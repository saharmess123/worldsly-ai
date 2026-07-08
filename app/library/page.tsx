"use client";

import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type LibraryPrompt = {
  id: number;
  title: string;
  category: string;
  model: string;
  sourceType: string;
  score: number;
  description: string;
  prompt: string;
  patterns: string[];
};

type HistoryItem = {
  id: number;
  tool: string;
  output: string;
  createdAt: string;
};

const prompts: LibraryPrompt[] = [
  {
    id: 1,
    title: "Expert Role Prompt",
    category: "General",
    model: "GPT / Claude / Gemini",
    sourceType: "Curated Pattern",
    score: 94,
    description:
      "A strong reusable structure that gives the AI a clear role, task, context, and output format.",
    prompt: `Act as a senior expert in [FIELD].

Your task is to help me with the following goal:

[DESCRIBE YOUR GOAL]

Before answering, analyze the context, missing information, constraints, and best possible approach.

Structure your answer with:
1. Clear explanation
2. Step-by-step guidance
3. Practical examples
4. Final recommendation

Requirements:
- Be specific
- Avoid generic advice
- Explain assumptions
- Use a professional tone`,
    patterns: ["Role Definition", "Context", "Structure", "Constraints"],
  },
  {
    id: 2,
    title: "Marketing Campaign Prompt",
    category: "Marketing",
    model: "GPT / Claude",
    sourceType: "High-Performing Template",
    score: 91,
    description:
      "Designed for product launches, ads, social media campaigns, and brand positioning.",
    prompt: `Act as a senior marketing strategist.

I am launching the following product/service:

[PRODUCT DETAILS]

Target audience:
[AUDIENCE]

Main problem it solves:
[PROBLEM]

Create a complete marketing campaign including:
- Positioning
- Main message
- 5 hooks
- Social media post
- Email announcement
- Call to action
- Content ideas for 7 days

Tone:
[PROFESSIONAL / FUN / LUXURY / FRIENDLY]

Make the campaign clear, persuasive, and practical.`,
    patterns: ["Audience", "Problem-Solution", "Hooks", "CTA"],
  },
  {
    id: 3,
    title: "Code Debugging Prompt",
    category: "Coding",
    model: "Coding Assistant",
    sourceType: "Developer Pattern",
    score: 89,
    description:
      "Helps the AI debug code with context, error logs, expected behavior, and clear constraints.",
    prompt: `Act as a senior software engineer.

I need help debugging this code.

Context:
[WHAT THE CODE SHOULD DO]

Code:
[PASTE CODE]

Error message:
[PASTE ERROR]

Expected behavior:
[WHAT SHOULD HAPPEN]

Please:
1. Identify the likely cause
2. Explain the issue simply
3. Provide the corrected code
4. Explain what changed
5. Suggest how to avoid this issue later

Do not rewrite unrelated parts of the code unless necessary.`,
    patterns: ["Context", "Error Details", "Expected Output", "Constraints"],
  },
  {
    id: 4,
    title: "Research Summary Prompt",
    category: "Research",
    model: "GPT / Claude / Gemini",
    sourceType: "Academic Pattern",
    score: 87,
    description:
      "Useful for summarizing articles, reports, papers, or complex documents clearly.",
    prompt: `Act as a research analyst.

Summarize the following content:

[PASTE CONTENT]

Please structure the summary as:
1. Main idea
2. Key arguments
3. Important evidence
4. Strengths
5. Weaknesses or limitations
6. Practical implications
7. Final conclusion

Requirements:
- Keep the summary accurate
- Do not invent information
- Separate facts from interpretation
- Use clear language`,
    patterns: ["Structure", "Accuracy", "Evidence", "Limitations"],
  },
  {
    id: 5,
    title: "Image Generation Prompt",
    category: "Image Generation",
    model: "Midjourney / Stable Diffusion",
    sourceType: "Visual Prompt Pattern",
    score: 90,
    description:
      "Creates detailed image prompts with subject, lighting, mood, style, composition, and quality details.",
    prompt: `Create a highly detailed image generation prompt.

Subject:
[MAIN SUBJECT]

Scene:
[ENVIRONMENT]

Style:
[REALISTIC / CINEMATIC / ANIME / 3D / PRODUCT RENDER]

Lighting:
[SOFT / DRAMATIC / NEON / NATURAL]

Mood:
[CALM / FUTURISTIC / LUXURY / DARK / DREAMY]

Composition:
[CLOSE-UP / WIDE SHOT / CENTERED / DYNAMIC ANGLE]

Add:
- Rich visual details
- Camera perspective
- Color palette
- Texture
- High-quality rendering details

Avoid:
[THINGS TO AVOID]`,
    patterns: ["Visual Detail", "Style", "Lighting", "Composition"],
  },
  {
    id: 6,
    title: "Agent Workflow Prompt",
    category: "Agents",
    model: "Agent Workflow",
    sourceType: "Agent Pattern",
    score: 92,
    description:
      "Builds structured agent instructions with goal, tools, steps, memory, and output rules.",
    prompt: `You are an autonomous AI agent.

Goal:
[DEFINE THE GOAL]

Available tools:
[LIST TOOLS]

Context:
[ADD BACKGROUND]

Follow this process:
1. Understand the goal
2. Break it into smaller tasks
3. Choose the right tool for each step
4. Execute carefully
5. Check the result
6. Report the final output

Rules:
- Ask for clarification only when necessary
- Do not make unsupported assumptions
- Keep track of completed steps
- Provide a clear final summary`,
    patterns: ["Agent Role", "Steps", "Tool Use", "Validation"],
  },
];

