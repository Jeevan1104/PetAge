import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

function computeNextDueDate(startDate: Date, frequency: string, customFreqDays?: number): Date {
  const next = new Date(startDate);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "custom":
      next.setDate(next.getDate() + (customFreqDays ?? 1));
      break;
  }
  return next;
}

export async function GET(request: Request) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("petId");
  if (!petId) return NextResponse.json({ error: "petId required" }, { status: 400 });

  const snap = await adminDb
    .collection("medications")
    .where("ownerId", "==", uid)
    .where("petId", "==", petId)
    .where("isArchived", "==", false)
    .orderBy("createdAt", "desc")
    .get();

  const meds = snap.docs.map((d) => ({ medicationId: d.id, ...d.data() }));
  return NextResponse.json({ meds });
}

export async function POST(request: Request) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { petId, name, isGeneric, dosageStrength, frequency, customFreqDays, startDate, reminderEnabled, notes } = body;

  if (!petId || !name || !frequency || !startDate) {
    return NextResponse.json({ error: "petId, name, frequency, and startDate are required" }, { status: 400 });
  }

  const petSnap = await adminDb.collection("pets").doc(petId).get();
  if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const start = new Date(startDate);
  const nextDue = computeNextDueDate(start, frequency, customFreqDays);
  const ref = adminDb.collection("medications").doc();
  const now = FieldValue.serverTimestamp();

  await ref.set({
    medicationId: ref.id,
    petId,
    ownerId: uid,
    name,
    isGeneric: isGeneric ?? false,
    dosageStrength: dosageStrength || null,
    frequency,
    customFreqDays: customFreqDays || null,
    startDate: Timestamp.fromDate(start),
    nextDueDate: Timestamp.fromDate(nextDue),
    reminderEnabled: reminderEnabled ?? true,
    isArchived: false,
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await ref.get();
  return NextResponse.json({ med: { medicationId: ref.id, ...created.data() } }, { status: 201 });
}
