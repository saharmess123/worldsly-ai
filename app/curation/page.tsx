"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Navbar from "../components/Navbar";

type ReviewStatus = "approved" | "rejected" | "risky";
type RiskLevel = "low" | "medium" | "high";

type SourceItem = {
  id: string;
  name: string;
  type: string;
  url: string | null;
};

type CurationReview = {
  id: string;
  discoveredPromptId: string;
  reviewerId: string | null;
  status: ReviewStatus;
  riskLevel: RiskLevel;
  reviewReason: string | null;
  createdAt: string;
};

type CurationPrompt = {
  id: string;
  sourceId: string | null;
  title: string;
  prompt: string;
  category: string;
  model: string;
  qualityScore: number;
  sourceUrl: string | null;
  status: string;
  discoveredAt: string;
  source: SourceItem | null;
  curationReviews: CurationReview[];
};

type CurationApiResponse = {
  success: boolean;
  items?: CurationPrompt[];
  count?: number;
  approvedCount?: number;
  rejectedCount?: number;
  riskyCount?: number;
  pendingCount?: number;
  error?: string;
};

type ReviewFormState = {
  discoveredPromptId: string;
  status: ReviewStatus;
  riskLevel: RiskLevel;
  reviewReason: string;
};

const INITIAL_REVIEW_FORM: ReviewFormState = {
  discoveredPromptId: "",
  status: "approved",
  riskLevel: "low",
  reviewReason: "",
};

function formatStatus(value: string) {
  return value
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

function getRiskClasses(riskLevel: RiskLevel) {
  if (riskLevel === "high") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300";
  }

  if (riskLevel === "medium") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  }

  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
}

function getReviewStatusClasses(status: ReviewStatus) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  }

  if (status === "rejected") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300";
  }

  return "border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
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

