"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type FeedbackItem = {
  id: string;
  rating: "useful" | "needs_work";
  originalPrompt: string;
  improvedPrompt: string;
  category: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  engineStatus: string;
  createdAt: string;
};

type FeedbackApiResponse = {
  items: FeedbackItem[];
  count: number;
  usefulCount: number;
  needsWorkCount: number;
  storageMode: string;
  note?: string;
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "useful" | "needs_work">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [storageMode, setStorageMode] = useState("loading");
  const [copiedText, setCopiedText] = useState("");

  async function loadFeedback() {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/feedback", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as FeedbackApiResponse;

      if (!response.ok) {
        throw new Error("Failed to load feedback.");
      }

      setFeedback(data.items || []);
      setStorageMode(data.storageMode || "postgres_prisma");
    } catch {
      setError("Could not load feedback from SQLite.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  const usefulCount = feedback.filter((item) => item.rating === "useful").length;

  const needsWorkCount = feedback.filter(
    (item) => item.rating === "needs_work"
  ).length;

  const successRate =
    feedback.length === 0
      ? 0
      : Math.round((usefulCount / feedback.length) * 100);

  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const matchesFilter = filter === "all" || item.rating === filter;

      const searchText = `
        ${item.originalPrompt}
        ${item.improvedPrompt}
        ${item.category}
        ${item.model}
        ${item.goal}
        ${item.depth}
        ${item.outputFormat}
        ${item.engineStatus}
        ${item.createdAt}
      `.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [feedback, search, filter]);

  async function clearFeedback() {
    const confirmed = confirm("Are you sure you want to clear all feedback?");

    if (!confirmed) return;

    try {
      setIsClearing(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/feedback", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear feedback.");
      }

      setFeedback([]);
      setSuccessMessage("All feedback records deleted from SQLite.");
    } catch {
      setError("Could not clear feedback from SQLite.");
    } finally {
      setIsClearing(false);
    }
  }

  async function deleteFeedbackItem(id: string) {
    const confirmed = confirm("Delete this feedback record?");

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete feedback item.");
      }

      setFeedback((current) => current.filter((item) => item.id !== id));
      setSuccessMessage("Feedback record deleted from SQLite.");
    } catch {
      setError("Could not delete this feedback record from SQLite.");
    } finally {
      setDeletingId(null);
    }
  }

  async function copyPrompt(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopiedText(label);

    setTimeout(() => {
      setCopiedText("");
    }, 2000);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[30%] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        {error ? (
          <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-bold text-red-500">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm font-bold text-emerald-500">
            {successMessage}
          </div>
        ) : null}

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                SQLite Feedback Learning Loop
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Learn which prompt improvements perform best.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Feedback signals are now stored in SQLite using Prisma. This
                page reads real backend feedback records instead of browser
                localStorage.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Optimize Prompt
                </a>

                <button
                  type="button"
                  onClick={loadFeedback}
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  {isLoading ? "Refreshing..." : "Refresh Feedback"}
                </button>

                <a
                  href="/dashboard"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  View Dashboard
                </a>
              </div>

              <div className="mt-5 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-500">
                Storage: {storageMode}
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Learning Analytics</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              User feedback becomes future training, ranking, and optimization
              signals.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Total</p>
                <h3 className="mt-2 text-4xl font-black">{feedback.length}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Success</p>
                <h3 className="mt-2 text-4xl font-black">{successRate}%</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Useful</p>
                <h3 className="mt-2 text-4xl font-black text-emerald-300">
                  {usefulCount}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Needs Work</p>
                <h3 className="mt-2 text-4xl font-black text-red-300">
                  {needsWorkCount}
                </h3>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Future Training Signal
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Later, this data can feed preference optimization, prompt
                ranking, and personalized prompt memory.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search feedback by prompt, model, goal, category..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <button
              onClick={() => setFilter("all")}
              className={`rounded-2xl px-5 py-4 text-sm font-black transition ${
                filter === "all"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "border border-slate-300 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setFilter("useful")}
              className={`rounded-2xl px-5 py-4 text-sm font-black transition ${
                filter === "useful"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "border border-slate-300 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300"
              }`}
            >
              Useful
            </button>

            <button
              onClick={() => setFilter("needs_work")}
              className={`rounded-2xl px-5 py-4 text-sm font-black transition ${
                filter === "needs_work"
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                  : "border border-slate-300 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300"
              }`}
            >
              Needs Work
            </button>

            <button
              onClick={clearFeedback}
              disabled={feedback.length === 0 || isClearing}
              className="rounded-2xl bg-red-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-red-500/20 transition hover:-translate-y-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isClearing ? "Clearing..." : "Clear"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-12 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
              ⏳
            </div>

            <h2 className="text-3xl font-black">Loading SQLite feedback...</h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Reading feedback records from the database.
            </p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
              🔁
            </div>

            <h2 className="text-3xl font-black">
              {feedback.length === 0
                ? "No feedback saved yet"
                : "No matching feedback found"}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Use the Prompt Optimizer, then click Useful or Needs Work to save
              feedback into SQLite.
            </p>

            <a
              href="/prompt-optimizer"
              className="mt-6 inline-block rounded-2xl bg-blue-500 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
            >
              Go to Optimizer
            </a>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredFeedback.map((item) => (
              <div
                key={item.id}
                className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        item.rating === "useful"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {item.rating === "useful" ? "Useful" : "Needs Work"}
                    </span>

                    <h2 className="mt-4 text-2xl font-black">
                      Feedback Record
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {item.createdAt}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="rounded-3xl bg-slate-950 p-4 text-center text-white dark:bg-white dark:text-slate-950">
                      <p className="text-xs font-black">Engine</p>
                      <p className="mt-1 text-xs font-black">
                        {item.engineStatus}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteFeedbackItem(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-black text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>

                <div className="mb-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                    <p className="text-xs font-black text-slate-500">
                      CATEGORY
                    </p>
                    <p className="mt-2 text-sm font-bold">{item.category}</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                    <p className="text-xs font-black text-slate-500">MODEL</p>
                    <p className="mt-2 text-sm font-bold">{item.model}</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                    <p className="text-xs font-black text-slate-500">GOAL</p>
                    <p className="mt-2 text-sm font-bold">{item.goal}</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                    <p className="text-xs font-black text-slate-500">DEPTH</p>
                    <p className="mt-2 text-sm font-bold">{item.depth}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-black">Original Prompt</h3>

                      <button
                        onClick={() =>
                          copyPrompt(item.originalPrompt, `original-${item.id}`)
                        }
                        className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500"
                      >
                        {copiedText === `original-${item.id}`
                          ? "Copied"
                          : "Copy"}
                      </button>
                    </div>

                    <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap rounded-3xl bg-slate-100 p-5 text-sm leading-7 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      {item.originalPrompt || "No original prompt saved."}
                    </pre>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-black">Improved Prompt</h3>

                      <button
                        onClick={() =>
                          copyPrompt(item.improvedPrompt, `improved-${item.id}`)
                        }
                        className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500"
                      >
                        {copiedText === `improved-${item.id}`
                          ? "Copied"
                          : "Copy"}
                      </button>
                    </div>

                    <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">
                      {item.improvedPrompt}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}