"use client";

import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type OptimizationMode = "Balanced" | "Creative" | "Technical" | "Marketing";

const samplePatterns = [
  "Role definition",
  "Clear objective",
  "Output format",
  "Context fields",
  "Constraints",
  "Examples",
  "Quality checklist",
  "Step-by-step reasoning",
];

const modeDescriptions: Record<OptimizationMode, string> = {
  Balanced:
    "Improves clarity, structure, and usefulness while keeping the original intent.",
  Creative:
    "Adds stronger ideas, angles, examples, and more expressive output direction.",
  Technical:
    "Makes the prompt more precise, structured, testable, and implementation-ready.",
  Marketing:
    "Improves persuasion, hooks, audience targeting, positioning, and conversion angles.",
};

function buildOptimizedPrompt(input: string, mode: OptimizationMode) {
  const cleanInput = input.trim();

  if (!cleanInput) {
    return "";
  }

  const modeInstruction =
    mode === "Creative"
      ? "Use creative angles, examples, and fresh variations."
      : mode === "Technical"
        ? "Be precise, structured, practical, and implementation-focused."
        : mode === "Marketing"
          ? "Focus on audience, value proposition, persuasion, hooks, and conversion."
          : "Improve clarity, structure, and usefulness while preserving the original intent.";

  return `Act as an expert prompt engineer.

Your task is to improve the following prompt so it produces clearer, more useful, and higher-quality AI outputs.

Original prompt:
"${cleanInput}"

Optimization style:
${mode}

Instructions:
1. Preserve the user's original goal.
2. Add missing context fields the user should provide.
3. Define the ideal role for the AI.
4. Specify the desired output format.
5. Add useful constraints and quality rules.
6. Include examples or options when helpful.
7. ${modeInstruction}

Return your answer in this structure:
- Improved Prompt
- Why It Is Better
- Suggested Inputs To Add
- Best Use Case`;
}

export default function OptimizerPage() {
  const [inputPrompt, setInputPrompt] = useState(
    "Write a good marketing post for my AI product."
  );
  const [mode, setMode] = useState<OptimizationMode>("Balanced");
  const [copied, setCopied] = useState(false);

  const optimizedPrompt = useMemo(() => {
    return buildOptimizedPrompt(inputPrompt, mode);
  }, [inputPrompt, mode]);

  const strengthScore = useMemo(() => {
    if (!inputPrompt.trim()) return 0;

    const base = 55;
    const lengthBonus = Math.min(inputPrompt.length / 6, 25);
    const modeBonus = mode === "Balanced" ? 10 : 15;

    return Math.min(Math.round(base + lengthBonus + modeBonus), 96);
  }, [inputPrompt, mode]);

  async function copyOptimizedPrompt() {
    if (!optimizedPrompt) return;

    await navigator.clipboard.writeText(optimizedPrompt);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
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
                Prompt Optimizer
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Turn weak prompts into stronger AI instructions.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Wordsly uses patterns from the approved corpus to rewrite basic
                prompts into clearer, richer, and more reliable instructions.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/corpus"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  View Corpus
                </a>

                <a
                  href="/feedback"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  Feedback Loop
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Optimization Engine</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              A simulation of how Wordsly improves prompts using corpus
              patterns.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Current Strength
              </p>

              <h3 className="mt-2 text-5xl font-black text-blue-300">
                {strengthScore}
              </h3>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-400"
                  style={{ width: `${strengthScore}%` }}
                />
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Selected Mode
              </p>

              <h3 className="mt-2 text-3xl font-black">{mode}</h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                {modeDescriptions[mode]}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <h2 className="text-2xl font-black">Original Prompt</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Enter a basic prompt. Wordsly will rewrite it into a stronger
              version using prompt intelligence patterns.
            </p>

            <textarea
              value={inputPrompt}
              onChange={(event) => setInputPrompt(event.target.value)}
              rows={10}
              placeholder="Paste your prompt here..."
              className="mt-5 w-full resize-none rounded-3xl border border-slate-300 bg-white p-5 text-sm font-semibold leading-7 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <div className="mt-5">
              <h3 className="font-black">Optimization Mode</h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(["Balanced", "Creative", "Technical", "Marketing"] as const).map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setMode(item)}
                      className={`rounded-2xl border px-5 py-4 text-left text-sm font-black transition hover:-translate-y-1 ${
                        mode === item
                          ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-500/50 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
              <h3 className="font-black">Detected Corpus Patterns</h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {samplePatterns.map((pattern) => (
                  <span
                    key={pattern}
                    className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-black text-fuchsia-500"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-blue-500/20 bg-blue-500/10 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-2xl">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black text-blue-700 dark:text-blue-300">
                  Optimized Prompt
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  This is the improved prompt generated from the original input.
                </p>
              </div>

              <button
                onClick={copyOptimizedPrompt}
                disabled={!optimizedPrompt}
                className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="min-h-[520px] whitespace-pre-wrap rounded-3xl border border-blue-500/20 bg-white/80 p-6 text-sm font-semibold leading-7 text-slate-800 shadow-inner dark:bg-slate-950/70 dark:text-slate-200">
              {optimizedPrompt || "Your optimized prompt will appear here."}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            Optimization is where the user feels the magic.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Discovery and corpus build the intelligence. The optimizer turns
            that intelligence into a useful product experience.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/feedback"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Feedback Loop
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