export default function CurationPage() {
  const [items, setItems] = useState<CurationPrompt[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [selectedReviewStatus, setSelectedReviewStatus] =
    useState("all");

  const [reviewForm, setReviewForm] =
    useState<ReviewFormState>(INITIAL_REVIEW_FORM);

  const [selectedPrompt, setSelectedPrompt] =
    useState<CurationPrompt | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingReviewId, setDeletingReviewId] =
    useState<string | null>(null);

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
    let approved = 0;
    let rejected = 0;
    let risky = 0;
    let pending = 0;

    for (const item of items) {
      const latestReview = item.curationReviews[0];

      if (!latestReview) {
        pending += 1;
        continue;
      }

      if (latestReview.status === "approved") {
        approved += 1;
      }

      if (latestReview.status === "rejected") {
        rejected += 1;
      }

      if (latestReview.status === "risky") {
        risky += 1;
      }
    }

    const averageScore =
      items.length === 0
        ? 0
        : Math.round(
            items.reduce(
              (total, item) => total + item.qualityScore,
              0
            ) / items.length
          );

    return {
      approved,
      rejected,
      risky,
      pending,
      averageScore,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const latestReview = item.curationReviews[0];

      const searchText = `
        ${item.title}
        ${item.prompt}
        ${item.category}
        ${item.model}
        ${item.source?.name ?? ""}
        ${latestReview?.reviewReason ?? ""}
      `.toLowerCase();

      const matchesSearch = searchText.includes(
        search.trim().toLowerCase()
      );

      const matchesCategory =
        selectedCategory === "all" ||
        item.category === selectedCategory;

      const matchesRisk =
        selectedRisk === "all" ||
        latestReview?.riskLevel === selectedRisk;

      const matchesReviewStatus =
        selectedReviewStatus === "all" ||
        (selectedReviewStatus === "pending" && !latestReview) ||
        latestReview?.status === selectedReviewStatus;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesRisk &&
        matchesReviewStatus
      );
    });
  }, [
    items,
    search,
    selectedCategory,
    selectedRisk,
    selectedReviewStatus,
  ]);

  const loadCuration = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/curation", {
        method: "GET",
        cache: "no-store",
      });

      const data: CurationApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load the Curation queue."
        );
      }

      setItems(data.items ?? []);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the Curation queue.";

      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCuration();
  }, [loadCuration]);

  function openReview(
    item: CurationPrompt,
    status: ReviewStatus
  ) {
    let riskLevel: RiskLevel = "low";

    if (status === "risky") {
      riskLevel = "high";
    }

    if (status === "rejected") {
      riskLevel = "medium";
    }

    setSelectedPrompt(item);

    setReviewForm({
      discoveredPromptId: item.id,
      status,
      riskLevel,
      reviewReason: "",
    });

    setError("");
    setSuccessMessage("");
  }

  function closeReview() {
    setSelectedPrompt(null);
    setReviewForm(INITIAL_REVIEW_FORM);
  }

  function updateReviewField(
    field: keyof ReviewFormState,
    value: string
  ) {
    setReviewForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function submitReview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!reviewForm.discoveredPromptId) {
      setError("A prompt must be selected.");
      return;
    }

    if (!reviewForm.reviewReason.trim()) {
      setError("Please write a review reason.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/curation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discoveredPromptId:
            reviewForm.discoveredPromptId,
          status: reviewForm.status,
          riskLevel: reviewForm.riskLevel,
          reviewReason: reviewForm.reviewReason,
          reviewerId: null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to save the review."
        );
      }

      setSuccessMessage(
        `Prompt review saved as ${formatStatus(
          reviewForm.status
        )}.`
      );

      closeReview();
      await loadCuration();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to save the review.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteReview(reviewId: string) {
    const confirmed = window.confirm(
      "Delete this Curation review?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingReviewId(reviewId);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/curation?id=${encodeURIComponent(reviewId)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to delete the review."
        );
      }

      setSuccessMessage("Curation review deleted.");
      await loadCuration();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the review.";

      setError(message);
    } finally {
      setDeletingReviewId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory("all");
    setSelectedRisk("all");
    setSelectedReviewStatus("all");
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
            <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-black text-violet-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                Internal Curation Workflow
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Review prompts before they enter the clean dataset.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Inspect prompts sent from Discovery, evaluate
                their quality and risk, write a review reason,
                and decide whether they should continue toward
                the Corpus.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void loadCuration()}
                  className="rounded-2xl bg-violet-600 px-6 py-4 text-center font-black text-white shadow-xl shadow-violet-500/30 transition hover:-translate-y-1 hover:bg-violet-500"
                >
                  Refresh Queue
                </button>

                <a
                  href="/discovery"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Open Discovery
                </a>

                <a
                  href="/corpus"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Open Corpus
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">
              Curation Analytics
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Live review status for prompts in the Curation
              queue.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <AnalyticsCard
                label="Queue"
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
                label="Approved"
                value={analytics.approved}
              />

              <AnalyticsCard
                label="Rejected"
                value={analytics.rejected}
              />

              <AnalyticsCard
                label="Risky"
                value={analytics.risky}
              />
            </div>
          </div>
        </div>

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
              placeholder="Search title, prompt, source, reason..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option value="all">All Categories</option>

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
              value={selectedReviewStatus}
              onChange={(event) =>
                setSelectedReviewStatus(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option value="all">All Reviews</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="risky">Risky</option>
            </select>

            <select
              value={selectedRisk}
              onChange={(event) =>
                setSelectedRisk(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-900 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Clear
            </button>
          </div>

          <p className="mt-4 text-right text-sm font-bold text-slate-500">
            {filteredItems.length} prompt
            {filteredItems.length === 1 ? "" : "s"} displayed
          </p>
        </div>

        {selectedPrompt && (
          <section className="mb-8 rounded-[2.5rem] border border-violet-400/30 bg-white/90 p-6 shadow-2xl shadow-violet-500/10 dark:bg-white/[0.06] sm:p-8">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-500">
                  Review Selected Prompt
                </div>

                <h2 className="text-3xl font-black">
                  {selectedPrompt.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeReview}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={submitReview}
              className="space-y-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-black">
                    Review Decision
                  </span>

                  <select
                    value={reviewForm.status}
                    onChange={(event) =>
                      updateReviewField(
                        "status",
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 font-bold outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="approved">
                      Approve
                    </option>

                    <option value="rejected">
                      Reject
                    </option>

                    <option value="risky">
                      Mark as Risky
                    </option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-black">
                    Risk Level
                  </span>

                  <select
                    value={reviewForm.riskLevel}
                    onChange={(event) =>
                      updateReviewField(
                        "riskLevel",
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 font-bold outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">
                      Medium
                    </option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-black">
                  Review Reason
                </span>

                <textarea
                  required
                  rows={5}
                  value={reviewForm.reviewReason}
                  onChange={(event) =>
                    updateReviewField(
                      "reviewReason",
                      event.target.value
                    )
                  }
                  placeholder="Explain why this prompt should be approved, rejected, or marked as risky..."
                  className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-medium leading-7 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-slate-950/60">
                <span className="font-black">
                  Reviewer status:
                </span>{" "}
                Internal team reviewer
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeReview}
                  className="rounded-2xl border border-slate-300 px-6 py-3 font-black transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-violet-600 px-6 py-3 font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Saving Review..."
                    : "Save Review"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-12 text-center shadow-xl dark:border-white/10 dark:bg-white/5">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-violet-500 dark:border-white/10 dark:border-t-violet-500" />

            <p className="mt-5 font-black text-slate-600 dark:text-slate-300">
              Loading Curation queue...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-xl dark:border-white/10 dark:bg-white/5">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-500/10 text-4xl">
              🧠
            </div>

            <h2 className="text-3xl font-black">
              No prompts in Curation
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Send a prompt from Discovery to Curation, or
              change the current filters.
            </p>

            <a
              href="/discovery"
              className="mt-6 inline-flex rounded-2xl bg-violet-600 px-6 py-3 font-black text-white transition hover:bg-violet-500"
            >
              Open Discovery
            </a>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredItems.map((item) => {
              const latestReview =
                item.curationReviews[0] ?? null;

              return (
                <article
                  key={item.id}
                  className="flex flex-col rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-violet-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
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

                        {latestReview ? (
                          <>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${getReviewStatusClasses(
                                latestReview.status
                              )}`}
                            >
                              {formatStatus(
                                latestReview.status
                              )}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${getRiskClasses(
                                latestReview.riskLevel
                              )}`}
                            >
                              {formatStatus(
                                latestReview.riskLevel
                              )}{" "}
                              Risk
                            </span>
                          </>
                        ) : (
                          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-600 dark:text-amber-300">
                            Awaiting Review
                          </span>
                        )}
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
                    <InfoCard
                      label="Target Model"
                      value={item.model}
                    />

                    <InfoCard
                      label="Discovery Status"
                      value={formatStatus(item.status)}
                    />
                  </div>

                  <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-words rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">
                    {item.prompt}
                  </pre>

                  {latestReview && (
                    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Latest Review Reason
                      </p>

                      <p className="mt-3 text-sm font-medium leading-7 text-slate-700 dark:text-slate-300">
                        {latestReview.reviewReason ||
                          "No reason provided."}
                      </p>

                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Reviewed{" "}
                        {formatDate(
                          latestReview.createdAt
                        )}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <button
                      type="button"
                      onClick={() =>
                        openReview(item, "approved")
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openReview(item, "rejected")
                      }
                      className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-rose-500"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openReview(item, "risky")
                      }
                      className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-amber-400"
                    >
                      Mark Risky
                    </button>

                    {latestReview && (
                      <button
                        type="button"
                        disabled={
                          deletingReviewId ===
                          latestReview.id
                        }
                        onClick={() =>
                          deleteReview(latestReview.id)
                        }
                        className="ml-auto rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300"
                      >
                        {deletingReviewId ===
                        latestReview.id
                          ? "Deleting..."
                          : "Delete Review"}
                      </button>
                    )}
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

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="text-sm font-bold">
        {value}
      </p>
    </div>
  );
}