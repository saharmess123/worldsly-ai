"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type ScanStatus =
  | "idle"
  | "scanning"
  | "completed"
  | "failed";

type SourceItem = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  credibilityScore: number;
  credibilityMethod: string;
  credibilityConfidence: number;
  credibilityReason: string | null;
  credibilityUpdatedAt: string | null;
  status: string;
  lastScanAt: string | null;
  lastScanLabel: string;
  scanFrequency: string;
  discoveredPromptCount: number;
  createdAt: string;
  updatedAt: string;
  storageMode?: string;
};

type SourcesApiResponse = {
  success: boolean;
  items: SourceItem[];
  count: number;
  activeCount: number;
  pausedCount: number;
  archivedCount: number;
  averageCredibility: number;
  totalDiscoveredPrompts: number;
  storageMode: string;
  message?: string;
  error?: string;
};

type ScanApiResponse = {
  success: boolean;
  scanStatus: ScanStatus;
  message?: string;
  error?: string;
  createdCount?: number;
  item?: SourceItem;
};

const sourceTypes = [
  "Website",
  "Community",
  "Social",
  "Developer",
  "Research",
  "Marketplace",
  "Agent Community",
  "Blog",
  "Forum",
  "Documentation",
  "Other",
];

const sourceStatuses = [
  "active",
  "paused",
  "archived",
];

const scanFrequencies = [
  "manual",
  "daily",
  "weekly",
  "monthly",
];

