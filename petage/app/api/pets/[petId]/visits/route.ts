import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { createVisitSchema } from "@/lib/schemas/visit";
import type { VetVisit } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: { petId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("visits.get.auth_failed", { petId: params.petId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("visits:read", uid, 60, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    // Verify user owns this pet
    const petSnap = await adminDb.collection("pets").doc(params.petId).get();
    if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
      logger.warn("visits.get.ownership_violation", { uid, petId: params.petId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Single equality filters only — avoids composite index requirement.
    // isArchived filter and sort applied in memory.
    const snap = await adminDb
      .collection("vetVisits")
      .where("petId", "==", params.petId)
      .where("ownerId", "==", uid)
      .get();

    const visits = snap.docs
      .map((d) => ({ visitId: d.id, ...d.data() }) as VetVisit)
      .filter((v) => !v.isArchived)
      .sort((a, b) => {
        const aTs = a.visitDate?.toMillis?.() ?? 0;
        const bTs = b.visitDate?.toMillis?.() ?? 0;
        return bTs - aTs; // newest first
      });

    return NextResponse.json({ visits });
  } catch (err) {
    logger.error("visits.get.internal_error", {
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
      logger.warn("visits.create.auth_failed", { petId: params.petId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("visits:create", uid, 30, "1 h");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    // Verify user owns this pet
    const petSnap = await adminDb.collection("pets").doc(params.petId).get();
    if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
      logger.warn("visits.create.ownership_violation", { uid, petId: params.petId });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createVisitSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      logger.warn("visits.create.validation_failed", { uid, petId: params.petId, reason: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const ref = adminDb.collection("vetVisits").doc();
    const now = FieldValue.serverTimestamp();

    await ref.set({
      visitId: ref.id,
      petId: params.petId,
      ownerId: uid,
      visitDate: Timestamp.fromDate(new Date(data.visitDate)),
      reason: data.reason,
      clinicName: data.clinicName ?? null,
      vetName: data.vetName ?? null,
      notes: data.notes ?? null,
      photoURLs: data.photoURLs ?? [],
      cost: data.cost ?? null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    const created = await ref.get();
    logger.info("visits.create.success", { uid, petId: params.petId, visitId: ref.id });
    return NextResponse.json(
      { visit: { visitId: ref.id, ...created.data() } },
      { status: 201 }
    );
  } catch (err) {
    logger.error("visits.create.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
