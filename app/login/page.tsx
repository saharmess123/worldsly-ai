"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@wordsly.ai");
  const [password, setPassword] = useState("adminadmin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Connected successfully! Redirecting...");
        // Wait a brief moment to show success message before redirecting
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        setError(data.error || "Invalid credentials.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12 dark:bg-[#030712] relative overflow-hidden">
      {/* Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[20%] top-[20%] h-[450px] w-[450px] rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute right-[20%] bottom-[20%] h-[450px] w-[450px] rounded-full bg-fuchsia-500/15 blur-[130px]" />
      </div>

      <div className="relative w-full max-w-md rounded-[2.5rem] border border-slate-200 bg-white/80 p-10 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/50 transition duration-300">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black tracking-tight dark:text-white">
            Wordsly<span className="text-blue-500">.Ai</span>
          </Link>
          <h2 className="mt-4 text-2xl font-black text-slate-800 dark:text-white">Welcome Back</h2>
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Sign in to access prompt optimization, training signals and logs.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-500 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-500 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-semibold outline-none focus:border-blue-500 transition dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-semibold outline-none focus:border-blue-500 transition dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-500 py-4 text-sm font-black text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 mt-2 shadow-lg shadow-blue-500/25"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Suggest credentials box */}
        <div className="mt-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 p-4 text-[11px] text-blue-500 font-bold leading-5">
          💡 <span className="uppercase tracking-wider text-[10px] text-blue-600 dark:text-blue-400">Testing Credentials:</span>
          <div className="mt-1">
            <strong>Login:</strong> <code className="bg-blue-500/10 px-1.5 py-0.5 rounded">admin@wordsly.ai</code>
          </div>
          <div>
            <strong>Password:</strong> <code className="bg-blue-500/10 px-1.5 py-0.5 rounded">adminadmin</code>
          </div>
        </div>

        <div className="mt-8 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          New to Wordsly.Ai?{" "}
          <Link href="/signup" className="text-blue-500 hover:underline font-black">
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
