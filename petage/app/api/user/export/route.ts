import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

/**
 * GET /api/user/export
 * Exports all data belonging to the current user as a JSON file.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const uid = decodedToken.uid;

    // Fetch user profile
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const profile = userDoc.exists ? userDoc.data() : null;

    // Fetch all collections in parallel
    const [petsSnap, vaccinesSnap, medsSnap, visitsSnap] = await Promise.all([
      adminDb.collection("pets").where("ownerId", "==", uid).get(),
      adminDb.collection("vaccines").where("ownerId", "==", uid).get(),
      adminDb.collection("medications").where("ownerId", "==", uid).get(),
      adminDb.collection("vetVisits").where("ownerId", "==", uid).get(),
    ]);

    // Fetch weight logs for all pets in parallel
    const pets = await Promise.all(petsSnap.docs.map(async (doc) => {
      const weightSnap = await adminDb.collection(`pets/${doc.id}/weightLogs`).get();
      const weightLogs = weightSnap.docs.map(wDoc => ({ id: wDoc.id, ...wDoc.data() }));
      return { id: doc.id, ...doc.data(), weightLogs };
    }));

    const vaccines = vaccinesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const medications = medsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const vetVisits = visitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile,
      pets,
      vaccines,
      medications,
      vetVisits,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="petage_export_${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("[Export JSON] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
