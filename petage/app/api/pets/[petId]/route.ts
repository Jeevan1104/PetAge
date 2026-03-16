import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(
  request: Request,
  { params }: { params: { petId: string } }
) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ref = adminDb.collection("pets").doc(params.petId);
  const snap = await ref.get();

  if (!snap.exists || snap.data()?.ownerId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  await ref.update({ ...body, updatedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { petId: string } }
) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ref = adminDb.collection("pets").doc(params.petId);
  const snap = await ref.get();

  if (!snap.exists || snap.data()?.ownerId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft delete — archive, don't hard-delete (preserves historical data)
  await ref.update({
    isArchived: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true });
}
