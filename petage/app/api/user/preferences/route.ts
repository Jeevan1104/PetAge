import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { z } from "zod";

const preferencesSchema = z.object({
  notifPush: z.boolean().optional(),
  notifEmail: z.boolean().optional(),
  reminderLeadDays: z.number().int().min(1).max(90).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.data.notifPush !== undefined) updates.notifPush = parsed.data.notifPush;
    if (parsed.data.notifEmail !== undefined) updates.notifEmail = parsed.data.notifEmail;
    if (parsed.data.reminderLeadDays !== undefined) updates.reminderLeadDays = parsed.data.reminderLeadDays;

    await adminDb.collection("users").doc(userId).update(updates);

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error("PATCH /api/user/preferences error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
