import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function GET(request: Request) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const snap = await adminDb
      .collection("pets")
      .where("ownerId", "==", uid)
      .where("isArchived", "==", false)
      .orderBy("createdAt", "asc")
      .get();

    const pets = snap.docs.map((d) => ({ petId: d.id, ...d.data() }));
    return NextResponse.json({ pets });
  } catch (err) {
    console.error("[GET /api/pets]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Enforce 2-pet free limit server-side
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const user = userSnap.data();

    if (user?.tier !== "premium") {
      const existing = await adminDb
        .collection("pets")
        .where("ownerId", "==", uid)
        .where("isArchived", "==", false)
        .get();

      if (existing.size >= 2) {
        return NextResponse.json(
          {
            error: "Free plan is limited to 2 pets. Upgrade to Premium for unlimited pets.",
            code: "LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const ref = adminDb.collection("pets").doc();
    const now = FieldValue.serverTimestamp();

    await ref.set({
      petId: ref.id,
      ownerId: uid,
      name: body.name,
      species: body.species,
      breed: body.breed || null,
      dateOfBirth: body.dateOfBirth
        ? Timestamp.fromDate(new Date(body.dateOfBirth))
        : null,
      photoURL: body.photoURL || null,
      microchipId: body.microchipId || null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    const created = await ref.get();
    return NextResponse.json(
      { pet: { petId: ref.id, ...created.data() } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/pets]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
