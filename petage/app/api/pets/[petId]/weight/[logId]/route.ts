import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { petId: string; logId: string } }
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
    
    // Verify ownership
    const petRef = db.collection("pets").doc(params.petId);
    const petDoc = await petRef.get();
    
    if (!petDoc.exists || petDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: "Pet not found or unauthorized" }, { status: 404 });
    }

    // Delete the specific weight log subdocument
    const logRef = petRef.collection("weightLogs").doc(params.logId);
    await logRef.delete();

    return NextResponse.json({ success: true, logId: params.logId });
  } catch (error) {
    console.error(`DELETE /api/pets/[petId]/weight/[logId] error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
