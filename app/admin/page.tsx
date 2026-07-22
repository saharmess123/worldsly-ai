"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type StatusType = "Completed" | "Active" | "Planned";

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

type PipelineStage = {
  key: string;
  label: string;
  count: number;
};

type AnalyticsData = {
  success: boolean;
  storageMode: string;
  error?: string;
  usefulRate: number;
  totals: {
    optimizations: number;
    feedback: number;
    sources: number;
    discovery: number;
    pendingReviews: number;
    corpus: number;
    trainingSignals: number;
  };
  scores: {
    averageOriginalScore: number;
    averageImprovedScore: number;
    averageScoreGain: number;
  };
  sources: {
    total: number;
    active: number;
    paused: number;
    archived: number;
    scanned: number;
    productive: number;
    averageCredibility: number;
    averagePromptsPerSource: number;
    scanningRate: number;
    productiveRate: number;
  };
  discovery: {
    total: number;
    pending: number;
    sentToCuration: number;
    enteredCuration: number;
    approved: number;
    rejected: number;
    reviewed: number;
    approvalRate: number;
    rejectionRate: number;
  };
  curation: {
    pending: number;
    totalReviews: number;
    approvedReviews: number;
    rejectedReviews: number;
    riskyReviews: number;
  };
  corpus: { total: number };
  training: {
    totalSignals: number;
    corpusLinkedSignals: number;
  };
  pipeline: {
    stages: PipelineStage[];
    conversions: {
      sourceScanning: number;
      productiveSources: number;
      discoveryToCuration: number;
      curationToCorpus: number;
      corpusToTraining: number;
      endToEnd: number;
    };
  };
};

const emptyAnalytics: AnalyticsData = {
  success: true,
  storageMode: "loading",
  usefulRate: 0,
  totals: {
    optimizations: 0,
    feedback: 0,
    sources: 0,
    discovery: 0,
    pendingReviews: 0,
    corpus: 0,
    trainingSignals: 0,
  },
  scores: {
    averageOriginalScore: 0,
    averageImprovedScore: 0,
    averageScoreGain: 0,
  },
  sources: {
    total: 0,
    active: 0,
    paused: 0,
    archived: 0,
    scanned: 0,
    productive: 0,
    averageCredibility: 0,
    averagePromptsPerSource: 0,
    scanningRate: 0,
    productiveRate: 0,
  },
  discovery: {
    total: 0,
    pending: 0,
    sentToCuration: 0,
    enteredCuration: 0,
    approved: 0,
    rejected: 0,
    reviewed: 0,
    approvalRate: 0,
    rejectionRate: 0,
  },
  curation: {
    pending: 0,
    totalReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0,
    riskyReviews: 0,
  },
  corpus: { total: 0 },
  training: {
    totalSignals: 0,
    corpusLinkedSignals: 0,
  },
  pipeline: {
    stages: [
      { key: "sources", label: "Sources", count: 0 },
      { key: "discovery", label: "Discovery", count: 0 },
      { key: "curation", label: "Curation", count: 0 },
      { key: "corpus", label: "Corpus", count: 0 },
      { key: "training", label: "Training", count: 0 },
    ],
    conversions: {
      sourceScanning: 0,
      productiveSources: 0,
      discoveryToCuration: 0,
      curationToCorpus: 0,
      corpusToTraining: 0,
      endToEnd: 0,
    },
  },
};

const modules: ModuleStatus[] = [
  {
    id: 1,
    name: "Source Scanning",
    area: "Discovery",
    status: "Completed",
    readiness: 92,
    description:
      "Active sources generate source-linked discovered prompts and update their scan metadata.",
    nextAction: "Replace mock scans with real connectors.",
    route: "/sources",
  },
  {
    id: 2,
    name: "Discovery Layer",
    area: "Discovery",
    status: "Active",
    readiness: 88,
    description:
      "Prompts can be scored, filtered, approved, rejected, or sent to Curation.",
    nextAction: "Add stronger duplicate detection.",
    route: "/discovery",
  },
  {
    id: 3,
    name: "Curation Pipeline",
    area: "Quality Control",
    status: "Completed",
    readiness: 92,
    description:
      "Approved prompts automatically enter the Corpus and create curated training signals.",
    nextAction: "Add reviewer assignment and audit history.",
    route: "/curation",
  },
  {
    id: 4,
    name: "Prompt Corpus",
    area: "Data Layer",
    status: "Active",
    readiness: 88,
    description:
      "The clean prompt dataset stores source, review, quality, and model metadata.",
    nextAction: "Add version history, tags, and edit support.",
    route: "/corpus",
  },
  {
    id: 5,
    name: "Training Dataset",
    area: "PromptMaster",
    status: "Active",
    readiness: 84,
    description:
      "Feedback, optimization history, and curated prompts generate duplicate-safe signals.",
    nextAction: "Create validated input/output pairs.",
    route: "/training",
  },
  {
    id: 6,
    name: "Local AI Runtime",
    area: "AI Runtime",
    status: "Planned",
    readiness: 20,
    description:
      "OpenAI, Ollama, Qwen, Llama, and PromptMaster will share one provider interface.",
    nextAction: "Implement the provider layer and connect Ollama.",
    route: "/architecture",
  },
];

