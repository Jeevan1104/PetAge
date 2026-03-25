import "server-only";
import { adminAuth } from "./firebase-admin";
import { logger } from "./logger";

// Extracts and verifies the Firebase ID token from the Authorization header.
// checkRevoked=true ensures tokens revoked via /api/auth/logout are immediately
// rejected — prevents session reuse after sign-out.
// Returns the uid on success, null on any failure (expired, revoked, malformed).
export async function verifyIdToken(request: Request): Promise<string | null> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice(7);
  const pathname = new URL(request.url).pathname;

  try {
    const decoded = await adminAuth.verifyIdToken(token, /* checkRevoked */ true);
    logger.info("auth.token_verified", { uid: decoded.uid, pathname });
    return decoded.uid;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    logger.warn("auth.token_verification_failed", { pathname, reason });
    return null;
  }
}
