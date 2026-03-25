import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { createMedicationSchema, computeNextDueDate } from "@/lib/schemas/medication";

export async function GET(
  request: Request,
  { params }: { params: { petId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("medications.get.auth_failed", { petId: params.petId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("medications:read", uid, 60, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    // Verify user owns this pet
    const petSnap = await adminDb.collection("pets").doc(params.petId).get();
    if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
      logger.warn("medications.get.ownership_violation", { uid, petId: params.petId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Single equality filters only — avoids composite index requirement.
    // isArchived filter and sort applied in memory.
    const snap = await adminDb
      .collection("medications")
      .where("petId", "==", params.petId)
      .where("ownerId", "==", uid)
      .get();

    const allMeds = snap.docs.map((d) => ({
      medicationId: d.id,
      ...d.data(),
    })) as Array<Record<string, unknown> & { medicationId: string }>;

    // Active meds first (not archived), sorted by nextDueDate ASC (soonest first)
    const active = allMeds
      .filter((m) => !m.isArchived)
      .sort((a, b) => {
        const aTs =
          (a.nextDueDate as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
        const bTs =
          (b.nextDueDate as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
        return aTs - bTs;
      });

    // Archived meds sorted by updatedAt DESC (most recently archived first)
    const archived = allMeds
      .filter((m) => m.isArchived)
      .sort((a, b) => {
        const aTs =
          (a.updatedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
        const bTs =
          (b.updatedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
        return bTs - aTs;
      });

    return NextResponse.json({ medications: active, archivedMedications: archived });
  } catch (err) {
    logger.error("medications.get.internal_error", {
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
      logger.warn("medications.create.auth_failed", { petId: params.petId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("medications:create", uid, 30, "1 h");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    // Verify user owns this pet
    const petSnap = await adminDb.collection("pets").doc(params.petId).get();
    if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
      logger.warn("medications.create.ownership_violation", { uid, petId: params.petId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createMedicationSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      logger.warn("medications.create.validation_failed", { uid, petId: params.petId, reason: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const startDate = new Date(data.startDate);
    const nextDueDate = computeNextDueDate(startDate, data.frequency, data.customFreqDays);

    const ref = adminDb.collection("medications").doc();
    const now = FieldValue.serverTimestamp();

    await ref.set({
      medicationId: ref.id,
      petId: params.petId,
      ownerId: uid,
      name: data.name,
      isGeneric: data.isGeneric,
      dosageStrength: data.dosageStrength ?? null,
      frequency: data.frequency,
      customFreqDays: data.customFreqDays ?? null,
      startDate: Timestamp.fromDate(startDate),
      nextDueDate: Timestamp.fromDate(nextDueDate),
      reminderEnabled: data.reminderEnabled,
      reminderSent: false,
      isArchived: false,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });

    const created = await ref.get();
    logger.info("medications.create.success", { uid, petId: params.petId, medicationId: ref.id });
    return NextResponse.json(
      { medication: { medicationId: ref.id, ...created.data() } },
      { status: 201 }
    );
  } catch (err) {
    logger.error("medications.create.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