function getStatusClasses(status: StatusType) {
  if (status === "Completed") return "bg-emerald-500/10 text-emerald-500";
  if (status === "Active") return "bg-cyan-500/10 text-cyan-500";
  return "bg-amber-500/10 text-amber-500";
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(emptyAnalytics);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearingDemo, setIsClearingDemo] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState<string | null>(null);
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function runCalibration() {
    try {
      setIsCalibrating(true);
      setError("");
      setMessage("");

      const res = await fetch("/api/ai/calibrate", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Calibration run failed.");
      }

      setCalibrationData(data);
      setMessage("Quality calibration suite executed successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to run calibration suite."
      );
    } finally {
      setIsCalibrating(false);
    }
  }

  async function handleAdminAction(action: string) {
    try {
      setIsExecutingAction(action);
      setError("");
      setMessage("");

      const response = await fetch("/api/pipeline/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to execute action ${action}.`);
      }

      setMessage(data.message || "Action executed successfully.");
      await loadAnalytics();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : `Failed to execute pipeline action: ${action}`
      );
    } finally {
      setIsExecutingAction(null);
    }
  }

  async function loadAnalytics() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/analytics", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as AnalyticsData;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load pipeline analytics.");
      }

      setAnalytics(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load pipeline analytics."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function seedDemoData() {
    try {
      setIsSeeding(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/seed-demo", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed demo data.");
      }

      setMessage("Demo data inserted successfully.");
      await loadAnalytics();
    } catch (seedError) {
      setError(
        seedError instanceof Error ? seedError.message : "Could not seed data."
      );
    } finally {
      setIsSeeding(false);
    }
  }

  async function clearDemoData() {
    if (!window.confirm("Clear all demo optimizations and feedback?")) return;

    try {
      setIsClearingDemo(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/seed-demo", { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clear demo data.");
      }

      setMessage("Demo data cleared successfully.");
      await loadAnalytics();
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Could not clear demo data."
      );
    } finally {
      setIsClearingDemo(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const filteredModules = useMemo(() => {
    return modules.filter((item) => {
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const text = `${item.name} ${item.area} ${item.description} ${item.nextAction}`.toLowerCase();
      return matchesStatus && text.includes(search.toLowerCase());
    });
  }, [search, statusFilter]);

  const conversionCards = [
    {
      label: "Sources Scanned",
      value: analytics.pipeline.conversions.sourceScanning,
    },
    {
      label: "Productive Sources",
      value: analytics.pipeline.conversions.productiveSources,
    },
    {
      label: "Discovery → Curation",
      value: analytics.pipeline.conversions.discoveryToCuration,
    },
    {
      label: "Curation → Corpus",
      value: analytics.pipeline.conversions.curationToCorpus,
    },
    {
      label: "Corpus → Training",
      value: analytics.pipeline.conversions.corpusToTraining,
    },
    {
      label: "End-to-End",
      value: analytics.pipeline.conversions.endToEnd,
    },
  ];

  const metricCards = [
    ["Sources", analytics.totals.sources],
    ["Discovered", analytics.totals.discovery],
    ["Pending Reviews", analytics.totals.pendingReviews],
    ["Approved", analytics.discovery.approved],
    ["Rejected", analytics.discovery.rejected],
    ["Corpus", analytics.totals.corpus],
    ["Training Signals", analytics.totals.trainingSignals],
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        {error && (
          <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm font-bold text-emerald-500">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Pipeline Analytics Dashboard
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              Track the complete Wordsly.AI intelligence pipeline.
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Monitor Sources, Discovery, Curation, Corpus, and Training using
              real SQLite data and conversion metrics.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={loadAnalytics}
                disabled={isLoading}
                className="rounded-2xl bg-blue-500 px-6 py-4 font-black text-white disabled:opacity-60"
              >
                {isLoading ? "Refreshing..." : "Refresh Pipeline"}
              </button>

              <a
                href="/sources"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-black dark:border-white/10 dark:bg-white/5"
              >
                Open Sources
              </a>

              <a
                href="/training"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-black dark:border-white/10 dark:bg-white/5"
              >
                Open Training
              </a>

              <button
                onClick={seedDemoData}
                disabled={isSeeding}
                className="rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white disabled:opacity-60 transition hover:bg-emerald-600"
              >
                {isSeeding ? "Seeding..." : "Seed Demo Data"}
              </button>

              <button
                onClick={clearDemoData}
                disabled={isClearingDemo}
                className="rounded-2xl bg-red-500 px-6 py-4 font-black text-white disabled:opacity-60 transition hover:bg-red-600"
              >
                {isClearingDemo ? "Clearing..." : "Clear Demo Data"}
              </button>

              <button
                onClick={() => handleAdminAction("trigger-scan")}
                disabled={isExecutingAction !== null}
                className="rounded-2xl bg-indigo-600 px-6 py-4 font-black text-white disabled:opacity-60 transition hover:bg-indigo-700"
              >
                {isExecutingAction === "trigger-scan" ? "Scanning..." : "Scan Active Sources"}
              </button>

              <button
                onClick={() => handleAdminAction("flush-curation")}
                disabled={isExecutingAction !== null}
                className="rounded-2xl bg-purple-600 px-6 py-4 font-black text-white disabled:opacity-60 transition hover:bg-purple-700"
              >
                {isExecutingAction === "flush-curation" ? "Flushing..." : "Flush Curation Queue"}
              </button>

              <button
                onClick={() => handleAdminAction("generate-signals")}
                disabled={isExecutingAction !== null}
                className="rounded-2xl bg-fuchsia-600 px-6 py-4 font-black text-white disabled:opacity-60 transition hover:bg-fuchsia-700"
              >
                {isExecutingAction === "generate-signals" ? "Syncing..." : "Sync Dataset"}
              </button>

              <button
                onClick={() => handleAdminAction("purge-archived")}
                disabled={isExecutingAction !== null}
                className="rounded-2xl bg-amber-600 px-6 py-4 font-black text-white disabled:opacity-60 transition hover:bg-amber-750"
              >
                {isExecutingAction === "purge-archived" ? "Purging..." : "Purge Archived"}
              </button>
            </div>

            <div className="mt-5 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-500">
              Storage: {analytics.storageMode}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-2xl font-black">Pipeline Health</h2>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Approval Rate</p>
                <h3 className="mt-2 text-4xl font-black text-emerald-300">
                  {analytics.discovery.approvalRate}%
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Rejection Rate</p>
                <h3 className="mt-2 text-4xl font-black text-red-300">
                  {analytics.discovery.rejectionRate}%
                </h3>
              </div>

              <div className="col-span-2 rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  End-to-End Conversion
                </p>
                <h3 className="mt-2 text-5xl font-black text-fuchsia-300">
                  {analytics.pipeline.conversions.endToEnd}%
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          {metricCards.map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <h3 className="mt-2 text-4xl font-black">{value}</h3>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl dark:border-white/10 dark:bg-white/5">
          <h2 className="text-3xl font-black">Live Intelligence Pipeline</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Current record volume at every internal stage.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {analytics.pipeline.stages.map((stage, index) => (
              <div key={stage.key} className="relative">
                <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6 text-center">
                  <p className="text-sm font-black text-blue-600 dark:text-blue-300">
                    {stage.label}
                  </p>
                  <h3 className="mt-2 text-5xl font-black">{stage.count}</h3>
                </div>

                {index < analytics.pipeline.stages.length - 1 && (
                  <div className="mt-2 text-center text-2xl font-black text-blue-500 lg:absolute lg:-right-4 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {conversionCards.map((item) => (
            <div
              key={item.label}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-black">{item.label}</h3>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-black text-emerald-500">
                  {item.value}%
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Metric title="Useful Rate" value={`${analytics.usefulRate}%`} />
          <Metric
            title="Average Score Gain"
            value={`+${analytics.scores.averageScoreGain}`}
          />
          <Metric
            title="Average Credibility"
            value={`${analytics.sources.averageCredibility}%`}
          />
          <Metric
            title="Corpus-linked Signals"
            value={analytics.training.corpusLinkedSignals}
          />
        </div>

        {/* Quality Calibration Panel */}
        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mb-6">
            <div>
              <h2 className="text-3xl font-black">Prompt Quality Calibration</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Run reference prompts against scoring models to calibrate alignment with expert benchmarks.
              </p>
            </div>

            <button
              onClick={runCalibration}
              disabled={isCalibrating}
              className="rounded-2xl bg-indigo-600 px-6 py-3.5 font-black text-white transition hover:bg-indigo-700 disabled:opacity-60 shrink-0 shadow-lg shadow-indigo-600/20"
            >
              {isCalibrating ? "Calibrating..." : "🔍 Run Calibration Suite"}
            </button>
          </div>

          {calibrationData ? (
            <div className="space-y-6">
              {/* Scorecard row */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                  <p className="text-xs font-bold text-slate-400">Tested Prompts</p>
                  <h3 className="mt-1 text-3xl font-black">{calibrationData.testedCount}</h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                  <p className="text-xs font-bold text-slate-400">Mean Absolute Error (MAE)</p>
                  <h3 className="mt-1 text-3xl font-black">{calibrationData.meanAbsoluteError}%</h3>
                </div>

                <div className={`rounded-2xl border p-4 ${calibrationData.statusColor}`}>
                  <p className="text-xs font-bold">Calibration Status</p>
                  <h3 className="mt-1 text-3xl font-black">{calibrationData.status}</h3>
                </div>
              </div>

              {/* Runs Table */}
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950/80 font-black uppercase text-slate-500">
                      <th className="p-4">Prompt Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-center">Expert Target</th>
                      <th className="p-4 text-center">Calculated</th>
                      <th className="p-4 text-center">Deviation</th>
                      <th className="p-4 text-center">Scoring Engine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calibrationData.runs.map((run: any) => {
                      const dev = run.scoreDeviation;
                      const absDev = Math.abs(dev);
                      let devColor = "text-emerald-500 font-bold";
                      if (absDev > 10) devColor = "text-red-500 font-bold";
                      else if (absDev > 5) devColor = "text-amber-500 font-bold";

                      return (
                        <tr key={run.id} className="border-b border-slate-200/60 dark:border-white/5 hover:bg-slate-100/40 dark:hover:bg-white/5">
                          <td className="p-4 font-bold max-w-xs truncate" title={run.prompt}>
                            {run.title}
                          </td>
                          <td className="p-4 text-slate-500">{run.category}</td>
                          <td className="p-4 text-center font-bold">{run.targetScore}%</td>
                          <td className="p-4 text-center font-bold">{run.calculatedScore}%</td>
                          <td className={`p-4 text-center ${devColor}`}>
                            {dev > 0 ? `+${dev}` : dev}%
                          </td>
                          <td className="p-4 text-center">
                            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-black text-blue-500 uppercase">
                              {run.mode}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center dark:border-white/10 dark:bg-slate-950/20">
              <span className="text-4xl">🔬</span>
              <h3 className="mt-2 text-base font-black">No calibration metrics loaded</h3>
              <p className="mt-1 text-xs text-slate-500">
                Trigger a run to test AI and rule-based prompt grading performance against expert benchmarks.
              </p>
            </div>
          )}
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modules..."
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold dark:border-white/10 dark:bg-slate-950"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black dark:border-white/10 dark:bg-slate-950"
            >
              {["All", "Completed", "Active", "Planned"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row">
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
                  </div>

                  <h2 className="text-3xl font-black">{module.name}</h2>
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {module.description}
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-950 p-5 text-center text-white dark:bg-white dark:text-slate-950">
                  <p className="text-xs font-black">Readiness</p>
                  <p className="mt-1 text-4xl font-black">{module.readiness}%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
                <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                  <h3 className="font-black text-blue-700 dark:text-blue-300">
                    Next Action
                  </h3>
                  <p className="mt-2 text-sm leading-7">{module.nextAction}</p>
                </div>

                {module.route && (
                  <a
                    href={module.route}
                    className="flex items-center justify-center rounded-3xl bg-blue-500 px-6 py-4 text-sm font-black text-white lg:min-w-[180px]"
                  >
                    Open Module
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl dark:border-white/10 dark:bg-white/5">
      <p className="text-sm font-black text-slate-500">{title}</p>
      <h3 className="mt-2 text-5xl font-black">{value}</h3>
    </div>
  );
}