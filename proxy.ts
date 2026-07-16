import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./app/lib/auth";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("wordsly_session");
  const token = sessionCookie?.value || "";
  
  // Verify session cryptographically
  const session = verifyToken(token);
  const role = session?.role || "user";
  const userId = session?.userId || null;

  const { pathname } = request.nextUrl;

  const adminPaths = [
    "/admin",
    "/api-status",
    "/mock-database",
    "/sources",
    "/discovery",
    "/curation",
    "/corpus",
    "/training",
    "/architecture",
    "/backend-plan",
    "/api/corpus",
    "/api/curation",
    "/api/discovery",
    "/api/sources",
    "/api/training-signals",
    "/api/analytics",
  ];

  const isAdminPath = adminPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isAdminPath) {
    // If not logged in, redirect to login or return 401
    if (!userId) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Access denied. Authentication required." },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If logged in but not admin, deny access
    if (role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Access denied. Admin privileges required." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
