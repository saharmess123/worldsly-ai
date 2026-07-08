"use client";

import ThemeToggle from "./components/ThemeToggle";

const intelligenceSteps = [
  {
    title: "Discover",
    description:
      "Finds high-performing prompt patterns from public prompt sources, communities, and research-inspired examples.",
    icon: "🌐",
  },
  {
    title: "Analyze",
    description:
      "Scores prompts by clarity, specificity, structure, constraints, examples, and output format.",
    icon: "📊",
  },
  {
    title: "Optimize",
    description:
      "Turns average prompts into stronger versions with explanations and multiple variants.",
    icon: "⚡",
  },
  {
    title: "Learn",
    description:
      "Uses feedback signals to improve future prompt recommendations and optimization quality.",
    icon: "🧠",
  },
];

const useCases = [
  "Marketing",
  "Coding",
  "Research",
  "Education",
  "Image Generation",
  "Agents",
  "Business",
  "Customer Support",
];

const promptPatterns = [
  "Role Definition",
  "Context Depth",
  "Output Format",
  "Constraints",
  "Examples",
  "Model Style",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-180px] h-[560px] w-[560px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-200px] top-[120px] h-[560px] w-[560px] rounded-full bg-fuchsia-500/20 blur-[150px]" />
        <div className="absolute bottom-[-200px] left-[30%] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[150px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <nav className="mb-10 flex items-center justify-between rounded-[2rem] border border-slate-200 bg-white/80 px-6 py-4 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <a href="/" className="text-3xl font-black tracking-tight">
            Wordsly<span className="text-blue-500">.Ai</span>
          </a>

          <div className="hidden items-center gap-7 text-sm font-bold text-slate-600 dark:text-slate-300 md:flex">
            <a href="/dashboard" className="transition hover:text-blue-500">
              Dashboard
            </a>
            <a href="/prompt-optimizer" className="transition hover:text-blue-500">
              Optimizer
            </a>
            <a href="/library" className="transition hover:text-blue-500">
              Library
            </a>
            <a href="/history" className="transition hover:text-blue-500">
              History
            </a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <a
              href="/prompt-optimizer"
              className="rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-600"
            >
              Optimize Prompt
            </a>
          </div>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
              Self-improving prompt intelligence
            </div>

            <h1 className="max-w-5xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
              The prompts that get better every day.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Wordsly.Ai discovers prompt patterns, analyzes what makes them
              work, and helps you transform average prompts into stronger,
              clearer, model-ready prompts.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="/prompt-optimizer"
                className="rounded-2xl bg-blue-500 px-7 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
              >
                Start Optimizing
              </a>

              <a
                href="/dashboard"
                className="rounded-2xl border border-slate-300 bg-white/70 px-7 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
              >
                View Intelligence Dashboard
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Prompt patterns", value: "5K+" },
                { label: "Use cases", value: "8+" },
                { label: "Optimization flow", value: "Live" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
                >
                  <h3 className="text-3xl font-black">{item.value}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[580px]">
            <div className="absolute left-0 top-10 z-10 rotate-[-8deg] rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-2xl shadow-blue-500/20 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
              <p className="text-xs font-black text-blue-500">Original Prompt</p>
              <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-700 dark:text-slate-300">
                Write a post about my AI product.
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-red-500/10">
                <div className="h-full w-[45%] rounded-full bg-red-500" />
              </div>
              <p className="mt-2 text-xs font-black text-red-500">Score 45</p>
            </div>

            <div className="absolute right-0 top-0 rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-blue-500/20 dark:border-white/10">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>

                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                  PromptMaster
                </span>
              </div>

              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Improved Prompt
                </p>

                <p className="mt-4 max-w-[390px] text-sm leading-7 text-slate-200">
                  Act as a senior AI product marketer. Create a structured
                  launch post for my AI product. Include the audience, problem,
                  solution, benefits, tone, CTA, and 3 alternative hooks.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Clarity", value: "92" },
                  { label: "Structure", value: "88" },
                  { label: "Specificity", value: "91" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-white/10 p-4 text-center"
                  >
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="mt-1 text-2xl font-black">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-16 right-10 rotate-[8deg] rounded-3xl bg-emerald-500 p-5 text-white shadow-2xl shadow-emerald-500/30">
              <p className="text-xs font-black">Improved Score</p>
              <p className="mt-1 text-4xl font-black">91</p>
            </div>

            <div className="absolute bottom-0 left-10 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-2xl shadow-fuchsia-500/20 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
              <p className="text-xs font-black text-fuchsia-500">
                Intelligence Patterns
              </p>

              <div className="mt-4 flex max-w-[300px] flex-wrap gap-2">
                {promptPatterns.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-500"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {intelligenceSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                {step.icon}
              </div>

              <h3 className="text-xl font-black">{step.title}</h3>

              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                Built for every prompt use case
              </div>

              <h2 className="text-4xl font-black leading-tight">
                One optimizer for text, code, agents, images, marketing, and research.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
                Wordsly focuses on the structure behind great prompts, so users
                can improve requests across different models and tasks.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {useCases.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 font-black transition hover:border-blue-500/60 dark:border-white/10 dark:bg-slate-950/60"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight md:text-5xl">
            Discover the best. Make them better.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Start with the Prompt Optimizer and build your personal library of
            stronger prompts.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/prompt-optimizer"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Optimize First Prompt
            </a>

            <a
              href="/dashboard"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              Open Dashboard
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}