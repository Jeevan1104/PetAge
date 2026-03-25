import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { updateVisitSchema } from "@/lib/schemas/visit";

export async function PATCH(
  request: Request,
  { params }: { params: { petId: string; visitId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("visits.update.auth_failed", { visitId: params.visitId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("visits:update", uid, 30, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const ref = adminDb.collection("vetVisits").doc(params.visitId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = snap.data()!;
    if (existing.ownerId !== uid || existing.petId !== params.petId) {
      logger.warn("visits.update.ownership_violation", { uid, visitId: params.visitId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateVisitSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      logger.warn("visits.update.validation_failed", { uid, visitId: params.visitId, reason: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (data.visitDate !== undefined) {
      update.visitDate = Timestamp.fromDate(new Date(data.visitDate));
    }
    if (data.reason !== undefined) update.reason = data.reason;
    if ("clinicName" in data) update.clinicName = data.clinicName ?? null;
    if ("vetName" in data) update.vetName = data.vetName ?? null;
    if ("notes" in data) update.notes = data.notes ?? null;
    if ("photoURLs" in data) update.photoURLs = data.photoURLs ?? [];
    if ("cost" in data) update.cost = data.cost ?? null;

    await ref.update(update);

    const updated = await ref.get();
    logger.info("visits.update.success", { uid, visitId: params.visitId });
    return NextResponse.json({ visit: { visitId: ref.id, ...updated.data() } });
  } catch (err) {
    logger.error("visits.update.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { petId: string; visitId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("visits.delete.auth_failed", { visitId: params.visitId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("visits:delete", uid, 10, "1 h");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const ref = adminDb.collection("vetVisits").doc(params.visitId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = snap.data()!;
    if (existing.ownerId !== uid || existing.petId !== params.petId) {
      logger.warn("visits.delete.ownership_violation", { uid, visitId: params.visitId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await ref.update({ isArchived: true, updatedAt: FieldValue.serverTimestamp() });

    logger.info("visits.delete.success", { uid, visitId: params.visitId });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("visits.delete.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
