"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type OptimizationResult = {
  success?: boolean;
  mode?: string;
  aiProvider?: string;
  storageMode?: string;
  engineStatus?: string;

  originalPrompt?: string;
  originalScore: number;
  improvedScore: number;
  scoreGain?: number;
  improvedPrompt: string;

  explanation: string[];
  variants: string[];
  patterns: string[];
  scoringNotes: string[];

  detectedCategory?: string;
  nextStep?: string;
};

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
  engineStatus: string;
  createdAt: string;
};

const categories = [
  "Marketing",
  "Coding",
  "Business",
  "Education",
  "Research",
  "Image Generation",
  "Video",
  "Agents",
  "Customer Support",
  "General",
];

const models = [
  "GPT-4.1 / GPT-5 style",
  "Claude style",
  "Gemini style",
  "Midjourney",
  "Stable Diffusion",
  "Coding Assistant",
  "Agent Workflow",
];

const optimizationGoals = [
  "More detailed",
  "More structured",
  "More creative",
  "More professional",
  "More concise",
  "Better reasoning",
  "Better output format",
];

const optimizationDepths = [
  "Basic",
  "Balanced",
  "Deep analysis",
  "Multi-variant premium",
];

const outputFormats = [
  "Detailed explanation",
  "Short explanation",
  "Prompt only",
  "Prompt + variants",
  "JSON format",
  "Agent YAML format",
];

