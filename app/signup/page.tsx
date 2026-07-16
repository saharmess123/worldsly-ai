"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        setError(data.error || "Failed to create account.");
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
          <h2 className="mt-4 text-2xl font-black text-slate-800 dark:text-white">Create Account</h2>
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Sign up to build datasets and access prompt engineering tools.
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

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-semibold outline-none focus:border-blue-500 transition dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:underline font-black">
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
