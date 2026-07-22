"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Navbar from "../../components/Navbar";
import CredibilityTrendChart, {
  type CredibilityTrendPoint,
} from "./CredibilityTrendChart";

type ScanStatus =
  | "running"
  | "completed"
  | "failed";

type ScanTrigger =
  | "manual"
  | "scheduled";

type SourceScanEvent = {
  id: string;
  sourceId: string;
  source: {
    id: string;
    name: string;
    type: string;
    url: string | null;
  };
  trigger: ScanTrigger;
  status: ScanStatus;
  provider: string | null;
  credibilityScore: number | null;
  credibilityConfidence: number | null;
  credibilityReason: string | null;
  createdCount: number;
  generatedCount: number;
  skippedDuplicateCount: number;
  retrievedCharacterCount: number;
  durationMs: number;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
};

type SourceScanResponse = {
  success: boolean;
  error?: string | { message?: string };
  filters: {
    hours: number;
    limit: number;
    sourceId: string | null;
    status: string | null;
    trigger: string | null;
  };
  summary: {
    totalCount: number;
    returnedCount: number;
    completedCount: number;
    failedCount: number;
    runningCount: number;
    manualCount: number;
    scheduledCount: number;
    successRate: number;
    totalCreatedPrompts: number;
    totalGeneratedPrompts: number;
    totalSkippedDuplicates: number;
    totalRetrievedCharacters: number;
    averageDurationMs: number;
    totalDurationMs: number;
  };
  events: SourceScanEvent[];
};

