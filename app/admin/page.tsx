"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type StatusType = "Completed" | "Active" | "Simulated" | "Planned" | "Future";

type ModuleStatus = {
  id: number;
  name: string;
  area: string;
  status: StatusType;
  readiness: number;
  description: string;
  nextAction: string;
  route?: string;
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
};

const modules: ModuleStatus[] = [
  {
    id: 1,
    name: "Frontend MVP",
    area: "Core Product",
    status: "Completed",
    readiness: 95,
    description:
      "The main interface, navigation, product flow, pages, dark/light theme, and demo structure are built.",
    nextAction: "Continue polishing UI and connect more pages to backend APIs.",
    route: "/",
  },
  {
    id: 2,
    name: "Prompt Optimizer",
    area: "Core Feature",
    status: "Active",
    readiness: 85,
    description:
      "Users can enter prompts, select model/goal/depth/format, receive scores, improved prompts, variants, explanations, and feedback options.",
    nextAction: "Connect a real AI API to replace the mock optimization engine.",
    route: "/prompt-optimizer",
  },
  {
    id: 3,
    name: "Optimize API",
    area: "Backend",
    status: "Active",
    readiness: 80,
    description:
      "The optimizer is connected to a Next.js API route. It currently uses a mock prompt improvement engine.",
    nextAction: "Replace mock logic with real AI model calls.",
    route: "/api-status",
  },
  {
    id: 4,
    name: "Score API",
    area: "Backend",
    status: "Active",
    readiness: 78,
    description:
      "Prompt scoring is available through an API route and can be tested from the API Status page.",
    nextAction: "Improve scoring with AI evaluation and stronger rubric logic.",
    route: "/api-status",
  },
  {
    id: 5,
    name: "SQLite Database",
    area: "Data Layer",
    status: "Completed",
    readiness: 82,
    description:
      "SQLite is connected using Prisma. History, feedback, and analytics can now persist after server restart.",
    nextAction: "Add more tables for sources, corpus, users, and training signals.",
    route: "/database-setup",
  },
  {
    id: 6,
    name: "History API",
    area: "Backend",
    status: "Completed",
    readiness: 88,
    description:
      "Saved optimizations are now written to and read from SQLite using Prisma.",
    nextAction: "Add single-record delete and user-specific history after authentication.",
    route: "/history",
  },
  {
    id: 7,
    name: "Feedback API",
    area: "Learning Loop",
    status: "Completed",
    readiness: 88,
    description:
      "Useful and needs-work feedback are now saved in SQLite using Prisma.",
    nextAction: "Connect feedback records to specific optimization IDs later.",
    route: "/feedback",
  },
  {
    id: 8,
    name: "Analytics API",
    area: "Backend",
    status: "Completed",
    readiness: 86,
    description:
      "The analytics API calculates total optimizations, feedback totals, useful rate, and average score improvement from SQLite.",
    nextAction: "Add category-based analytics and charts later.",
    route: "/dashboard",
  },
  {
    id: 9,
    name: "API Status Monitor",
    area: "Dev Tools",
    status: "Completed",
    readiness: 84,
    description:
      "The API Status page checks optimize, score, history, feedback, and analytics routes.",
    nextAction: "Add auth, database ping, and AI provider health checks later.",
    route: "/api-status",
  },
  {
    id: 10,
    name: "Seed Demo API",
    area: "Dev Tools",
    status: "Completed",
    readiness: 83,
    description:
      "The seed demo API can insert and clear demo optimization and feedback records for presentations.",
    nextAction: "Keep it as an internal admin/demo tool and protect it later with authentication.",
    route: "/admin",
  },
  {
    id: 11,
    name: "Sources Manager",
    area: "Discovery",
    status: "Simulated",
    readiness: 75,
    description:
      "Shows future discovery sources such as Reddit, X, GitHub, blogs, research papers, prompt communities, and agent forums.",
    nextAction: "Connect real source ingestion and scanning system.",
    route: "/sources",
  },
  {
    id: 12,
    name: "Discovery Layer",
    area: "Discovery",
    status: "Simulated",
    readiness: 72,
    description:
      "Demonstrates discovered prompt examples, source metadata, quality score, category, model, and detected prompt patterns.",
    nextAction: "Build real web discovery pipeline and source connectors.",
    route: "/discovery",
  },
  {
    id: 13,
    name: "Curation Queue",
    area: "Quality Control",
    status: "Simulated",
    readiness: 78,
    description:
      "Shows how discovered prompts can be reviewed, approved, or rejected before entering the corpus.",
    nextAction: "Connect curation workflow to backend and database.",
    route: "/curation",
  },
  {
    id: 14,
    name: "Prompt Corpus",
    area: "Data Layer",
    status: "Simulated",
    readiness: 76,
    description:
      "Represents the curated prompt database with approved prompts, categories, scores, model metadata, and extracted patterns.",
    nextAction: "Create real corpus API routes and connect them to Prisma.",
    route: "/corpus",
  },
  {
    id: 15,
    name: "Settings Memory",
    area: "Personalization",
    status: "Simulated",
    readiness: 75,
    description: "Preferences are still mainly saved in browser localStorage.",
    nextAction: "Move settings to the database after authentication is added.",
    route: "/settings",
  },
  {
    id: 16,
    name: "Authentication",
    area: "Security",
    status: "Planned",
    readiness: 10,
    description:
      "User accounts, login, signup, sessions, roles, and premium access are not connected yet.",
    nextAction: "Add authentication after core database APIs are stable.",
  },
  {
    id: 17,
    name: "PromptMaster Training",
    area: "PromptMaster",
    status: "Future",
    readiness: 35,
    description:
      "Preview page explains future PromptMaster training using curated prompts, feedback signals, and optimization history.",
    nextAction:
      "Prepare training datasets after corpus, feedback, and discovery systems are real.",
    route: "/training",
  },
];