function safeParseArray<T>(value: string | null): T[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatStorageMode(storageMode?: string) {
  if (storageMode === "sqlite_prisma_ready") return "SQLite + Prisma Ready";
  if (storageMode === "sqlite_prisma") return "SQLite + Prisma";
  if (storageMode === "mock_api") return "Mock API";
  return storageMode || "Not provided";
}

export default function PromptOptimizerPage() {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("General");
  const [model, setModel] = useState("GPT-4.1 / GPT-5 style");
  const [goal, setGoal] = useState("More structured");
  const [depth, setDepth] = useState("Balanced");
  const [outputFormat, setOutputFormat] = useState("Detailed explanation");
  const [personalStyle, setPersonalStyle] = useState("");
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<
    "useful" | "needs_work" | null
  >(null);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedModel = localStorage.getItem("worldsly_preferred_model");
    const savedDepth = localStorage.getItem("worldsly_optimization_depth");
    const savedGoal = localStorage.getItem("worldsly_default_goal");
    const savedFormat = localStorage.getItem("worldsly_output_format");
    const savedStyle = localStorage.getItem("worldsly_personal_style");

    if (savedModel) setModel(savedModel);
    if (savedDepth) setDepth(savedDepth);
    if (savedGoal) setGoal(savedGoal);
    if (savedFormat) setOutputFormat(savedFormat);
    if (savedStyle) setPersonalStyle(savedStyle);
  }, []);

  const resultLift = useMemo(() => {
    if (!result) return 0;
    return result.scoreGain ?? result.improvedScore - result.originalScore;
  }, [result]);

  async function optimizePrompt() {
    if (!prompt.trim()) {
      setError("Please enter a prompt first.");
      return;
    }

    try {
      setIsOptimizing(true);
      setError("");
      setCopied(false);
      setSaved(false);
      setFeedbackGiven(null);

      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          category,
          model,
          goal,
          depth,
          outputFormat,
          personalStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to optimize prompt.");
      }

      setResult(data);

      if (data.detectedCategory) {
        setCategory(data.detectedCategory);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while optimizing the prompt.";

      setError(message);
      setResult(null);
    } finally {
      setIsOptimizing(false);
    }
  }

  async function copyPrompt(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Copy failed. Please copy the text manually.");
    }
  }

  async function saveToHistory() {
    if (!result) return;

    try {
      setIsSavingHistory(true);
      setError("");

      const response = await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "Prompt Optimizer",
          originalPrompt: result.originalPrompt || prompt,
          output: result.improvedPrompt,
          category: result.detectedCategory || category,
          model,
          goal,
          depth,
          outputFormat,
          originalScore: result.originalScore,
          improvedScore: result.improvedScore,
          engineStatus: result.engineStatus || "mock_api",
          mode: result.mode || "mock",
          aiProvider: result.aiProvider || "mock",
          storageMode: result.storageMode || "sqlite_prisma_ready",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save history.");
      }

      const history = safeParseArray<HistoryItem>(
        localStorage.getItem("worldsly_history")
      );

      const newItem: HistoryItem = {
        id: Date.now(),
        tool: "Prompt Optimizer",
        output: result.improvedPrompt,
        createdAt: new Date().toLocaleString(),
      };

      localStorage.setItem(
        "worldsly_history",
        JSON.stringify([newItem, ...history])
      );

      setSaved(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "History API failed. Please try again.";

      setError(message);
    } finally {
      setIsSavingHistory(false);
    }
  }

  async function saveFeedback(rating: "useful" | "needs_work") {
    if (!result) return;

    try {
      setIsSavingFeedback(true);
      setError("");

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          originalPrompt: result.originalPrompt || prompt,
          improvedPrompt: result.improvedPrompt,
          category: result.detectedCategory || category,
          model,
          goal,
          depth,
          outputFormat,
          engineStatus: result.engineStatus || "mock_api",
          mode: result.mode || "mock",
          aiProvider: result.aiProvider || "mock",
          storageMode: result.storageMode || "sqlite_prisma_ready",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save feedback.");
      }

      const feedback = safeParseArray<FeedbackItem>(
        localStorage.getItem("wordsly_feedback")
      );

      const newFeedback: FeedbackItem = {
        id: Date.now(),
        rating,
        originalPrompt: result.originalPrompt || prompt,
        improvedPrompt: result.improvedPrompt,
        category: result.detectedCategory || category,
        model,
        goal,
        depth,
        outputFormat,
        engineStatus: result.engineStatus || "mock_api",
        createdAt: new Date().toLocaleString(),
      };

      localStorage.setItem(
        "wordsly_feedback",
        JSON.stringify([newFeedback, ...feedback])
      );

      setFeedbackGiven(rating);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Feedback API failed. Please try again.";

      setError(message);
    } finally {
      setIsSavingFeedback(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-160px] top-[-140px] h-[480px] w-[480px] rounded-full bg-blue-500/25 blur-[130px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[30%] h-[460px] w-[460px] rounded-full bg-cyan-400/20 blur-[130px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                Prompt Intelligence Engine
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Turn average prompts into high-performing prompts.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Paste any prompt and Wordsly will call the optimizer API,
                analyze it, score it, improve it, explain the changes, and
                generate stronger prompt variants using your saved preferences.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  { label: "Optimize API", value: "/api/optimize", icon: "🔌" },
                  { label: "History API", value: "/api/history", icon: "🗂️" },
                  { label: "Feedback API", value: "/api/feedback", icon: "💬" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <div className="mb-3 text-3xl">{item.icon}</div>
                    <h3 className="font-black">{item.label}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Current Preferences</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Loaded from Settings.
                </p>
              </div>

              <a
                href="/settings"
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-blue-300 hover:bg-white/20"
              >
                Edit
              </a>
            </div>

            <div className="space-y-4">
              {[
                { label: "Model", value: model },
                { label: "Depth", value: depth },
                { label: "Goal", value: goal },
                { label: "Format", value: outputFormat },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-white/10 p-5"
                >
                  <p className="text-sm font-bold text-slate-400">
                    {item.label}
                  </p>
                  <h3 className="mt-2 text-xl font-black">{item.value}</h3>
                </div>
              ))}
            </div>

            {result && (
              <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Score Improvement
                </p>
                <h3 className="mt-2 text-4xl font-black text-emerald-300">
                  +{resultLift} pts
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Engine: {result.engineStatus || "mock_api"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Mode: {result.mode || "mock"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Provider: {result.aiProvider || "mock"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Storage: {formatStorageMode(result.storageMode)}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Detected use case: {result.detectedCategory || category}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <h2 className="text-2xl font-black">Optimize Prompt</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              This page sends your request to the backend optimizer route and
              can save the result to SQLite history.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black">
                  Original Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: Create a futuristic hero image for Wordsly.Ai..."
                  className="min-h-[190px] w-full resize-none rounded-3xl border border-slate-300 bg-white p-5 text-sm leading-7 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Use Case
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Target Model
                </label>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  {models.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Optimization Goal
                </label>
                <select
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  {optimizationGoals.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Optimization Depth
                </label>
                <select
                  value={depth}
                  onChange={(event) => setDepth(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  {optimizationDepths.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Output Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(event) => setOutputFormat(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  {outputFormats.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              {personalStyle && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-bold text-blue-500">
                  Personal style loaded from Settings.
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-500">
                  {error}
                </div>
              )}

              <button
                onClick={optimizePrompt}
                disabled={isOptimizing}
                className="w-full rounded-2xl bg-blue-500 px-6 py-4 font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isOptimizing ? "Optimizing with API..." : "Optimize Prompt"}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6">
              <h2 className="text-2xl font-black">Optimization Result</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Score, improved prompt, variants, and intelligence patterns.
              </p>
            </div>

            {!result ? (
              <div className="flex min-h-[600px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-slate-950/60">
                <div>
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
                    🧠
                  </div>
                  <h3 className="text-xl font-black">
                    No prompt optimized yet
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Paste a prompt and click optimize to call the API engine.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
                    <p className="text-sm font-black text-red-500">
                      Original Quality
                    </p>
                    <h3 className="mt-2 text-5xl font-black">
                      {result.originalScore}%
                    </h3>
                    <p className="mt-1 text-xs font-black text-red-400">
                      Out of 100
                    </p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-red-500/10">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${result.originalScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                    <p className="text-sm font-black text-emerald-500">
                      Improved Quality
                    </p>
                    <h3 className="mt-2 text-5xl font-black">
                      {result.improvedScore}%
                    </h3>
                    <p className="mt-1 text-xs font-black text-emerald-400">
                      Out of 100
                    </p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-500/10">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${result.improvedScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                    <p className="text-sm font-black text-blue-500">
                      Score Gain
                    </p>
                    <h3 className="mt-2 text-5xl font-black">
                      +{resultLift} pts
                    </h3>
                    <p className="mt-1 text-xs font-black text-blue-400">
                      Improvement lift
                    </p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-blue-500/10">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.min(resultLift * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                  <h3 className="text-xl font-black text-blue-700 dark:text-blue-300">
                    API Engine Status
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                      {
                        label: "Engine",
                        value: result.engineStatus || "mock_api",
                      },
                      {
                        label: "Mode",
                        value: result.mode || "mock",
                      },
                      {
                        label: "AI Provider",
                        value: result.aiProvider || "mock",
                      },
                      {
                        label: "Storage",
                        value: formatStorageMode(result.storageMode),
                      },
                      {
                        label: "Detected Category",
                        value: result.detectedCategory || category,
                      },
                      {
                        label: "History Target",
                        value: "/api/history",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-blue-500/20 bg-white/60 p-4 dark:bg-slate-950/40"
                      >
                        <p className="text-xs font-black text-blue-500">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                  <h3 className="text-xl font-black text-blue-700 dark:text-blue-300">
                    How Scoring Works
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    Scores are calculated out of 100 by the optimizer API. The
                    original score checks clarity, context, structure,
                    constraints, and use-case signals. The improved score adds
                    optimization depth, category-specific improvements, output
                    format quality, and goal alignment.
                  </p>

                  <div className="mt-4 grid gap-3">
                    {result.scoringNotes.map((note) => (
                      <div
                        key={note}
                        className="rounded-2xl border border-blue-500/20 bg-white/60 p-4 text-sm font-bold leading-6 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h3 className="text-xl font-black">Improved Prompt</h3>

                    <button
                      onClick={() => copyPrompt(result.improvedPrompt)}
                      className="rounded-full bg-blue-500 px-4 py-2 text-xs font-black text-white hover:bg-blue-600"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <pre className="max-h-[720px] overflow-auto whitespace-pre-wrap rounded-3xl bg-white p-5 text-sm leading-7 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    {result.improvedPrompt}
                  </pre>

                  <button
                    onClick={saveToHistory}
                    disabled={isSavingHistory || saved}
                    className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    {isSavingHistory
                      ? "Saving..."
                      : saved
                        ? "Saved to SQLite History"
                        : "Save Optimization"}
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                  <h3 className="text-xl font-black">Why It Works Better</h3>

                  <div className="mt-4 space-y-3">
                    {result.explanation.map((item) => (
                      <div key={item} className="flex gap-3">
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                          ✓
                        </span>
                        <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                  <h3 className="text-xl font-black">
                    Prompt Intelligence Patterns
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {result.patterns.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                  <h3 className="text-xl font-black">Optimized Variants</h3>

                  <div className="mt-4 space-y-4">
                    {result.variants.map((variant, index) => (
                      <div
                        key={variant}
                        className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-black">Variant {index + 1}</h4>

                          <button
                            onClick={() => copyPrompt(variant)}
                            className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500"
                          >
                            Copy
                          </button>
                        </div>

                        <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
                          {variant}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                  <h3 className="text-xl font-black">Feedback Loop</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Feedback is saved through the feedback API and will become a
                    training signal for PromptMaster later.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => saveFeedback("useful")}
                      disabled={isSavingFeedback}
                      className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {isSavingFeedback
                        ? "Saving..."
                        : feedbackGiven === "useful"
                          ? "👍 Feedback Saved"
                          : "👍 Useful"}
                    </button>

                    <button
                      onClick={() => saveFeedback("needs_work")}
                      disabled={isSavingFeedback}
                      className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {isSavingFeedback
                        ? "Saving..."
                        : feedbackGiven === "needs_work"
                          ? "👎 Feedback Saved"
                          : "👎 Needs Work"}
                    </button>
                  </div>

                  {feedbackGiven && (
                    <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                      <p className="text-sm font-bold text-blue-500">
                        Feedback saved through the API. Later this becomes part
                        of the real training loop.
                      </p>
                    </div>
                  )}
                </div>

                {result.nextStep && (
                  <div className="rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-5">
                    <h3 className="text-xl font-black text-fuchsia-500">
                      Next Backend Step
                    </h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
                      {result.nextStep}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}