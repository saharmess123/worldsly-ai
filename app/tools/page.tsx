"use client";

import Navbar from "../components/Navbar";

const coreTools = [
  {
    title: "Prompt Optimizer",
    description:
      "Paste any prompt and generate a stronger version with scoring, explanations, and optimized variants.",
    href: "/prompt-optimizer",
    icon: "⚡",
    tag: "Core Engine",
    status: "Active",
  },
  {
    title: "Discovery Layer",
    description:
      "Explore discovered high-performing prompt patterns from simulated public sources and communities.",
    href: "/discovery",
    icon: "🌐",
    tag: "Discovery",
    status: "MVP",
  },
  {
    title: "Prompt Library",
    description:
      "Browse curated prompt structures with quality scores, model compatibility, and reusable patterns.",
    href: "/library",
    icon: "📚",
    tag: "Curated Data",
    status: "Active",
  },
  {
    title: "Optimization History",
    description:
      "Review saved prompt improvements and build your personal prompt intelligence memory.",
    href: "/history",
    icon: "🧠",
    tag: "Memory",
    status: "Active",
  },
];

const intelligenceTools = [
  {
    title: "Prompt Scoring",
    description:
      "Analyze prompt quality using clarity, specificity, structure, context, constraints, and format.",
    icon: "📊",
    score: "Quality Engine",
  },
  {
    title: "Pattern Extraction",
    description:
      "Identify what makes prompts work better, such as role definition, examples, and output rules.",
    icon: "🧬",
    score: "Pattern Engine",
  },
  {
    title: "Feedback Learning",
    description:
      "Use thumbs up/down and saved results to improve future prompt recommendations.",
    icon: "🔁",
    score: "Learning Loop",
  },
  {
    title: "Model-Aware Formatting",
    description:
      "Adapt prompt structure for GPT-style models, Claude-style models, image tools, code assistants, and agents.",
    icon: "🤖",
    score: "Model Layer",
  },
];

const oldContentTools = [
  {
    title: "Email Writer",
    description:
      "Legacy MVP tool for generating professional emails. Can later become a prompt template category.",
    href: "/email-writer",
    icon: "✉️",
  },
  {
    title: "Text Rewriter",
    description:
      "Legacy MVP tool for improving rough text. Can later connect to prompt optimization flows.",
    href: "/text-rewriter",
    icon: "📝",
  },
  {
    title: "Caption Generator",
    description:
      "Legacy MVP tool for social captions. Can later become a marketing prompt use case.",
    href: "/caption-generator",
    icon: "📣",
  },
  {
    title: "Support Reply",
    description:
      "Legacy MVP tool for customer replies. Can later become a support prompt category.",
    href: "/support-reply",
    icon: "🎧",
  },
];

export default function ToolsPage() {
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
                Prompt Intelligence Tools
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Tools built around prompt discovery, scoring, and optimization.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Wordsly.Ai is focused on improving prompts, learning from
                strong patterns, and helping users create better AI outputs
                through a smarter prompt intelligence system.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Open Optimizer
                </a>

                <a
                  href="/discovery"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  Explore Discovery
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Platform System</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The tools are organized around the main intelligence flow of
              Wordsly.Ai.
            </p>

            <div className="mt-6 space-y-4">
              {[
                { step: "01", title: "Discover prompts", icon: "🌐" },
                { step: "02", title: "Score quality", icon: "📊" },
                { step: "03", title: "Optimize structure", icon: "⚡" },
                { step: "04", title: "Learn from feedback", icon: "🧠" },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/10 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-sm font-black text-white">
                    {item.step}
                  </div>

                  <div>
                    <h3 className="font-black">
                      {item.icon} {item.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="mb-5">
            <h2 className="text-3xl font-black">Core Platform Tools</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              These are the main pages that match the self-improving prompt
              intelligence vision.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {coreTools.map((tool) => (
              <a
                key={tool.title}
                href={tool.href}
                className="group rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
                    {tool.icon}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                      {tool.tag}
                    </span>

                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">
                      {tool.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-black">{tool.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {tool.description}
                </p>

                <span className="mt-5 inline-flex text-sm font-black text-blue-500 transition group-hover:translate-x-1">
                  Open →
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mb-10 rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-6">
            <h2 className="text-3xl font-black">Intelligence Modules</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              These modules explain what the final platform will do behind the
              scenes as the engine becomes smarter.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {intelligenceTools.map((tool) => (
              <div
                key={tool.title}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                    {tool.icon}
                  </div>

                  <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-black text-fuchsia-500">
                    {tool.score}
                  </span>
                </div>

                <h3 className="text-xl font-black">{tool.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-black">Legacy MVP Tools</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                These were built first, but now they can be repositioned as use
                cases inside the prompt intelligence platform.
              </p>
            </div>

            <span className="rounded-full bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-500">
              Optional / Later
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {oldContentTools.map((tool) => (
              <a
                key={tool.title}
                href={tool.href}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                  {tool.icon}
                </div>

                <h3 className="font-black">{tool.title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {tool.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}