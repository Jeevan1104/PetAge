import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendReminderEmail } from "@/lib/resend";
import {
  buildVaccineReminderHtml,
  buildMedicationReminderHtml,
} from "@/lib/email-templates";
import { format, addDays } from "date-fns";

/**
 * POST /api/cron/check-reminders
 *
 * Secured via CRON_SECRET header. Designed for Vercel Cron (daily 09:00 UTC).
 * Scans vaccines + medications nearing their due dates and sends email reminders
 * to users who have email notifications enabled.
 */
export async function POST(request: Request) {
  // Verify cron secret
  const secret = request.headers.get("x-cron-secret") || request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = { vaccinesSent: 0, medicationsSent: 0, errors: 0, skipped: 0 };

  try {
    // ------------------------------------------------------------------
    // 1. Gather all users who have email notifications enabled
    // ------------------------------------------------------------------
    const usersSnap = await adminDb
      .collection("users")
      .where("notifEmail", "==", true)
      .get();

    if (usersSnap.empty) {
      return NextResponse.json({ ...summary, message: "No users with email notifications" });
    }

    // Build a lookup: uid → { email, reminderLeadDays }
    const userMap = new Map<string, { email: string; leadDays: number }>();
    for (const doc of usersSnap.docs) {
      const data = doc.data();
      if (data.email) {
        userMap.set(doc.id, {
          email: data.email as string,
          leadDays: (data.reminderLeadDays as number) ?? 30,
        });
      }
    }

    // ------------------------------------------------------------------
    // 2. Check vaccines nearing expiry
    // ------------------------------------------------------------------
    const vaccinesSnap = await adminDb
      .collection("vaccines")
      .where("isArchived", "==", false)
      .where("reminderSent", "==", false)
      .where("reminderEnabled", "==", true)
      .get();

    for (const vDoc of vaccinesSnap.docs) {
      const v = vDoc.data();
      const owner = userMap.get(v.ownerId as string);
      if (!owner) continue; // user doesn't have email on or doesn't exist

      const expiryDate = v.expiryDate?.toDate?.();
      if (!expiryDate) continue; // no expiry set

      const threshold = addDays(new Date(), owner.leadDays);
      if (expiryDate > threshold) {
        summary.skipped++;
        continue; // not within reminder window yet
      }

      // Resolve pet name
      let petName = "your pet";
      try {
        const petDoc = await adminDb.collection("pets").doc(v.petId as string).get();
        if (petDoc.exists) petName = (petDoc.data()?.name as string) || petName;
      } catch { /* use default */ }

      const html = buildVaccineReminderHtml(
        petName,
        v.name as string,
        format(expiryDate, "MMMM d, yyyy")
      );

      const sent = await sendReminderEmail(
        owner.email,
        `💉 Vaccine reminder for ${petName}`,
        html
      );

      if (sent) {
        await vDoc.ref.update({ reminderSent: true });
        summary.vaccinesSent++;
      } else {
        summary.errors++;
      }
    }

    // ------------------------------------------------------------------
    // 3. Check medications nearing next due date
    // ------------------------------------------------------------------
    const medsSnap = await adminDb
      .collection("medications")
      .where("isArchived", "==", false)
      .where("reminderSent", "==", false)
      .where("reminderEnabled", "==", true)
      .get();

    for (const mDoc of medsSnap.docs) {
      const m = mDoc.data();
      const owner = userMap.get(m.ownerId as string);
      if (!owner) continue;

      const nextDue = m.nextDueDate?.toDate?.();
      if (!nextDue) continue;

      const threshold = addDays(new Date(), owner.leadDays);
      if (nextDue > threshold) {
        summary.skipped++;
        continue;
      }

      let petName = "your pet";
      try {
        const petDoc = await adminDb.collection("pets").doc(m.petId as string).get();
        if (petDoc.exists) petName = (petDoc.data()?.name as string) || petName;
      } catch { /* use default */ }

      const html = buildMedicationReminderHtml(
        petName,
        m.name as string,
        format(nextDue, "MMMM d, yyyy")
      );

      const sent = await sendReminderEmail(
        owner.email,
        `💊 Time to give ${petName} their ${m.name}`,
        html
      );

      if (sent) {
        await mDoc.ref.update({ reminderSent: true });
        summary.medicationsSent++;
      } else {
        summary.errors++;
      }
    }

    console.log("[Cron] check-reminders completed:", summary);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Cron] check-reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron (which sends GET by default)
export async function GET(request: Request) {
  return POST(request);
}
