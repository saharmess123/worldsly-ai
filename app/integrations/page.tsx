"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";

const integrations = [
  {
    title: "API Access",
    description:
      "Allow developers to send prompts to Wordsly and receive optimized prompts, scores, variants, and explanations.",
    icon: "🔌",
    status: "Premium",
    type: "Developer",
  },
  {
    title: "Browser Extension",
    description:
      "Optimize prompts directly inside ChatGPT, Claude, Gemini, Reddit, X, GitHub, and prompt communities.",
    icon: "🧩",
    status: "Planned",
    type: "Extension",
  },
  {
    title: "JSON Export",
    description:
      "Export optimized prompts in structured JSON format for apps, automations, and developer workflows.",
    icon: "🧾",
    status: "Preview",
    type: "Export",
  },
  {
    title: "Agent YAML Export",
    description:
      "Transform optimized prompts into YAML-style agent instructions for AI agent workflows.",
    icon: "🤖",
    status: "Premium",
    type: "Agent",
  },
  {
    title: "Team Workspace",
    description:
      "Share prompt libraries, feedback, and prompt memory across a company or product team.",
    icon: "👥",
    status: "Enterprise",
    type: "Team",
  },
  {
    title: "White-label API",
    description:
      "Let other AI products use Wordsly prompt optimization under their own brand.",
    icon: "🏷️",
    status: "Future",
    type: "Business",
  },
];

const apiExample = `POST /api/optimize

{
  "prompt": "Write a post about my AI product",
  "category": "Marketing",
  "model": "GPT-style",
  "goal": "More structured",
  "depth": "Deep analysis"
}`;

const apiResponse = `{
  "originalScore": 45,
  "improvedScore": 91,
  "patterns": [
    "Role Definition",
    "Audience Context",
    "Output Format",
    "CTA"
  ],
  "optimizedPrompt": "Act as a senior AI product marketer..."
}`;

const exportFormats = [
  {
    title: "Prompt Bundle",
    description: "Export original prompt, improved prompt, scores, and variants.",
    format: "PDF / TXT",
    icon: "📦",
  },
  {
    title: "Developer JSON",
    description: "Use optimized prompt data inside apps and automations.",
    format: "JSON",
    icon: "🧾",
  },
  {
    title: "Agent Workflow",
    description: "Convert prompt logic into structured agent instructions.",
    format: "YAML",
    icon: "🤖",
  },
  {
    title: "Team Pack",
    description: "Bundle prompts by category, project, model, or use case.",
    format: "ZIP",
    icon: "🗂️",
  },
];

export default function IntegrationsPage() {
  const [copied, setCopied] = useState<"request" | "response" | null>(null);

  async function copyText(text: string, type: "request" | "response") {
    await navigator.clipboard.writeText(text);
    setCopied(type);

    setTimeout(() => {
      setCopied(null);
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
                API & Integrations
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Bring prompt intelligence into every workflow.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Wordsly.Ai can grow beyond a web app with API access, browser
                extension, export bundles, agent formatting, team workspaces,
                and white-label integrations.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Test Optimizer
                </a>

                <a
                  href="/pricing"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  View Plans
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Integration Roadmap</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Premium and enterprise features that turn Wordsly into an
              infrastructure product.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">API</p>
                <h3 className="mt-2 text-4xl font-black">v1</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Exports</p>
                <h3 className="mt-2 text-4xl font-black">4</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Plan</p>
                <h3 className="mt-2 text-4xl font-black">Pro</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">Mode</p>
                <h3 className="mt-2 text-4xl font-black">MVP</h3>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold text-slate-400">
                Monetization Angle
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                API access, team usage, exports, and private prompt corpuses can
                become premium and enterprise revenue features.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          {integrations.map((item) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
                  {item.icon}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                    {item.type}
                  </span>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">
                    {item.status}
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-black">{item.title}</h2>

              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">API Request Preview</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Example of how developers could call Wordsly from another app.
                </p>
              </div>

              <button
                onClick={() => copyText(apiExample, "request")}
                className="rounded-full bg-blue-500 px-4 py-2 text-xs font-black text-white hover:bg-blue-600"
              >
                {copied === "request" ? "Copied" : "Copy"}
              </button>
            </div>

            <pre className="overflow-auto rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">
              {apiExample}
            </pre>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">API Response Preview</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Optimized prompt, scores, patterns, and analysis returned.
                </p>
              </div>

              <button
                onClick={() => copyText(apiResponse, "response")}
                className="rounded-full bg-blue-500 px-4 py-2 text-xs font-black text-white hover:bg-blue-600"
              >
                {copied === "response" ? "Copied" : "Copy"}
              </button>
            </div>

            <pre className="overflow-auto rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">
              {apiResponse}
            </pre>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-6">
            <h2 className="text-3xl font-black">Export Bundles</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Premium users can export prompt intelligence in different formats
              depending on their workflow.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {exportFormats.map((item) => (
              <div
                key={item.title}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  {item.icon}
                </div>

                <h3 className="text-xl font-black">{item.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>

                <span className="mt-5 inline-flex rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-black text-fuchsia-500">
                  {item.format}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            API access turns Wordsly into a platform, not only a website.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            The web app is the first interface. API, exports, browser extension,
            and team features make Wordsly useful across other products and
            workflows.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/prompt-optimizer"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Test Optimizer
            </a>

            <a
              href="/training"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              View Training Layer
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}