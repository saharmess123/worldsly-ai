"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import AIProviderHealth from "./AIProviderHealth";

type ApiStatusValue = "Checking" | "Online" | "Error";

type ApiStatus = {
  name: string;
  route: string;
  method: string;
  status: ApiStatusValue;
  message: string;
  responseTime?: number;
  storageMode?: string;
  mode?: string;
  aiProvider?: string;
  openAiModel?: string | null;
  fallbackReason?: string;
  description: string;
  capabilities: string[];
  checkMode: "live" | "documented";
};

const initialApis: ApiStatus[] = [
  {
    name: "Optimize API",
    route: "/api/optimize",
    method: "GET / POST",
    status: "Checking",
    message: "Not checked yet.",
    description:
      "Optimizes prompts using OpenAI when available, with safe mock fallback when OpenAI quota or billing is unavailable.",
    capabilities: [
      "GET checks optimizer status without using OpenAI credits",
      "POST optimizes prompts",
      "Supports real_ai mode with OpenAI",
      "Supports mock fallback mode",
      "Returns mode, aiProvider, openAiModel, and engineStatus",
    ],
    checkMode: "live",
  },
  {
    name: "Score API",
    route: "/api/score",
    method: "POST",
    status: "Checking",
    message: "Not checked yet.",
    description:
      "Scores prompt quality and returns a structured evaluation for the optimizer workflow.",
    capabilities: [
      "Accepts prompt scoring requests",
      "Returns prompt quality metrics",
      "Supports optimizer feedback flow",
    ],
    checkMode: "live",
  },
  {
    name: "History API",
    route: "/api/history",
    method: "GET / POST / DELETE",
    status: "Checking",
    message: "Not checked yet.",
    description:
      "Stores and manages optimization history records using SQLite and Prisma.",
    capabilities: [
      "GET all history records",
      "POST new history record",
      "DELETE all history records",
      "DELETE one history record with /api/history?id=...",
      "Persists data in SQLite",
    ],
    checkMode: "live",
  },
  {
    name: "Feedback API",
    route: "/api/feedback",
    method: "GET / POST / DELETE",
    status: "Checking",
    message: "Not checked yet.",
    description:
      "Stores and manages user feedback records using SQLite and Prisma.",
    capabilities: [
      "GET all feedback records",
      "POST new feedback record",
      "DELETE all feedback records",
      "DELETE one feedback record with /api/feedback?id=...",
      "Persists data in SQLite",
    ],
    checkMode: "live",
  },
  {
    name: "Analytics API",
    route: "/api/analytics",
    method: "GET",
    status: "Checking",
    message: "Not checked yet.",
    description:
      "Reads live optimization and feedback statistics from the SQLite database.",
    capabilities: [
      "Returns total optimizations",
      "Returns total feedback",
      "Returns useful feedback rate",
      "Returns average score gain",
      "Returns latest optimization and feedback records",
      "Powered by PostgreSQL + Prisma",
    ],
    checkMode: "live",
  },
  {
    name: "Seed Demo API",
    route: "/api/seed-demo",
    method: "POST / DELETE",
    status: "Checking",
    message: "Not checked yet.",
    description:
      "Adds or clears demo records for testing the dashboard, admin page, database viewer, and analytics.",
    capabilities: [
      "POST inserts demo optimization and feedback records",
      "DELETE clears demo optimization and feedback records",
      "Used by Admin and Database Viewer controls",
      "Not auto-tested here to avoid changing database data",
    ],
    checkMode: "documented",
  },
];

function getStatusClasses(status: ApiStatusValue) {
  if (status === "Online") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }

  if (status === "Error") {
    return "border-red-500/20 bg-red-500/10 text-red-500";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-500";
}

function getStorageLabel(storageMode?: string) {
  if (storageMode === "postgres_prisma") return "PostgreSQL + Prisma";
  if (storageMode === "postgres_prisma_ready") return "PostgreSQL + Prisma Ready";
  if (storageMode === "documented") return "Documented Route";
  if (storageMode === "mock_api") return "Mock API";
  if (storageMode) return storageMode;

  return "API";
}

function getModeLabel(mode?: string) {
  if (mode === "real_ai") return "Real AI";
  if (mode === "mock") return "Mock";
  return mode || "Not provided";
}

