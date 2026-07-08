"use client";

import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type DiscoveredPrompt = {
  id: number;
  title: string;
  source: string;
  category: string;
  model: string;
  engagement: string;
  qualityScore: number;
  reason: string;
  prompt: string;
  patterns: string[];
};

type HistoryItem = {
  id: number;
  tool: string;
  output: string;
  createdAt: string;
};

const discoveredPrompts: DiscoveredPrompt[] = [
  {
    id: 1,
    title: "Senior Expert Role Framework",
    source: "Prompt Community",
    category: "General",
    model: "GPT / Claude / Gemini",
    engagement: "High reuse",
    qualityScore: 94,
    reason:
      "Strong role definition, clear task structure, constraints, and reusable output format.",
    prompt: `Act as a senior expert in [FIELD].

Help me achieve this goal:
[GOAL]

Before answering:
- Identify missing context
- Clarify assumptions
- Choose the best approach
- Structure the answer clearly

Output format:
1. Objective
2. Analysis
3. Step-by-step solution
4. Examples
5. Final recommendation

Requirements:
- Be specific
- Avoid vague advice
- Use practical examples
- Keep the answer actionable`,
    patterns: ["Role Definition", "Output Format", "Constraints", "Examples"],
  },
  {
    id: 2,
    title: "Viral Hook Generator",
    source: "X / Creator Threads",
    category: "Marketing",
    model: "GPT / Claude",
    engagement: "Strong engagement",
    qualityScore: 91,
    reason:
      "Uses audience, pain point, benefit, curiosity, and CTA to generate stronger marketing hooks.",
    prompt: `Act as a viral content strategist.

Product or topic:
[TOPIC]

Target audience:
[AUDIENCE]

Main pain point:
[PAIN POINT]

Generate:
- 10 curiosity-driven hooks
- 5 problem-solution hooks
- 5 bold opinion hooks
- 5 short punchy hooks
- 3 CTA variations

Rules:
- Make hooks specific
- Avoid generic marketing language
- Use clear benefit-driven wording
- Keep each hook under 18 words`,
    patterns: ["Audience", "Pain Point", "Hooks", "CTA"],
  },
  {
    id: 3,
    title: "Code Review Assistant",
    source: "GitHub / Developer Forums",
    category: "Coding",
    model: "Coding Assistant",
    engagement: "Developer approved",
    qualityScore: 89,
    reason:
      "Provides context, expected behavior, code review steps, and prevents unrelated rewrites.",
    prompt: `Act as a senior software engineer reviewing my code.

Context:
[WHAT THE CODE DOES]

Code:
[PASTE CODE]

Please review for:
1. Bugs
2. Security issues
3. Performance problems
4. Readability
5. Architecture improvements

Then provide:
- Main issues found
- Corrected code if needed
- Explanation of changes
- Best practices to improve it

Rules:
- Do not rewrite unrelated code
- Explain simply
- Prioritize critical issues first`,
    patterns: ["Context", "Review Criteria", "Prioritization", "Constraints"],
  },
  {
    id: 4,
    title: "Research Paper Analyzer",
    source: "Research / Academic Blogs",
    category: "Research",
    model: "GPT / Claude / Gemini",
    engagement: "High accuracy",
    qualityScore: 88,
    reason:
      "Forces the model to separate summary, evidence, limitations, and interpretation.",
    prompt: `Act as a research analyst.

Analyze the following paper or article:
[PASTE TEXT]

Structure your answer:
1. Research question
2. Main thesis
3. Methodology
4. Key findings
5. Evidence used
6. Limitations
7. Practical implications
8. Final summary

Rules:
- Do not invent missing information
- Separate facts from interpretation
- Explain technical terms simply
- Mention uncertainty when needed`,
    patterns: ["Accuracy", "Evidence", "Limitations", "Structure"],
  },
  {
    id: 5,
    title: "Image Prompt Composer",
    source: "Image Prompt Communities",
    category: "Image Generation",
    model: "Midjourney / Stable Diffusion",
    engagement: "Popular visual format",
    qualityScore: 92,
    reason:
      "Combines subject, camera, lighting, mood, composition, and negative constraints.",
    prompt: `Create an image generation prompt.

Subject:
[SUBJECT]

Environment:
[SCENE]

Style:
[STYLE]

Camera:
[CAMERA ANGLE / LENS]

Lighting:
[LIGHTING]

Mood:
[MOOD]

Details to include:
- Texture
- Color palette
- Composition
- Background
- Realistic rendering details

Avoid:
[NEGATIVE PROMPT]

Make the prompt rich, visual, and precise.`,
    patterns: ["Visual Detail", "Lighting", "Composition", "Negative Prompt"],
  },
  {
    id: 6,
    title: "Agent Task Planner",
    source: "AI Agent Forums",
    category: "Agents",
    model: "Agent Workflow",
    engagement: "Strong agent structure",
    qualityScore: 90,
    reason:
      "Defines goal, tools, process, validation, and final reporting rules for agent workflows.",
    prompt: `You are an autonomous AI agent.

Goal:
[GOAL]

Available tools:
[TOOLS]

Context:
[BACKGROUND]

Process:
1. Understand the goal
2. Break the goal into tasks
3. Select the right tool for each task
4. Execute step by step
5. Validate the result
6. Report final output

Rules:
- Do not skip validation
- Ask for clarification only when necessary
- Keep track of completed steps
- Provide a concise final summary`,
    patterns: ["Agent Role", "Tool Use", "Validation", "Task Planning"],
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

const sources = [
  "All",
  "Prompt Community",
  "X / Creator Threads",
  "GitHub / Developer Forums",
  "Research / Academic Blogs",
  "Image Prompt Communities",
  "AI Agent Forums",
];

export default function DiscoveryPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const filteredPrompts = useMemo(() => {
    return discoveredPrompts.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.prompt.toLowerCase().includes(search.toLowerCase()) ||
        item.reason.toLowerCase().includes(search.toLowerCase()) ||
        item.patterns.join(" ").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      const matchesSource =
        selectedSource === "All" || item.source === selectedSource;

      return matchesSearch && matchesCategory && matchesSource;
    });
  }, [search, selectedCategory, selectedSource]);

  async function copyPrompt(prompt: string, id: number) {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }

  function savePrompt(item: DiscoveredPrompt) {
    const savedHistory = localStorage.getItem("worldsly_history");
    const history: HistoryItem[] = savedHistory ? JSON.parse(savedHistory) : [];

    const newItem: HistoryItem = {
      id: Date.now(),
      tool: "Discovery Layer",
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
                Discovery Layer
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Discover high-performing prompt patterns.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                This layer simulates how Wordsly finds, scores, and organizes
                strong prompts from communities, creator threads, GitHub,
                research sources, and prompt libraries.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Optimize a Prompt
                </a>

                <a
                  href="/library"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  View Library
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Discovery Analytics</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              MVP preview of the future discovery and ranking engine.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Sources</p>
                <h3 className="mt-2 text-4xl font-black">6</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Patterns</p>
                <h3 className="mt-2 text-4xl font-black">18+</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Avg Score</p>
                <h3 className="mt-2 text-4xl font-black">91%</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Mode</p>
                <h3 className="mt-2 text-4xl font-black">MVP</h3>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">Future Upgrade</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Later this page will connect to real web discovery, source
                ranking, prompt scoring, metadata extraction, and AI evaluation.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search discovered prompts, patterns, sources..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={selectedSource}
              onChange={(event) => setSelectedSource(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {sources.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
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
                      {item.source}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black">{item.title}</h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {item.reason}
                  </p>
                </div>

                <div className="shrink-0 rounded-3xl bg-emerald-500/10 p-4 text-center">
                  <p className="text-xs font-black text-emerald-500">Score</p>
                  <p className="mt-1 text-3xl font-black text-emerald-500">
                    {item.qualityScore}
                  </p>
                </div>
              </div>

              <div className="mb-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                  <p className="mb-2 text-xs font-black text-slate-500">
                    TARGET MODEL
                  </p>
                  <p className="text-sm font-bold">{item.model}</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                  <p className="mb-2 text-xs font-black text-slate-500">
                    ENGAGEMENT SIGNAL
                  </p>
                  <p className="text-sm font-bold">{item.engagement}</p>
                </div>
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

            <h2 className="text-2xl font-black">No discovered prompts found</h2>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Try changing the source, category, or search keyword.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}