const categories = [
  "All",
  "General",
  "Marketing",
  "Coding",
  "Research",
  "Image Generation",
  "Agents",
];

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.patterns.join(" ").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  async function copyPrompt(prompt: string, id: number) {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }

  function savePrompt(item: LibraryPrompt) {
    const savedHistory = localStorage.getItem("worldsly_history");
    const history: HistoryItem[] = savedHistory ? JSON.parse(savedHistory) : [];

    const newItem: HistoryItem = {
      id: Date.now(),
      tool: "Prompt Library",
      output: item.prompt,
      createdAt: new Date().toLocaleString(),
    };

    localStorage.setItem(
      "worldsly_history",
      JSON.stringify([newItem, ...history])
    );

    setSavedId(item.id);

    setTimeout(() => {
      setSavedId(null);
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

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                Curated Prompt Intelligence Library
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Explore high-quality prompt patterns.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Browse reusable prompt structures scored by quality, use case,
                model compatibility, and prompt engineering patterns.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Optimize Your Prompt
                </a>

                <a
                  href="/dashboard"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  View Dashboard
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Library Intelligence</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Each prompt is organized with patterns, use cases, model style,
              and a quality score.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Prompts</p>
                <h3 className="mt-2 text-4xl font-black">{prompts.length}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Categories</p>
                <h3 className="mt-2 text-4xl font-black">
                  {categories.length - 1}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Avg Score</p>
                <h3 className="mt-2 text-4xl font-black">90%</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Mode</p>
                <h3 className="mt-2 text-4xl font-black">MVP</h3>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">Next Upgrade</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Later this library will be powered by live discovery, ranking,
                user feedback, and AI-based prompt scoring.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by category, pattern, use case..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setSelectedCategory(item)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                    selectedCategory === item
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/10"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {filteredPrompts.map((item) => (
            <div
              key={item.id}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                      {item.category}
                    </span>

                    <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-black text-fuchsia-500">
                      {item.sourceType}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black">{item.title}</h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0 rounded-3xl bg-emerald-500/10 p-4 text-center">
                  <p className="text-xs font-black text-emerald-500">Score</p>
                  <p className="mt-1 text-3xl font-black text-emerald-500">
                    {item.score}
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <p className="mb-2 text-xs font-black text-slate-500">
                  MODEL COMPATIBILITY
                </p>
                <p className="text-sm font-bold">{item.model}</p>
              </div>

              <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">
                {item.prompt}
              </pre>

              <div className="mt-5 flex flex-wrap gap-2">
                {item.patterns.map((pattern) => (
                  <span
                    key={pattern}
                    className="rounded-full bg-slate-200 px-3 py-2 text-xs font-black text-slate-700 dark:bg-white/10 dark:text-slate-300"
                  >
                    {pattern}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => copyPrompt(item.prompt, item.id)}
                  className="flex-1 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  {copiedId === item.id ? "Copied" : "Copy Prompt"}
                </button>

                <button
                  onClick={() => savePrompt(item)}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:-translate-y-1 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {savedId === item.id ? "Saved" : "Save to History"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
              🔎
            </div>

            <h2 className="text-2xl font-black">No prompts found</h2>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Try another category or search keyword.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}