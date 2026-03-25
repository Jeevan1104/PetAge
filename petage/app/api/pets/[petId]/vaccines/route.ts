import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { createVaccineSchema, computeVaccineStatus } from "@/lib/schemas/vaccine";

export async function GET(
  request: Request,
  { params }: { params: { petId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("vaccines.get.auth_failed", { petId: params.petId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 60 reads per minute per user
    const rl = await checkRateLimit("vaccines:read", uid, 60, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    // Verify the user owns this pet
    const petSnap = await adminDb.collection("pets").doc(params.petId).get();
    if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
      logger.warn("vaccines.get.ownership_violation", { uid, petId: params.petId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Single-field query avoids composite index requirement.
    // isArchived filter and sort are applied in memory.
    const snap = await adminDb
      .collection("vaccines")
      .where("petId", "==", params.petId)
      .where("ownerId", "==", uid)
      .get();

    const vaccines = snap.docs
      .map((d) => ({ vaccineId: d.id, ...d.data() } as any))
      .filter((v) => !v.isArchived)
      .sort((a, b) => {
        const aTs = a.dateAdministered?.toMillis?.() ?? 0;
        const bTs = b.dateAdministered?.toMillis?.() ?? 0;
        return bTs - aTs;
      });
    return NextResponse.json({ vaccines });
  } catch (err) {
    logger.error("vaccines.get.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { petId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("vaccines.create.auth_failed", { petId: params.petId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 20 vaccine creates per hour per user
    const rl = await checkRateLimit("vaccines:create", uid, 20, "1 h");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    // Verify the user owns this pet
    const petSnap = await adminDb.collection("pets").doc(params.petId).get();
    if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
      logger.warn("vaccines.create.ownership_violation", { uid, petId: params.petId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createVaccineSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      logger.warn("vaccines.create.validation_failed", { uid, petId: params.petId, reason: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
    const status = computeVaccineStatus(expiryDate, data.reminderLeadDays);

    const ref = adminDb.collection("vaccines").doc();
    const now = FieldValue.serverTimestamp();

    await ref.set({
      vaccineId: ref.id,
      petId: params.petId,
      ownerId: uid,
      name: data.name,
      dateAdministered: Timestamp.fromDate(new Date(data.dateAdministered)),
      expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
      reminderEnabled: data.reminderEnabled,
      reminderLeadDays: data.reminderLeadDays,
      reminderSent: false,
      status,
      notes: data.notes ?? null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    const created = await ref.get();
    logger.info("vaccines.create.success", { uid, petId: params.petId, vaccineId: ref.id });
    return NextResponse.json(
      { vaccine: { vaccineId: ref.id, ...created.data() } },
      { status: 201 }
    );
  } catch (err) {
    logger.error("vaccines.create.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