const priorities = [
  {
    title: "Real AI API Integration",
    level: "Highest Priority",
    description:
      "Connect a real AI model so prompt optimization and scoring become real instead of mock logic.",
    icon: "🤖",
  },
  {
    title: "Seed Demo Data",
    level: "Done / Admin Tool",
    description:
      "Admin can now insert and clear demo optimizations and feedback from the UI.",
    icon: "🌱",
  },
  {
    title: "Single Record Delete",
    level: "High Priority",
    description:
      "Add delete-by-id for history and feedback records instead of only clearing all records.",
    icon: "🧹",
  },
  {
    title: "Authentication",
    level: "Medium Priority",
    description:
      "Add user accounts, login, sessions, and later premium access control.",
    icon: "🔐",
  },
  {
    title: "Real Discovery Pipeline",
    level: "Later Phase",
    description:
      "Build actual source scanning from the open web and specialized prompt communities.",
    icon: "🌐",
  },
  {
    title: "PromptMaster Training",
    level: "Future Phase",
    description:
      "Prepare real training data from curated prompts, feedback, and successful optimization patterns.",
    icon: "🧠",
  },
];

const activityItems = [
  {
    id: 1,
    type: "Database",
    title: "SQLite database connected",
    detail:
      "Prisma + SQLite is now connected and used by history, feedback, and analytics APIs.",
    createdAt: "Current phase",
  },
  {
    id: 2,
    type: "Backend",
    title: "API routes are active",
    detail:
      "Optimize, score, history, feedback, analytics, and seed demo routes are now available.",
    createdAt: "Current phase",
  },
  {
    id: 3,
    type: "Frontend",
    title: "Dashboard, history, feedback, and admin updated",
    detail:
      "Main pages now read backend data from SQLite instead of browser localStorage.",
    createdAt: "Current phase",
  },
  {
    id: 4,
    type: "Demo",
    title: "Admin demo controls added",
    detail:
      "The Admin page can now seed and clear demo SQLite records for presentations.",
    createdAt: "Current phase",
  },
  {
    id: 5,
    type: "Next",
    title: "Real AI still pending",
    detail:
      "The next major step is replacing mock optimization with a real AI provider.",
    createdAt: "Next phase",
  },
];

