import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { createWeightSchema } from "@/lib/schemas/weight";

export async function GET(
  request: NextRequest,
  { params }: { params: { petId: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const db = adminDb;
    const petRef = db.collection("pets").doc(params.petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists || petDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: "Pet not found or unauthorized" }, { status: 404 });
    }

    const logsSnapshot = await petRef.collection("weightLogs").orderBy("logDate", "desc").get();
    const logs = logsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      logId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/pets/[petId]/weight error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { petId: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const db = adminDb;
    const petRef = db.collection("pets").doc(params.petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists || petDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: "Pet not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createWeightSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }
    
    const data = parsed.data;
    
    // The store passes 'weight' natively as kg regardless of 'unit'
    // but just to be safe as per our architecture, if unit is lbs, frontend already dispatched weight in Kg
    // So we just store weight literally.
    
    const logData = {
      petId: params.petId,
      ownerId: userId,
      weight: data.weight,
      unit: data.unit,
      logDate: new Date(data.logDate),
      notes: data.notes || null,
      createdAt: new Date(),
    };

    const logRef = await petRef.collection("weightLogs").add(logData);

    return NextResponse.json({
      log: {
        logId: logRef.id,
        ...logData,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/pets/[petId]/weight error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
