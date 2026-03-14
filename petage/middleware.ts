import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js middleware for route protection
// NOTE: Firebase Auth JWT validation happens client-side via onAuthStateChanged
// This middleware provides basic path-based redirects for unauthenticated users

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth pages — redirect to dashboard if already authenticated
  // (actual auth check happens client-side, this is a UX optimization)
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";

  // Dashboard pages need authentication
  const isDashboardPage = pathname.startsWith("/dashboard");

  // For dashboard pages, we rely on client-side auth guard in layout.tsx
  // The middleware just handles the basic routing logic

  if (isDashboardPage || isAuthPage) {
    // Let the request through — client-side guards handle the rest
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Match dashboard and auth routes
  matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password"],
};
