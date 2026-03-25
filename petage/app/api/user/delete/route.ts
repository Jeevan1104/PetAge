import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

/**
 * DELETE /api/user/delete
 * Hard deletes the user's account, including all Firebase Auth and Firestore data.
 */
export async function DELETE(request: NextRequest) {
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

    const db = adminDb;
    const batch = db.batch();

    // 1. Delete all pets and their subcollections
    const petsSnap = await db.collection("pets").where("ownerId", "==", uid).get();
    for (const petDoc of petsSnap.docs) {
      // Subcollection: weightLogs
      const weightSnap = await db.collection(`pets/${petDoc.id}/weightLogs`).get();
      weightSnap.forEach(wDoc => {
        batch.delete(wDoc.ref);
      });
      // Delete the pet doc itself
      batch.delete(petDoc.ref);
    }

    // 2. Delete all vaccines
    const vaccinesSnap = await db.collection("vaccines").where("ownerId", "==", uid).get();
    vaccinesSnap.forEach(doc => batch.delete(doc.ref));

    // 3. Delete all medications
    const medsSnap = await db.collection("medications").where("ownerId", "==", uid).get();
    medsSnap.forEach(doc => batch.delete(doc.ref));

    // 4. Delete all vet visits
    const visitsSnap = await db.collection("vetVisits").where("ownerId", "==", uid).get();
    visitsSnap.forEach(doc => batch.delete(doc.ref));

    // 5. Delete user profile doc
    const userRef = db.collection("users").doc(uid);
    batch.delete(userRef);

    // Commit all Firestore deletions
    await batch.commit();

    // 6. Delete Firebase Auth user
    await adminAuth.deleteUser(uid);

    return NextResponse.json({ success: true, message: "Account deleted successfully." });
  } catch (error) {
    console.error("[Delete Account] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
