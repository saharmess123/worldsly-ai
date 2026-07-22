"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Navbar from "../../components/Navbar";

type AlertSeverity =
  | "medium"
  | "high"
  | "critical";

type AlertStatus =
  | "open"
  | "resolved";

type CredibilityAlert = {
  id: string;
  sourceId: string;
  source: {
    id: string;
    name: string;
    type: string;
    url: string | null;
  };
  severity: AlertSeverity;
  status: AlertStatus;
  alertType: string;
  currentScore: number;
  previousScore: number | null;
  scoreDrop: number | null;
  threshold: number | null;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
};

type AlertsResponse = {
  success: boolean;
  error?: string;
  summary: {
    totalCount: number;
    returnedCount: number;
    openCount: number;
    resolvedCount: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
  };
  alerts: CredibilityAlert[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function severityClasses(
  severity: AlertSeverity,
) {
  if (severity === "critical") {
    return "border-red-500/20 bg-red-500/10 text-red-500";
  }

  if (severity === "high") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-500";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-500";
}

export default function SourceCredibilityAlertsPage() {
  const [data, setData] =
    useState<AlertsResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [hours, setHours] =
    useState("720");

  const [status, setStatus] =
    useState("");

  const [severity, setSeverity] =
    useState("");

  const loadAlerts =
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

        if (severity) {
          params.set(
            "severity",
            severity,
          );
        }

        const response = await fetch(
          `/api/source-credibility-alerts?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as AlertsResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
              "Failed to load credibility alerts.",
          );
        }

        setData(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load credibility alerts.",
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      hours,
      severity,
      status,
    ]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  async function updateAlert(
    alert: CredibilityAlert,
  ) {
    try {
      setUpdatingId(alert.id);
      setError("");
      setMessage("");

      const nextStatus =
        alert.status === "open"
          ? "resolved"
          : "open";

      const response = await fetch(
        "/api/source-credibility-alerts",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: alert.id,
            status: nextStatus,
          }),
        },
      );

      const result =
        (await response.json()) as {
          success: boolean;
          error?: string;
          message?: string;
        };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Failed to update credibility alert.",
        );
      }

      setMessage(
        result.message ||
          "Credibility alert updated.",
      );

      await loadAlerts();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update credibility alert.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  const summaryCards = [
    {
      label: "Open Alerts",
      value:
        data?.summary.openCount ?? 0,
    },
    {
      label: "Critical",
      value:
        data?.summary.criticalCount ?? 0,
    },
    {
      label: "High",
      value:
        data?.summary.highCount ?? 0,
    },
    {
      label: "Resolved",
      value:
        data?.summary.resolvedCount ?? 0,
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-red-500/20 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-orange-500/20 blur-[140px]" />
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

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-500">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Source Credibility Alerts
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Detect credibility risks before they affect the corpus.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Review low credibility scores and significant score drops generated automatically after source scans.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() =>
                void loadAlerts()
              }
              disabled={isLoading}
              className="rounded-2xl bg-red-500 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? "Refreshing..."
                : "Refresh Alerts"}
            </button>

            <a
              href="/admin/source-scans"
              className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-black dark:border-white/10 dark:bg-white/5"
            >
              Scan Monitoring
            </a>

            <a
              href="/admin"
              className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 font-black dark:border-white/10 dark:bg-white/5"
            >
              Back to Admin
            </a>
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
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-4 md:grid-cols-3">
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
                <option value="8760">
                  Last year
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
                <option value="open">
                  Open
                </option>
                <option value="resolved">
                  Resolved
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black">
                Severity
              </span>

              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none dark:border-white/10 dark:bg-slate-950"
              >
                <option value="">
                  All severities
                </option>
                <option value="critical">
                  Critical
                </option>
                <option value="high">
                  High
                </option>
                <option value="medium">
                  Medium
                </option>
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="border-b border-slate-200 p-6 dark:border-white/10">
            <h2 className="text-2xl font-black">
              Credibility Alert History
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Showing{" "}
              {data?.summary.returnedCount ?? 0}{" "}
              of{" "}
              {data?.summary.totalCount ?? 0}{" "}
              matching alerts
            </p>
          </div>

          {isLoading && !data ? (
            <div className="p-12 text-center font-bold text-slate-500">
              Loading credibility alerts...
            </div>
          ) : !data?.alerts.length ? (
            <div className="p-12 text-center">
              <p className="text-xl font-black">
                No credibility alerts found
              </p>

              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Sources currently meet the configured credibility rules.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {data.alerts.map((alert) => (
                <article
                  key={alert.id}
                  className="p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row">
                    <div className="max-w-4xl">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${severityClasses(
                            alert.severity,
                          )}`}
                        >
                          {alert.severity}
                        </span>

                        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                          {alert.status}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-black">
                        {alert.source.name}
                      </h3>

                      <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
                        {alert.message}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-5 text-sm font-bold text-slate-500 dark:text-slate-400">
                        <span>
                          Current: {alert.currentScore}%
                        </span>

                        <span>
                          Previous:{" "}
                          {alert.previousScore === null
                            ? "N/A"
                            : `${alert.previousScore}%`}
                        </span>

                        <span>
                          Drop:{" "}
                          {alert.scoreDrop === null
                            ? "N/A"
                            : `${alert.scoreDrop} points`}
                        </span>

                        <span>
                          Created:{" "}
                          {formatDate(alert.createdAt)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void updateAlert(alert)
                      }
                      disabled={
                        updatingId === alert.id
                      }
                      className="h-fit rounded-2xl bg-slate-950 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
                    >
                      {updatingId === alert.id
                        ? "Updating..."
                        : alert.status === "open"
                          ? "Resolve Alert"
                          : "Reopen Alert"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
