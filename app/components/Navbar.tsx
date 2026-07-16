/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const userLinks = [
  { title: "Dashboard", href: "/dashboard", description: "Overview and usage statistics", icon: "📊" },
  { title: "Optimizer", href: "/prompt-optimizer", description: "Enhance your prompts", icon: "⚡" },
  { title: "History", href: "/history", description: "Your saved optimization records", icon: "🕘" },
  { title: "Library", href: "/library", description: "Browse public templates", icon: "📖" },
  { title: "Tools", href: "/tools", description: "Helper and text formatting utilities", icon: "🛠️" },
  { title: "Pricing", href: "/pricing", description: "Plans and access credentials", icon: "💳" },
  { title: "Settings", href: "/settings", description: "Customize your prompt style", icon: "⚙️" },
];

const adminLinks = [
  ...userLinks,
  { title: "Admin Center", href: "/admin", description: "Platform control system", icon: "🛠️" },
  { title: "API Status", href: "/api-status", description: "Internal API status", icon: "📡" },
  { title: "Database Viewer", href: "/mock-database", description: "Inspect SQLite content", icon: "🗄️" },
  { title: "Sources", href: "/sources", description: "Prompt ingestion channels", icon: "🌍" },
  { title: "Discovery", href: "/discovery", description: "Ingested prompts queue", icon: "🔎" },
  { title: "Curation", href: "/curation", description: "Review and approve templates", icon: "✅" },
  { title: "Corpus", href: "/corpus", description: "Curated prompt database", icon: "📚" },
  { title: "Training", href: "/training", description: "PromptMaster training dataset", icon: "🧠" },
  { title: "Architecture", href: "/architecture", description: "Technical architecture plan", icon: "🏗️" },
  { title: "Backend Plan", href: "/backend-plan", description: "Next actions plan", icon: "🧩" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string | null; email: string; role: string } | null>(null);
  const [role, setRole] = useState<"user" | "admin">("user");

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.authenticated) {
            setUser(data.user);
            setRole(data.user.role === "admin" ? "admin" : "user");
            return;
          }
        }
        setUser(null);
        setRole("user");
      } catch {
        setUser(null);
        setRole("user");
      }
    }
    checkSession();
  }, []);

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        setRole("user");
        window.location.href = "/login";
      }
    } catch {
      alert("Failed to log out.");
    }
  }

  const activeLinks = role === "admin" ? adminLinks : userLinks;

  return (
    <nav className="relative z-50 mb-8 rounded-[2rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0 text-3xl font-black tracking-tight">
          Wordsly<span className="text-blue-500">.Ai</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-5 text-sm font-bold text-slate-600 dark:text-slate-300 lg:flex">
          <Link href="/" className="transition hover:text-blue-500">Home</Link>
          <a href="/dashboard" className="transition hover:text-blue-500">Dashboard</a>
          <a href="/prompt-optimizer" className="transition hover:text-blue-500">Optimizer</a>
          <a href="/tools" className="transition hover:text-blue-500">Tools</a>

          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-white/10"
            >
              More
              <span className={`transition ${open ? "rotate-180 text-blue-500" : ""}`}>↓</span>
            </button>

            {open && (
              <div className="absolute right-0 top-12 max-h-[60vh] w-[390px] overflow-auto rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-slate-950">
                <div className="grid gap-2">
                  {activeLinks.map((link) => (
                    <a
                      key={link.title}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex gap-4 rounded-3xl p-4 transition hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                        {link.icon}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-950 dark:text-white">{link.title}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{link.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="hidden items-center gap-3 sm:flex">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Hi, <strong className="text-slate-800 dark:text-white">{user.name || user.email}</strong>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                  role === "admin" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                }`}>
                  {role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2 text-xs font-black hover:bg-slate-800 transition"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 bg-white/70 px-5 py-2.5 text-xs font-black text-slate-900 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-blue-500 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-600 transition"
              >
                Sign Up
              </Link>
            </>
          )}
          
          <ThemeToggle />

          <a
            href="/prompt-optimizer"
            className="rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white hover:bg-blue-600 transition"
          >
            Optimize
          </a>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="mt-4 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-950 lg:hidden">
          <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
            {user ? (
              <div className="border-b border-slate-200 dark:border-white/10 px-4 py-3 mb-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">Logged in as:</p>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    role === "admin" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                  }`}>
                    {role}
                  </span>
                </div>
                <p className="font-black text-sm text-slate-800 dark:text-white">{user.name || user.email}</p>
                <button
                  onClick={handleLogout}
                  className="mt-2 w-full rounded-xl bg-red-500/10 text-red-500 py-2 text-xs font-black hover:bg-red-500/20 transition"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-4 py-3 mb-2 border-b border-slate-200 dark:border-white/10">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white py-2 text-center text-xs font-black dark:border-white/10 dark:bg-slate-900"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-blue-500 py-2 text-center text-xs font-black text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <Link href="/" onClick={() => setOpen(false)} className="px-4 py-3 font-black">Home</Link>
            {activeLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex gap-4 rounded-2xl px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <span>{link.icon}</span>
                <span className="font-black">{link.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
