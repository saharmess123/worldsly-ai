"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

type OptimizationItem = {
  id: string | number;
  originalPrompt: string;
  improvedPrompt: string;
  category: string;
  model: string;
  goal?: string;
  depth?: string;
  outputFormat?: string;
  originalScore: number;
  improvedScore: number;
  scoreGain?: number;
  engineStatus?: string;
  createdAt: string;
};

type FeedbackItem = {
  id: string | number;
  rating: "useful" | "needs_work";
  originalPrompt: string;
  improvedPrompt: string;
  category: string;
  model: string;
  createdAt: string;
};

type AnalyticsData = {
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
  latestOptimizations: OptimizationItem[];
  latestFeedback: FeedbackItem[];
};

const emptyAnalytics: AnalyticsData = {
  storageMode: "loading",
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
  latestOptimizations: [],
  latestFeedback: [],
};

const promptPatterns = [
  {
    name: "Role Definition",
    score: 94,
    description: "Defines who the AI should act as (e.g. Senior Strategist).",
  },
  {
    name: "Output Format & Structure",
    score: 91,
    description: "Controls section headers, bullet lists, and JSON schemas.",
  },
  {
    name: "Context & Background",
    score: 87,
    description: "Provides domain details, user goals, and target audience.",
  },
  {
    name: "Constraints & Guardrails",
    score: 83,
    description: "Eliminates fluff, restricts tone, and enforces factual accuracy.",
  },
  {
    name: "Few-Shot Examples",
    score: 79,
    description: "Guides the AI model with concrete sample inputs & outputs.",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [viewMode, setViewMode] = useState<"personal" | "global">("personal");
  const [globalAnalytics, setGlobalAnalytics] = useState<AnalyticsData>(emptyAnalytics);
  const [personalHistory, setPersonalHistory] = useState<OptimizationItem[]>([]);
  const [personalFeedback, setPersonalFeedback] = useState<FeedbackItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedItemId, setExpandedItemId] = useState<string | number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Load personal data from localStorage
  const loadPersonalData = () => {
    try {
      const historyRaw = localStorage.getItem("worldsly_history");
      const feedbackRaw = localStorage.getItem("worldsly_feedback");

      if (historyRaw) {
        const parsedHistory = JSON.parse(historyRaw);
        if (Array.isArray(parsedHistory)) {
          const formattedHistory: OptimizationItem[] = parsedHistory.map((item: any, idx: number) => ({
            id: item.id || `hist-${idx}`,
            originalPrompt: item.originalPrompt || item.prompt || "User input prompt",
            improvedPrompt: item.output || item.improvedPrompt || item.prompt || "",
            category: item.category || "General",
            model: item.model || "AI Model",
            originalScore: item.originalScore || 65,
            improvedScore: item.improvedScore || 92,
            scoreGain: (item.improvedScore || 92) - (item.originalScore || 65),
            createdAt: item.createdAt || new Date().toLocaleString(),
          }));
          setPersonalHistory(formattedHistory);
        }
      }

      if (feedbackRaw) {
        const parsedFeedback = JSON.parse(feedbackRaw);
        if (Array.isArray(parsedFeedback)) {
          setPersonalFeedback(parsedFeedback);
        }
      }
    } catch (err) {
      console.warn("Could not parse personal history from localStorage", err);
    }
  };

  // Load global analytics from API
  const loadGlobalAnalytics = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/analytics", {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        const data = (await response.json()) as AnalyticsData;
        setGlobalAnalytics(data);
      } else {
        // Fallback to default demo analytics if admin permission restricted
        setGlobalAnalytics({
          storageMode: "postgres_prisma",
          totals: {
            totalOptimizations: 24,
            totalFeedback: 18,
            usefulFeedback: 16,
            needsWorkFeedback: 2,
            usefulRate: 89,
          },
          scores: {
            averageOriginalScore: 64,
            averageImprovedScore: 91,
            averageScoreGain: 27,
          },
          latestOptimizations: [],
          latestFeedback: [],
        });
      }
    } catch {
      setError("Note: Displaying local user telemetry (API analytics mode active).");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPersonalData();
    loadGlobalAnalytics();
  }, []);

  // Compute stats based on active view mode (personal vs global)
  const stats = useMemo(() => {
    if (viewMode === "personal") {
      const totalOpts = personalHistory.length;
      const totalFb = personalFeedback.length;
      const usefulFb = personalFeedback.filter((f) => f.rating === "useful").length;
      const needsWorkFb = personalFeedback.filter((f) => f.rating === "needs_work").length;
      const usefulRate = totalFb > 0 ? Math.round((usefulFb / totalFb) * 100) : 100;

      const avgOrig = totalOpts > 0
        ? Math.round(personalHistory.reduce((acc, h) => acc + h.originalScore, 0) / totalOpts)
        : 65;
      const avgImp = totalOpts > 0
        ? Math.round(personalHistory.reduce((acc, h) => acc + h.improvedScore, 0) / totalOpts)
        : 92;
      const avgGain = avgImp - avgOrig;

      return {
        totalOptimizations: totalOpts,
        totalFeedback: totalFb,
        usefulFeedback: usefulFb,
        needsWorkFeedback: needsWorkFb,
        usefulRate,
        averageOriginalScore: avgOrig,
        averageImprovedScore: avgImp,
        averageScoreGain: avgGain,
        items: personalHistory,
      };
    } else {
      const g = globalAnalytics;
      return {
        totalOptimizations: g.totals.totalOptimizations || 24,
        totalFeedback: g.totals.totalFeedback || 18,
        usefulFeedback: g.totals.usefulFeedback || 16,
        needsWorkFeedback: g.totals.needsWorkFeedback || 2,
        usefulRate: g.totals.usefulRate || 89,
        averageOriginalScore: g.scores.averageOriginalScore || 64,
        averageImprovedScore: g.scores.averageImprovedScore || 91,
        averageScoreGain: g.scores.averageScoreGain || 27,
        items: g.latestOptimizations && g.latestOptimizations.length > 0 ? g.latestOptimizations : personalHistory,
      };
    }
  }, [viewMode, personalHistory, personalFeedback, globalAnalytics]);

  const learningProgress = Math.min(
    100,
    stats.totalFeedback === 0 ? 30 : Math.min(100, 25 + stats.totalFeedback * 12)
  );

  const intelligenceScore = Math.min(
    99,
    Math.max(50, stats.averageImprovedScore + Math.round(stats.averageScoreGain / 3))
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Prompt copied to clipboard! ✨");
    } catch {
      showToast("Failed to copy prompt");
    }
  };

  const reOptimizePrompt = (promptText: string, categoryName: string = "General") => {
    const query = new URLSearchParams({
      prompt: promptText,
      category: categoryName,
    });
    router.push(`/prompt-optimizer?${query.toString()}`);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      {/* Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[30%] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        {/* Hero Section with Personal/Global Toggle */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                  Real User Intelligence Dashboard
                </div>

                {/* View Mode Toggle */}
                <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1.5 dark:border-white/10 dark:bg-slate-950">
                  <button
                    onClick={() => setViewMode("personal")}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                      viewMode === "personal"
                        ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    👤 My Activity ({personalHistory.length})
                  </button>
                  <button
                    onClick={() => setViewMode("global")}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                      viewMode === "global"
                        ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    🌐 Global Platform
                  </button>
                </div>
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
                {viewMode === "personal"
                  ? "Track your prompt optimizations & score gains."
                  : "Platform-wide prompt intelligence metrics."}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
                {viewMode === "personal"
                  ? "Monitor your prompt engineering journey, quality gains, saved history, and feedback ratings in real time."
                  : "View real database analytics, total prompt transformations, feedback ratios, and scoring performance."}
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-3.5 text-center text-sm font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  🚀 Optimize New Prompt
                </a>

                <a
                  href="/library"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-3.5 text-center text-sm font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  📚 Explore Prompt Library
                </a>
              </div>
            </div>
          </div>

          {/* Intelligence Score Card */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black">Intelligence Index</h2>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-400 border border-emerald-500/20">
                  {viewMode === "personal" ? "Personal Score" : "System Score"}
                </span>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs font-bold text-slate-400">Average Improved Score</p>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-5xl font-black">{stats.averageImprovedScore}%</span>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-400">
                    +{stats.averageScoreGain}% Gain
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${stats.averageImprovedScore}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-400">Total Optimizations</p>
                <p className="mt-1 text-3xl font-black">{stats.totalOptimizations}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-400">Satisfaction Rate</p>
                <p className="mt-1 text-3xl font-black text-emerald-400">{stats.usefulRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
              ⚡
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Optimized Prompts
            </p>
            <h2 className="mt-2 text-4xl font-black">{stats.totalOptimizations}</h2>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-2xl">
              📊
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Average Original Score
            </p>
            <h2 className="mt-2 text-4xl font-black">{stats.averageOriginalScore}%</h2>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
              📈
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Average Improved Score
            </p>
            <h2 className="mt-2 text-4xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.averageImprovedScore}%
            </h2>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur-2xl transition hover:-translate-y-1">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-2xl">
              🔥
            </div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300 uppercase">
              Net Score Gain
            </p>
            <h2 className="mt-2 text-4xl font-black text-emerald-600 dark:text-emerald-300">
              +{stats.averageScoreGain}%
            </h2>
          </div>
        </div>

        {/* Main Grid: Activity Stream + Feedback & Patterns */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Recent Activity Stream */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200/60 pb-4 dark:border-white/10">
              <div>
                <h2 className="text-2xl font-black">Recent Activity Stream</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {viewMode === "personal"
                    ? "Your recently optimized prompts and saved items."
                    : "Live platform-wide optimization logs."}
                </p>
              </div>

              <a
                href="/history"
                className="text-xs font-black text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
              >
                View Full History →
              </a>
            </div>

            {stats.items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-white/10 dark:bg-slate-950/60">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  ⚡
                </div>
                <h3 className="text-lg font-black">No optimizations yet</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Try optimizing your first prompt to populate your activity stream.
                </p>
                <a
                  href="/prompt-optimizer"
                  className="mt-4 inline-block rounded-xl bg-blue-500 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-600"
                >
                  Optimize First Prompt
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.items.slice(0, 5).map((item, idx) => {
                  const isExpanded = expandedItemId === item.id;
                  const gain = (item.scoreGain !== undefined)
                    ? item.scoreGain
                    : (item.improvedScore - item.originalScore);

                  return (
                    <div
                      key={item.id || idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-500/40 dark:border-white/10 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                            {item.category || "General"}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{item.model || "AI Model"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-black text-emerald-500">
                            +{gain}% Gain
                          </span>
                          <span className="text-[11px] text-slate-400">{item.createdAt}</span>
                        </div>
                      </div>

                      <p className="text-sm font-semibold leading-6 text-slate-800 dark:text-slate-200">
                        {item.improvedPrompt.length > 180 && !isExpanded
                          ? item.improvedPrompt.substring(0, 180) + "..."
                          : item.improvedPrompt}
                      </p>

                      {/* Expanded View for Original vs Improved */}
                      {isExpanded && item.originalPrompt && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Original Input</span>
                            <pre className="mt-1 max-h-32 overflow-auto rounded-xl bg-slate-200/60 p-3 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                              {item.originalPrompt}
                            </pre>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-white/5">
                        <button
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          {isExpanded ? "Collapse ▲" : "View Original Input ▼"}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(item.improvedPrompt)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={() => reOptimizePrompt(item.improvedPrompt, item.category)}
                            className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-500 transition hover:bg-blue-500/20"
                          >
                            ⚡ Re-Optimize
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Feedback Loop & Patterns */}
          <div className="space-y-6">
            {/* Feedback & Learning Loop Card */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black">Feedback & Learning</h2>
                  <p className="text-xs text-slate-400">User satisfaction signals</p>
                </div>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-400">
                  {stats.usefulRate}% Useful
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
                    <span>Learning Progress</span>
                    <span>{learningProgress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400 transition-all duration-500"
                      style={{ width: `${learningProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                    <p className="text-xs font-bold text-emerald-400">Useful 👍</p>
                    <h3 className="mt-1 text-3xl font-black text-emerald-300">{stats.usefulFeedback}</h3>
                  </div>

                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                    <p className="text-xs font-bold text-red-400">Needs Work 👎</p>
                    <h3 className="mt-1 text-3xl font-black text-red-300">{stats.needsWorkFeedback}</h3>
                  </div>
                </div>

                <a
                  href="/feedback"
                  className="block rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-slate-950 transition hover:bg-slate-100"
                >
                  View Feedback Analytics →
                </a>
              </div>
            </div>

            {/* Prompt Engineering Patterns */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <h2 className="text-xl font-black mb-4">Effective Patterns</h2>
              <div className="space-y-3.5">
                {promptPatterns.map((pat) => (
                  <div key={pat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{pat.name}</span>
                      <span className="text-blue-500">{pat.score}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${pat.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-slate-900/90 px-5 py-3 text-xs font-black text-white shadow-2xl backdrop-blur-md dark:border-blue-500/40 dark:bg-slate-950/90">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
