"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";

type StageStatus =
  | "healthy"
  | "attention"
  | "blocked"
  | "empty";

type PipelineStage = {
  key: string;
  label: string;
  route: string;
  count: number;
  status: StageStatus;
  details: Record<string, number>;
};

type PipelineHealthResponse = {
  success: boolean;
  error?: string | { message?: string };
  overallStatus: StageStatus;
  warnings: string[];
  summary: {
    healthyStages: number;
    attentionStages: number;
    blockedStages: number;
    emptyStages: number;
    totalWarnings: number;
    fullPipelineActive: boolean;
  };
  conversions: {
    sourceScanning: number;
    discoveryToCuration: number;
    curationToCorpus: number;
    corpusToTraining: number;
    endToEnd: number;
  };
  stages: PipelineStage[];
  generatedAt: string;
};

function readError(
  data: Partial<PipelineHealthResponse> | null,
  fallback: string,
) {
  if (!data?.error) return fallback;
  if (typeof data.error === "string") return data.error;
  return data.error.message || fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: StageStatus) {
  if (status === "healthy") return "Healthy";
  if (status === "attention") return "Needs attention";
  if (status === "blocked") return "Blocked";
  return "Empty";
}

function statusClasses(status: StageStatus) {
  if (status === "healthy") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }

  if (status === "attention") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-500";
  }

  if (status === "blocked") {
    return "border-red-500/20 bg-red-500/10 text-red-500";
  }

  return "border-slate-500/20 bg-slate-500/10 text-slate-500";
}

export default function PipelineHealthPage() {
  const [data, setData] =
    useState<PipelineHealthResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadPipelineHealth =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          "/api/pipeline/health",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as PipelineHealthResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            readError(
              result,
              "Failed to load pipeline health.",
            ),
          );
        }

        setData(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load pipeline health.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadPipelineHealth();
  }, [loadPipelineHealth]);

  const summaryCards = [
    {
      label: "Healthy Stages",
      value: data?.summary.healthyStages ?? 0,
      note: "Stages operating normally",
    },
    {
      label: "Needs Attention",
      value: data?.summary.attentionStages ?? 0,
      note: "Stages requiring review",
    },
    {
      label: "Blocked Stages",
      value: data?.summary.blockedStages ?? 0,
      note: "Pipeline interruptions",
    },
    {
      label: "Warnings",
      value: data?.summary.totalWarnings ?? 0,
      note: "Current operational alerts",
    },
  ];

  const conversionCards = [
    {
      label: "Sources Scanned",
      value:
        data?.conversions.sourceScanning ?? 0,
    },
    {
      label: "Discovery → Curation",
      value:
        data?.conversions.discoveryToCuration ?? 0,
    },
    {
      label: "Curation → Corpus",
      value:
        data?.conversions.curationToCorpus ?? 0,
    },
    {
      label: "Corpus → Training",
      value:
        data?.conversions.corpusToTraining ?? 0,
    },
    {
      label: "End-to-End",
      value:
        data?.conversions.endToEnd ?? 0,
    },
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

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Pipeline Control Panel
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              Check the complete Wordsly.AI knowledge pipeline.
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Monitor Sources, Discovery, Curation, Corpus and Training
              Signals using real database records and automatic health rules.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() =>
                  void loadPipelineHealth()
                }
                disabled={isLoading}
                className="rounded-2xl bg-blue-500 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Refreshing..."
                  : "Refresh Pipeline"}
              </button>

              <a
                href="/admin"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-black dark:border-white/10 dark:bg-white/5"
              >
                Back to Admin
              </a>

              <a
                href="/admin/ai-monitoring"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-black dark:border-white/10 dark:bg-white/5"
              >
                AI Monitoring
              </a>
            </div>

            {data?.generatedAt && (
              <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">
                Last updated:{" "}
                {formatDate(data.generatedAt)}
              </p>
            )}
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">
              Overall pipeline status
            </p>

            <h2 className="mt-3 text-4xl font-black">
              {isLoading
                ? "Checking..."
                : statusLabel(
                    data?.overallStatus ?? "empty",
                  )}
            </h2>

            <div
              className={`mt-6 inline-flex rounded-full border px-4 py-2 text-sm font-black ${statusClasses(
                data?.overallStatus ?? "empty",
              )}`}
            >
              {data?.summary.fullPipelineActive
                ? "Full pipeline active"
                : "Pipeline not fully active"}
            </div>

            <div className="mt-7 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Healthy
                </p>
                <p className="mt-2 text-4xl font-black text-emerald-300">
                  {data?.summary.healthyStages ?? 0}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Warnings
                </p>
                <p className="mt-2 text-4xl font-black text-amber-300">
                  {data?.summary.totalWarnings ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-sm font-black text-slate-500">
                {card.label}
              </p>
              <h3 className="mt-2 text-5xl font-black">
                {card.value}
              </h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {card.note}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl dark:border-white/10 dark:bg-white/5">
          <h2 className="text-3xl font-black">
            Pipeline Stages
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Each stage is evaluated using real record counts and dependency
            checks.
          </p>

          <div className="mt-7 grid gap-5 lg:grid-cols-5">
            {(data?.stages ?? []).map(
              (stage, index) => (
                <div
                  key={stage.key}
                  className="relative"
                >
                  <div className="h-full rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/5">
                    <div
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                        stage.status,
                      )}`}
                    >
                      {statusLabel(stage.status)}
                    </div>

                    <h3 className="mt-5 text-xl font-black">
                      {stage.label}
                    </h3>

                    <p className="mt-3 text-5xl font-black">
                      {stage.count}
                    </p>

                    <div className="mt-5 space-y-2">
                      {Object.entries(
                        stage.details,
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between gap-3 text-xs"
                        >
                          <span className="capitalize text-slate-500">
                            {key.replace(
                              /([A-Z])/g,
                              " $1",
                            )}
                          </span>
                          <span className="font-black">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={stage.route}
                      className="mt-6 flex justify-center rounded-2xl bg-blue-500 px-4 py-3 text-sm font-black text-white"
                    >
                      Open Stage
                    </a>
                  </div>

                  {index <
                    (data?.stages.length ?? 0) -
                      1 && (
                    <div className="mt-2 text-center text-2xl font-black text-blue-500 lg:absolute lg:-right-4 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">
                      →
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl dark:border-white/10 dark:bg-white/5">
          <h2 className="text-3xl font-black">
            Conversion Health
          </h2>

          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {conversionCards.map((item) => (
              <div
                key={item.label}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black">
                    {item.label}
                  </h3>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-black text-emerald-500">
                    {item.value}%
                  </span>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, item.value),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl dark:border-white/10 dark:bg-white/5">
          <h2 className="text-3xl font-black">
            Pipeline Warnings
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Operational issues detected across connected stages.
          </p>

          {isLoading ? (
            <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center font-bold text-slate-500 dark:border-white/10 dark:bg-white/5">
              Checking pipeline warnings...
            </div>
          ) : !data?.warnings.length ? (
            <div className="mt-7 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-7 text-emerald-600 dark:text-emerald-300">
              <h3 className="text-xl font-black">
                No pipeline warnings
              </h3>
              <p className="mt-2 text-sm font-bold">
                All detected dependencies are operating normally.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-4">
              {data.warnings.map(
                (warning, index) => (
                  <div
                    key={`${warning}-${index}`}
                    className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm font-bold text-amber-700 dark:text-amber-300"
                  >
                    {warning}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
