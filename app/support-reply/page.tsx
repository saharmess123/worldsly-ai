"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";

function formatName(name: string) {
  const cleanName = name.trim();

  if (!cleanName) return "Customer";

  return cleanName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function SupportReplyPage() {
  const [customerName, setCustomerName] = useState("");
  const [issueType, setIssueType] = useState("Technical issue");
  const [tone, setTone] = useState("Polite and professional");
  const [language, setLanguage] = useState("English");
  const [customerMessage, setCustomerMessage] = useState("");
  const [solution, setSolution] = useState("");
  const [result, setResult] = useState("");

  function generateReply() {
    if (!customerMessage.trim()) {
      alert("Please enter the customer message.");
      return;
    }

    const reply = `Dear ${formatName(customerName)},

Thank you for contacting us.

We are sorry to hear that you are experiencing this issue. We understand how important this is, and we appreciate you taking the time to share the details with us.

Regarding your ${issueType.toLowerCase()}, we recommend the following:

${
  solution ||
  "Our team will review the situation and get back to you as soon as possible with the next steps."
}

Please let us know if the issue continues after trying the suggested steps. We will be happy to assist you further.

Best regards,
Support Team`;

    setResult(reply);

    const oldHistory = localStorage.getItem("worldsly_history");
    const history = oldHistory ? JSON.parse(oldHistory) : [];

    const newItem = {
      id: Date.now(),
      tool: "Support Reply",
      output: reply,
      createdAt: new Date().toLocaleString(),
    };

    localStorage.setItem(
      "worldsly_history",
      JSON.stringify([newItem, ...history])
    );
  }

  function copyReply() {
    if (!result) {
      alert("Please generate a reply first.");
      return;
    }

    navigator.clipboard.writeText(result);
    alert("Support reply copied successfully!");
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
                Customer Support Tool
              </div>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Support Reply
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Generate calm, polite, and professional customer support replies
                for complaints, questions, and tickets.
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
                <h2 className="text-2xl font-black">Reply Details</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Add the customer message and the suggested solution.
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                🎧
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                  Customer Name
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Example: Sarah, Ahmed, Client"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                  Issue Type
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                >
                  <option>Technical issue</option>
                  <option>Payment issue</option>
                  <option>Account issue</option>
                  <option>Product complaint</option>
                  <option>Delivery issue</option>
                  <option>General question</option>
                </select>
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
                    <option>Polite and professional</option>
                    <option>Friendly</option>
                    <option>Formal</option>
                    <option>Apologetic</option>
                    <option>Calm and reassuring</option>
                    <option>Short and direct</option>
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
                  Customer Message
                </label>
                <textarea
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  placeholder="Paste the customer complaint, question, or ticket here..."
                  rows={6}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                  Suggested Solution / Next Step
                </label>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Example: Please reset your password, clear your browser cache, and try logging in again."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <button
                onClick={generateReply}
                className="w-full rounded-2xl bg-blue-500 py-4 font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
              >
                Generate Reply
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Generated Reply</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Copy the response or find it later in your history.
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
                    onClick={copyReply}
                    className="rounded-2xl bg-blue-500 py-4 font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-600"
                  >
                    Copy Reply
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
                    🎧
                  </div>

                  <h3 className="text-2xl font-black">
                    Your reply will appear here
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Paste the customer message, add your suggested solution, and
                    generate a clear support reply instantly.
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