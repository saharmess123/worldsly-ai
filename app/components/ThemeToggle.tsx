"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
    >
      {isDark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}