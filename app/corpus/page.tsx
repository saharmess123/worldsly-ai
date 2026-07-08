"use client";

import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type CorpusItem = {
  id: number;
  title: string;
  category: string;
  sourceType: string;
  model: string;
  approvedAt: string;
  qualityScore: number;
  originalityScore: number;
  structureScore: number;
  usageCount: number;
  trainingReady: boolean;
  prompt: string;
  improvedVersion: string;
  patterns: string[];
};

const corpusItems: CorpusItem[] = [
  {
    id: 1,
    title: "Expert Role + Output Format Prompt",
    category: "General",
    sourceType: "Community",
    model: "GPT-style",
    approvedAt: "Today",
    qualityScore: 92,
    originalityScore: 76,
    structureScore: 94,
    usageCount: 148,
    trainingReady: true,
    prompt:
      "Act as a senior expert in the topic. Ask clarifying questions if needed, explain your assumptions, then provide a structured answer with examples and practical next steps.",
    improvedVersion:
      "Act as a senior expert in the requested topic. First identify any missing context. If the answer depends on assumptions, state them clearly. Then provide a structured response with examples, practical steps, risks, and a final recommendation.",
    patterns: [
      "Expert role",
      "Clarifying questions",
      "Assumptions",
      "Structured output",
      "Examples",
    ],
  },
  {
    id: 2,
    title: "Code Debugging Assistant",
    category: "Coding",
    sourceType: "Developer",
    model: "Coding Assistant",
    approvedAt: "Yesterday",
    qualityScore: 90,
    originalityScore: 73,
    structureScore: 89,
    usageCount: 96,
    trainingReady: true,
    prompt:
      "Analyze this code, identify the likely bug, explain the cause, suggest a fix, and provide a safer improved version with comments.",
    improvedVersion:
      "Review the code carefully. Identify the most likely bug, explain why it happens, show the corrected code, and include a short explanation of how the fix improves reliability, readability, or safety.",
    patterns: [
      "Bug analysis",
      "Root cause",
      "Corrected code",
      "Code comments",
      "Reliability",
    ],
  },
  {
    id: 3,
    title: "Research Summary Framework",
    category: "Research",
    sourceType: "Research",
    model: "Claude style",
    approvedAt: "2 days ago",
    qualityScore: 88,
    originalityScore: 71,
    structureScore: 91,
    usageCount: 74,
    trainingReady: true,
    prompt:
      "Summarize this paper by objective, methodology, dataset, findings, limitations, assumptions, and practical implications.",
    improvedVersion:
      "Summarize the research paper using the following sections: objective, research question, methodology, dataset, key findings, limitations, assumptions, practical implications, and possible future work.",
    patterns: [
      "Objective",
      "Methodology",
      "Dataset",
      "Limitations",
      "Implications",
    ],
  },
  {
    id: 4,
    title: "Marketing Hook Generator",
    category: "Marketing",
    sourceType: "Social",
    model: "GPT-style",
    approvedAt: "Today",
    qualityScore: 84,
    originalityScore: 68,
    structureScore: 81,
    usageCount: 121,
    trainingReady: false,
    prompt:
      "Generate 20 short hooks for this product. Use curiosity, pain point, transformation, authority, social proof, and urgency angles.",
    improvedVersion:
      "Generate 20 short marketing hooks for the product. Group them by angle: curiosity, pain point, transformation, authority, social proof, urgency, and objection handling. Keep each hook under 15 words.",
    patterns: [
      "Hook angles",
      "Pain point",
      "Transformation",
      "Social proof",
      "Urgency",
    ],
  },
  {
    id: 5,
    title: "AI Tutor Prompt",
    category: "Education",
    sourceType: "Community",
    model: "GPT-style",
    approvedAt: "3 days ago",
    qualityScore: 86,
    originalityScore: 70,
    structureScore: 88,
    usageCount: 63,
    trainingReady: true,
    prompt:
      "Teach me this topic step by step. Start simple, then increase difficulty, and quiz me at the end.",
    improvedVersion:
      "Teach the topic step by step. Start with a simple explanation, then add examples, common mistakes, a slightly harder version, and a short quiz with answers at the end.",
    patterns: [
      "Step-by-step teaching",
      "Examples",
      "Difficulty progression",
      "Quiz",
      "Answers",
    ],
  },
];

const categories = [
  "All",
  "General",
  "Coding",
  "Research",
  "Marketing",
  "Education",
];

