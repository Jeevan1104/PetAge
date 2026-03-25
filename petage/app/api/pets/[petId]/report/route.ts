import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { HealthReportDocument } from "@/components/reports/HealthReport";
import type { Pet, Vaccine, VetVisit, Medication, WeightLog } from "@/lib/types";

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

    if (!decodedToken.premium && decodedToken.tier !== "premium") {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
    }

    const db = adminDb;
    
    // Resolve core Pet document
    const petRef = db.collection("pets").doc(params.petId);
    const petDoc = await petRef.get();
    if (!petDoc.exists || petDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: "Pet not found or unauthorized" }, { status: 404 });
    }
    const pet = { petId: petDoc.id, ...petDoc.data() } as Pet;

    // Concurrently aggregate collections
    const [vaccinesSnap, visitsSnap, medsSnap, weightSnap] = await Promise.all([
      petRef.collection("vaccines").orderBy("dateAdministered", "desc").get(),
      petRef.collection("visits").orderBy("date", "desc").get(),
      petRef.collection("medications").get(),
      petRef.collection("weightLogs").orderBy("logDate", "desc").get()
    ]);

    const formatData = (snap: FirebaseFirestore.QuerySnapshot) =>
      snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Cast aggregated data into types
    // Cast IDs internally based on their type architectures
    const vaccines = formatData(vaccinesSnap).map(d => ({ ...d, vaccineId: d.id })) as unknown as Vaccine[];
    const visits = formatData(visitsSnap).map(d => ({ ...d, visitId: d.id })) as unknown as VetVisit[];
    const medications = formatData(medsSnap).map(d => ({ ...d, medicationId: d.id })) as unknown as Medication[];
    const weightLogs = formatData(weightSnap).map(d => ({ ...d, logId: d.id })) as unknown as WeightLog[];

    // Render PDF layout dynamically
    const stream = await renderToStream(
      React.createElement(HealthReportDocument, {
        pet,
        vaccines,
        visits,
        medications,
        weightLogs,
      }) as unknown as React.ReactElement
    );

    // Stream native Blob as PDF 
    const response = new NextResponse(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pet.name}_Health_Report.pdf"`,
      },
    });

    return response;
  } catch (error) {
    console.error("GET /api/pets/[petId]/report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
