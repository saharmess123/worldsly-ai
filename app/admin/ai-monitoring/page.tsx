"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";

type ProviderName = "mock" | "ollama" | "openai";

type MonitoringSummary = {
  totalMatchingEvents: number;
  returnedEvents: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  fallbackCount: number;
  fallbackRate: number;
  averageLatencyMs: number;
  averageAttempts: number;
};

type ProviderBreakdown = {
  provider: ProviderName;
  requestCount: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageLatencyMs: number;
};

type RuntimeEvent = {
  id: string;
  operation: string;
  primaryProvider: string;
  resolvedProvider: string;
  fallbackProvider: string | null;
  model: string;
  success: boolean;
  usedFallback: boolean;
  attemptCount: number;
  latencyMs: number;
  error: string | null;
  createdAt: string;
};

type MonitoringResponse = {
  success: boolean;
  error?: string | { message?: string };
  filters: {
    hours: number;
    limit: number;
    provider: string | null;
    success: boolean | null;
    since: string;
  };
  summary: MonitoringSummary;
  providers: ProviderBreakdown[];
  recentEvents: RuntimeEvent[];
  generatedAt: string;
};

function getErrorMessage(
  data: Partial<MonitoringResponse> | null,
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

function providerLabel(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export default function AIMonitoringPage() {
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [hours, setHours] = useState("24");
  const [provider, setProvider] = useState("");
  const [successFilter, setSuccessFilter] = useState("");
  const [limit, setLimit] = useState("50");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMonitoring = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams({
        hours,
        limit,
      });

      if (provider) params.set("provider", provider);
      if (successFilter) params.set("success", successFilter);

      const response = await fetch(`/api/ai/monitoring?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as MonitoringResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result, "Failed to load AI monitoring data."),
        );
      }

      setData(result);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load AI monitoring data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [hours, limit, provider, successFilter]);

  useEffect(() => {
    void loadMonitoring();
  }, [loadMonitoring]);

  const summary = data?.summary;

  const metricCards = [
    {
      label: "Total Requests",
      value: summary?.totalMatchingEvents ?? 0,
      note: `${summary?.returnedEvents ?? 0} events displayed`,
    },
    {
      label: "Success Rate",
      value: `${summary?.successRate ?? 0}%`,
      note: `${summary?.successfulRequests ?? 0} successful requests`,
    },
    {
      label: "Failed Requests",
      value: summary?.failedRequests ?? 0,
      note: "Requests requiring attention",
    },
    {
      label: "Average Latency",
      value: `${summary?.averageLatencyMs ?? 0} ms`,
      note: "Average AI response time",
    },
    {
      label: "Fallback Rate",
      value: `${summary?.fallbackRate ?? 0}%`,
      note: `${summary?.fallbackCount ?? 0} fallback events`,
    },
    {
      label: "Average Attempts",
      value: summary?.averageAttempts ?? 0,
      note: "Attempts per AI request",
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
              AI Runtime Monitoring
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              Monitor every Wordsly.AI request in real time.
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Track provider usage, request success, latency, retry attempts,
              fallback behaviour and recent AI runtime errors.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => void loadMonitoring()}
                disabled={isLoading}
                className="rounded-2xl bg-blue-500 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Refreshing..." : "Refresh Monitoring"}
              </button>

              <a
                href="/admin"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-black dark:border-white/10 dark:bg-white/5"
              >
                Back to Admin
              </a>
            </div>

            {data?.generatedAt && (
              <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">
                Last updated: {formatDate(data.generatedAt)}
              </p>
            )}
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">
              Runtime health
            </p>

            <h2 className="mt-3 text-3xl font-black">
              {isLoading
                ? "Loading..."
                : (summary?.successRate ?? 0) >= 90
                  ? "Healthy"
                  : (summary?.successRate ?? 0) >= 70
                    ? "Needs attention"
                    : "Critical"}
            </h2>

            <div className="mt-7">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>Success rate</span>
                <span>{summary?.successRate ?? 0}%</span>
              </div>

              <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, summary?.successRate ?? 0),
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Successful</p>
                <p className="mt-2 text-4xl font-black text-emerald-300">
                  {summary?.successfulRequests ?? 0}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Failed</p>
                <p className="mt-2 text-4xl font-black text-red-300">
                  {summary?.failedRequests ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Time range
              </span>
              <select
                value={hours}
                onChange={(event) => setHours(event.target.value)}
                disabled={isLoading}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold dark:border-white/10 dark:bg-slate-950"
              >
                <option value="1">Last hour</option>
                <option value="24">Last 24 hours</option>
                <option value="168">Last 7 days</option>
                <option value="720">Last 30 days</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Provider
              </span>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                disabled={isLoading}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold dark:border-white/10 dark:bg-slate-950"
              >
                <option value="">All providers</option>
                <option value="mock">Mock</option>
                <option value="ollama">Ollama</option>
                <option value="openai">OpenAI</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Status
              </span>
              <select
                value={successFilter}
                onChange={(event) => setSuccessFilter(event.target.value)}
                disabled={isLoading}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold dark:border-white/10 dark:bg-slate-950"
              >
                <option value="">All statuses</option>
                <option value="true">Successful</option>
                <option value="false">Failed</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Event limit
              </span>
              <select
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                disabled={isLoading}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold dark:border-white/10 dark:bg-slate-950"
              >
                <option value="25">25 events</option>
                <option value="50">50 events</option>
                <option value="100">100 events</option>
                <option value="200">200 events</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void loadMonitoring()}
                disabled={isLoading}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {metricCards.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-sm font-black text-slate-500">{metric.label}</p>
              <h3 className="mt-2 text-4xl font-black">{metric.value}</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {metric.note}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl dark:border-white/10 dark:bg-white/5">
          <h2 className="text-3xl font-black">Provider Performance</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Compare request volume, reliability and speed across all AI
            providers.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {(data?.providers ?? []).map((item) => (
              <div
                key={item.provider}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-black">
                    {providerLabel(item.provider)}
                  </h3>

                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-black text-blue-500">
                    {item.requestCount} requests
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <ProviderMetric
                    label="Success"
                    value={`${item.successRate}%`}
                  />
                  <ProviderMetric
                    label="Latency"
                    value={`${item.averageLatencyMs} ms`}
                  />
                  <ProviderMetric
                    label="Completed"
                    value={item.successfulRequests}
                  />
                  <ProviderMetric
                    label="Failed"
                    value={item.failedRequests}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-black">Recent Runtime Events</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Latest AI operations matching the selected filters.
              </p>
            </div>

            <span className="text-sm font-black text-slate-500">
              {data?.recentEvents.length ?? 0} displayed
            </span>
          </div>

          {isLoading ? (
            <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center font-bold text-slate-500 dark:border-white/10 dark:bg-white/5">
              Loading AI runtime events...
            </div>
          ) : !data?.recentEvents.length ? (
            <div className="mt-7 rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-white/20">
              <h3 className="text-xl font-black">No runtime events found</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                No AI runtime events were recorded during this period.
              </p>
            </div>
          ) : (
            <div className="mt-7 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10">
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Operation</th>
                    <th className="px-4 py-4">Provider</th>
                    <th className="px-4 py-4">Model</th>
                    <th className="px-4 py-4">Latency</th>
                    <th className="px-4 py-4">Attempts</th>
                    <th className="px-4 py-4">Fallback</th>
                    <th className="px-4 py-4">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {data.recentEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-slate-200/80 dark:border-white/10"
                    >
                      <td className="px-4 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            event.success
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {event.success ? "Success" : "Failed"}
                        </span>
                      </td>

                      <td className="px-4 py-5 font-bold">{event.operation}</td>

                      <td className="px-4 py-5">
                        <div className="font-black">
                          {providerLabel(event.resolvedProvider)}
                        </div>
                        {event.primaryProvider !== event.resolvedProvider && (
                          <div className="mt-1 text-xs text-slate-500">
                            Primary: {providerLabel(event.primaryProvider)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-5 font-mono text-xs">
                        {event.model}
                      </td>

                      <td className="px-4 py-5 font-black">
                        {event.latencyMs} ms
                      </td>

                      <td className="px-4 py-5">{event.attemptCount}</td>

                      <td className="px-4 py-5">
                        {event.usedFallback ? (
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-500">
                            Used
                          </span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-5 text-slate-600 dark:text-slate-400">
                        {formatDate(event.createdAt)}
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

function ProviderMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 dark:bg-slate-950">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
