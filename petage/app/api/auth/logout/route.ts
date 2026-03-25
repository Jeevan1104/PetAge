import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

// Revokes the user's refresh tokens server-side on logout.
// This means even if someone captured a refresh token, it is immediately invalid.
// Firebase ID tokens (1-hour JWTs) still work until they naturally expire,
// but checkRevoked=true in verifyIdToken catches those too.
export async function POST(request: Request) {
  try {
    // Rate limit by IP before verifying the token — prevents token-flooding attacks
    const ip = getClientIp(request);
    const rl = await checkRateLimit("auth:logout", ip, 10, "1 m");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const uid = await verifyIdToken(request);
    if (!uid) {
      logger.warn("auth.logout.auth_failed", { ip });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await adminAuth.revokeRefreshTokens(uid);
    logger.info("auth.logout.success", { uid });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("auth.logout.internal_error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
