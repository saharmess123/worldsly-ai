import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const roleCookie = request.cookies.get("wordsly_user_role");
  // Default to admin initially if no cookie exists so that fresh preview environments are fully accessible.
  const role = roleCookie?.value || "admin";

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
  ];

  const isAdminPath = adminPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isAdminPath && role !== "admin") {
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
