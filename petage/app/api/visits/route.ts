import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("petId");
  if (!petId) return NextResponse.json({ error: "petId required" }, { status: 400 });

  const snap = await adminDb
    .collection("vetVisits")
    .where("ownerId", "==", uid)
    .where("petId", "==", petId)
    .orderBy("visitDate", "desc")
    .get();

  const visits = snap.docs.map((d) => ({ visitId: d.id, ...d.data() }));
  return NextResponse.json({ visits });
}

export async function POST(request: Request) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { petId, visitDate, reason, clinicName, vetName, notes } = body;

  if (!petId || !visitDate || !reason) {
    return NextResponse.json({ error: "petId, visitDate, and reason are required" }, { status: 400 });
  }

  const petSnap = await adminDb.collection("pets").doc(petId).get();
  if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const ref = adminDb.collection("vetVisits").doc();
  const now = FieldValue.serverTimestamp();

  await ref.set({
    visitId: ref.id,
    petId,
    ownerId: uid,
    visitDate: Timestamp.fromDate(new Date(visitDate)),
    reason,
    clinicName: clinicName || null,
    vetName: vetName || null,
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await ref.get();
  return NextResponse.json({ visit: { visitId: ref.id, ...created.data() } }, { status: 201 });
}
