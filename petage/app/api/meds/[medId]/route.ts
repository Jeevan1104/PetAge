import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";

export async function DELETE(
  request: Request,
  { params }: { params: { medId: string } }
) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { medId } = params;
  const snap = await adminDb.collection("medications").doc(medId).get();
  if (!snap.exists || snap.data()?.ownerId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft-archive instead of hard delete (preserves history)
  await adminDb.collection("medications").doc(medId).update({ isArchived: true });
  return NextResponse.json({ success: true });
}
