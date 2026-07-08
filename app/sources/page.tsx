"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type SourceItem = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  credibilityScore: number;
  status: string;
  lastScanAt: string;
  scanFrequency: string;
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
  storageMode: string;
  message?: string;
  error?: string;
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

const sourceStatuses = ["active", "paused", "archived"];
const scanFrequencies = ["manual", "daily", "weekly", "monthly"];

function getCredibilityLabel(score: number) {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function getCredibilityClasses(score: number) {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-500";
  if (score >= 50) return "bg-amber-500/10 text-amber-500";
  return "bg-red-500/10 text-red-500";
}

function getStatusClasses(status: string) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-500";
  if (status === "paused")
    return "bg-slate-500/10 text-slate-500 dark:text-slate-300";
  if (status === "archived") return "bg-red-500/10 text-red-500";
  return "bg-blue-500/10 text-blue-500";
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("All");
  const [status, setStatus] = useState("All");
  const [credibility, setCredibility] = useState("All");

  const [name, setName] = useState("");
  const [newType, setNewType] = useState("Website");
  const [url, setUrl] = useState("");
  const [credibilityScore, setCredibilityScore] = useState(70);
  const [newStatus, setNewStatus] = useState("active");
  const [scanFrequency, setScanFrequency] = useState("manual");

  const [storageMode, setStorageMode] = useState("sqlite_prisma");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSources() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/sources", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as SourcesApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load sources.");
      }

      setSources(data.items || []);
      setStorageMode(data.storageMode || "sqlite_prisma");
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
      setError("Source name is required.");
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type: newType,
          url,
          credibilityScore,
          status: newStatus,
          scanFrequency,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create source.");
      }

      setName("");
      setNewType("Website");
      setUrl("");
      setCredibilityScore(70);
      setNewStatus("active");
      setScanFrequency("manual");

      setMessage("Source created successfully.");
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

  async function deleteSource(id: string) {
    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(`/api/sources?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete source.");
      }

      setMessage("Source deleted successfully.");
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
    const confirmed = window.confirm(
      "Are you sure you want to delete all sources?"
    );

    if (!confirmed) return;

    try {
      setIsDeletingAll(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/sources", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete all sources.");
      }

      setMessage("All sources deleted successfully.");
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

  const activeSources = sources.filter((item) => item.status === "active").length;
  const pausedSources = sources.filter((item) => item.status === "paused").length;
  const archivedSources = sources.filter(
    (item) => item.status === "archived"
  ).length;

  const averageCredibility =
    sources.length === 0
      ? 0
      : Math.round(
          sources.reduce((sum, item) => sum + item.credibilityScore, 0) /
            sources.length
        );

  const filteredSources = useMemo(() => {
    return sources.filter((item) => {
      const matchesType = sourceType === "All" || item.type === sourceType;
      const matchesStatus = status === "All" || item.status === status;

      const credibilityLabel = getCredibilityLabel(item.credibilityScore);
      const matchesCredibility =
        credibility === "All" || credibility === credibilityLabel;

      const searchText = `
        ${item.name}
        ${item.type}
        ${item.url || ""}
        ${item.status}
        ${item.scanFrequency}
        ${item.credibilityScore}
      `.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesType && matchesStatus && matchesCredibility && matchesSearch;
    });
  }, [sources, search, sourceType, status, credibility]);

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
            <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-[-120px] left-[30%] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                Source Manager
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Manage where Wordsly discovers prompt intelligence.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Sources are now connected to SQLite through Prisma. Add trusted
                websites, communities, repositories, blogs, and research sources
                that will later feed the discovery pipeline.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={loadSources}
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Refresh Sources
                </button>

                <a
                  href="/discovery"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  Open Discovery
                </a>

                <a
                  href="/curation"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  Review Curation
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

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Source Analytics</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Live source statistics from SQLite.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Total</p>
                <h3 className="mt-2 text-4xl font-black">{sources.length}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Active</p>
                <h3 className="mt-2 text-4xl font-black text-emerald-300">
                  {activeSources}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Paused</p>
                <h3 className="mt-2 text-4xl font-black text-amber-300">
                  {pausedSources}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Archived</p>
                <h3 className="mt-2 text-4xl font-black text-red-300">
                  {archivedSources}
                </h3>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Average Credibility
              </p>

              <h3 className="mt-2 text-4xl font-black text-cyan-300">
                {averageCredibility}%
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Storage: {storageMode}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">Add New Source</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Add a new discovery source to SQLite.
              </p>
            </div>

            <button
              onClick={deleteAllSources}
              disabled={isDeletingAll || sources.length === 0}
              className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isDeletingAll ? "Deleting..." : "Delete All Sources"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Source name, e.g. GitHub Prompt Repositories"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Source URL, optional"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <select
              value={newType}
              onChange={(event) => setNewType(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {sourceTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {sourceStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatus(item)}
                </option>
              ))}
            </select>

            <select
              value={scanFrequency}
              onChange={(event) => setScanFrequency(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {scanFrequencies.map((item) => (
                <option key={item} value={item}>
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
                setCredibilityScore(Number(event.target.value))
              }
              placeholder="Credibility score"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <button
            onClick={createSource}
            disabled={isCreating}
            className="mt-5 rounded-2xl bg-blue-500 px-6 py-4 font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isCreating ? "Creating Source..." : "Add Source"}
          </button>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sources, types, URLs, status..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option>All</option>
              {sourceTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option>All</option>
              {sourceStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatus(item)}
                </option>
              ))}
            </select>

            <select
              value={credibility}
              onChange={(event) => setCredibility(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-12 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <h2 className="text-3xl font-black">Loading sources...</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Reading from SQLite through /api/sources.
            </p>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
              🌐
            </div>

            <h2 className="text-3xl font-black">No source found</h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Add your first source or change the filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredSources.map((source) => (
              <div
                key={source.id}
                className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
              >
                <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
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
                        {getCredibilityLabel(source.credibilityScore)} ·{" "}
                        {source.credibilityScore}%
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                          source.status
                        )}`}
                      >
                        {formatStatus(source.status)}
                      </span>

                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">
                        SQLite
                      </span>
                    </div>

                    <h2 className="text-3xl font-black">{source.name}</h2>

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

                  <button
                    onClick={() => deleteSource(source.id)}
                    disabled={deletingId === source.id}
                    className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-500/20 transition hover:-translate-y-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {deletingId === source.id ? "Deleting..." : "Delete"}
                  </button>
                </div>

                <div className="grid gap-5 lg:grid-cols-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                    <h3 className="font-black">Credibility</h3>
                    <p className="mt-3 text-4xl font-black">
                      {source.credibilityScore}%
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                    <h3 className="font-black">Scan Frequency</h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-slate-600 dark:text-slate-400">
                      {formatStatus(source.scanFrequency)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                    <h3 className="font-black">Last Scan</h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-slate-600 dark:text-slate-400">
                      {source.lastScanAt}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                    <h3 className="font-black text-blue-700 dark:text-blue-300">
                      Created
                    </h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
                      {source.createdAt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            Source quality controls the intelligence quality.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            This page now stores real source records in SQLite. Next, these
            sources will feed the Discovery API, then Curation, Corpus, and
            PromptMaster training.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/discovery"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Discovery Layer
            </a>

            <a
              href="/architecture"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              View Architecture
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}