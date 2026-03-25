import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware runs on the Edge runtime — Firebase Admin SDK is NOT available here.
// Route protection is enforced at three layers:
//   1. This middleware: fast path-based redirects via session cookie heuristic
//   2. Client-side: dashboard/layout.tsx checks firebaseUser + emailVerified
//   3. API routes: verifyIdToken() with checkRevoked=true on every request

export function middleware(request: NextRequest) {
  // Firebase stores auth state in IndexedDB, not cookies — cookie-based
  // redirect detection is unreliable and causes redirect loops for authenticated
  // users navigating to /dashboard. Auth enforcement is handled at two layers:
  //   1. Client-side: dashboard/layout.tsx checks firebaseUser + emailVerified
  //   2. API routes: verifyIdToken() with checkRevoked=true on every request
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password", "/verify-email"],
};
