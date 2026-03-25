import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { updateMedicationSchema, computeNextDueDate } from "@/lib/schemas/medication";
import type { MedFrequency } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: { petId: string; medicationId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("medications.update.auth_failed", { medicationId: params.medicationId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("medications:update", uid, 30, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const ref = adminDb.collection("medications").doc(params.medicationId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = snap.data()!;
    if (existing.ownerId !== uid || existing.petId !== params.petId) {
      logger.warn("medications.update.ownership_violation", { uid, medicationId: params.medicationId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateMedicationSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      logger.warn("medications.update.validation_failed", { uid, medicationId: params.medicationId, reason: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (data.name !== undefined) update.name = data.name;
    if (data.isGeneric !== undefined) update.isGeneric = data.isGeneric;
    if ("dosageStrength" in data) update.dosageStrength = data.dosageStrength ?? null;
    if ("notes" in data) update.notes = data.notes ?? null;
    if (data.reminderEnabled !== undefined) update.reminderEnabled = data.reminderEnabled;

    // If frequency or startDate changes, recompute nextDueDate and reset reminderSent
    const frequencyChanged = data.frequency !== undefined && data.frequency !== existing.frequency;
    const startDateChanged = data.startDate !== undefined;
    const customFreqChanged = data.customFreqDays !== undefined && data.customFreqDays !== existing.customFreqDays;

    if (frequencyChanged || startDateChanged || customFreqChanged) {
      if (data.frequency !== undefined) update.frequency = data.frequency;
      if (data.customFreqDays !== undefined) update.customFreqDays = data.customFreqDays ?? null;

      const baseDate = data.startDate
        ? new Date(data.startDate)
        : (existing.startDate as { toDate: () => Date }).toDate();

      if (data.startDate !== undefined) {
        update.startDate = Timestamp.fromDate(new Date(data.startDate));
      }

      const freq = (data.frequency ?? existing.frequency) as MedFrequency;
      const customDays = data.customFreqDays ?? (existing.customFreqDays as number | undefined);
      update.nextDueDate = Timestamp.fromDate(computeNextDueDate(baseDate, freq, customDays));
      update.reminderSent = false;
    }

    await ref.update(update);

    const updated = await ref.get();
    logger.info("medications.update.success", { uid, medicationId: params.medicationId });
    return NextResponse.json({ medication: { medicationId: ref.id, ...updated.data() } });
  } catch (err) {
    logger.error("medications.update.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { petId: string; medicationId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("medications.delete.auth_failed", { medicationId: params.medicationId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("medications:delete", uid, 10, "1 h");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const ref = adminDb.collection("medications").doc(params.medicationId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = snap.data()!;
    if (existing.ownerId !== uid || existing.petId !== params.petId) {
      logger.warn("medications.delete.ownership_violation", { uid, medicationId: params.medicationId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await ref.update({ isArchived: true, updatedAt: FieldValue.serverTimestamp() });

    logger.info("medications.delete.success", { uid, medicationId: params.medicationId });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("medications.delete.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
