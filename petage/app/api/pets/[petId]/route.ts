import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { updatePetSchema } from "@/lib/schemas/pet";

export async function PATCH(
  request: Request,
  { params }: { params: { petId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("pets.update.auth_failed", { petId: params.petId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 30 updates per minute per user
    const rl = await checkRateLimit("pets:update", uid, 30, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const ref = adminDb.collection("pets").doc(params.petId);
    const snap = await ref.get();

    if (!snap.exists || snap.data()?.ownerId !== uid) {
      logger.warn("pets.update.ownership_violation", { uid, petId: params.petId, exists: snap.exists });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updatePetSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      logger.warn("pets.update.validation_failed", { uid, petId: params.petId, reason: message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    await ref.update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.species !== undefined && { species: data.species }),
      ...(data.breed !== undefined && { breed: data.breed }),
      ...(data.dateOfBirth !== undefined && {
        dateOfBirth: Timestamp.fromDate(new Date(data.dateOfBirth)),
      }),
      ...(data.photoURL !== undefined && { photoURL: data.photoURL }),
      ...(data.microchipId !== undefined && { microchipId: data.microchipId }),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("pets.update.internal_error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { petId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("pets.delete.auth_failed", { petId: params.petId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 10 deletes per hour per user
    const rl = await checkRateLimit("pets:delete", uid, 10, "1 h");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const ref = adminDb.collection("pets").doc(params.petId);
    const snap = await ref.get();

    if (!snap.exists || snap.data()?.ownerId !== uid) {
      logger.warn("pets.delete.ownership_violation", { uid, petId: params.petId, exists: snap.exists });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await ref.update({
      isArchived: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("pets.delete.internal_error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
