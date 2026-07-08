"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";

export default function CaptionGeneratorPage() {
  const [platform, setPlatform] = useState("LinkedIn");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState("");

  function generateCaption() {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    const caption = `🚀 ${topic}

${details || "Excited to share this update with you."}

This is a great step forward, and I am looking forward to the next phase.

#${platform.replace(/\s+/g, "")} #AI #Productivity #Innovation`;

    setResult(caption);

    const oldHistory = localStorage.getItem("worldsly_history");
    const history = oldHistory ? JSON.parse(oldHistory) : [];

    const newItem = {
      id: Date.now(),
      tool: "Social Media Caption",
      output: caption,
      createdAt: new Date().toLocaleString(),
    };

    localStorage.setItem(
      "worldsly_history",
      JSON.stringify([newItem, ...history])
    );
  }

  function copyCaption() {
    if (!result) {
      alert("Please generate a caption first.");
      return;
    }

    navigator.clipboard.writeText(result);
    alert("Caption copied successfully!");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-160px] top-[-140px] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-140px] top-[120px] h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-[-160px] left-[35%] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[120px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Social Content Tool
              </div>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Caption Generator
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Create clean social media captions for LinkedIn, Instagram,
                Facebook, TikTok, and X from a simple topic and details.
              </p>
            </div>

            <a
              href="/tools"
              className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
            >
              Back to Tools
            </a>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Caption Details</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Select the platform and describe what you want to post.
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                📣
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                >
                  <option>LinkedIn</option>
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option>TikTok</option>
                  <option>X / Twitter</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                  Topic
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Example: Launching Worldsly.Ai MVP"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                  >
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Creative</option>
                    <option>Excited</option>
                    <option>Persuasive</option>
                    <option>Simple</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                  >
                    <option>English</option>
                    <option>French</option>
                    <option>Arabic</option>
                    <option>Spanish</option>
                    <option>German</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                  Details
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Example: The platform helps users generate prompts, emails, captions, and support replies."
                  rows={8}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <button
                onClick={generateCaption}
                className="w-full rounded-2xl bg-blue-500 py-4 font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
              >
                Generate Caption
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Generated Caption</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Copy your caption or find it later in history.
                </p>
              </div>

              <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-500">
                Auto-saved
              </span>
            </div>

            {result ? (
              <>
                <div className="min-h-[560px] whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm leading-7 text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
                  {result}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={copyCaption}
                    className="rounded-2xl bg-blue-500 py-4 font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-600"
                  >
                    Copy Caption
                  </button>

                  <a
                    href="/history"
                    className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 py-4 text-center font-black text-emerald-500 transition hover:-translate-y-1 hover:bg-emerald-500/20"
                  >
                    View History
                  </a>
                </div>
              </>
            ) : (
              <div className="flex min-h-[560px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-slate-950/70">
                <div>
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
                    📣
                  </div>

                  <h3 className="text-2xl font-black">
                    Your caption will appear here
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Add the platform, topic, and details. Worldsly.Ai will
                    create a ready-to-post caption for you.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}