export default function ApiStatusPage() {
  const [apis, setApis] = useState<ApiStatus[]>(initialApis);
  const [lastChecked, setLastChecked] = useState("");

  async function checkApis() {
    setApis(
      initialApis.map((api) => ({
        ...api,
        status: "Checking",
        message: "Checking API health...",
        responseTime: undefined,
        storageMode: undefined,
        mode: undefined,
        aiProvider: undefined,
        openAiModel: undefined,
        fallbackReason: undefined,
      }))
    );

    const results: ApiStatus[] = [];

    for (const api of initialApis) {
      if (api.checkMode === "documented") {
        results.push({
          ...api,
          status: "Online",
          message:
            "Route is documented as available. It is not called automatically here because POST/DELETE would change SQLite demo data.",
          storageMode: "documented",
        });

        continue;
      }

      const start = performance.now();

      try {
        let response: Response;

        if (api.route === "/api/optimize") {
          response = await fetch(api.route, {
            method: "GET",
            cache: "no-store",
          });
        } else if (api.route === "/api/score") {
          response = await fetch(api.route, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt:
                "Create an image for Wordsly.Ai showing AI improving prompts.",
              category: "Image Generation",
            }),
          });
        } else {
          response = await fetch(api.route, {
            method: "GET",
            cache: "no-store",
          });
        }

        const end = performance.now();
        const responseTime = Math.round(end - start);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "API returned an error.");
        }

        const isSqliteRoute =
          api.route === "/api/history" ||
          api.route === "/api/feedback" ||
          api.route === "/api/analytics";

        const isOptimizeRoute = api.route === "/api/optimize";

        let message = "API is working correctly.";

        if (isOptimizeRoute && data.mode === "real_ai") {
          message =
            "OpenAI key detected. Real AI mode is enabled. Actual generation still depends on OpenAI credits/quota.";
        } else if (isOptimizeRoute && data.mode === "mock") {
          message =
            "Optimizer is online, but mock mode is active because OpenAI key is missing or unavailable.";
        } else if (data.storageMode === "postgres_prisma" || isSqliteRoute) {
          message = "API is working correctly with PostgreSQL + Prisma persistence.";
        }

        results.push({
          ...api,
          status: "Online",
          message,
          responseTime,
          storageMode:
            data.storageMode || (isSqliteRoute ? "postgres_prisma" : "mock_api"),
          mode: data.mode,
          aiProvider: data.aiProvider,
          openAiModel: data.openAiModel,
          fallbackReason: data.fallbackReason,
        });
      } catch (error) {
        const end = performance.now();
        const responseTime = Math.round(end - start);

        results.push({
          ...api,
          status: "Error",
          message:
            error instanceof Error
              ? error.message
              : "Could not connect to this API.",
          responseTime,
        });
      }
    }

    setApis(results);
    setLastChecked(new Date().toLocaleString());
  }

  useEffect(() => {
    checkApis();
  }, []);

  const onlineCount = apis.filter((api) => api.status === "Online").length;
  const errorCount = apis.filter((api) => api.status === "Error").length;
  const checkingCount = apis.filter((api) => api.status === "Checking").length;

  const sqliteCount = apis.filter(
    (api) =>
      api.storageMode === "postgres_prisma" ||
      api.storageMode === "postgres_prisma_ready"
  ).length;

  const optimizeApi = apis.find((api) => api.route === "/api/optimize");
  const realAiEnabled = optimizeApi?.mode === "real_ai";
  const openAiProvider = optimizeApi?.aiProvider === "openai";

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

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
              API Status Monitor
            </div>

            <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Monitor the APIs powering Wordsly.Ai.
            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              This page checks optimizer, scoring, history, feedback, analytics,
              and demo routes. The optimizer now supports OpenAI real AI mode
              with safe mock fallback, while history, feedback, and analytics use
              PostgreSQL + Prisma persistence.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-lg shadow-slate-300/20 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
                <p className="text-sm font-black text-blue-500">
                  Storage Mode
                </p>
                <h3 className="mt-2 text-2xl font-black">PostgreSQL + Prisma</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  History, feedback, and analytics use real database
                  persistence.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-lg shadow-slate-300/20 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
                <p className="text-sm font-black text-emerald-500">
                  OpenAI Status
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  {realAiEnabled ? "Connected" : "Mock Mode"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {realAiEnabled
                    ? "OpenAI key is detected and real AI mode is enabled."
                    : "Mock mode is active until OpenAI is available."}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-lg shadow-slate-300/20 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
                <p className="text-sm font-black text-amber-500">
                  Fallback Safety
                </p>
                <h3 className="mt-2 text-2xl font-black">Enabled</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  If OpenAI quota or billing fails, the app falls back to mock
                  mode.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-lg shadow-slate-300/20 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
                <p className="text-sm font-black text-fuchsia-500">
                  Demo Data
                </p>
                <h3 className="mt-2 text-2xl font-black">Seed + Clear</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Demo records can be inserted or cleared from admin controls.
                </p>
              </div>
            </div>

            {openAiProvider && optimizeApi?.openAiModel && (
              <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-300">
                  Real AI Mode Detected
                </h3>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
                  The optimizer route detected OpenAI and is configured to use{" "}
                  <span className="font-black">{optimizeApi.openAiModel}</span>.
                  If actual prompt generation falls back to mock mode, the most
                  likely reason is OpenAI billing credits or quota.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={checkApis}
                className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
              >
                Recheck APIs
              </button>

              <a
                href="/dashboard"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
              >
                Dashboard
              </a>

              <a
                href="/mock-database"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
              >
                Database Viewer
              </a>

              <a
                href="/prompt-optimizer"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
              >
                Test Optimizer
              </a>
            </div>

            {lastChecked && (
              <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                Last checked: {lastChecked}
              </p>
            )}
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-xl shadow-emerald-500/10">
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">
              Online
            </p>
            <h3 className="mt-2 text-5xl font-black">{onlineCount}</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              APIs responding correctly.
            </p>
          </div>

          <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-6 shadow-xl shadow-blue-500/10">
            <p className="text-sm font-black text-blue-600 dark:text-blue-300">
              SQLite Ready
            </p>
            <h3 className="mt-2 text-5xl font-black">{sqliteCount}</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              APIs using or prepared for Prisma persistence.
            </p>
          </div>

          <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 shadow-xl shadow-amber-500/10">
            <p className="text-sm font-black text-amber-600 dark:text-amber-300">
              Checking
            </p>
            <h3 className="mt-2 text-5xl font-black">{checkingCount}</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              APIs currently being tested.
            </p>
          </div>

          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 shadow-xl shadow-red-500/10">
            <p className="text-sm font-black text-red-600 dark:text-red-300">
              Errors
            </p>
            <h3 className="mt-2 text-5xl font-black">{errorCount}</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              APIs that need attention.
            </p>
          </div>
        </div>

        <AIProviderHealth />

        <div className="grid gap-6">
          {apis.map((api) => (
            <div
              key={api.route}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                      {api.method}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
                        api.status
                      )}`}
                    >
                      {api.status}
                    </span>

                    {api.responseTime !== undefined && (
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                        {api.responseTime} ms
                      </span>
                    )}

                    {api.storageMode && (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">
                        {getStorageLabel(api.storageMode)}
                      </span>
                    )}

                    {api.mode && (
                      <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-black text-fuchsia-500">
                        {getModeLabel(api.mode)}
                      </span>
                    )}

                    {api.aiProvider && (
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-500">
                        Provider: {api.aiProvider}
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl font-black">{api.name}</h2>

                  <p className="mt-2 font-mono text-sm text-blue-500">
                    {api.route}
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {api.description}
                  </p>

                  <p className="mt-3 text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
                    {api.message}
                  </p>

                  {api.openAiModel && (
                    <p className="mt-2 text-sm font-bold text-emerald-600 dark:text-emerald-300">
                      OpenAI model: {api.openAiModel}
                    </p>
                  )}

                  {api.fallbackReason && (
                    <p className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-bold text-amber-600 dark:text-amber-300">
                      Fallback reason: {api.fallbackReason}
                    </p>
                  )}

                  <div className="mt-5 grid gap-2 md:grid-cols-2">
                    {api.capabilities.map((capability) => (
                      <div
                        key={capability}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      >
                        {capability}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-w-[160px] rounded-3xl bg-slate-950 p-5 text-center text-white dark:bg-white dark:text-slate-950">
                  <p className="text-xs font-black">Status</p>
                  <p className="mt-1 text-2xl font-black">{api.status}</p>

                  {api.mode && (
                    <>
                      <p className="mt-4 text-xs font-black">Mode</p>
                      <p className="mt-1 text-lg font-black">
                        {getModeLabel(api.mode)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            Wordsly.Ai now has a SQLite-backed MVP with OpenAI-ready optimizer.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            The project has working API routes, persistent history, persistent
            feedback, live analytics, seed demo controls, database viewer
            support, and OpenAI integration with safe mock fallback. Real
            generation depends on active OpenAI credits and quota.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/prompt-optimizer"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Test Optimizer
            </a>

            <a
              href="/admin"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              Admin Control
            </a>

            <a
              href="/mock-database"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              Database Viewer
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
