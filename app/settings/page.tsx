/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ThemeToggle from "../components/ThemeToggle";

export default function SettingsPage() {
  const isDev = process.env.NODE_ENV === "development";
  const [preferredModel, setPreferredModel] = useState("GPT-4.1 / GPT-5 style");
  const [optimizationDepth, setOptimizationDepth] = useState("Balanced");
  const [defaultGoal, setDefaultGoal] = useState("More structured");
  const [outputFormat, setOutputFormat] = useState("Detailed explanation");
  const [personalStyle, setPersonalStyle] = useState("");
  const [discoveryFocus, setDiscoveryFocus] = useState("General prompts");
  const [saved, setSaved] = useState(false);
  const [role, setRole] = useState("admin");

  useEffect(() => {
    const savedModel = localStorage.getItem("worldsly_preferred_model");
    const savedDepth = localStorage.getItem("worldsly_optimization_depth");
    const savedGoal = localStorage.getItem("worldsly_default_goal");
    const savedFormat = localStorage.getItem("worldsly_output_format");
    const savedStyle = localStorage.getItem("worldsly_personal_style");
    const savedDiscovery = localStorage.getItem("worldsly_discovery_focus");
    const savedRole = localStorage.getItem("wordsly_user_role") || "admin";

    if (savedModel) setPreferredModel(savedModel);
    if (savedDepth) setOptimizationDepth(savedDepth);
    if (savedGoal) setDefaultGoal(savedGoal);
    if (savedFormat) setOutputFormat(savedFormat);
    if (savedStyle) setPersonalStyle(savedStyle);
    if (savedDiscovery) setDiscoveryFocus(savedDiscovery);
    setRole(savedRole);
  }, []);

  function saveSettings() {
    localStorage.setItem("worldsly_preferred_model", preferredModel);
    localStorage.setItem("worldsly_optimization_depth", optimizationDepth);
    localStorage.setItem("worldsly_default_goal", defaultGoal);
    localStorage.setItem("worldsly_output_format", outputFormat);
    localStorage.setItem("worldsly_personal_style", personalStyle);
    localStorage.setItem("worldsly_discovery_focus", discoveryFocus);
    localStorage.setItem("wordsly_user_role", role);
    document.cookie = `wordsly_user_role=${role}; path=/; max-age=31536000`;

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
    
    window.dispatchEvent(new Event("storage"));
    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-6 text-slate-950 dark:bg-[#030712] dark:text-white relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
            <h1 className="text-4xl font-black md:text-5xl leading-tight">Prompt Intelligence Settings</h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Configure your preferred optimization models, response depth, and personal style templates.
            </p>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white dark:border-white/10 dark:bg-white/5">
            <h2 className="text-2xl font-black">Preferences Info</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <p className="text-xs text-slate-400">Active Model</p>
                <p className="font-bold mt-1">{preferredModel}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-2xl font-black mb-4">Optimization Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black mb-1">Preferred Model Style</label>
                <select
                  value={preferredModel}
                  onChange={(e) => setPreferredModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900"
                >
                  <option>GPT-4.1 / GPT-5 style</option>
                  <option>Claude style</option>
                  <option>Gemini style</option>
                  <option>Midjourney</option>
                  <option>Coding Assistant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black mb-1">Optimization Depth</label>
                <select
                  value={optimizationDepth}
                  onChange={(e) => setOptimizationDepth(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900"
                >
                  <option>Basic</option>
                  <option>Balanced</option>
                  <option>Deep analysis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black mb-1">Default Optimization Goal</label>
                <select
                  value={defaultGoal}
                  onChange={(e) => setDefaultGoal(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900"
                >
                  <option>More structured</option>
                  <option>More detailed</option>
                  <option>More concise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black mb-1">Output Format</label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900"
                >
                  <option>Detailed explanation</option>
                  <option>Short explanation</option>
                  <option>Prompt only</option>
                </select>
              </div>

              <button
                onClick={saveSettings}
                className="w-full rounded-2xl bg-blue-500 px-6 py-4 font-black text-white hover:bg-blue-600 transition"
              >
                {saved ? "Settings Saved!" : "Save Preferences"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {isDev && (
              <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                <h2 className="text-2xl font-black">Workspace Role Configuration</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Switch user permissions to view the platform through different layouts.
                </p>
                
                <div className="mt-4">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="admin">Admin / Developer Mode</option>
                    <option value="user">Standard User Mode</option>
                  </select>
                </div>

                <button
                  onClick={saveSettings}
                  className="mt-4 w-full rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-5 py-3 text-sm font-black hover:bg-slate-800 transition"
                >
                  Apply Role Change
                </button>
              </div>
            )}

            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
              <h2 className="text-2xl font-black">Personal Style Memory</h2>
              <textarea
                value={personalStyle}
                onChange={(e) => setPersonalStyle(e.target.value)}
                placeholder="Example: I prefer clear, structured prompts..."
                rows={4}
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900 resize-none"
              />
              <button
                onClick={saveSettings}
                className="mt-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-5 py-3 text-sm font-black hover:bg-slate-800 transition"
              >
                Save Style
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
