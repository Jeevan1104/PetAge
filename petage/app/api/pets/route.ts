import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { createPetSchema } from "@/lib/schemas/pet";

export async function GET(request: Request) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("pets.get.auth_failed", { pathname: new URL(request.url).pathname });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 60 reads per minute per user
    const rl = await checkRateLimit("pets:read", uid, 60, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const snap = await adminDb
      .collection("pets")
      .where("ownerId", "==", uid)
      .where("isArchived", "==", false)
      .orderBy("createdAt", "asc")
      .get();

    const pets = snap.docs.map((d) => ({ petId: d.id, ...d.data() } as any));
    return NextResponse.json({ pets });
  } catch (err) {
    logger.error("pets.get.internal_error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("pets.create.auth_failed", { pathname: new URL(request.url).pathname });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 10 pet creates per hour per user
    const rl = await checkRateLimit("pets:create", uid, 10, "1 h");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    // Enforce 2-pet free limit server-side
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const user = userSnap.data();

    if (user?.tier !== "premium") {
      const existing = await adminDb
        .collection("pets")
        .where("ownerId", "==", uid)
        .where("isArchived", "==", false)
        .get();

      if (existing.size >= 2) {
        logger.warn("pets.create.tier_limit_reached", { uid });
        return NextResponse.json(
          {
            error: "Free plan is limited to 2 pets. Upgrade to Premium for unlimited pets.",
            code: "LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const parsed = createPetSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      logger.warn("pets.create.validation_failed", { uid, reason: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const ref = adminDb.collection("pets").doc();
    const now = FieldValue.serverTimestamp();

    await ref.set({
      petId: ref.id,
      ownerId: uid,
      name: data.name,
      species: data.species,
      breed: data.breed ?? null,
      dateOfBirth: data.dateOfBirth
        ? Timestamp.fromDate(new Date(data.dateOfBirth))
        : null,
      photoURL: data.photoURL ?? null,
      microchipId: data.microchipId ?? null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    const created = await ref.get();
    return NextResponse.json(
      { pet: { petId: ref.id, ...created.data() } },
      { status: 201 }
    );
  } catch (err) {
    logger.error("pets.create.internal_error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
