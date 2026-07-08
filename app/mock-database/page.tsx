"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

type HistoryItem = {
  id: string;
  tool: string;
  originalPrompt?: string;
  output: string;
  category?: string;
  model?: string;
  goal?: string;
  depth?: string;
  outputFormat?: string;
  originalScore?: number;
  improvedScore?: number;
  engineStatus?: string;
  createdAt: string;
};

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

type HistoryResponse = {
  items: HistoryItem[];
  count: number;
  storageMode: string;
  note?: string;
};

type FeedbackResponse = {
  items: FeedbackItem[];
  count: number;
  usefulCount: number;
  needsWorkCount: number;
  storageMode: string;
  note?: string;
};

type AnalyticsResponse = {
  storageMode: string;
  totals: {
    totalOptimizations: number;
    totalFeedback: number;
    usefulFeedback: number;
    needsWorkFeedback: number;
    usefulRate: number;
  };
  scores: {
    averageOriginalScore: number;
    averageImprovedScore: number;
    averageScoreGain: number;
  };
};

const emptyAnalytics: AnalyticsResponse = {
  storageMode: "sqlite_prisma",
  totals: {
    totalOptimizations: 0,
    totalFeedback: 0,
    usefulFeedback: 0,
    needsWorkFeedback: 0,
    usefulRate: 0,
  },
  scores: {
    averageOriginalScore: 0,
    averageImprovedScore: 0,
    averageScoreGain: 0,
  },
};

