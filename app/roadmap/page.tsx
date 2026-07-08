"use client";

import Navbar from "../components/Navbar";

const phases = [
  {
    phase: "Phase 1",
    title: "Frontend MVP Foundation",
    status: "Completed",
    color: "emerald",
    description:
      "Build the main product interface and demonstrate the full Wordsly.Ai prompt intelligence concept.",
    items: [
      "Landing page",
      "Prompt Intelligence Dashboard",
      "Prompt Optimizer",
      "Discovery Layer",
      "Prompt Library",
      "Optimization History",
      "Feedback Analytics",
      "Training Layer preview",
      "API & Integrations preview",
      "Pricing page",
      "Settings and personal preferences",
      "Dark / light mode",
    ],
  },
  {
    phase: "Phase 2",
    title: "Real AI Optimization Engine",
    status: "Next",
    color: "blue",
    description:
      "Replace the local simulated optimizer with real AI-powered prompt scoring, rewriting, variants, and explanations.",
    items: [
      "Connect AI API",
      "Generate real optimized prompts",
      "Score prompt quality with AI",
      "Generate multiple prompt variants",
      "Explain why each prompt works",
      "Support model-specific optimization",
      "Add safety and quality checks",
    ],
  },
  {
    phase: "Phase 3",
    title: "Database, Auth, and User Memory",
    status: "Planned",
    color: "fuchsia",
    description:
      "Move from localStorage to a real backend with users, saved prompts, feedback, settings, and history.",
    items: [
      "User accounts",
      "Login / signup",
      "Database schema",
      "Save prompt history",
      "Save feedback signals",
      "Save personal style memory",
      "User plan limits",
      "Admin dashboard",
    ],
  },
  {
    phase: "Phase 4",
    title: "Discovery and Prompt Corpus",
    status: "Planned",
    color: "cyan",
    description:
      "Build the system that discovers strong prompts from external sources and stores them with metadata.",
    items: [
      "Source discovery pipeline",
      "Prompt extraction",
      "Duplicate detection",
      "Metadata enrichment",
      "Quality scoring",
      "Prompt ranking",
      "Source credibility scoring",
      "Prompt category detection",
    ],
  },
  {
    phase: "Phase 5",
    title: "PromptMaster Training Layer",
    status: "Future",
    color: "amber",
    description:
      "Use curated prompts, optimized outputs, and feedback signals to improve a specialized prompt intelligence model.",
    items: [
      "Training dataset preparation",
      "Weak prompt / strong prompt pairs",
      "Synthetic prompt data",
      "Preference optimization",
      "Prompt pattern learning",
      "Model evaluation",
      "Continuous improvement loop",
    ],
  },
  {
    phase: "Phase 6",
    title: "Premium SaaS and Enterprise",
    status: "Future",
    color: "violet",
    description:
      "Turn Wordsly.Ai into a scalable SaaS product with monetization, API access, teams, and enterprise features.",
    items: [
      "Free and premium plans",
      "Usage limits",
      "Stripe payments",
      "API access",
      "Browser extension",
      "Team workspace",
      "Private prompt corpus",
      "Export bundles",
      "Enterprise analytics",
    ],
  },
];

const doneNow = [
  "Frontend app built with Next.js, React, TypeScript, and Tailwind CSS",
  "Prompt optimization flow simulated locally",
  "Saved prompt history using localStorage",
  "Feedback loop saved locally",
  "Dashboard reads real local feedback and history",
  "Training layer reads saved examples and feedback signals",
  "Pricing, API, discovery, and library pages created",
];

const needsBackend = [
  "Real AI API for prompt optimization",
  "Backend database instead of localStorage",
  "Authentication and user accounts",
  "Real web discovery pipeline",
  "Prompt corpus storage",
  "Real scoring and ranking engine",
  "Payment system for premium plans",
];

export default function RoadmapPage() {
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
                Product Roadmap
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                From frontend MVP to self-improving prompt intelligence.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                This roadmap explains what Wordsly.Ai already demonstrates, what
                is currently simulated, and what must be built next to turn it
                into a real AI-powered SaaS platform.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/dashboard"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Open Dashboard
                </a>

                <a
                  href="/training"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  View Training Layer
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Project Status</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Clear and honest status for the current MVP.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Current Stage
                </p>
                <h3 className="mt-2 text-3xl font-black text-emerald-300">
                  Frontend MVP
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  AI Engine Status
                </p>
                <h3 className="mt-2 text-3xl font-black text-blue-300">
                  Simulated
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Backend Status
                </p>
                <h3 className="mt-2 text-3xl font-black text-amber-300">
                  Not Connected
                </h3>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Honest Meeting Line
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The product vision and frontend MVP are in place. The next phase
                is connecting real AI, backend storage, authentication, and the
                discovery pipeline.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <h2 className="text-3xl font-black">What is done now</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Current frontend MVP capabilities.
            </p>

            <div className="mt-6 space-y-3">
              {doneNow.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-emerald-500/10 p-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                    ✓
                  </span>
                  <p className="text-sm leading-6 font-semibold text-slate-700 dark:text-slate-300">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <h2 className="text-3xl font-black">What needs backend / AI</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              These are not fully real yet and should be built in the next
              phases.
            </p>

            <div className="mt-6 space-y-3">
              {needsBackend.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-amber-500/10 p-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">
                    !
                  </span>
                  <p className="text-sm leading-6 font-semibold text-slate-700 dark:text-slate-300">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-8">
            <h2 className="text-3xl font-black">Development Phases</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              A clean product roadmap from the current MVP to a real
              self-improving prompt platform.
            </p>
          </div>

          <div className="space-y-6">
            {phases.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                        {phase.phase}
                      </span>

                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                        {phase.status}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black">{phase.title}</h3>

                    <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                      {phase.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {phase.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            The MVP proves the product direction. The next step is real AI and
            backend infrastructure.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            This is the clean message for your boss: the interface, product
            vision, pages, and flow are ready. Now the project needs the real
            engine behind it.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/prompt-optimizer"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Test Optimizer
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