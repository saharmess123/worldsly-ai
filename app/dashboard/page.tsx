"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

type OptimizationItem = {
  id: string;
  originalPrompt: string;
  improvedPrompt: string;
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

const intelligenceLayers = [
  {
    title: "Discovery Layer",
    description: "Finds strong prompt patterns from public prompt sources.",
    icon: "🌐",
    status: "MVP",
  },
  {
    title: "Scoring Engine",
    description:
      "Evaluates prompts by clarity, structure, specificity, and output quality.",
    icon: "📊",
    status: "Active",
  },
  {
    title: "Optimization Engine",
    description: "Improves weak prompts into stronger, model-ready prompts.",
    icon: "⚡",
    status: "Active",
  },
  {
    title: "Feedback Loop",
    description:
      "Learns from user feedback to improve future prompt revisions.",
    icon: "🧠",
    status: "SQLite",
  },
];

const promptPatterns = [
  {
    name: "Role Definition",
    score: 92,
    description: "Defines who the AI should act as.",
  },
  {
    name: "Output Format",
    score: 88,
    description: "Controls how the answer should be structured.",
  },
  {
    name: "Context Depth",
    score: 84,
    description: "Adds background and user intent.",
  },
  {
    name: "Constraints",
    score: 79,
    description: "Reduces vague or generic outputs.",
  },
  {
    name: "Examples",
    score: 74,
    description: "Guides the model with reference style.",
  },
];

const quickActions = [
  {
    title: "Optimize a Prompt",
    description: "Paste any prompt and generate a stronger version with scoring.",
    href: "/prompt-optimizer",
    icon: "⚡",
  },
  {
    title: "Mock Database",
    description: "View saved SQLite optimizations and feedback records.",
    href: "/mock-database",
    icon: "🗄️",
  },
  {
    title: "API Status",
    description: "Check optimize, score, history, feedback, and analytics APIs.",
    href: "/api-status",
    icon: "🧪",
  },
  {
    title: "Training Layer",
    description:
      "Preview how prompts, metadata, and feedback become training signals.",
    href: "/training",
    icon: "🧠",
  },
  {
    title: "Feedback Analytics",
    description: "Analyze useful and needs-work feedback signals.",
    href: "/feedback",
    icon: "🔁",
  },
  {
    title: "Backend Plan",
    description: "Review the backend, database, API, and AI migration plan.",
    href: "/backend-plan",
    icon: "🧩",
  },
];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(emptyAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/analytics", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load analytics.");
      }

      const data = (await response.json()) as AnalyticsData;
      setAnalytics(data);
    } catch {
      setError("Could not load dashboard analytics from SQLite.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalOptimizations = analytics.totals.totalOptimizations;
  const totalFeedback = analytics.totals.totalFeedback;
  const usefulCount = analytics.totals.usefulFeedback;
  const needsWorkCount = analytics.totals.needsWorkFeedback;
  const feedbackSuccessRate = analytics.totals.usefulRate;
  const recentItems = analytics.latestOptimizations.slice(0, 4);

  const intelligenceScore = Math.min(
    98,
    Math.max(
      45,
      analytics.scores.averageImprovedScore +
        Math.round(analytics.scores.averageScoreGain / 4)
    )
  );

  const learningProgress = Math.min(
    100,
    totalFeedback === 0 ? 0 : 25 + totalFeedback * 15
  );

  const promptQuality = Math.min(
    96,
    Math.max(58, analytics.scores.averageImprovedScore)
  );

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

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-[-120px] left-[30%] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                  SQLite Analytics Dashboard
                </div>

                <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                  Real database analytics for prompt intelligence.
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                  Wordsly.Ai now reads saved optimizations, feedback signals,
                  score gains, and latest activity directly from SQLite using
                  Prisma.
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
                    onClick={loadAnalytics}
                    className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                  >
                    {isLoading ? "Refreshing..." : "Refresh Analytics"}
                  </button>
                </div>

                <div className="mt-5 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-500">
                  Storage: {analytics.storageMode}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-5 top-8 z-10 rotate-[-8deg] rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-blue-500/20 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
                  <p className="text-xs font-black text-blue-500">
                    Feedback Rate
                  </p>
                  <p className="mt-1 text-3xl font-black">
                    {feedbackSuccessRate}%
                  </p>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl shadow-blue-500/20 dark:border-white/10">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-400" />
                      <span className="h-3 w-3 rounded-full bg-yellow-400" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>

                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                      Prisma Active
                    </span>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-xs font-bold text-slate-400">
                      Intelligence Score
                    </p>

                    <h3 className="mt-2 text-5xl font-black">
                      {intelligenceScore}
                    </h3>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${intelligenceScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-slate-400">Optimized</p>
                      <p className="mt-1 text-2xl font-black">
                        {totalOptimizations}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-slate-400">Feedback</p>
                      <p className="mt-1 text-2xl font-black">
                        {totalFeedback}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-5 -right-4 rotate-[8deg] rounded-3xl bg-emerald-500 p-4 text-white shadow-2xl shadow-emerald-500/30">
                  <p className="text-xs font-black">Prompt Quality</p>
                  <p className="mt-1 text-3xl font-black">{promptQuality}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Learning Loop</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Feedback-based improvement.
                </p>
              </div>

              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-300">
                SQLite
              </span>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-400">
                    Learning Progress
                  </p>
                  <p className="font-black">{learningProgress}%</p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400"
                    style={{ width: `${learningProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-bold text-slate-400">Useful</p>
                  <h3 className="mt-2 text-4xl font-black text-emerald-300">
                    {usefulCount}
                  </h3>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-bold text-slate-400">
                    Needs Work
                  </p>
                  <h3 className="mt-2 text-4xl font-black text-red-300">
                    {needsWorkCount}
                  </h3>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="mb-5 text-sm font-bold text-slate-400">
                  Intelligence Layers
                </p>

                <div className="space-y-4">
                  {intelligenceLayers.map((layer) => (
                    <div
                      key={layer.title}
                      className="rounded-2xl border border-white/10 bg-white/10 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="font-black">
                          {layer.icon} {layer.title}
                        </h3>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-slate-300">
                          {layer.status}
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-slate-400">
                        {layer.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="/feedback"
                className="block rounded-2xl bg-white px-5 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
              >
                Open Feedback Analytics
              </a>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Optimized Prompts",
              value: totalOptimizations,
              icon: "⚡",
            },
            {
              label: "Feedback Signals",
              value: totalFeedback,
              icon: "🔁",
            },
            {
              label: "Avg Score Gain",
              value: `+${analytics.scores.averageScoreGain}`,
              icon: "📈",
            },
            {
              label: "Success Rate",
              value: `${feedbackSuccessRate}%`,
              icon: "✅",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                {stat.icon}
              </div>

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {stat.label}
              </p>

              <h2 className="mt-2 text-4xl font-black">{stat.value}</h2>
            </div>
          ))}
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <p className="text-sm font-black text-slate-500">
              Average Original Score
            </p>
            <h2 className="mt-2 text-5xl font-black">
              {analytics.scores.averageOriginalScore}
            </h2>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <p className="text-sm font-black text-slate-500">
              Average Improved Score
            </p>
            <h2 className="mt-2 text-5xl font-black">
              {analytics.scores.averageImprovedScore}
            </h2>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">
              Average Gain
            </p>
            <h2 className="mt-2 text-5xl font-black">
              +{analytics.scores.averageScoreGain}
            </h2>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Top Prompt Patterns</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Patterns that usually improve AI output quality.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {promptPatterns.map((pattern) => (
                <div
                  key={pattern.name}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60"
                >
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black">{pattern.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {pattern.description}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-black text-blue-500">
                      {pattern.score}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${pattern.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <h2 className="text-2xl font-black">Quick Actions</h2>

              <div className="mt-5 space-y-4">
                {quickActions.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                      {item.icon}
                    </div>

                    <div>
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">Recent Optimizations</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Latest saved prompt improvements from SQLite.
                  </p>
                </div>

                <a
                  href="/history"
                  className="text-sm font-black text-blue-500 hover:text-blue-400"
                >
                  View →
                </a>
              </div>

              {recentItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-slate-950/60">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                    🧠
                  </div>

                  <h3 className="text-lg font-black">No optimizations yet</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Optimize your first prompt and it will appear here.
                  </p>

                  <a
                    href="/prompt-optimizer"
                    className="mt-5 inline-block rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-600"
                  >
                    Optimize First Prompt
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="font-black">{item.category}</h3>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-500">
                          +{item.improvedScore - item.originalScore}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">{item.createdAt}</p>

                      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {item.improvedPrompt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}