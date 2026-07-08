"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ThemeToggle from "../components/ThemeToggle";

export default function SettingsPage() {
  const [preferredModel, setPreferredModel] = useState("GPT-4.1 / GPT-5 style");
  const [optimizationDepth, setOptimizationDepth] = useState("Balanced");
  const [defaultGoal, setDefaultGoal] = useState("More structured");
  const [outputFormat, setOutputFormat] = useState("Detailed explanation");
  const [personalStyle, setPersonalStyle] = useState("");
  const [discoveryFocus, setDiscoveryFocus] = useState("General prompts");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedModel = localStorage.getItem("worldsly_preferred_model");
    const savedDepth = localStorage.getItem("worldsly_optimization_depth");
    const savedGoal = localStorage.getItem("worldsly_default_goal");
    const savedFormat = localStorage.getItem("worldsly_output_format");
    const savedStyle = localStorage.getItem("worldsly_personal_style");
    const savedDiscovery = localStorage.getItem("worldsly_discovery_focus");

    if (savedModel) setPreferredModel(savedModel);
    if (savedDepth) setOptimizationDepth(savedDepth);
    if (savedGoal) setDefaultGoal(savedGoal);
    if (savedFormat) setOutputFormat(savedFormat);
    if (savedStyle) setPersonalStyle(savedStyle);
    if (savedDiscovery) setDiscoveryFocus(savedDiscovery);
  }, []);

  function saveSettings() {
    localStorage.setItem("worldsly_preferred_model", preferredModel);
    localStorage.setItem("worldsly_optimization_depth", optimizationDepth);
    localStorage.setItem("worldsly_default_goal", defaultGoal);
    localStorage.setItem("worldsly_output_format", outputFormat);
    localStorage.setItem("worldsly_personal_style", personalStyle);
    localStorage.setItem("worldsly_discovery_focus", discoveryFocus);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
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
                Prompt Intelligence Settings
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Personalize how Wordsly optimizes prompts.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Configure your preferred model style, optimization depth,
                output format, discovery focus, and personal prompt style.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/prompt-optimizer"
                  className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
                >
                  Optimize Prompt
                </a>

                <a
                  href="/dashboard"
                  className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
                >
                  Open Dashboard
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h2 className="text-2xl font-black">Personal Prompt Memory</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              In the full platform, these settings will help Wordsly adapt
              prompt revisions to your style and preferred model behavior.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Preferred Model
                </p>
                <h3 className="mt-2 text-2xl font-black">{preferredModel}</h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Optimization Depth
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  {optimizationDepth}
                </h3>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold text-slate-400">
                  Theme Control
                </p>

                <div className="mt-4">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <h2 className="text-2xl font-black">Optimization Preferences</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              These preferences will be used as the default setup for future
              prompt optimization.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black">
                  Preferred Model Style
                </label>

                <select
                  value={preferredModel}
                  onChange={(event) => setPreferredModel(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  <option>GPT-4.1 / GPT-5 style</option>
                  <option>Claude style</option>
                  <option>Gemini style</option>
                  <option>Midjourney</option>
                  <option>Stable Diffusion</option>
                  <option>Coding Assistant</option>
                  <option>Agent Workflow</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Optimization Depth
                </label>

                <select
                  value={optimizationDepth}
                  onChange={(event) =>
                    setOptimizationDepth(event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  <option>Basic</option>
                  <option>Balanced</option>
                  <option>Deep analysis</option>
                  <option>Multi-variant premium</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">
                  Default Optimization Goal
                </label>

                <select
                  value={defaultGoal}
                  onChange={(event) => setDefaultGoal(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  <option>More structured</option>
                  <option>More detailed</option>
                  <option>More concise</option>
                  <option>More creative</option>
                  <option>More professional</option>
                  <option>Better reasoning</option>
                  <option>Better output format</option>
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
                  <option>Detailed explanation</option>
                  <option>Short explanation</option>
                  <option>Prompt only</option>
                  <option>Prompt + variants</option>
                  <option>JSON format</option>
                  <option>Agent YAML format</option>
                </select>
              </div>

              <button
                onClick={saveSettings}
                className="w-full rounded-2xl bg-blue-500 px-6 py-4 font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
              >
                {saved ? "Settings Saved" : "Save Settings"}
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <h2 className="text-2xl font-black">Discovery Preferences</h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Choose the type of prompt sources and patterns that should
                matter most in future discovery.
              </p>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-black">
                  Discovery Focus
                </label>

                <select
                  value={discoveryFocus}
                  onChange={(event) => setDiscoveryFocus(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  <option>General prompts</option>
                  <option>Marketing prompts</option>
                  <option>Coding prompts</option>
                  <option>Research prompts</option>
                  <option>Image generation prompts</option>
                  <option>Agent workflow prompts</option>
                  <option>Business prompts</option>
                </select>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-sm font-black text-blue-500">
                  Discovery Layer
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Later, this will influence which sources, prompt categories,
                  and high-performing examples Wordsly prioritizes.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <h2 className="text-2xl font-black">Personal Style Memory</h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Add a short description of your preferred prompt style. In the
                final version, Wordsly can use this to personalize optimization.
              </p>

              <textarea
                value={personalStyle}
                onChange={(event) => setPersonalStyle(event.target.value)}
                placeholder="Example: I prefer clear, structured prompts with practical examples, professional tone, and concise explanations."
                className="mt-6 min-h-[220px] w-full resize-none rounded-3xl border border-slate-300 bg-white p-5 text-sm leading-7 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />

              <button
                onClick={saveSettings}
                className="mt-5 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-xl shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:shadow-black/20 dark:hover:bg-slate-200"
              >
                {saved ? "Memory Saved" : "Save Personal Style"}
              </button>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <h2 className="text-2xl font-black">Account Plan Preview</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                  <p className="text-sm font-bold text-slate-500">
                    Current Plan
                  </p>
                  <h3 className="mt-2 text-3xl font-black">Free</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Limited optimizations and library access.
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
                  <p className="text-sm font-bold text-blue-500">
                    Future Plan
                  </p>
                  <h3 className="mt-2 text-3xl font-black">Premium</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Advanced variants, analytics, API, and memory.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}