export default function MockDatabasePage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse>(emptyAnalytics);
  const [historyCount, setHistoryCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [usefulCount, setUsefulCount] = useState(0);
  const [needsWorkCount, setNeedsWorkCount] = useState(0);
  const [storageMode, setStorageMode] = useState("sqlite_prisma");
  const [lastLoaded, setLastLoaded] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearingDemo, setIsClearingDemo] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(
    null
  );
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState("");

  async function loadDatabaseData() {
    try {
      setIsLoading(true);
      setMessage("");

      const [historyResponse, feedbackResponse, analyticsResponse] =
        await Promise.all([
          fetch("/api/history", { cache: "no-store" }),
          fetch("/api/feedback", { cache: "no-store" }),
          fetch("/api/analytics", { cache: "no-store" }),
        ]);

      const historyData = (await historyResponse.json()) as HistoryResponse;
      const feedbackData = (await feedbackResponse.json()) as FeedbackResponse;
      const analyticsData =
        (await analyticsResponse.json()) as AnalyticsResponse;

      if (!historyResponse.ok) {
        throw new Error("Could not load history API data.");
      }

      if (!feedbackResponse.ok) {
        throw new Error("Could not load feedback API data.");
      }

      if (!analyticsResponse.ok) {
        throw new Error("Could not load analytics API data.");
      }

      setHistory(Array.isArray(historyData.items) ? historyData.items : []);
      setFeedback(Array.isArray(feedbackData.items) ? feedbackData.items : []);
      setAnalytics(analyticsData || emptyAnalytics);

      setHistoryCount(historyData.count || 0);
      setFeedbackCount(feedbackData.count || 0);
      setUsefulCount(feedbackData.usefulCount || 0);
      setNeedsWorkCount(feedbackData.needsWorkCount || 0);

      setStorageMode(
        analyticsData.storageMode ||
          historyData.storageMode ||
          feedbackData.storageMode ||
          "sqlite_prisma"
      );

      setLastLoaded(new Date().toLocaleString());
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while loading SQLite database data.";

      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function seedDemoData() {
    try {
      setIsSeeding(true);
      setMessage("");

      const response = await fetch("/api/seed-demo", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not seed demo data.");
      }

      setMessage("Demo data inserted into SQLite.");
      await loadDatabaseData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not seed demo data.";

      setMessage(errorMessage);
    } finally {
      setIsSeeding(false);
    }
  }

  async function clearDemoData() {
    const confirmed = confirm(
      "Are you sure you want to clear all optimization and feedback records?"
    );

    if (!confirmed) return;

    try {
      setIsClearingDemo(true);
      setMessage("");

      const response = await fetch("/api/seed-demo", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not clear demo data.");
      }

      setMessage("All demo data cleared from SQLite.");
      await loadDatabaseData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not clear demo data.";

      setMessage(errorMessage);
    } finally {
      setIsClearingDemo(false);
    }
  }

  async function clearHistory() {
    const confirmed = confirm("Are you sure you want to clear all history?");

    if (!confirmed) return;

    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch("/api/history", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not clear history.");
      }

      setMessage("All history records cleared from SQLite.");
      await loadDatabaseData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not clear history.";

      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function clearFeedback() {
    const confirmed = confirm("Are you sure you want to clear all feedback?");

    if (!confirmed) return;

    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch("/api/feedback", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not clear feedback.");
      }

      setMessage("All feedback records cleared from SQLite.");
      await loadDatabaseData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not clear feedback.";

      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteHistoryItem(id: string) {
    const confirmed = confirm("Delete this history record?");

    if (!confirmed) return;

    try {
      setDeletingHistoryId(id);
      setMessage("");

      const response = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete history record.");
      }

      setMessage("History record deleted from SQLite.");
      await loadDatabaseData();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not delete history record.";

      setMessage(errorMessage);
    } finally {
      setDeletingHistoryId(null);
    }
  }

  async function deleteFeedbackItem(id: string) {
    const confirmed = confirm("Delete this feedback record?");

    if (!confirmed) return;

    try {
      setDeletingFeedbackId(id);
      setMessage("");

      const response = await fetch(
        `/api/feedback?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete feedback record.");
      }

      setMessage("Feedback record deleted from SQLite.");
      await loadDatabaseData();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not delete feedback record.";

      setMessage(errorMessage);
    } finally {
      setDeletingFeedbackId(null);
    }
  }

  useEffect(() => {
    loadDatabaseData();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[30%] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        <div className="relative mb-8 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
          <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[30%] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
              SQLite Database Viewer
            </div>

            <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              View real persisted Wordsly.Ai database records.
            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              This page reads optimization history, feedback, and analytics from
              the SQLite database through Prisma-powered API routes.
            </p>

            <div className="mt-8 flex flex-col flex-wrap gap-4 sm:flex-row">
              <button
                onClick={loadDatabaseData}
                disabled={isLoading}
                className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isLoading ? "Loading..." : "Refresh Database"}
              </button>

              <button
                onClick={seedDemoData}
                disabled={isSeeding}
                className="rounded-2xl bg-emerald-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-emerald-500/30 transition hover:-translate-y-1 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSeeding ? "Seeding..." : "Seed Demo Data"}
              </button>

              <button
                onClick={clearDemoData}
                disabled={isClearingDemo}
                className="rounded-2xl bg-red-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-red-500/30 transition hover:-translate-y-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isClearingDemo ? "Clearing..." : "Clear Demo Data"}
              </button>

              <a
                href="/prompt-optimizer"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
              >
                Add Manual Data
              </a>

              <a
                href="/api-status"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
              >
                API Status
              </a>
            </div>

            {lastLoaded && (
              <p className="mt-4 text-sm font-bold text-slate-500">
                Last loaded: {lastLoaded}
              </p>
            )}

            {message && (
              <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-bold text-blue-500">
                {message}
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <p className="text-sm font-black text-slate-500">Storage Mode</p>
            <h3 className="mt-2 break-words text-3xl font-black">
              {storageMode}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Persistent SQLite database.
            </p>
          </div>

          <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-blue-600 dark:text-blue-300">
              History Records
            </p>
            <h3 className="mt-2 text-5xl font-black">{historyCount}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Saved optimizations.
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">
              Useful Feedback
            </p>
            <h3 className="mt-2 text-5xl font-black">{usefulCount}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Positive learning signals.
            </p>
          </div>

          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 shadow-xl shadow-red-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-red-600 dark:text-red-300">
              Useful Rate
            </p>
            <h3 className="mt-2 text-5xl font-black">
              {analytics.totals.usefulRate}%
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Needs work: {needsWorkCount}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <p className="text-sm font-black text-slate-500">
              Average Original Score
            </p>
            <h3 className="mt-2 text-5xl font-black">
              {analytics.scores.averageOriginalScore}
            </h3>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">
              Average Improved Score
            </p>
            <h3 className="mt-2 text-5xl font-black">
              {analytics.scores.averageImprovedScore}
            </h3>
          </div>

          <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-blue-600 dark:text-blue-300">
              Average Score Gain
            </p>
            <h3 className="mt-2 text-5xl font-black">
              +{analytics.scores.averageScoreGain}
            </h3>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-3xl font-black">History API Data</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Data loaded from{" "}
                  <span className="font-mono">/api/history</span>.
                </p>
              </div>

              <button
                onClick={clearHistory}
                disabled={isLoading || historyCount === 0}
                className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                Clear History
              </button>
            </div>

            {history.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-slate-950/60">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
                  🗂️
                </div>
                <h3 className="text-xl font-black">No history saved yet</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Go to Prompt Optimizer, optimize a prompt, then click Save
                  Optimization.
                </p>
              </div>
            ) : (
              <div className="max-h-[900px] space-y-4 overflow-auto pr-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                        {item.tool}
                      </span>

                      <span className="text-xs font-bold text-slate-500">
                        {item.createdAt}
                      </span>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {item.category && (
                        <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-500 dark:text-slate-300">
                          {item.category}
                        </span>
                      )}

                      {item.model && (
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-500">
                          {item.model}
                        </span>
                      )}

                      {item.engineStatus && (
                        <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-black text-purple-500">
                          {item.engineStatus}
                        </span>
                      )}

                      {item.originalScore !== undefined &&
                        item.improvedScore !== undefined && (
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">
                            {item.originalScore}% → {item.improvedScore}%
                          </span>
                        )}
                    </div>

                    {item.originalPrompt && (
                      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                        <p className="mb-1 text-xs font-black text-slate-500">
                          Original Prompt
                        </p>
                        <p className="line-clamp-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {item.originalPrompt}
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                      <p className="mb-1 text-xs font-black text-slate-500">
                        Saved Output
                      </p>
                      <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {item.output}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      disabled={deletingHistoryId === item.id}
                      className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingHistoryId === item.id
                        ? "Deleting..."
                        : "Delete Record"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-3xl font-black">Feedback API Data</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Data loaded from{" "}
                  <span className="font-mono">/api/feedback</span>.
                </p>
              </div>

              <button
                onClick={clearFeedback}
                disabled={isLoading || feedbackCount === 0}
                className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                Clear Feedback
              </button>
            </div>

            {feedback.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-slate-950/60">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-4xl">
                  💬
                </div>
                <h3 className="text-xl font-black">No feedback saved yet</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Go to Prompt Optimizer, optimize a prompt, then click Useful
                  or Needs Work.
                </p>
              </div>
            ) : (
              <div className="max-h-[900px] space-y-4 overflow-auto pr-2">
                {feedback.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          item.rating === "useful"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {item.rating === "useful" ? "Useful" : "Needs Work"}
                      </span>

                      <span className="text-xs font-bold text-slate-500">
                        {item.createdAt}
                      </span>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-500 dark:text-slate-300">
                        {item.category}
                      </span>

                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                        {item.engineStatus}
                      </span>

                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-500">
                        {item.model}
                      </span>
                    </div>

                    <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                      <p className="mb-1 text-xs font-black text-slate-500">
                        Original Prompt
                      </p>
                      <p className="line-clamp-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {item.originalPrompt}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                      <p className="mb-1 text-xs font-black text-slate-500">
                        Improved Prompt
                      </p>
                      <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {item.improvedPrompt}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteFeedbackItem(item.id)}
                      disabled={deletingFeedbackId === item.id}
                      className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingFeedbackId === item.id
                        ? "Deleting..."
                        : "Delete Record"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            This is now a real SQLite database viewer.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Wordsly.Ai now persists optimization history, feedback, and
            analytics using SQLite and Prisma. The next phase is connecting a
            real AI provider and adding authentication.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/database-setup"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              View Database Setup
            </a>

            <a
              href="/admin"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              Admin Control
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}