const trainingFilters = ["All", "Training Ready", "Needs Review"];

export default function CorpusPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [trainingFilter, setTrainingFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const totalPrompts = corpusItems.length;
  const trainingReadyCount = corpusItems.filter(
    (item) => item.trainingReady
  ).length;

  const averageQuality = Math.round(
    corpusItems.reduce((sum, item) => sum + item.qualityScore, 0) /
      corpusItems.length
  );

  const totalUsage = corpusItems.reduce((sum, item) => sum + item.usageCount, 0);

  const filteredCorpus = useMemo(() => {
    return corpusItems.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;

      const matchesTraining =
        trainingFilter === "All" ||
        (trainingFilter === "Training Ready" && item.trainingReady) ||
        (trainingFilter === "Needs Review" && !item.trainingReady);

      const searchText = `
        ${item.title}
        ${item.category}
        ${item.sourceType}
        ${item.model}
        ${item.prompt}
        ${item.improvedVersion}
        ${item.patterns.join(" ")}
      `.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesCategory && matchesTraining && matchesSearch;
    });
  }, [search, category, trainingFilter]);

  async function copyText(id: number, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }

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
                Prompt Corpus
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Store approved prompts as training-ready intelligence.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                The corpus is where approved prompts become organized knowledge.
                Wordsly uses this layer to compare patterns, improve prompts,
                and prepare high-quality examples for future training.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/curation"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Open Curation
                </a>

                <a
                  href="/optimizer"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  Open Optimizer
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Corpus Analytics</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              The approved prompt memory layer behind the product.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Prompts</p>
                <h3 className="mt-2 text-4xl font-black">{totalPrompts}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Avg Quality</p>
                <h3 className="mt-2 text-4xl font-black">{averageQuality}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Training Ready
                </p>
                <h3 className="mt-2 text-4xl font-black text-emerald-300">
                  {trainingReadyCount}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Usage</p>
                <h3 className="mt-2 text-4xl font-black text-blue-300">
                  {totalUsage}
                </h3>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Corpus purpose
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                The corpus stores only curated prompts, improved versions, and
                reusable patterns. This makes Wordsly smarter over time.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search corpus by title, category, prompt, pattern..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={trainingFilter}
              onChange={(event) => setTrainingFilter(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {trainingFilters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredCorpus.map((item) => (
            <div
              key={item.id}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                      {item.category}
                    </span>

                    <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-black text-fuchsia-500">
                      {item.sourceType}
                    </span>

                    <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-500 dark:text-slate-300">
                      {item.model}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        item.trainingReady
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {item.trainingReady
                        ? "Training Ready"
                        : "Needs Review"}
                    </span>
                  </div>

                  <h2 className="text-3xl font-black">{item.title}</h2>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Approved {item.approvedAt} · Used {item.usageCount} times
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Quality", value: item.qualityScore },
                    { label: "Originality", value: item.originalityScore },
                    { label: "Structure", value: item.structureScore },
                  ].map((score) => (
                    <div
                      key={score.label}
                      className="rounded-3xl bg-slate-950 p-4 text-center text-white dark:bg-white dark:text-slate-950"
                    >
                      <p className="text-xs font-black">{score.label}</p>
                      <p className="mt-1 text-3xl font-black">{score.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-black">Original Prompt</h3>

                    <button
                      onClick={() => copyText(item.id, item.prompt)}
                      className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                    >
                      {copiedId === item.id ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
                    {item.prompt}
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-black text-blue-600 dark:text-blue-300">
                      Improved Version
                    </h3>

                    <button
                      onClick={() => copyText(item.id, item.improvedVersion)}
                      className="rounded-full bg-blue-500 px-4 py-2 text-xs font-black text-white hover:bg-blue-600"
                    >
                      {copiedId === item.id ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {item.improvedVersion}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="font-black">Reusable Intelligence Patterns</h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.patterns.map((pattern) => (
                    <span
                      key={pattern}
                      className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-500"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCorpus.length === 0 && (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
              📚
            </div>

            <h2 className="text-3xl font-black">No corpus item found</h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Try changing the search, category, or training filter.
            </p>
          </div>
        )}

        <div className="mt-10 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            The corpus is where Wordsly starts becoming intelligent.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Every approved prompt adds useful structure, reusable patterns, and
            examples that can improve future prompt optimization.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/optimizer"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Open Optimizer
            </a>

            <a
              href="/training"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              Training Layer
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}