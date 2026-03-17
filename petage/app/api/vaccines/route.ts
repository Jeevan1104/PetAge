import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

type VaccineStatus = "current" | "due_soon" | "overdue";

function computeStatus(expiryDate: Timestamp | null, leadDays = 30): VaccineStatus {
  if (!expiryDate) return "current";
  const expiry = expiryDate.toDate();
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + leadDays);
  if (expiry < now) return "overdue";
  if (expiry <= soon) return "due_soon";
  return "current";
}

export async function GET(request: Request) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("petId");
  if (!petId) return NextResponse.json({ error: "petId required" }, { status: 400 });

  const snap = await adminDb
    .collection("vaccines")
    .where("ownerId", "==", uid)
    .where("petId", "==", petId)
    .orderBy("dateAdministered", "desc")
    .get();

  const vaccines = snap.docs.map((d) => ({ vaccineId: d.id, ...d.data() }));
  return NextResponse.json({ vaccines });
}

export async function POST(request: Request) {
  const uid = await verifyIdToken(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { petId, name, dateAdministered, expiryDate, reminderEnabled, notes } = body;

  if (!petId || !name || !dateAdministered) {
    return NextResponse.json({ error: "petId, name, and dateAdministered are required" }, { status: 400 });
  }

  // Verify pet belongs to user
  const petSnap = await adminDb.collection("pets").doc(petId).get();
  if (!petSnap.exists || petSnap.data()?.ownerId !== uid) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const ref = adminDb.collection("vaccines").doc();
  const now = FieldValue.serverTimestamp();
  const expiryTs = expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null;

  await ref.set({
    vaccineId: ref.id,
    petId,
    ownerId: uid,
    name,
    dateAdministered: Timestamp.fromDate(new Date(dateAdministered)),
    expiryDate: expiryTs,
    reminderEnabled: reminderEnabled ?? true,
    reminderSent: false,
    status: computeStatus(expiryTs),
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await ref.get();
  return NextResponse.json({ vaccine: { vaccineId: ref.id, ...created.data() } }, { status: 201 });
}
