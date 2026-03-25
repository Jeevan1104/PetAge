import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { updateVaccineSchema, computeVaccineStatus } from "@/lib/schemas/vaccine";

export async function PATCH(
  request: Request,
  { params }: { params: { petId: string; vaccineId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("vaccines.update.auth_failed", { petId: params.petId, vaccineId: params.vaccineId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 30 updates per minute per user
    const rl = await checkRateLimit("vaccines:update", uid, 30, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const ref = adminDb.collection("vaccines").doc(params.vaccineId);
    const snap = await ref.get();
    const existing = snap.data();

    if (!snap.exists || existing?.ownerId !== uid || existing?.petId !== params.petId) {
      logger.warn("vaccines.update.ownership_violation", {
        uid, petId: params.petId, vaccineId: params.vaccineId, exists: snap.exists,
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateVaccineSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      logger.warn("vaccines.update.validation_failed", {
        uid, petId: params.petId, vaccineId: params.vaccineId, reason: message,
      });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;

    // Recompute status and reset reminderSent if expiry-related fields changed
    const expiryChanged = data.expiryDate !== undefined;
    const leadDaysChanged = data.reminderLeadDays !== undefined;
    let statusUpdate: Record<string, unknown> = {};

    if (expiryChanged || leadDaysChanged) {
      const newExpiry = data.expiryDate
        ? new Date(data.expiryDate)
        : existing?.expiryDate?.toDate?.() ?? undefined;
      const newLeadDays = data.reminderLeadDays ?? existing?.reminderLeadDays ?? 30;
      statusUpdate = {
        status: computeVaccineStatus(newExpiry, newLeadDays),
        reminderSent: false,
      };
    }

    await ref.update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.dateAdministered !== undefined && {
        dateAdministered: Timestamp.fromDate(new Date(data.dateAdministered)),
      }),
      ...(data.expiryDate !== undefined && {
        expiryDate: data.expiryDate
          ? Timestamp.fromDate(new Date(data.expiryDate))
          : null,
      }),
      ...(data.reminderEnabled !== undefined && { reminderEnabled: data.reminderEnabled }),
      ...(data.reminderLeadDays !== undefined && { reminderLeadDays: data.reminderLeadDays }),
      ...(data.reminderSent !== undefined && { reminderSent: data.reminderSent }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
      ...statusUpdate,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("vaccines.update.success", { uid, petId: params.petId, vaccineId: params.vaccineId });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("vaccines.update.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { petId: string; vaccineId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("vaccines.delete.auth_failed", { petId: params.petId, vaccineId: params.vaccineId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 10 deletes per hour per user
    const rl = await checkRateLimit("vaccines:delete", uid, 10, "1 h");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const ref = adminDb.collection("vaccines").doc(params.vaccineId);
    const snap = await ref.get();
    const existing = snap.data();

    if (!snap.exists || existing?.ownerId !== uid || existing?.petId !== params.petId) {
      logger.warn("vaccines.delete.ownership_violation", {
        uid, petId: params.petId, vaccineId: params.vaccineId, exists: snap.exists,
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await ref.update({
      isArchived: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("vaccines.delete.success", { uid, petId: params.petId, vaccineId: params.vaccineId });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("vaccines.delete.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
