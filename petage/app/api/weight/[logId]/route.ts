import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";

export async function DELETE(
  request: Request,
  { params }: { params: { logId: string } }
) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { logId } = params;
  const snap = await adminDb.collection("weightLogs").doc(logId).get();
  if (!snap.exists || snap.data()?.ownerId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await adminDb.collection("weightLogs").doc(logId).delete();
  return NextResponse.json({ success: true });
}
