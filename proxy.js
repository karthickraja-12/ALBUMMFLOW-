import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Edge-compatible auth for middleware — uses authConfig (no Prisma)
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isApproved = req.auth?.user?.is_approved;
  const isAdmin = req.auth?.user?.role === "super_admin";
  const { pathname } = req.nextUrl;

  // 1. Protect Admin Route
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn || !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 2. Handle Dashboard Access & Approval
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // If not approved, redirect to "Pending" (unless already there or admin)
    if (!isApproved && !isAdmin && pathname !== "/dashboard/pending") {
      return NextResponse.redirect(new URL("/dashboard/pending", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
