"use client";

import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const moreLinks = [
  {
    title: "Discovery",
    href: "/discovery",
    description: "Find prompts",
    icon: "🔎",
  },
  {
    title: "Sources",
    href: "/sources",
    description: "Discovery sources",
    icon: "🌍",
  },
  {
    title: "Corpus",
    href: "/corpus",
    description: "Approved prompt library",
    icon: "📚",
  },
  {
    title: "Curation",
    href: "/curation",
    description: "Review queue",
    icon: "✅",
  },
  {
    title: "Training",
    href: "/training",
    description: "Model improvement",
    icon: "🧠",
  },
  {
    title: "Feedback",
    href: "/feedback",
    description: "Learn from results",
    icon: "💬",
  },
  {
    title: "History",
    href: "/history",
    description: "Saved optimizations",
    icon: "🕘",
  },
  {
    title: "Database Viewer",
    href: "/mock-database",
    description: "SQLite data viewer",
    icon: "🗄️",
  },
  {
    title: "Database Setup",
    href: "/database-setup",
    description: "Persistent data plan",
    icon: "💾",
  },
  {
    title: "API Status",
    href: "/api-status",
    description: "API health monitor",
    icon: "📡",
  },
  {
    title: "Backend Plan",
    href: "/backend-plan",
    description: "Real engine plan",
    icon: "🧩",
  },
  {
    title: "Admin",
    href: "/admin",
    description: "System control",
    icon: "🛠️",
  },
  {
    title: "Library",
    href: "/library",
    description: "Prompt collection",
    icon: "📖",
  },
  {
    title: "Pricing",
    href: "/pricing",
    description: "Plans and access",
    icon: "💳",
  },
  {
    title: "Settings",
    href: "/settings",
    description: "User preferences",
    icon: "⚙️",
  },
  {
    title: "Roadmap",
    href: "/roadmap",
    description: "Product plan",
    icon: "🛣️",
  },
  {
    title: "Architecture",
    href: "/architecture",
    description: "System design",
    icon: "🏗️",
  },
  {
    title: "Pitch",
    href: "/pitch",
    description: "Project pitch",
    icon: "🚀",
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-50 mb-8 rounded-[2rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <a href="/" className="shrink-0 text-3xl font-black tracking-tight">
          Wordsly<span className="text-blue-500">.Ai</span>
        </a>

        <div className="hidden items-center gap-5 text-sm font-bold text-slate-600 dark:text-slate-300 lg:flex">
          <a href="/" className="transition hover:text-blue-500">
            Home
          </a>

          <a href="/dashboard" className="transition hover:text-blue-500">
            Dashboard
          </a>

          <a href="/prompt-optimizer" className="transition hover:text-blue-500">
            Optimizer
          </a>

          <a href="/tools" className="transition hover:text-blue-500">
            Tools
          </a>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-white/10"
            >
              More
              <span
                className={`transition ${
                  open ? "rotate-180 text-blue-500" : ""
                }`}
              >
                ↓
              </span>
            </button>

            {open && (
              <div className="absolute right-0 top-12 max-h-[75vh] w-[390px] overflow-auto rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-slate-950 dark:shadow-black/40">
                <div className="grid gap-2">
                  {moreLinks.map((link) => (
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
                        <h3 className="font-black text-slate-950 dark:text-white">
                          {link.title}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {link.description}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <ThemeToggle />

          <a
            href="/prompt-optimizer"
            className="rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-600"
          >
            Optimize
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="rounded-full bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30"
          >
            Menu
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-300/20 dark:border-white/10 dark:bg-slate-950 dark:shadow-black/20 lg:hidden">
          <div className="grid gap-2">
            <a
              href="/"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 font-black transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Home
            </a>

            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 font-black transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Dashboard
            </a>

            <a
              href="/prompt-optimizer"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 font-black transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Optimizer
            </a>

            <a
              href="/tools"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 font-black transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              Tools
            </a>

            {moreLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex gap-4 rounded-2xl px-4 py-3 transition hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <span>{link.icon}</span>
                <span className="font-black">{link.title}</span>
              </a>
            ))}

            <a
              href="/prompt-optimizer"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-2xl bg-blue-500 px-5 py-4 text-center font-black text-white shadow-lg shadow-blue-500/30"
            >
              Optimize Prompt
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}