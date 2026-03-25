import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { computeNextDueDate } from "@/lib/schemas/medication";
import type { MedFrequency } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: { petId: string; medicationId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("medications.mark_given.auth_failed", { medicationId: params.medicationId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("medications:mark_given", uid, 60, "1 m");
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
      logger.warn("medications.mark_given.ownership_violation", { uid, medicationId: params.medicationId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.isArchived) {
      return NextResponse.json({ error: "Cannot mark an archived medication as given" }, { status: 409 });
    }

    // Advance nextDueDate from today (not from the old nextDueDate) to avoid drift
    const now = new Date();
    const frequency = existing.frequency as MedFrequency;
    const customFreqDays = existing.customFreqDays as number | undefined;
    const nextDueDate = computeNextDueDate(now, frequency, customFreqDays);

    await ref.update({
      nextDueDate: Timestamp.fromDate(nextDueDate),
      reminderSent: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await ref.get();
    logger.info("medications.mark_given.success", { uid, medicationId: params.medicationId, nextDueDate: nextDueDate.toISOString() });
    return NextResponse.json({ medication: { medicationId: ref.id, ...updated.data() } });
  } catch (err) {
    logger.error("medications.mark_given.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
