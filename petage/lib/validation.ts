/**
 * Shared validation helpers for API routes.
 * Extracted from pets route handlers to eliminate duplication.
 */

/**
 * Converts empty strings and null values to undefined.
 * Useful as a Zod `.preprocess()` transform for optional fields
 * that may arrive as "" from HTML forms.
 */
export function emptyToUndefined(v: unknown): unknown {
  return v === "" || v === null ? undefined : v;
}

/**
 * Returns true if the given URL points to Firebase Storage.
 * Used to ensure user-supplied photo URLs are hosted on our own bucket
 * rather than arbitrary external domains.
 */
export function isFirebaseStorageUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    return (
      protocol === "https:" &&
      (hostname === "firebasestorage.googleapis.com" ||
        hostname === "storage.googleapis.com")
    );
  } catch {
    return false;
  }
}
