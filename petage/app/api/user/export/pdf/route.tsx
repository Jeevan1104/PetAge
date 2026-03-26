import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import {
  AccountExportDocument,
  type ExportProfile,
  type ExportPet,
  type ExportVaccine,
  type ExportMedication,
  type ExportVisit,
} from "@/components/reports/AccountExport";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const db = adminDb;

    // Fetch user profile
    const userDoc = await db.collection("users").doc(uid).get();
    const profile = (userDoc.exists ? userDoc.data() : null) as unknown as ExportProfile | null;

    // Fetch all collections for this owner
    const [petsSnap, vaccinesSnap, medsSnap, visitsSnap] = await Promise.all([
      db.collection("pets").where("ownerId", "==", uid).get(),
      db.collection("vaccines").where("ownerId", "==", uid).get(),
      db.collection("medications").where("ownerId", "==", uid).get(),
      db.collection("vetVisits").where("ownerId", "==", uid).get(),
    ]);

    const formatData = (snap: FirebaseFirestore.QuerySnapshot) =>
      snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const pets = formatData(petsSnap) as unknown as ExportPet[];
    const vaccines = formatData(vaccinesSnap) as unknown as ExportVaccine[];
    const medications = formatData(medsSnap) as unknown as ExportMedication[];
    const vetVisits = formatData(visitsSnap) as unknown as ExportVisit[];

    // Render PDF layout dynamically
    const stream = await renderToStream(
      React.createElement(AccountExportDocument, {
        profile,
        pets,
        vaccines,
        medications,
        vetVisits,
      }) as unknown as React.ReactElement
    );

    // Stream native Blob as PDF 
    const response = new NextResponse(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="petage_export_${Date.now()}.pdf"`,
      },
    });

    return response;
  } catch (error) {
    console.error("[Export PDF] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
