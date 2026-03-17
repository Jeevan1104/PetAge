import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(
  request: Request,
  { params }: { params: { petId: string } }
) {
  try {
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
  } catch (err) {
    console.error("[PATCH /api/pets/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { petId: string } }
) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ref = adminDb.collection("pets").doc(params.petId);
    const snap = await ref.get();

    if (!snap.exists || snap.data()?.ownerId !== uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await ref.update({
      isArchived: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/pets/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
