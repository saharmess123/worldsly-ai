"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Navbar from "../components/Navbar";

type DiscoveryStatus =
  | "pending"
  | "sent_to_curation"
  | "approved"
  | "rejected";

type SourceItem = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  credibilityScore?: number;
  status?: string;
};

type DiscoveredPrompt = {
  id: string;
  sourceId: string | null;
  title: string;
  prompt: string;
  category: string;
  model: string;
  qualityScore: number;
  sourceUrl: string | null;
  status: DiscoveryStatus;
  discoveredAt: string;
  source: SourceItem | null;
};

type DiscoveryResponse = {
  success: boolean;
  items?: DiscoveredPrompt[];
  count?: number;
  error?: string;
};

type SourcesResponse = {
  success?: boolean;
  items?: SourceItem[];
  sources?: SourceItem[];
  error?: string;
};

const STATUS_OPTIONS: Array<{
  value: DiscoveryStatus;
  label: string;
}> = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "sent_to_curation",
    label: "Sent to Curation",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

const INITIAL_FORM = {
  title: "",
  prompt: "",
  category: "General",
  model: "General",
  qualityScore: "50",
  sourceId: "",
  sourceUrl: "",
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(status: DiscoveryStatus) {
  switch (status) {
    case "approved":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";

    case "rejected":
      return "border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300";

    case "sent_to_curation":
      return "border-violet-400/30 bg-violet-500/10 text-violet-600 dark:text-violet-300";

    default:
      return "border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  }
}

function getScoreClasses(score: number) {
  if (score >= 80) {
    return "text-emerald-500";
  }

  if (score >= 60) {
    return "text-blue-500";
  }

  if (score >= 40) {
    return "text-amber-500";
  }

  return "text-rose-500";
}

export default function DiscoveryPage() {
  const [items, setItems] = useState<DiscoveredPrompt[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);

  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [minimumScore, setMinimumScore] = useState("0");

  const [form, setForm] = useState(INITIAL_FORM);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => item.category)
          .filter((category) => category.trim().length > 0)
      )
    ).sort((first, second) => first.localeCompare(second));
  }, [items]);

  const analytics = useMemo(() => {
    const pending = items.filter(
      (item) => item.status === "pending"
    ).length;

    const sentToCuration = items.filter(
      (item) => item.status === "sent_to_curation"
    ).length;

    const approved = items.filter(
      (item) => item.status === "approved"
    ).length;

    const rejected = items.filter(
      (item) => item.status === "rejected"
    ).length;

    const averageScore =
      items.length > 0
        ? Math.round(
            items.reduce(
              (total, item) => total + item.qualityScore,
              0
            ) / items.length
          )
        : 0;

    return {
      pending,
      sentToCuration,
      approved,
      rejected,
      averageScore,
    };
  }, [items]);

  const loadSources = useCallback(async () => {
    try {
      const response = await fetch("/api/sources", {
        cache: "no-store",
      });

      const data: SourcesResponse | SourceItem[] =
        await response.json();

      if (!response.ok) {
        throw new Error("Unable to load sources.");
      }

      if (Array.isArray(data)) {
        setSources(data);
        return;
      }

      if (Array.isArray(data.items)) {
        setSources(data.items);
        return;
      }

      if (Array.isArray(data.sources)) {
        setSources(data.sources);
        return;
      }

      setSources([]);
    } catch (sourceError) {
      console.error("Source loading error:", sourceError);
      setSources([]);
    }
  }, []);

  const loadDiscovery = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const parameters = new URLSearchParams();

      if (search.trim()) {
        parameters.set("search", search.trim());
      }

      if (selectedSource !== "all") {
        parameters.set("sourceId", selectedSource);
      }

      if (selectedCategory !== "all") {
        parameters.set("category", selectedCategory);
      }

      if (selectedStatus !== "all") {
        parameters.set("status", selectedStatus);
      }

      const numericMinimumScore = Number(minimumScore);

      if (
        Number.isFinite(numericMinimumScore) &&
        numericMinimumScore > 0
      ) {
        parameters.set(
          "minScore",
          String(numericMinimumScore)
        );
      }

      const queryString = parameters.toString();

      const url = queryString
        ? `/api/discovery?${queryString}`
        : "/api/discovery";

      const response = await fetch(url, {
        cache: "no-store",
      });

      const data: DiscoveryResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load discovered prompts."
        );
      }

      setItems(data.items ?? []);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load discovered prompts.";

      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    selectedSource,
    selectedCategory,
    selectedStatus,
    minimumScore,
  ]);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDiscovery();
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadDiscovery]);

  function updateFormField(
    field: keyof typeof INITIAL_FORM,
    value: string
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function createDiscoveredPrompt(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          prompt: form.prompt,
          category: form.category,
          model: form.model,
          qualityScore: Number(form.qualityScore),
          sourceId: form.sourceId || null,
          sourceUrl: form.sourceUrl || null,
          status: "pending",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to create discovered prompt."
        );
      }

      setForm(INITIAL_FORM);
      setShowForm(false);
      setSuccessMessage(
        "Prompt saved successfully in Discovery."
      );

      await loadDiscovery();
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Unable to create discovered prompt.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function updatePromptStatus(
    id: string,
    status: DiscoveryStatus
  ) {
    try {
      setUpdatingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/discovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to update prompt."
        );
      }

      setSuccessMessage(
        status === "sent_to_curation"
          ? "Prompt sent to the Curation queue."
          : `Prompt marked as ${formatStatus(status)}.`
      );

      await loadDiscovery();
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Unable to update prompt.";

      setError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deletePrompt(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this prompt?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/discovery?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to delete prompt."
        );
      }

      setSuccessMessage("Prompt deleted successfully.");

      await loadDiscovery();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete prompt.";

      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  async function copyPrompt(
    prompt: string,
    title: string
  ) {
    try {
      await navigator.clipboard.writeText(prompt);
      setSuccessMessage(`"${title}" copied successfully.`);
      setError("");
    } catch {
      setError("Unable to copy the prompt.");
    }
  }

  function clearFilters() {
    setSearch("");
    setSelectedSource("all");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setMinimumScore("0");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-4 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white sm:px-6">
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

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                Internal Discovery Pipeline
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Discover and review prompt candidates.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Store prompts discovered from sources, score
                their quality, filter candidates, reject weak
                entries, and send strong prompts to Curation.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm((currentValue) => !currentValue);
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  {showForm
                    ? "Close Form"
                    : "+ Add Discovered Prompt"}
                </button>

                <a
                  href="/curation"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  Open Curation
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">
              Discovery Analytics
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Live data loaded from SQLite through the Discovery
              API.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <AnalyticsCard
                label="Displayed"
                value={items.length}
              />

              <AnalyticsCard
                label="Average Score"
                value={`${analytics.averageScore}%`}
              />

              <AnalyticsCard
                label="Pending"
                value={analytics.pending}
              />

              <AnalyticsCard
                label="Curation Queue"
                value={analytics.sentToCuration}
              />

              <AnalyticsCard
                label="Approved"
                value={analytics.approved}
              />

              <AnalyticsCard
                label="Rejected"
                value={analytics.rejected}
              />
            </div>
          </div>
        </div>

        {showForm && (
          <section className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 sm:p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-black">
                Add a Discovered Prompt
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Add a manual test prompt or save a candidate
                collected from one of the configured sources.
              </p>
            </div>

            <form
              onSubmit={createDiscoveredPrompt}
              className="space-y-5"
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-black">
                    Prompt Title
                  </span>

                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      updateFormField(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="Example: Professional email writer"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-black">
                    Source
                  </span>

                  <select
                    value={form.sourceId}
                    onChange={(event) =>
                      updateFormField(
                        "sourceId",
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      Manual entry / no source
                    </option>

                    {sources.map((source) => (
                      <option
                        key={source.id}
                        value={source.id}
                      >
                        {source.name} — {source.type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-black">
                  Prompt Content
                </span>

                <textarea
                  required
                  rows={9}
                  value={form.prompt}
                  onChange={(event) =>
                    updateFormField(
                      "prompt",
                      event.target.value
                    )
                  }
                  placeholder="Paste the discovered prompt here..."
                  className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-medium leading-7 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-black">
                    Category
                  </span>

                  <input
                    required
                    type="text"
                    value={form.category}
                    onChange={(event) =>
                      updateFormField(
                        "category",
                        event.target.value
                      )
                    }
                    placeholder="Coding, Marketing, Research..."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-black">
                    Target Model
                  </span>

                  <input
                    required
                    type="text"
                    value={form.model}
                    onChange={(event) =>
                      updateFormField(
                        "model",
                        event.target.value
                      )
                    }
                    placeholder="General, GPT, Claude..."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-black">
                    Source URL
                  </span>

                  <input
                    type="url"
                    value={form.sourceUrl}
                    onChange={(event) =>
                      updateFormField(
                        "sourceUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://example.com/prompt"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="flex items-center justify-between text-sm font-black">
                    <span>Quality Score</span>
                    <span className="text-blue-500">
                      {form.qualityScore}%
                    </span>
                  </span>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={form.qualityScore}
                    onChange={(event) =>
                      updateFormField(
                        "qualityScore",
                        event.target.value
                      )
                    }
                    className="mt-4 w-full cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForm(INITIAL_FORM);
                    setShowForm(false);
                  }}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-black text-slate-900 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-blue-500 px-6 py-3 font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save to Discovery"}
                </button>
              </div>
            </form>
          </section>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm font-bold text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-300">
            {successMessage}
          </div>
        )}

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search title, prompt, or category..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <select
              value={selectedSource}
              onChange={(event) =>
                setSelectedSource(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option value="all">All Sources</option>

              {sources.map((source) => (
                <option
                  key={source.id}
                  value={source.id}
                >
                  {source.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option value="all">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option value="all">All Statuses</option>

              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-900 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Clear
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
              <span>Minimum score:</span>

              <input
                type="number"
                min="0"
                max="100"
                value={minimumScore}
                onChange={(event) =>
                  setMinimumScore(event.target.value)
                }
                className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <p className="text-sm font-bold text-slate-500">
              {items.length} prompt
              {items.length === 1 ? "" : "s"} displayed
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-12 text-center shadow-xl dark:border-white/10 dark:bg-white/5">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-500 dark:border-white/10 dark:border-t-blue-500" />

            <p className="mt-5 font-black text-slate-600 dark:text-slate-300">
              Loading discovered prompts...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
              🔎
            </div>

            <h2 className="text-2xl font-black">
              No discovered prompts found
            </h2>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Add a new prompt or change the current
              filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {items.map((item) => {
              const isUpdating =
                updatingId === item.id;

              const isDeleting =
                deletingId === item.id;

              return (
                <article
                  key={item.id}
                  className="flex flex-col rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                          {item.category}
                        </span>

                        <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-black text-fuchsia-500">
                          {item.source?.name ??
                            "Manual Entry"}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
                            item.status
                          )}`}
                        >
                          {formatStatus(item.status)}
                        </span>
                      </div>

                      <h2 className="break-words text-2xl font-black">
                        {item.title}
                      </h2>

                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Discovered{" "}
                        {formatDate(item.discoveredAt)}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-3xl bg-slate-950/5 p-4 text-center dark:bg-white/10">
                      <p className="text-xs font-black text-slate-500">
                        SCORE
                      </p>

                      <p
                        className={`mt-1 text-3xl font-black ${getScoreClasses(
                          item.qualityScore
                        )}`}
                      >
                        {item.qualityScore}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                      <p className="mb-2 text-xs font-black text-slate-500">
                        TARGET MODEL
                      </p>

                      <p className="text-sm font-bold">
                        {item.model}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                      <p className="mb-2 text-xs font-black text-slate-500">
                        PIPELINE STATUS
                      </p>

                      <p className="text-sm font-bold">
                        {formatStatus(item.status)}
                      </p>
                    </div>
                  </div>

                  <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-words rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">
                    {item.prompt}
                  </pre>

                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 break-all text-sm font-bold text-blue-500 hover:underline"
                    >
                      Open original source
                    </a>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <button
                      type="button"
                      onClick={() =>
                        copyPrompt(
                          item.prompt,
                          item.title
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-900 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      Copy
                    </button>

                    <button
                      type="button"
                      disabled={
                        isUpdating ||
                        item.status ===
                          "sent_to_curation"
                      }
                      onClick={() =>
                        updatePromptStatus(
                          item.id,
                          "sent_to_curation"
                        )
                      }
                      className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating
                        ? "Updating..."
                        : "Send to Curation"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        isUpdating ||
                        item.status === "approved"
                      }
                      onClick={() =>
                        updatePromptStatus(
                          item.id,
                          "approved"
                        )
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      disabled={
                        isUpdating ||
                        item.status === "rejected"
                      }
                      onClick={() =>
                        updatePromptStatus(
                          item.id,
                          "rejected"
                        )
                      }
                      className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() =>
                        deletePrompt(item.id)
                      }
                      className="ml-auto rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function AnalyticsCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
      <p className="text-sm font-bold text-slate-400">
        {label}
      </p>

      <h3 className="mt-2 text-3xl font-black">
        {value}
      </h3>
    </div>
  );
}