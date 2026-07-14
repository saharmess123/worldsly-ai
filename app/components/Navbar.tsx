"use client";

import { useEffect, useState } from "react";
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
  const [role, setRole] = useState<"user" | "admin">("admin");

  useEffect(() => {
    const localRole = localStorage.getItem("wordsly_user_role");
    if (localRole === "user") {
      setRole("user");
    } else {
      setRole("admin");
      localStorage.setItem("wordsly_user_role", "admin");
    }
  }, []);

  function toggleRole() {
    const nextRole = role === "admin" ? "user" : "admin";
    localStorage.setItem("wordsly_user_role", nextRole);
    setRole(nextRole);
    window.dispatchEvent(new Event("storage")); // Trigger updates in settings
  }

  const activeLinks = role === "admin" ? adminLinks : userLinks;

  return (
    <nav className="relative z-50 mb-8 rounded-[2rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-4">
        <a href="/" className="shrink-0 text-3xl font-black tracking-tight">
          Wordsly<span className="text-blue-500">.Ai</span>
        </a>

        {/* Desktop Links */}
        <div className="hidden items-center gap-5 text-sm font-bold text-slate-600 dark:text-slate-300 lg:flex">
          <a href="/" className="transition hover:text-blue-500">Home</a>
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
          <button
            onClick={toggleRole}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              role === "admin" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
            }`}
          >
            Role: {role === "admin" ? "Admin 🛠️" : "User 👤"}
          </button>
          
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
          <button
            onClick={toggleRole}
            className="rounded-full bg-slate-200 dark:bg-white/10 px-3 py-2 text-[10px] font-black"
          >
            {role === "admin" ? "Admin" : "User"}
          </button>
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
            <a href="/" onClick={() => setOpen(false)} className="px-4 py-3 font-black">Home</a>
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
