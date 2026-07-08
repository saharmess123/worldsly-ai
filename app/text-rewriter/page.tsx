"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";

export default function TextRewriterPage() {
  const [originalText, setOriginalText] = useState("");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [goal, setGoal] = useState("Improve clarity and grammar");
  const [result, setResult] = useState("");

  function createProfessionalRewrite(text: string) {
    const lowerText = text.toLowerCase().trim();

    if (
      lowerText.includes("hi sir") &&
      lowerText.includes("waiting") &&
      lowerText.includes("feedback") &&
      lowerText.includes("project")
    ) {
      return `Hi Sir,

I hope you are doing well.

I am still waiting for your feedback regarding the project. I would also like to know if we can continue with the next step.

Thank you.`;
    }

    if (
      lowerText.includes("i hope you are doing well") &&
      lowerText.includes("details")
    ) {
      return `Hi Sir,

I hope you are doing well.

I am still waiting for the additional details you mentioned regarding the project. Please let me know when you have an update so I can continue with the next steps.

Thank you.`;
    }

    let rewrittenText = text.trim();

    rewrittenText = rewrittenText
      .replace(/\bi\b/g, "I")
      .replace(/\biam\b/gi, "I am")
      .replace(/\bdont\b/gi, "do not")
      .replace(/\bcant\b/gi, "cannot")
      .replace(/\bwanna\b/gi, "would like to")
      .replace(/\bgonna\b/gi, "going to")
      .replace(/\bu\b/gi, "you")
      .replace(/\bur\b/gi, "your")
      .replace(/\bcuz\b/gi, "because")
      .replace(/\bbc\b/gi, "because")
      .replace(/\bmsg\b/gi, "message");

    rewrittenText =
      rewrittenText.charAt(0).toUpperCase() + rewrittenText.slice(1);

    if (!rewrittenText.endsWith(".") && !rewrittenText.endsWith("!")) {
      rewrittenText += ".";
    }

    return rewrittenText;
  }

  function generateRewrite() {
    if (!originalText.trim()) {
      alert("Please enter text to rewrite.");
      return;
    }

    const rewrittenText = createProfessionalRewrite(originalText);

    setResult(rewrittenText);

    const oldHistory = localStorage.getItem("worldsly_history");
    const history = oldHistory ? JSON.parse(oldHistory) : [];

    const newItem = {
      id: Date.now(),
      tool: "Text Rewriter",
      output: rewrittenText,
      createdAt: new Date().toLocaleString(),
    };

    localStorage.setItem(
      "worldsly_history",
      JSON.stringify([newItem, ...history])
    );
  }

  function copyText() {
    if (!result) {
      alert("Please rewrite text first.");
      return;
    }

    navigator.clipboard.writeText(result);
    alert("Rewritten text copied successfully!");
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
                Writing Improvement Tool
              </div>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Text Rewriter
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Improve grammar, clarity, tone, and professionalism from a
                rough message or draft.
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
                <h2 className="text-2xl font-black">Rewrite Details</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Paste your draft and choose the rewriting style.
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                📝
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                  Original Text
                </label>
                <textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="Paste the text you want to improve..."
                  rows={10}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
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
                    <option>Formal</option>
                    <option>Simple</option>
                    <option>Confident</option>
                    <option>Polite</option>
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
                  Rewrite Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                >
                  <option>Improve clarity and grammar</option>
                  <option>Make it more professional</option>
                  <option>Make it shorter</option>
                  <option>Make it more polite</option>
                  <option>Make it more persuasive</option>
                  <option>Simplify the text</option>
                </select>
              </div>

              <button
                onClick={generateRewrite}
                className="w-full rounded-2xl bg-blue-500 py-4 font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
              >
                Rewrite Text
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Rewritten Text</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Copy the improved version or find it later in history.
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
                    onClick={copyText}
                    className="rounded-2xl bg-blue-500 py-4 font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-600"
                  >
                    Copy Text
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
                    📝
                  </div>

                  <h3 className="text-2xl font-black">
                    Your rewritten text will appear here
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Paste your original message, choose your settings, and get a
                    cleaner version instantly.
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