import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";

export async function DELETE(
  request: Request,
  { params }: { params: { vaccineId: string } }
) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vaccineId } = params;
  const snap = await adminDb.collection("vaccines").doc(vaccineId).get();
  if (!snap.exists || snap.data()?.ownerId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await adminDb.collection("vaccines").doc(vaccineId).delete();
  return NextResponse.json({ success: true });
}
