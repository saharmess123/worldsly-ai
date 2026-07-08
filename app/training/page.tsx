"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type HistoryItem = {
  id: number;
  tool: string;
  output: string;
  createdAt: string;
};

type FeedbackItem = {
  id: number;
  rating: "useful" | "needs_work";
  originalPrompt: string;
  improvedPrompt: string;
  category: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  createdAt: string;
};

const trainingStages = [
  {
    title: "Prompt Collection",
    description:
      "Collects optimized prompts, curated library examples, and discovered high-performing prompt patterns.",
    icon: "📥",
    status: "Active",
  },
  {
    title: "Metadata Enrichment",
    description:
      "Adds category, model, score, use case, feedback rating, patterns, and output format.",
    icon: "🏷️",
    status: "MVP",
  },
  {
    title: "Preference Signals",
    description:
      "Uses thumbs up/down feedback to understand which prompt improvements are preferred.",
    icon: "👍",
    status: "Active",
  },
  {
    title: "Synthetic Data",
    description:
      "Generates additional training examples by creating weak prompt and improved prompt pairs.",
    icon: "🧪",
    status: "Planned",
  },
  {
    title: "PromptMaster Training",
    description:
      "Future model training layer for supervised fine-tuning and preference optimization.",
    icon: "🧠",
    status: "Planned",
  },
];

const modelSignals = [
  {
    name: "Role Definition",
    value: 92,
    description: "Prompts with a clear expert role usually produce stronger outputs.",
  },
  {
    name: "Context Enrichment",
    value: 88,
    description: "Adding missing context improves relevance and reduces generic answers.",
  },
  {
    name: "Output Formatting",
    value: 84,
    description: "Clear structure helps models produce cleaner and reusable results.",
  },
  {
    name: "Constraints",
    value: 79,
    description: "Constraints reduce vague, unsupported, or overly broad answers.",
  },
];

export default function TrainingPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const savedHistory = localStorage.getItem("worldsly_history");
    const savedFeedback = localStorage.getItem("wordsly_feedback");

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    if (savedFeedback) {
      setFeedback(JSON.parse(savedFeedback));
    }
  }, []);

  const usefulCount = feedback.filter((item) => item.rating === "useful").length;
  const needsWorkCount = feedback.filter(
    (item) => item.rating === "needs_work"
  ).length;

  const trainingExamples = history.filter((item) =>
    item.tool.toLowerCase().includes("prompt")
  );

  const datasetSize = trainingExamples.length + feedback.length;

  const preferenceScore =
    feedback.length === 0 ? 0 : Math.round((usefulCount / feedback.length) * 100);

  const trainingReadiness = Math.min(
    100,
    datasetSize * 8 + usefulCount * 6 + trainingExamples.length * 4
  );

  const filteredTrainingExamples = useMemo(() => {
    return trainingExamples.filter((item) => {
      const text = `${item.tool} ${item.output} ${item.createdAt}`;
      return text.toLowerCase().includes(search.toLowerCase());
    });
  }, [trainingExamples, search]);

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
                Intelligence & Training Layer
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Train PromptMaster from prompt patterns and feedback.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                This layer turns optimized prompts, curated examples, discovery
                patterns, and user feedback into structured training signals for
                a future self-improving prompt model.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Generate Training Example
                </a>

                <a
                  href="/feedback"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  View Feedback Signals
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Training Readiness</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              MVP preview of how close the platform is to having usable training
              data.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-400">
                  Dataset Readiness
                </p>
                <p className="font-black">{trainingReadiness}%</p>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${trainingReadiness}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Dataset</p>
                <h3 className="mt-2 text-4xl font-black">{datasetSize}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Preference</p>
                <h3 className="mt-2 text-4xl font-black">
                  {preferenceScore}%
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Useful</p>
                <h3 className="mt-2 text-4xl font-black text-emerald-300">
                  {usefulCount}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Needs Work</p>
                <h3 className="mt-2 text-4xl font-black text-red-300">
                  {needsWorkCount}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Training Examples", value: trainingExamples.length, icon: "📚" },
            { label: "Feedback Signals", value: feedback.length, icon: "🔁" },
            { label: "Useful Signals", value: usefulCount, icon: "👍" },
            { label: "Dataset Size", value: datasetSize, icon: "🧠" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                {stat.icon}
              </div>

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {stat.label}
              </p>

              <h2 className="mt-2 text-4xl font-black">{stat.value}</h2>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6">
              <h2 className="text-2xl font-black">Training Pipeline</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                How Wordsly will transform prompt examples into model
                improvement signals.
              </p>
            </div>

            <div className="space-y-5">
              {trainingStages.map((stage, index) => (
                <div
                  key={stage.title}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                        {stage.icon}
                      </div>

                      <div>
                        <h3 className="font-black">
                          {index + 1}. {stage.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                      {stage.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <h2 className="text-2xl font-black">Model Learning Signals</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Patterns that the future PromptMaster model should learn from.
              </p>

              <div className="mt-5 space-y-5">
                {modelSignals.map((signal) => (
                  <div
                    key={signal.name}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-black">{signal.name}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {signal.description}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-black text-emerald-500">
                        {signal.value}%
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${signal.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <h2 className="text-2xl font-black">Training Dataset Preview</h2>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search training examples..."
                className="mt-5 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />

              <div className="mt-5 max-h-[580px] space-y-4 overflow-auto pr-2">
                {filteredTrainingExamples.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-slate-950/60">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                      🧠
                    </div>

                    <h3 className="text-lg font-black">No training data yet</h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Optimize prompts and save them to history to create
                      training examples.
                    </p>

                    <a
                      href="/prompt-optimizer"
                      className="mt-5 inline-block rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-600"
                    >
                      Create Example
                    </a>
                  </div>
                ) : (
                  filteredTrainingExamples.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                          {item.tool}
                        </span>

                        <p className="text-xs font-bold text-slate-500">
                          {item.createdAt}
                        </p>
                      </div>

                      <p className="line-clamp-6 text-sm leading-7 text-slate-700 dark:text-slate-300">
                        {item.output}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}