function getStatusClasses(status: StatusType) {
  if (status === "Completed") return "bg-emerald-500/10 text-emerald-500";
  if (status === "Active") return "bg-cyan-500/10 text-cyan-500";
  if (status === "Simulated") return "bg-blue-500/10 text-blue-500";
  if (status === "Planned") return "bg-amber-500/10 text-amber-500";
  return "bg-fuchsia-500/10 text-fuchsia-500";
}

function getReadinessLabel(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 65) return "Good MVP";
  if (score >= 35) return "Preview";
  return "Not started";
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(emptyAnalytics);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearingDemo, setIsClearingDemo] = useState(false);
  const [error, setError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  async function loadAnalytics() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/analytics", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as AnalyticsData;

      if (!response.ok) {
        throw new Error("Failed to load analytics.");
      }

      setAnalytics(data);
    } catch {
      setError("Could not load SQLite analytics.");
    } finally {
      setIsLoading(false);
    }
  }

  async function seedDemoData() {
    try {
      setIsSeeding(true);
      setError("");
      setAdminMessage("");

      const response = await fetch("/api/seed-demo", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed demo data.");
      }

      setAdminMessage("Demo data inserted successfully.");
      await loadAnalytics();
    } catch {
      setError("Could not insert demo data.");
    } finally {
      setIsSeeding(false);
    }
  }

  async function clearDemoData() {
    const confirmed = confirm(
      "Are you sure you want to clear all demo optimizations and feedback?"
    );

    if (!confirmed) return;

    try {
      setIsClearingDemo(true);
      setError("");
      setAdminMessage("");

      const response = await fetch("/api/seed-demo", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clear demo data.");
      }

      setAdminMessage("Demo data cleared successfully.");
      await loadAnalytics();
    } catch {
      setError("Could not clear demo data.");
    } finally {
      setIsClearingDemo(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const completedCount = modules.filter(
    (item) => item.status === "Completed"
  ).length;

  const activeCount = modules.filter((item) => item.status === "Active").length;

  const simulatedCount = modules.filter(
    (item) => item.status === "Simulated"
  ).length;

  const plannedCount = modules.filter((item) => item.status === "Planned").length;

  const futureCount = modules.filter((item) => item.status === "Future").length;

  const averageReadiness = Math.round(
    modules.reduce((sum, item) => sum + item.readiness, 0) / modules.length
  );

  const filteredModules = useMemo(() => {
    return modules.filter((item) => {
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const searchText = `
        ${item.name}
        ${item.area}
        ${item.status}
        ${item.description}
        ${item.nextAction}
      `.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter]);

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

        {adminMessage ? (
          <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm font-bold text-emerald-500">
            {adminMessage}
          </div>
        ) : null}

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-[-120px] left-[30%] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                Admin Control Center
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Track the real status of the Wordsly.Ai MVP.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                This page now reads SQLite analytics and includes admin controls
                to seed or clear demo records for presentations.
              </p>

              <div className="mt-8 flex flex-col flex-wrap gap-4 sm:flex-row">
                <a
                  href="/dashboard"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Open Dashboard
                </a>

                <button
                  type="button"
                  onClick={loadAnalytics}
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  {isLoading ? "Refreshing..." : "Refresh Admin Data"}
                </button>

                <a
                  href="/api-status"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  API Status
                </a>

                <button
                  type="button"
                  onClick={seedDemoData}
                  disabled={isSeeding}
                  className="rounded-2xl bg-emerald-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-emerald-500/30 transition hover:-translate-y-1 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSeeding ? "Seeding..." : "Seed Demo Data"}
                </button>

                <button
                  type="button"
                  onClick={clearDemoData}
                  disabled={isClearingDemo}
                  className="rounded-2xl bg-red-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-red-500/30 transition hover:-translate-y-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isClearingDemo ? "Clearing..." : "Clear Demo Data"}
                </button>
              </div>

              <div className="mt-5 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-500">
                Storage: {analytics.storageMode}
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">System Readiness</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Overall MVP status based on current modules.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Readiness Score
              </p>

              <h3 className="mt-2 text-6xl font-black text-blue-300">
                {averageReadiness}%
              </h3>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-400"
                  style={{ width: `${averageReadiness}%` }}
                />
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Frontend and database MVP are now strong. Real AI and
                authentication are the next major phases.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Completed</p>
                <h3 className="mt-2 text-4xl font-black text-emerald-300">
                  {completedCount}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Active</p>
                <h3 className="mt-2 text-4xl font-black text-cyan-300">
                  {activeCount}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Simulated</p>
                <h3 className="mt-2 text-4xl font-black text-blue-300">
                  {simulatedCount}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Planned</p>
                <h3 className="mt-2 text-4xl font-black text-amber-300">
                  {plannedCount + futureCount}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <p className="text-sm font-black text-slate-500">
              Saved Optimizations
            </p>
            <h3 className="mt-2 text-5xl font-black">
              {analytics.totals.totalOptimizations}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              SQLite optimization records.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <p className="text-sm font-black text-slate-500">Feedback</p>
            <h3 className="mt-2 text-5xl font-black">
              {analytics.totals.totalFeedback}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              SQLite feedback records.
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">
              Useful Rate
            </p>
            <h3 className="mt-2 text-5xl font-black">
              {analytics.totals.usefulRate}%
            </h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Positive learning signals.
            </p>
          </div>

          <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-blue-600 dark:text-blue-300">
              Avg Score Gain
            </p>
            <h3 className="mt-2 text-5xl font-black">
              +{analytics.scores.averageScoreGain}
            </h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Average optimization improvement.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modules, areas, next actions..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {[
                "All",
                "Completed",
                "Active",
                "Simulated",
                "Planned",
                "Future",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-500 dark:text-slate-300">
                      {module.area}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                        module.status
                      )}`}
                    >
                      {module.status}
                    </span>

                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                      {getReadinessLabel(module.readiness)}
                    </span>
                  </div>

                  <h2 className="text-3xl font-black">{module.name}</h2>

                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {module.description}
                  </p>
                </div>

                <div className="shrink-0 rounded-3xl bg-slate-950 p-5 text-center text-white dark:bg-white dark:text-slate-950">
                  <p className="text-xs font-black">Readiness</p>
                  <p className="mt-1 text-4xl font-black">
                    {module.readiness}%
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                  <h3 className="font-black text-blue-700 dark:text-blue-300">
                    Next Action
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    {module.nextAction}
                  </p>
                </div>

                {module.route && (
                  <a
                    href={module.route}
                    className="flex items-center justify-center rounded-3xl bg-blue-500 px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-600 lg:min-w-[180px]"
                  >
                    Open Module
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <h2 className="text-3xl font-black">Next Priorities</h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              Recommended order for moving from database MVP to real product
              functionality.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {priorities.map((priority) => (
                <div
                  key={priority.title}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="text-4xl">{priority.icon}</div>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                      {priority.level}
                    </span>
                  </div>

                  <h3 className="text-xl font-black">{priority.title}</h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {priority.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-xl shadow-slate-300/20 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <h2 className="text-3xl font-black">Recent Admin Notes</h2>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              Current project status summarized for internal review.
            </p>

            <div className="mt-6 space-y-4">
              {activityItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/10 p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-300">
                      {item.type}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {item.createdAt}
                    </span>
                  </div>

                  <h3 className="text-lg font-black">{item.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            The frontend and database MVP are working. The real AI engine is
            next.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Wordsly.Ai now has real SQLite persistence for optimization history,
            feedback, and analytics. Admin can also seed or clear demo records
            for presentations.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/architecture"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              View Architecture
            </a>

            <a
              href="/roadmap"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              View Roadmap
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}