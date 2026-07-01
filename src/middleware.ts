import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protect every app route. Unauthenticated users are redirected to /login.
// Admin-only sections are additionally gated here (and again server-side).
export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    const adminOnly =
      pathname.startsWith("/admin7014") ||
      pathname.startsWith("/followups") ||
      pathname.startsWith("/members");

    if (adminOnly && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/leads", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // Run on everything except the login page, NextAuth API, and static assets.
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
