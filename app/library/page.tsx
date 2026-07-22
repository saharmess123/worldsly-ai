"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

type VersionRecord = {
  version: string | number;
  prompt: string;
  improvedVersion?: string;
  updatedAt?: string;
  changeNote?: string;
};

type LibraryPrompt = {
  id: number | string;
  title: string;
  category: string;
  model: string;
  sourceType: string;
  score: number;
  description: string;
  prompt: string;
  improvedVersion?: string;
  patterns: string[];
  version: string;
  updatedAt: string;
  versionHistory?: VersionRecord[];
};

type HistoryItem = {
  id: number;
  tool: string;
  output: string;
  createdAt: string;
};

const initialPrompts: LibraryPrompt[] = [
  {
    id: 1,
    title: "Expert Role Prompt",
    category: "General",
    model: "GPT / Claude / Gemini",
    sourceType: "Curated Pattern",
    score: 94,
    version: "v1.2",
    updatedAt: "2026-07-20",
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
    versionHistory: [
      {
        version: "v1.2",
        prompt: `Act as a senior expert in [FIELD]...\nRequirements: Be specific, avoid generic advice.`,
        updatedAt: "2026-07-20",
        changeNote: "Added assumptions requirement and structured step-by-step guidance.",
      },
      {
        version: "v1.1",
        prompt: `Act as an expert in [FIELD]. Help me with [GOAL]. Give practical examples.`,
        updatedAt: "2026-07-10",
        changeNote: "Refined role specification and initial formatting.",
      },
      {
        version: "v1.0",
        prompt: `Help me with [GOAL].`,
        updatedAt: "2026-07-01",
        changeNote: "Initial prompt draft.",
      },
    ],
  },
  {
    id: 2,
    title: "Marketing Campaign Prompt",
    category: "Marketing",
    model: "GPT / Claude",
    sourceType: "High-Performing Template",
    score: 91,
    version: "v2.0",
    updatedAt: "2026-07-18",
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
    versionHistory: [
      {
        version: "v2.0",
        prompt: `Act as a senior marketing strategist...\n5 hooks, social media post, 7-day content ideas.`,
        updatedAt: "2026-07-18",
        changeNote: "Added 7-day content schedule and hook generation logic.",
      },
      {
        version: "v1.0",
        prompt: `Create a marketing campaign for [PRODUCT].`,
        updatedAt: "2026-06-25",
        changeNote: "Basic marketing prompt template.",
      },
    ],
  },
  {
    id: 3,
    title: "Code Debugging Prompt",
    category: "Coding",
    model: "Coding Assistant",
    sourceType: "Developer Pattern",
    score: 89,
    version: "v1.3",
    updatedAt: "2026-07-19",
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
    versionHistory: [
      {
        version: "v1.3",
        prompt: `Act as a senior software engineer...\nDo not rewrite unrelated parts.`,
        updatedAt: "2026-07-19",
        changeNote: "Added scope constraint to prevent unnecessary refactoring.",
      },
      {
        version: "v1.0",
        prompt: `Debug this code: [CODE] Error: [ERROR]`,
        updatedAt: "2026-06-20",
        changeNote: "Initial developer debugging prompt.",
      },
    ],
  },
  {
    id: 4,
    title: "Research Summary Prompt",
    category: "Research",
    model: "GPT / Claude / Gemini",
    sourceType: "Academic Pattern",
    score: 87,
    version: "v1.1",
    updatedAt: "2026-07-15",
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
    versionHistory: [
      {
        version: "v1.1",
        prompt: `Act as a research analyst...\nSeparate facts from interpretation.`,
        updatedAt: "2026-07-15",
        changeNote: "Added constraint on separating facts from interpretation.",
      },
      {
        version: "v1.0",
        prompt: `Summarize this text: [TEXT]`,
        updatedAt: "2026-06-15",
        changeNote: "Simple summarization prompt.",
      },
    ],
  },
  {
    id: 5,
    title: "Image Generation Prompt",
    category: "Image Generation",
    model: "Midjourney / Stable Diffusion",
    sourceType: "Visual Prompt Pattern",
    score: 90,
    version: "v1.2",
    updatedAt: "2026-07-14",
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
    versionHistory: [
      {
        version: "v1.2",
        prompt: `Create a highly detailed image prompt...\nComposition and Lighting controls.`,
        updatedAt: "2026-07-14",
        changeNote: "Added composition parameters and negative prompt section.",
      },
    ],
  },
  {
    id: 6,
    title: "Agent Workflow Prompt",
    category: "Agents",
    model: "Agent Workflow",
    sourceType: "Agent Pattern",
    score: 92,
    version: "v1.4",
    updatedAt: "2026-07-21",
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
    versionHistory: [
      {
        version: "v1.4",
        prompt: `You are an autonomous AI agent...\nRules: keep track of completed steps.`,
        updatedAt: "2026-07-21",
        changeNote: "Added step tracking and error validation protocol.",
      },
    ],
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

const modelOptions = [
  "All Models",
  "GPT",
  "Claude",
  "Gemini",
  "Coding Assistant",
  "Midjourney",
  "Agent Workflow",
];

const minScoreOptions = [
  { label: "Any Score", value: 0 },
  { label: "85%+", value: 85 },
  { label: "90%+", value: 90 },
  { label: "92%+", value: 92 },
];

export default function LibraryPage() {
  const router = useRouter();

  const [promptsList, setPromptsList] = useState<LibraryPrompt[]>(initialPrompts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedModel, setSelectedModel] = useState("All Models");
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"score_desc" | "score_asc" | "title_asc" | "version_desc">("score_desc");

  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [savedId, setSavedId] = useState<number | string | null>(null);

  const [activeVersionModal, setActiveVersionModal] = useState<LibraryPrompt | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCorpusPrompts() {
      try {
        const res = await fetch("/api/corpus");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.items) && data.items.length > 0) {
            const apiPrompts: LibraryPrompt[] = data.items.map((item: any) => ({
              id: item.id,
              title: item.title,
              category: item.category || "General",
              model: item.model || "General AI",
              sourceType: "Corpus Database",
              score: item.qualityScore || 90,
              description: item.improvedVersion ? `Improved version: ${item.improvedVersion.substring(0, 100)}...` : item.prompt.substring(0, 120) + "...",
              prompt: item.prompt,
              improvedVersion: item.improvedVersion,
              patterns: Array.isArray(item.patterns) ? item.patterns : ["Corpus"],
              version: item.version ? `v${item.version}.0` : "v1.0",
              updatedAt: item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : "2026-07-21",
              versionHistory: item.metadata?.versionHistory || [
                {
                  version: item.version ? `v${item.version}.0` : "v1.0",
                  prompt: item.prompt,
                  improvedVersion: item.improvedVersion,
                  updatedAt: new Date().toISOString().split("T")[0],
                  changeNote: "Imported from Corpus database.",
                },
              ],
            }));

            // Merge API prompts with default prompts to avoid duplicates
            setPromptsList((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newItems = apiPrompts.filter((p) => !existingIds.has(p.id));
              return [...newItems, ...prev];
            });
          }
        }
      } catch (err) {
        console.warn("Could not fetch API corpus prompts, using curated defaults", err);
      }
    }

    fetchCorpusPrompts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const filteredPrompts = useMemo(() => {
    return promptsList
      .filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase()) ||
          item.prompt.toLowerCase().includes(search.toLowerCase()) ||
          item.patterns.join(" ").toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
          selectedCategory === "All" || item.category === selectedCategory;

        const matchesModel =
          selectedModel === "All Models" ||
          item.model.toLowerCase().includes(selectedModel.toLowerCase());

        const matchesScore = item.score >= minScore;

        return matchesSearch && matchesCategory && matchesModel && matchesScore;
      })
      .sort((a, b) => {
        if (sortBy === "score_desc") return b.score - a.score;
        if (sortBy === "score_asc") return a.score - b.score;
        if (sortBy === "title_asc") return a.title.localeCompare(b.title);
        if (sortBy === "version_desc") return b.version.localeCompare(a.version);
        return 0;
      });
  }, [promptsList, search, selectedCategory, selectedModel, minScore, sortBy]);

  async function copyPrompt(prompt: string, id: number | string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      showToast("Prompt copied to clipboard! ✨");

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch {
      showToast("Failed to copy prompt");
    }
  }

  function savePrompt(item: LibraryPrompt) {
    const savedHistory = localStorage.getItem("worldsly_history");
    const history: HistoryItem[] = savedHistory ? JSON.parse(savedHistory) : [];

    const newItem: HistoryItem = {
      id: Date.now(),
      tool: `Prompt Library (${item.version})`,
      output: item.prompt,
      createdAt: new Date().toLocaleString(),
    };

    localStorage.setItem(
      "worldsly_history",
      JSON.stringify([newItem, ...history])
    );

    setSavedId(item.id);
    showToast(`Saved "${item.title}" to History! 📁`);

    setTimeout(() => {
      setSavedId(null);
    }, 2000);
  }

  function handleUseInOptimizer(item: LibraryPrompt) {
    const query = new URLSearchParams({
      prompt: item.prompt,
      category: item.category,
    });
    router.push(`/prompt-optimizer?${query.toString()}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      {/* Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[30%] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        {/* Hero Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                Prompt Intelligence Library v2.0
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Explore high-quality prompt patterns.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Browse reusable prompt structures scored by quality, category, model compatibility, versioning, and engineering patterns.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Optimize Custom Prompt
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

          {/* Stats Box */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Library Intelligence</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Filtered & structured with version history, pattern matching, and 1-click optimizer integration.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Total Patterns</p>
                <h3 className="mt-2 text-4xl font-black">{promptsList.length}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Filtered</p>
                <h3 className="mt-2 text-4xl font-black">{filteredPrompts.length}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Avg Quality</p>
                <h3 className="mt-2 text-4xl font-black">
                  {Math.round(
                    promptsList.reduce((acc, p) => acc + p.score, 0) /
                      (promptsList.length || 1)
                  )}%
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Mode</p>
                <h3 className="mt-2 text-4xl font-black">Live</h3>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>⚡ Quick Filter Status</span>
                <span className="text-blue-400 font-mono">{selectedCategory} • {selectedModel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-5 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            {/* Search Input */}
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search prompts, categories, patterns..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold outline-none transition dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Min Score Selector */}
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold outline-none transition dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {minScoreOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold outline-none transition dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              <option value="score_desc">Sort: Highest Score</option>
              <option value="score_asc">Sort: Lowest Score</option>
              <option value="title_asc">Sort: Title A-Z</option>
              <option value="version_desc">Sort: Latest Version</option>
            </select>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
            <span className="mr-2 text-xs font-black tracking-wider text-slate-400 uppercase">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                  selectedCategory === cat
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Cards Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredPrompts.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div>
                {/* Badges row */}
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                        {item.category}
                      </span>

                      <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-black text-fuchsia-500">
                        {item.sourceType}
                      </span>

                      {/* Version Badge */}
                      <button
                        onClick={() => setActiveVersionModal(item)}
                        title="Click to view version history"
                        className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-black text-purple-600 transition hover:bg-purple-500/20 dark:text-purple-300"
                      >
                        <span>{item.version}</span>
                        <span className="text-[10px] text-purple-400">📜</span>
                      </button>
                    </div>

                    <h2 className="text-2xl font-black">{item.title}</h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-3xl bg-emerald-500/10 p-3.5 text-center min-w-[70px]">
                    <p className="text-[10px] font-black uppercase text-emerald-500">
                      Score
                    </p>
                    <p className="mt-0.5 text-2xl font-black text-emerald-500">
                      {item.score}%
                    </p>
                  </div>
                </div>

                {/* Model compatibility box */}
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-slate-950/60">
                  <span className="text-xs font-black text-slate-500 uppercase">
                    Model: <span className="text-slate-800 dark:text-slate-200 font-bold ml-1">{item.model}</span>
                  </span>
                  <span className="text-xs text-slate-400">Updated: {item.updatedAt}</span>
                </div>

                {/* Prompt Preview */}
                <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200 shadow-inner">
                  {item.prompt}
                </pre>

                {/* Pattern Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.patterns.map((pattern) => (
                    <span
                      key={pattern}
                      className="rounded-lg bg-slate-200/80 px-2.5 py-1 text-[11px] font-black text-slate-700 dark:bg-white/10 dark:text-slate-300"
                    >
                      #{pattern}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={() => handleUseInOptimizer(item)}
                  className="flex-1 rounded-xl bg-blue-500 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-600"
                >
                  🚀 Use in Optimizer
                </button>

                <button
                  onClick={() => copyPrompt(item.prompt, item.id)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-black text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {copiedId === item.id ? "✓ Copied" : "📋 Copy"}
                </button>

                <button
                  onClick={() => savePrompt(item)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-black text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {savedId === item.id ? "✓ Saved" : "⭐ Save"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredPrompts.length === 0 && (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
              🔎
            </div>
            <h2 className="text-2xl font-black">No prompts match your filter</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Try adjusting your search query, model selection, or minimum score criteria.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
                setSelectedModel("All Models");
                setMinScore(0);
              }}
              className="mt-6 rounded-2xl bg-blue-500 px-6 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Version History Modal */}
      {activeVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900 text-slate-900 dark:text-white">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-white/10">
              <div>
                <span className="text-xs font-black text-purple-500 uppercase">
                  Version History & Iterations
                </span>
                <h3 className="text-2xl font-black mt-1">{activeVersionModal.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Current Version: <span className="font-bold text-blue-500">{activeVersionModal.version}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveVersionModal(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 max-h-[400px] overflow-y-auto space-y-4 pr-2">
              {activeVersionModal.versionHistory && activeVersionModal.versionHistory.length > 0 ? (
                activeVersionModal.versionHistory.map((ver, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-2 font-black text-sm text-purple-600 dark:text-purple-400">
                        Version {ver.version}
                        {idx === 0 && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-500 font-bold">
                            Current
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-400">{ver.updatedAt}</span>
                    </div>
                    {ver.changeNote && (
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-3 bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                        💡 {ver.changeNote}
                      </p>
                    )}
                    <pre className="max-h-[140px] overflow-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-slate-200">
                      {ver.prompt}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-slate-400">
                  No previous version history recorded for this pattern.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveVersionModal(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-slate-900/90 px-5 py-3 text-xs font-black text-white shadow-2xl backdrop-blur-md dark:border-blue-500/40 dark:bg-slate-950/90">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}