function readError(
  data: Partial<SourceScanResponse> | null,
  fallback: string,
) {
  if (!data?.error) {
    return fallback;
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  return data.error.message || fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(value: number) {
  if (value < 1000) {
    return `${value} ms`;
  }

  return `${(value / 1000).toFixed(1)} s`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function statusClasses(status: ScanStatus) {
  if (status === "completed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }

  if (status === "failed") {
    return "border-red-500/20 bg-red-500/10 text-red-500";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-500";
}

export default function SourceScansPage() {
  const [data, setData] =
    useState<SourceScanResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [hours, setHours] =
    useState("168");

  const [status, setStatus] =
    useState("");

  const [trigger, setTrigger] =
    useState("");

  const [sourceId, setSourceId] =
    useState("");

  const loadSourceScans =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setError("");

        const params =
          new URLSearchParams({
            hours,
            limit: "100",
          });

        if (status) {
          params.set("status", status);
        }

        if (trigger) {
          params.set("trigger", trigger);
        }

        if (sourceId.trim()) {
          params.set(
            "sourceId",
            sourceId.trim(),
          );
        }

        const response = await fetch(
          `/api/source-scans?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as SourceScanResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            readError(
              result,
              "Failed to load source scan history.",
            ),
          );
        }

        setData(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load source scan history.",
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      hours,
      sourceId,
      status,
      trigger,
    ]);

  useEffect(() => {
    void loadSourceScans();
  }, [loadSourceScans]);

  const summaryCards = [
    {
      label: "Total Scans",
      value:
        data?.summary.totalCount ?? 0,
      note: "Recorded in selected period",
    },
    {
      label: "Success Rate",
      value:
        `${data?.summary.successRate ?? 0}%`,
      note: "Completed versus failed scans",
    },
    {
      label: "Prompts Created",
      value:
        data?.summary.totalCreatedPrompts ??
        0,
      note: "New discoveries stored",
    },
    {
      label: "Average Duration",
      value: formatDuration(
        data?.summary.averageDurationMs ??
          0,
      ),
      note: "Average scan execution time",
    },
  ];

  const uniqueSources = useMemo(() => {
    const sources =
      data?.events.map(
        (event) => event.source,
      ) ?? [];

    return Array.from(
      new Map(
        sources.map((source) => [
          source.id,
          source,
        ]),
      ).values(),
    );
  }, [data]);

  const credibilityTrendPoints =
    useMemo<CredibilityTrendPoint[]>(
      () =>
        (data?.events ?? [])
          .filter(
            (event) =>
              event.credibilityScore !== null,
          )
          .sort(
            (left, right) =>
              new Date(left.startedAt).getTime() -
              new Date(right.startedAt).getTime(),
          )
          .map((event) => ({
            id: event.id,
            sourceName: event.source.name,
            score: event.credibilityScore ?? 0,
            confidence:
              event.credibilityConfidence ?? 0,
            startedAt: event.startedAt,
          })),
      [data],
    );
  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-violet-500/20 blur-[140px]" />
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
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Source Scan Monitoring
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              Track every source intelligence scan.
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Review manual and scheduled scans, execution
              duration, discovered prompts, duplicate filtering
              and operational failures.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() =>
                  void loadSourceScans()
                }
                disabled={isLoading}
                className="rounded-2xl bg-cyan-500 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Refreshing..."
                  : "Refresh History"}
              </button>

              <a
                href="/admin"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-black dark:border-white/10 dark:bg-white/5"
              >
                Back to Admin
              </a>

              <a
                href="/sources"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-black dark:border-white/10 dark:bg-white/5"
              >
                Manage Sources
              </a>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">
              Scan activity
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-black">
                  {data?.summary.completedCount ??
                    0}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  Completed
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-black">
                  {data?.summary.failedCount ??
                    0}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  Failed
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-black">
                  {data?.summary.manualCount ??
                    0}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  Manual
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-black">
                  {data?.summary.scheduledCount ??
                    0}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  Scheduled
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Duplicates skipped
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatNumber(
                  data?.summary
                    .totalSkippedDuplicates ??
                    0,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {card.label}
              </p>

              <p className="mt-3 text-4xl font-black">
                {typeof card.value ===
                "number"
                  ? formatNumber(card.value)
                  : card.value}
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {card.note}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-widest text-cyan-500">
              Credibility analytics
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Credibility Trend
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Follow AI credibility scores and confidence across the selected scan history.
            </p>
          </div>

          <CredibilityTrendChart
            points={credibilityTrendPoints}
          />
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-widest text-cyan-500">
              Credibility analytics
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Credibility Trend
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Follow AI credibility scores and confidence across the selected scan history.
            </p>
          </div>

          <CredibilityTrendChart
            points={credibilityTrendPoints}
          />
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-black">
                Time range
              </span>

              <select
                value={hours}
                onChange={(event) =>
                  setHours(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none dark:border-white/10 dark:bg-slate-950"
              >
                <option value="24">
                  Last 24 hours
                </option>
                <option value="168">
                  Last 7 days
                </option>
                <option value="720">
                  Last 30 days
                </option>
                <option value="2160">
                  Last 90 days
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black">
                Status
              </span>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none dark:border-white/10 dark:bg-slate-950"
              >
                <option value="">
                  All statuses
                </option>
                <option value="completed">
                  Completed
                </option>
                <option value="failed">
                  Failed
                </option>
                <option value="running">
                  Running
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black">
                Trigger
              </span>

              <select
                value={trigger}
                onChange={(event) =>
                  setTrigger(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none dark:border-white/10 dark:bg-slate-950"
              >
                <option value="">
                  All triggers
                </option>
                <option value="manual">
                  Manual
                </option>
                <option value="scheduled">
                  Scheduled
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black">
                Source
              </span>

              <select
                value={sourceId}
                onChange={(event) =>
                  setSourceId(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none dark:border-white/10 dark:bg-slate-950"
              >
                <option value="">
                  All sources
                </option>

                {uniqueSources.map((source) => (
                  <option
                    key={source.id}
                    value={source.id}
                  >
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6 dark:border-white/10">
            <div>
              <h2 className="text-2xl font-black">
                Recent Scan Events
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Showing{" "}
                {data?.summary.returnedCount ??
                  0}{" "}
                of{" "}
                {data?.summary.totalCount ??
                  0}{" "}
                matching events
              </p>
            </div>
          </div>

          {isLoading && !data ? (
            <div className="p-12 text-center font-bold text-slate-500">
              Loading source scan history...
            </div>
          ) : !data?.events.length ? (
            <div className="p-12 text-center">
              <p className="text-xl font-black">
                No scan events found
              </p>

              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Run a source scan or adjust the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-100/80 text-xs uppercase tracking-widest text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">
                      Source
                    </th>
                    <th className="px-6 py-4">
                      Status
                    </th>
                    <th className="px-6 py-4">
                      Trigger
                    </th>
                    <th className="px-6 py-4">
                      Provider
                    </th>
                    <th className="px-6 py-4">
                      Credibility
                    </th>
                    <th className="px-6 py-4">
                      Prompts
                    </th>
                    <th className="px-6 py-4">
                      Duration
                    </th>
                    <th className="px-6 py-4">
                      Started
                    </th>
                    <th className="px-6 py-4">
                      Result
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-t border-slate-200 align-top dark:border-white/10"
                    >
                      <td className="px-6 py-5">
                        <p className="font-black">
                          {event.source.name}
                        </p>

                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {event.source.type}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${statusClasses(
                            event.status,
                          )}`}
                        >
                          {event.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 font-bold capitalize">
                        {event.trigger}
                      </td>

                      <td className="px-6 py-5 font-bold">
                        {event.provider || "—"}
                      </td>
                      <td className="px-6 py-5">
                        {event.credibilityScore === null ? (
                          <span className="text-slate-500">N/A</span>
                        ) : (
                          <>
                            <p className="font-black">
                              {event.credibilityScore}%
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {event.credibilityConfidence ?? 0}% confidence
                            </p>
                            {event.credibilityReason && (
                              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {event.credibilityReason}
                              </p>
                            )}
                          </>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-black">
                          {event.createdCount} created
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {event.generatedCount} generated ·{" "}
                          {event.skippedDuplicateCount} duplicate
                        </p>
                      </td>

                      <td className="px-6 py-5 font-bold">
                        {formatDuration(
                          event.durationMs,
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold">
                        {formatDate(
                          event.startedAt,
                        )}
                      </td>

                      <td className="max-w-sm px-6 py-5">
                        {event.errorMessage ? (
                          <>
                            <p className="font-black text-red-500">
                              {event.errorCode ||
                                "SCAN_FAILED"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {event.errorMessage}
                            </p>
                          </>
                        ) : (
                          <p className="font-bold text-emerald-500">
                            {formatNumber(
                              event
                                .retrievedCharacterCount,
                            )}{" "}
                            characters processed
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
