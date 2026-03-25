import { NextResponse } from "next/server";
import { adminDb, adminAuth, adminStorage } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const deleteSchema = z.object({
  confirmEmail: z.string().email(),
});

/**
 * DELETE /api/user
 *
 * Hard-deletes the authenticated user's account:
 *   1. Validates confirmEmail matches their account email (prevents accidental deletes)
 *   2. Deletes all Firestore documents owned by this user across every collection
 *   3. Deletes Firebase Storage files (pet photos + visit photos)
 *   4. Deletes the Firebase Auth account (last, so the user can still re-auth if earlier steps fail)
 *
 * Rate limit: 3 attempts / hour per user
 */
export async function DELETE(request: Request) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3 delete attempts per hour — prevents abuse / accidental loops
    const rl = await checkRateLimit("user:delete", uid, 3, "1 h");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    // Validate request body
    const body = await request.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide your email address to confirm account deletion." },
        { status: 400 }
      );
    }

    // Verify confirmEmail matches the user's actual email
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (!userData) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    if (
      parsed.data.confirmEmail.toLowerCase() !== userData.email?.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Email address doesn't match. Please try again." },
        { status: 400 }
      );
    }

    logger.info("user.delete.start", { uid });

    // ----------------------------------------------------------------
    // Step 1 — Collect all pets so we can delete their subcollections
    // ----------------------------------------------------------------
    const petsSnap = await adminDb
      .collection("pets")
      .where("ownerId", "==", uid)
      .get();

    // Delete weightLogs subcollection for each pet
    for (const petDoc of petsSnap.docs) {
      const weightLogsSnap = await petDoc.ref.collection("weightLogs").get();
      if (!weightLogsSnap.empty) {
        await deleteBatch(
          adminDb,
          weightLogsSnap.docs.map((d) => d.ref)
        );
      }
    }

    // ----------------------------------------------------------------
    // Step 2 — Batch delete top-level collections (vaccines, vetVisits,
    //           medications, pets). Each batch is capped at 500 ops.
    // ----------------------------------------------------------------
    const collections: { name: string; field: string }[] = [
      { name: "vaccines", field: "ownerId" },
      { name: "vetVisits", field: "ownerId" },
      { name: "medications", field: "ownerId" },
    ];

    for (const col of collections) {
      const snap = await adminDb
        .collection(col.name)
        .where(col.field, "==", uid)
        .get();
      if (!snap.empty) {
        await deleteBatch(
          adminDb,
          snap.docs.map((d) => d.ref)
        );
      }
    }

    // Delete pets themselves
    if (!petsSnap.empty) {
      await deleteBatch(
        adminDb,
        petsSnap.docs.map((d) => d.ref)
      );
    }

    // ----------------------------------------------------------------
    // Step 3 — Delete user document
    // ----------------------------------------------------------------
    await adminDb.collection("users").doc(uid).delete();

    // ----------------------------------------------------------------
    // Step 4 — Delete Firebase Storage files
    //   Pet photos live under:   pets/{uid}/
    //   Visit photos live under: visits/{uid}/
    // ----------------------------------------------------------------
    try {
      const bucket = adminStorage.bucket();
      await Promise.all([
        bucket.deleteFiles({ prefix: `pets/${uid}/` }),
        bucket.deleteFiles({ prefix: `visits/${uid}/` }),
      ]);
    } catch (storageErr) {
      // Non-fatal: storage cleanup failure should not block Auth deletion.
      // Files will become orphaned but are inaccessible without a valid token.
      logger.warn("user.delete.storage_cleanup_failed", {
        uid,
        error:
          storageErr instanceof Error
            ? storageErr.message
            : String(storageErr),
      });
    }

    // ----------------------------------------------------------------
    // Step 5 — Delete Firebase Auth account (last)
    // ----------------------------------------------------------------
    await adminAuth.deleteUser(uid);

    logger.info("user.delete.complete", { uid });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("user.delete.error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again or contact support." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Firestore batches are limited to 500 operations.
 * This helper splits an arbitrary list of document refs into 500-op chunks.
 */
async function deleteBatch(
  db: FirebaseFirestore.Firestore,
  refs: FirebaseFirestore.DocumentReference[]
): Promise<void> {
  const CHUNK = 500;
  for (let i = 0; i < refs.length; i += CHUNK) {
    const batch = db.batch();
    refs.slice(i, i + CHUNK).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}
