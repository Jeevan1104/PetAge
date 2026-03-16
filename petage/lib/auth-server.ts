import { adminAuth } from "./firebase-admin";

// Extracts and verifies the Firebase ID token from the Authorization header.
// Returns the uid on success, null on failure.
export async function verifyIdToken(request: Request): Promise<string | null> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
