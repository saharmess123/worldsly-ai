"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type HistoryItem = {
  id: string;
  tool: string;
  originalPrompt: string;
  output: string;
  category: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  originalScore: number;
  improvedScore: number;
  engineStatus: string;
  createdAt: string;
};

type HistoryApiResponse = {
  items: HistoryItem[];
  count: number;
  storageMode: string;
  note?: string;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [storageMode, setStorageMode] = useState("loading");

  async function loadHistory() {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/history", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as HistoryApiResponse;

      if (!response.ok) {
        throw new Error("Failed to load history.");
      }

      setHistory(data.items || []);
      setStorageMode(data.storageMode || "postgres_prisma");
    } catch {
      setError("Could not load history from SQLite.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const searchText = `
        ${item.tool}
        ${item.originalPrompt}
        ${item.output}
        ${item.category}
        ${item.model}
        ${item.goal}
        ${item.depth}
        ${item.outputFormat}
        ${item.engineStatus}
        ${item.createdAt}
      `;

      return searchText.toLowerCase().includes(search.toLowerCase());
    });
  }, [history, search]);

  const optimizerCount = history.filter((item) =>
    item.tool.toLowerCase().includes("prompt optimizer")
  ).length;

  const imageCount = history.filter((item) =>
    item.category.toLowerCase().includes("image")
  ).length;

  const averageGain =
    history.length === 0
      ? 0
      : Math.round(
          history.reduce(
            (sum, item) => sum + (item.improvedScore - item.originalScore),
            0
          ) / history.length
        );

  const averageImprovedScore =
    history.length === 0
      ? 0
      : Math.round(
          history.reduce((sum, item) => sum + item.improvedScore, 0) /
            history.length
        );

  async function copyOutput(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }

  async function clearHistory() {
    const confirmed = confirm("Are you sure you want to clear all history?");

    if (!confirmed) return;

    try {
      setIsClearing(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/history", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear history.");
      }

      setHistory([]);
      setSuccessMessage("All history records deleted from SQLite.");
    } catch {
      setError("Could not clear history from SQLite.");
    } finally {
      setIsClearing(false);
    }
  }

  async function deleteHistoryItem(id: string) {
    const confirmed = confirm("Delete this history record?");

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete history item.");
      }

      setHistory((current) => current.filter((item) => item.id !== id));
      setSuccessMessage("History record deleted from SQLite.");
    } catch {
      setError("Could not delete this history record from SQLite.");
    } finally {
      setDeletingId(null);
    }
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
                SQLite Optimization History
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Review and reuse your saved prompt improvements.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Every saved optimization is now stored in SQLite with Prisma,
                so it stays available even after restarting the development
                server.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Optimize New Prompt
                </a>

                <button
                  type="button"
                  onClick={loadHistory}
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  {isLoading ? "Refreshing..." : "Refresh History"}
                </button>

                <a
                  href="/mock-database"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  Mock Database
                </a>
              </div>

              <div className="mt-5 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-500">
                Storage: {storageMode}
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">History Analytics</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Track saved prompt intelligence records from the SQLite database.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Total Saved</p>
                <h3 className="mt-2 text-4xl font-black">{history.length}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Optimized</p>
                <h3 className="mt-2 text-4xl font-black">{optimizerCount}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Image</p>
                <h3 className="mt-2 text-4xl font-black">{imageCount}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Avg Gain</p>
                <h3 className="mt-2 text-4xl font-black">+{averageGain}</h3>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Average Improved Score
              </p>
              <p className="mt-2 text-4xl font-black">
                {averageImprovedScore}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                This score is calculated from saved database optimization
                records.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search saved prompts, categories, models, or dates..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <button
              onClick={loadHistory}
              className="rounded-2xl bg-blue-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-600"
            >
              Refresh
            </button>

            <button
              onClick={clearHistory}
              disabled={history.length === 0 || isClearing}
              className="rounded-2xl bg-red-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-500/20 transition hover:-translate-y-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isClearing ? "Clearing..." : "Clear History"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-12 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
              ⏳
            </div>

            <h2 className="text-3xl font-black">Loading SQLite history...</h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Reading saved optimization records from the database.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
              🧠
            </div>

            <h2 className="text-3xl font-black">
              {history.length === 0
                ? "No saved optimizations yet"
                : "No results found"}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              {history.length === 0
                ? "Optimize your first prompt and save it to start building your SQLite prompt history."
                : "Try searching with another keyword."}
            </p>

            <a
              href="/prompt-optimizer"
              className="mt-6 inline-block rounded-2xl bg-blue-500 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
            >
              Start Optimizing
            </a>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                        {item.tool}
                      </span>

                      <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-black text-purple-500">
                        {item.category}
                      </span>

                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">
                        +{item.improvedScore - item.originalScore}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-black">
                      Saved Prompt Record
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {item.createdAt}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-emerald-500/10 p-4 text-center">
                    <p className="text-xs font-black text-emerald-500">
                      Score
                    </p>
                    <p className="mt-1 font-black text-emerald-500">
                      {item.originalScore} → {item.improvedScore}
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Original Prompt
                  </p>

                  <p className="line-clamp-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    {item.originalPrompt || "No original prompt saved."}
                  </p>
                </div>

                <pre className="max-h-[340px] overflow-auto whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">
                  {item.output}
                </pre>

                <div className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-slate-950/60 sm:grid-cols-2">
                  <div>
                    <p className="font-black text-slate-500">Model</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {item.model}
                    </p>
                  </div>

                  <div>
                    <p className="font-black text-slate-500">Goal</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {item.goal}
                    </p>
                  </div>

                  <div>
                    <p className="font-black text-slate-500">Depth</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {item.depth}
                    </p>
                  </div>

                  <div>
                    <p className="font-black text-slate-500">Engine</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {item.engineStatus}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => copyOutput(item.output, item.id)}
                    className="flex-1 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-600"
                  >
                    {copiedId === item.id ? "Copied" : "Copy Improved Prompt"}
                  </button>

                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    disabled={deletingId === item.id}
                    className="flex-1 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-500 transition hover:-translate-y-1 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {deletingId === item.id ? "Deleting..." : "Delete Record"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}