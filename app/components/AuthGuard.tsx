"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        
        // Public routes
        const isPublicRoute = ["/", "/login", "/signup"].includes(pathname);

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.authenticated && data.user) {
            setAuthenticated(true);
            const user = data.user as User;

            // Admin routes check
            const isAdminRoute =
              pathname.startsWith("/admin") ||
              [
                "/api-status",
                "/mock-database",
                "/sources",
                "/discovery",
                "/curation",
                "/corpus",
                "/training",
                "/architecture",
                "/backend-plan",
              ].includes(pathname);

            if (isAdminRoute && user.role !== "admin") {
              // Redirect regular users from admin pages to dashboard
              router.push("/dashboard");
              return;
            }

            // Redirect authenticated users trying to access login/signup
            if (["/login", "/signup"].includes(pathname)) {
              router.push("/dashboard");
              return;
            }

            setLoading(false);
            return;
          }
        }

        // Not authenticated
        setAuthenticated(false);

        // Redirect unauthenticated users from protected routes to login
        if (!isPublicRoute) {
          router.push("/login");
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("AuthGuard verification error:", err);
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  // Loading spinner with premium aesthetics
  if (loading) {
    const isPublicRoute = ["/", "/login", "/signup"].includes(pathname);
    
    // Do not show full-page loading screen for public landing page
    if (isPublicRoute && pathname === "/") {
      return <>{children}</>;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent shadow-lg" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-blue-400" />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-slate-400 animate-pulse">
          Verifying Session...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
