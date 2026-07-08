"use client";

import Navbar from "../components/Navbar";

const architectureLayers = [
  {
    title: "Frontend Application",
    icon: "🖥️",
    status: "Built",
    description:
      "The user interface where people optimize prompts, explore discovery, view history, feedback, training, pricing, and settings.",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  },
  {
    title: "AI Optimization Engine",
    icon: "⚡",
    status: "Next Phase",
    description:
      "The real AI layer that will score prompts, rewrite them, generate variants, explain improvements, and adapt to model style.",
    technologies: ["OpenAI API", "Prompt Scoring", "Prompt Rewriting", "Variant Generation"],
  },
  {
    title: "Backend API",
    icon: "🔌",
    status: "Planned",
    description:
      "The secure server layer that connects the frontend to AI models, database, authentication, plans, and usage limits.",
    technologies: ["Node.js / Next API", "Auth", "Rate Limits", "Payments"],
  },
  {
    title: "Database",
    icon: "🗄️",
    status: "Planned",
    description:
      "Stores users, saved prompts, optimization history, feedback signals, settings, prompt metadata, and team workspaces.",
    technologies: ["PostgreSQL", "Prisma", "User Data", "Prompt Corpus"],
  },
  {
    title: "Discovery Pipeline",
    icon: "🌐",
    status: "Planned",
    description:
      "Finds high-performing prompts from public sources, extracts patterns, removes duplicates, scores quality, and saves metadata.",
    technologies: ["Web Search", "Scraping", "Deduplication", "Ranking"],
  },
  {
    title: "Training Layer",
    icon: "🧠",
    status: "Future",
    description:
      "Uses curated prompts, weak/strong prompt pairs, and feedback data to improve PromptMaster over time.",
    technologies: ["Synthetic Data", "Preference Signals", "Fine-tuning", "Evaluation"],
  },
];

const dataFlow = [
  {
    step: "01",
    title: "User submits prompt",
    description:
      "The user enters a weak or average prompt inside the Prompt Optimizer.",
  },
  {
    step: "02",
    title: "Prompt is analyzed",
    description:
      "Wordsly checks clarity, context, format, specificity, constraints, and model target.",
  },
  {
    step: "03",
    title: "Relevant patterns are retrieved",
    description:
      "The system compares the prompt with discovered and curated high-performing prompt patterns.",
  },
  {
    step: "04",
    title: "Optimized prompt is generated",
    description:
      "The AI engine rewrites the prompt into a stronger, structured, reusable version.",
  },
  {
    step: "05",
    title: "User gives feedback",
    description:
      "The user marks the result as Useful or Needs Work.",
  },
  {
    step: "06",
    title: "System learns from feedback",
    description:
      "Feedback becomes a signal for ranking, personalization, and future training.",
  },
];

const currentVsFuture = [
  {
    area: "Prompt Optimizer",
    current: "Local simulated optimization",
    future: "Real AI-powered optimization",
  },
  {
    area: "History",
    current: "Saved in localStorage",
    future: "Saved in database per user",
  },
  {
    area: "Feedback",
    current: "Saved locally",
    future: "Used for preference learning",
  },
  {
    area: "Discovery",
    current: "Simulated prompt source examples",
    future: "Real web discovery pipeline",
  },
  {
    area: "Training",
    current: "Training preview dashboard",
    future: "PromptMaster training system",
  },
  {
    area: "API",
    current: "Preview page only",
    future: "Real developer API access",
  },
];

export default function ArchitecturePage() {
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
                Product Architecture
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                How Wordsly.Ai becomes a self-improving prompt intelligence platform.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                This architecture explains how the frontend MVP connects later
                to real AI, backend services, database, discovery pipeline,
                training data, and API access.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/roadmap"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  View Roadmap
                </a>

                <a
                  href="/training"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  Training Layer
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Current Stack</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              What is already used in the frontend MVP.
            </p>

            <div className="mt-6 space-y-4">
              {["Next.js", "React", "TypeScript", "Tailwind CSS", "localStorage"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-white/10 bg-white/10 p-5"
                  >
                    <h3 className="text-xl font-black">{item}</h3>
                  </div>
                )
              )}
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Architecture Status
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The frontend structure is ready. The next step is replacing MVP
                simulation with real AI, backend, database, and discovery.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          {architectureLayers.map((layer) => (
            <div
              key={layer.title}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
                  {layer.icon}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    layer.status === "Built"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : layer.status === "Next Phase"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {layer.status}
                </span>
              </div>

              <h2 className="text-2xl font-black">{layer.title}</h2>

              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                {layer.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {layer.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-10 rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-8">
            <h2 className="text-3xl font-black">Data Flow</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              The future flow from user prompt to optimized output and feedback learning.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {dataFlow.map((item) => (
              <div
                key={item.step}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-sm font-black text-white">
                  {item.step}
                </div>

                <h3 className="text-xl font-black">{item.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-6">
            <h2 className="text-3xl font-black">Current MVP vs Final Product</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              This table is useful for explaining clearly what is done and what
              still needs to be built.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-3 bg-slate-950 text-white">
              <div className="p-4 text-sm font-black">Area</div>
              <div className="p-4 text-sm font-black">Current MVP</div>
              <div className="p-4 text-sm font-black">Final Product</div>
            </div>

            {currentVsFuture.map((row) => (
              <div
                key={row.area}
                className="grid grid-cols-3 border-t border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="p-4 font-black">{row.area}</div>
                <div className="p-4 text-slate-600 dark:text-slate-400">
                  {row.current}
                </div>
                <div className="p-4 font-bold text-blue-500">{row.future}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            The architecture is clear: frontend first, then AI, backend, database,
            discovery, and training.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            This page helps explain the technical direction without pretending
            that the MVP already has a real self-training AI engine.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/dashboard"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Open Dashboard
            </a>

            <a
              href="/integrations"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              View API Plan
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}