function getCredibilityLabel(score: number) {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function getCredibilityClasses(score: number) {
  if (score >= 80) {
    return "bg-emerald-500/10 text-emerald-500";
  }

  if (score >= 50) {
    return "bg-amber-500/10 text-amber-500";
  }

  return "bg-red-500/10 text-red-500";
}

function getStatusClasses(status: string) {
  if (status === "active") {
    return "bg-emerald-500/10 text-emerald-500";
  }

  if (status === "paused") {
    return "bg-slate-500/10 text-slate-500 dark:text-slate-300";
  }

  if (status === "archived") {
    return "bg-red-500/10 text-red-500";
  }

  return "bg-blue-500/10 text-blue-500";
}

function getScanStatusClasses(
  scanStatus: ScanStatus
) {
  if (scanStatus === "scanning") {
    return "bg-blue-500/10 text-blue-500";
  }

  if (scanStatus === "completed") {
    return "bg-emerald-500/10 text-emerald-500";
  }

  if (scanStatus === "failed") {
    return "bg-red-500/10 text-red-500";
  }

  return "bg-slate-500/10 text-slate-500 dark:text-slate-300";
}

function formatStatus(status: string) {
  if (!status) return "";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

export default function SourcesPage() {
  const [sources, setSources] =
    useState<SourceItem[]>([]);

  const [search, setSearch] =
    useState("");

  const [sourceType, setSourceType] =
    useState("All");

  const [status, setStatus] =
    useState("All");

  const [credibility, setCredibility] =
    useState("All");

  const [name, setName] =
    useState("");

  const [newType, setNewType] =
    useState("Website");

  const [url, setUrl] =
    useState("");

  const [
    credibilityScore,
    setCredibilityScore,
  ] = useState(70);

  const [newStatus, setNewStatus] =
    useState("active");

  const [
    scanFrequency,
    setScanFrequency,
  ] = useState("manual");

  const [storageMode, setStorageMode] =
    useState("postgres_prisma");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isCreating, setIsCreating] =
    useState(false);

  const [
    isDeletingAll,
    setIsDeletingAll,
  ] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [
    scanStatuses,
    setScanStatuses,
  ] = useState<
    Record<string, ScanStatus>
  >({});

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadSources() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        "/api/sources",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as SourcesApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to load sources."
        );
      }

      setSources(data.items || []);

      setStorageMode(
        data.storageMode ||
          "postgres_prisma"
      );

      setScanStatuses((current) => {
        const next = {
          ...current,
        };

        for (const source of data.items) {
          if (!next[source.id]) {
            next[source.id] =
              "idle";
          }
        }

        return next;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while loading sources.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function createSource() {
    if (!name.trim()) {
      setError(
        "Source name is required."
      );

      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/sources",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "create",
            name,
            type: newType,
            url,
            credibilityScore,
            status: newStatus,
            scanFrequency,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to create source."
        );
      }

      setName("");
      setNewType("Website");
      setUrl("");
      setCredibilityScore(70);
      setNewStatus("active");
      setScanFrequency("manual");

      setMessage(
        "Source created successfully."
      );

      await loadSources();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the source.";

      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }

  async function scanSource(
    sourceId: string
  ) {
    if (
      scanStatuses[sourceId] ===
      "scanning"
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      setScanStatuses(
        (current) => ({
          ...current,
          [sourceId]:
            "scanning",
        })
      );

      const response = await fetch(
        "/api/sources",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "scan",
            sourceId,
          }),
        }
      );

      const data =
        (await response.json()) as ScanApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Source scan failed."
        );
      }

      setScanStatuses(
        (current) => ({
          ...current,
          [sourceId]:
            "completed",
        })
      );

      setMessage(
        data.message ||
          `${data.createdCount || 0} prompts discovered successfully.`
      );

      await loadSources();
    } catch (error) {
      setScanStatuses(
        (current) => ({
          ...current,
          [sourceId]:
            "failed",
        })
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while scanning the source.";

      setError(errorMessage);
    }
  }

  async function deleteSource(
    id: string
  ) {
    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/sources?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to delete source."
        );
      }

      setMessage(
        "Source deleted successfully."
      );

      await loadSources();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the source.";

      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAllSources() {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete all sources?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingAll(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/sources",
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to delete all sources."
        );
      }

      setMessage(
        "All sources deleted successfully."
      );

      setScanStatuses({});

      await loadSources();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting sources.";

      setError(errorMessage);
    } finally {
      setIsDeletingAll(false);
    }
  }

  useEffect(() => {
    loadSources();
  }, []);

  const activeSources =
    sources.filter(
      (item) =>
        item.status === "active"
    ).length;

  const pausedSources =
    sources.filter(
      (item) =>
        item.status === "paused"
    ).length;

  const archivedSources =
    sources.filter(
      (item) =>
        item.status === "archived"
    ).length;

  const averageCredibility =
    sources.length === 0
      ? 0
      : Math.round(
          sources.reduce(
            (sum, item) =>
              sum +
              item.credibilityScore,
            0
          ) / sources.length
        );

  const totalDiscoveredPrompts =
    sources.reduce(
      (total, item) =>
        total +
        item.discoveredPromptCount,
      0
    );

  const filteredSources =
    useMemo(() => {
      return sources.filter(
        (item) => {
          const matchesType =
            sourceType === "All" ||
            item.type === sourceType;

          const matchesStatus =
            status === "All" ||
            item.status === status;

          const credibilityLabel =
            getCredibilityLabel(
              item.credibilityScore
            );

          const matchesCredibility =
            credibility === "All" ||
            credibility ===
              credibilityLabel;

          const searchText = `
            ${item.name}
            ${item.type}
            ${item.url || ""}
            ${item.status}
            ${item.scanFrequency}
            ${item.credibilityScore}
            ${item.discoveredPromptCount}
          `.toLowerCase();

          const matchesSearch =
            searchText.includes(
              search.toLowerCase()
            );

          return (
            matchesType &&
            matchesStatus &&
            matchesCredibility &&
            matchesSearch
          );
        }
      );
    }, [
      sources,
      search,
      sourceType,
      status,
      credibility,
    ]);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[30%] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Real Source Intelligence
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Scan trusted sources and generate prompt intelligence.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Each active source can retrieve real public web content, analyze it with the AI runtime, and feed grounded prompts into the Discovery pipeline.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={loadSources}
                  disabled={isLoading}
                  className="rounded-2xl bg-blue-500 px-6 py-4 font-black text-white disabled:opacity-60"
                >
                  {isLoading
                    ? "Refreshing..."
                    : "Refresh Sources"}
                </button>

                <a
                  href="/discovery"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black dark:border-white/10 dark:bg-white/5"
                >
                  Open Discovery
                </a>
              </div>

              {message && (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-500">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-500">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-2xl font-black">
              Source Analytics
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Total Sources
                </p>
                <h3 className="mt-2 text-4xl font-black">
                  {sources.length}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Active
                </p>
                <h3 className="mt-2 text-4xl font-black text-emerald-300">
                  {activeSources}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Discovered
                </p>
                <h3 className="mt-2 text-4xl font-black text-cyan-300">
                  {totalDiscoveredPrompts}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Credibility
                </p>
                <h3 className="mt-2 text-4xl font-black text-blue-300">
                  {averageCredibility}%
                </h3>
              </div>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Paused: {pausedSources} Â· Archived: {archivedSources}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Storage: {storageMode}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">
                Add New Source
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Add a public HTTP or HTTPS source, then scan its real content to generate grounded discovered prompts.
              </p>
            </div>

            <button
              onClick={deleteAllSources}
              disabled={
                isDeletingAll ||
                sources.length === 0
              }
              className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {isDeletingAll
                ? "Deleting..."
                : "Delete All Sources"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Source name"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold dark:border-white/10 dark:bg-slate-950"
            />

            <input
              value={url}
              onChange={(event) =>
                setUrl(event.target.value)
              }
              placeholder="Source URL, optional"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold dark:border-white/10 dark:bg-slate-950"
            />

            <select
              value={newType}
              onChange={(event) =>
                setNewType(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black dark:border-white/10 dark:bg-slate-950"
            >
              {sourceTypes.map((item) => (
                <option key={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={newStatus}
              onChange={(event) =>
                setNewStatus(
                  event.target.value
                )
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black dark:border-white/10 dark:bg-slate-950"
            >
              {sourceStatuses.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatStatus(item)}
                </option>
              ))}
            </select>

            <select
              value={scanFrequency}
              onChange={(event) =>
                setScanFrequency(
                  event.target.value
                )
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black dark:border-white/10 dark:bg-slate-950"
            >
              {scanFrequencies.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatStatus(item)}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={0}
              max={100}
              value={credibilityScore}
              onChange={(event) =>
                setCredibilityScore(
                  Number(
                    event.target.value
                  )
                )
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold dark:border-white/10 dark:bg-slate-950"
            />
          </div>

          <button
            onClick={createSource}
            disabled={isCreating}
            className="mt-5 rounded-2xl bg-blue-500 px-6 py-4 font-black text-white disabled:opacity-60"
          >
            {isCreating
              ? "Creating Source..."
              : "Add Source"}
          </button>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search sources..."
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold dark:border-white/10 dark:bg-slate-950"
            />

            <select
              value={sourceType}
              onChange={(event) =>
                setSourceType(
                  event.target.value
                )
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black dark:border-white/10 dark:bg-slate-950"
            >
              <option>All</option>

              {sourceTypes.map((item) => (
                <option key={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black dark:border-white/10 dark:bg-slate-950"
            >
              <option>All</option>

              {sourceStatuses.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatStatus(item)}
                </option>
              ))}
            </select>

            <select
              value={credibility}
              onChange={(event) =>
                setCredibility(
                  event.target.value
                )
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black dark:border-white/10 dark:bg-slate-950"
            >
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-12 text-center dark:border-white/10 dark:bg-white/5">
            <h2 className="text-3xl font-black">
              Loading sources...
            </h2>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center dark:border-white/10 dark:bg-white/5">
            <h2 className="text-3xl font-black">
              No source found
            </h2>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredSources.map(
              (source) => {
                const scanStatus =
                  scanStatuses[
                    source.id
                  ] || "idle";

                const isScanning =
                  scanStatus ===
                  "scanning";

                return (
                  <div
                    key={source.id}
                    className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                            {source.type}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${getCredibilityClasses(
                              source.credibilityScore
                            )}`}
                          >
                            {getCredibilityLabel(
                              source.credibilityScore
                            )}{" "}
                            Â·{" "}
                            {
                              source.credibilityScore
                            }
                            %
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                              source.status
                            )}`}
                          >
                            {formatStatus(
                              source.status
                            )}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${getScanStatusClasses(
                              scanStatus
                            )}`}
                          >
                            Scan:{" "}
                            {formatStatus(
                              scanStatus
                            )}
                          </span>
                        </div>

                        <h2 className="text-3xl font-black">
                          {source.name}
                        </h2>

                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block break-all text-sm font-bold text-blue-500 hover:underline"
                          >
                            {source.url}
                          </a>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            No URL added.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() =>
                            scanSource(
                              source.id
                            )
                          }
                          disabled={
                            isScanning ||
                            source.status !==
                              "active"
                          }
                          className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isScanning
                            ? "Scanning..."
                            : "Scan Source"}
                        </button>

                        <button
                          onClick={() =>
                            deleteSource(
                              source.id
                            )
                          }
                          disabled={
                            deletingId ===
                            source.id
                          }
                          className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                        >
                          {deletingId ===
                          source.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                        <h3 className="font-black">
                          Credibility
                        </h3>
                        <p className="mt-3 text-4xl font-black">
                          {source.credibilityScore}%
                        </p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {source.credibilityMethod === "ai_scan"
                            ? `AI scan · ${source.credibilityConfidence}% confidence`
                            : "Manual score"}
                        </p>
                        {source.credibilityReason && (
                          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {source.credibilityReason}
                          </p>
                        )}
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                        <h3 className="font-black">
                          Frequency
                        </h3>
                        <p className="mt-3 text-sm font-bold">
                          {formatStatus(
                            source.scanFrequency
                          )}
                        </p>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                        <h3 className="font-black">
                          Last Scan
                        </h3>
                        <p className="mt-3 text-sm font-bold">
                          {
                            source.lastScanLabel
                          }
                        </p>
                      </div>

                      <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
                        <h3 className="font-black text-cyan-700 dark:text-cyan-300">
                          Discovered
                        </h3>
                        <p className="mt-3 text-4xl font-black">
                          {
                            source.discoveredPromptCount
                          }
                        </p>
                      </div>

                      <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                        <h3 className="font-black text-blue-700 dark:text-blue-300">
                          Created
                        </h3>
                        <p className="mt-3 text-xs font-bold">
                          {new Date(
                            source.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}