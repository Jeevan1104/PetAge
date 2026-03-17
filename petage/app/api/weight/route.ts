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
    .collection("weightLogs")
    .where("ownerId", "==", uid)
    .where("petId", "==", petId)
    .orderBy("logDate", "desc")
    .get();

  const logs = snap.docs.map((d) => ({ logId: d.id, ...d.data() }));
  return NextResponse.json({ logs });
}

export async function POST(request: Request) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { petId, weight, unit, logDate, notes } = body;

  if (!petId || weight == null || !unit || !logDate) {
    return NextResponse.json({ error: "petId, weight, unit, and logDate are required" }, { status: 400 });
  }

  const petSnap = await adminDb.collection("pets").doc(petId).get();
  if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const ref = adminDb.collection("weightLogs").doc();
  const now = FieldValue.serverTimestamp();

  // Always store in kg internally
  const weightKg = unit === "lbs" ? weight * 0.453592 : weight;

  await ref.set({
    logId: ref.id,
    petId,
    ownerId: uid,
    weight: weightKg,
    unit,
    logDate: Timestamp.fromDate(new Date(logDate)),
    notes: notes || null,
    createdAt: now,
  });

  const created = await ref.get();
  return NextResponse.json({ log: { logId: ref.id, ...created.data() } }, { status: 201 });
}
