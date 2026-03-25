import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("vaccines_global.get.auth_failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 60 reads per minute per user
    const rl = await checkRateLimit("vaccines_global:read", uid, 60, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const snap = await adminDb
      .collection("vaccines")
      .where("ownerId", "==", uid)
      .get();

    const vaccines = snap.docs
      .map((d) => ({ vaccineId: d.id, ...d.data() } as Record<string, unknown> & { vaccineId: string }))
      .filter((v) => !v.isArchived)
      .sort((a, b) => {
        const aTs = (a.dateAdministered as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
        const bTs = (b.dateAdministered as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
        return bTs - aTs;
      });
    
    return NextResponse.json({ vaccines });
  } catch (err) {
    logger.error("vaccines_global.get.internal_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
