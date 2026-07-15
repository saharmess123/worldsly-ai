import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const roleCookie = request.cookies.get("wordsly_user_role");
  // Default to user initially if no cookie exists for robust role protection.
  const role = roleCookie?.value || "user";

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

  if (isAdminPath && role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
