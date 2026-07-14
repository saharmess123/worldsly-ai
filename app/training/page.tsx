"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type TrainingSignal = {
  id: string;
  sourceType: string;
  sourceId: string | null;
  corpusId: string | null;
  signalType: string;
  score: number;
  metadata: any;
  createdAt: string;
  corpus: { title: string } | null;
};

const sourceTypes = ["All", "feedback", "history", "corpus"];
const signalTypes = ["All", "preference", "demonstration", "curated"];

export default function TrainingPage() {
  const [signals, setSignals] = useState<TrainingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState("");

  // Filters
  const [sourceType, setSourceType] = useState("All");
  const [signalType, setSignalType] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState("");

  async function fetchSignals() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/training-signals");
      const data = await res.json();
      if (data.success) {
        setSignals(data.items);
      } else {
        setError(data.error || "Failed to load signals");
      }
    } catch {
      setError("Failed to fetch from Training Signals API");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSignals();
  }, []);

  async function generateSignals() {
    try {
      setGenerating(true);
      setGenerationMsg("");
      const res = await fetch("/api/training-signals", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setGenerationMsg(data.message);
        fetchSignals();
      } else {
        alert(data.error || "Failed to build signals");
      }
    } catch {
      alert("Error calling signals generator API");
    } finally {
      setGenerating(false);
    }
  }

  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      const matchesSource = sourceType === "All" || s.sourceType === sourceType;
      const matchesSignal = signalType === "All" || s.signalType === signalType;
      const matchesScore = s.score >= minScore;
      
      const metaString = JSON.stringify(s.metadata || {}).toLowerCase();
      const matchesSearch =
        s.sourceType.toLowerCase().includes(search.toLowerCase()) ||
        s.signalType.toLowerCase().includes(search.toLowerCase()) ||
        metaString.includes(search.toLowerCase());

      return matchesSource && matchesSignal && matchesScore && matchesSearch;
    });
  }, [signals, sourceType, signalType, minScore, search]);

  // Calculations
  const feedbackSignals = signals.filter(s => s.sourceType === "feedback");
  const usefulFeedback = feedbackSignals.filter(s => s.score === 100).length;
  
  const preferenceScore = feedbackSignals.length
    ? Math.round((usefulFeedback / feedbackSignals.length) * 100)
    : 0;

  const datasetSize = signals.length;

  const datasetReadiness = Math.min(
    100,
    datasetSize * 5 + usefulFeedback * 8
  );

  // Exporters
  function exportToJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredSignals, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "wordsly_training_signals.json");
    dlAnchor.click();
  }

  function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,ID,SourceType,SignalType,Score,CreatedAt,OriginalPrompt,ImprovedPrompt\n";
    
    filteredSignals.forEach((s) => {
      const id = s.id;
      const src = s.sourceType;
      const sig = s.signalType;
      const score = s.score;
      const created = s.createdAt;
      
      const orig = s.metadata?.originalPrompt ? `"${s.metadata.originalPrompt.replace(/"/g, '""')}"` : '""';
      const imp = (s.metadata?.improvedPrompt || s.metadata?.prompt) ? `"${(s.metadata.improvedPrompt || s.metadata.prompt).replace(/"/g, '""')}"` : '""';
      
      csvContent += `${id},${src},${sig},${score},${created},${orig},${imp}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", encodedUri);
    dlAnchor.setAttribute("download", "wordsly_training_signals.csv");
    dlAnchor.click();
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
            <h1 className="text-4xl font-black md:text-5xl leading-tight">Training Signals Engine</h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Collect user preferences, curations, and optimizations to prepare datasets for the upcoming PromptMaster fine-tuning step.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={generateSignals}
                disabled={generating}
                className="rounded-2xl bg-blue-500 px-6 py-4 font-black text-white hover:bg-blue-600 transition disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Learning Signals"}
              </button>
            </div>
            {generationMsg && (
              <p className="mt-3 text-sm font-bold text-emerald-500">{generationMsg}</p>
            )}
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white dark:border-white/10 dark:bg-white/5">
            <h2 className="text-2xl font-black">Dataset Readiness</h2>
            <p className="mt-2 text-sm text-slate-400">Calculated based on current signal size and quality metrics.</p>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold">Progress</span>
                <span className="font-black">{datasetReadiness}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${datasetReadiness}%` }}
                />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/5 p-4 border border-white/10">
                <p className="text-xs text-slate-400 font-bold">Total Signals</p>
                <h3 className="text-3xl font-black mt-1">{datasetSize}</h3>
              </div>
              <div className="rounded-3xl bg-white/5 p-4 border border-white/10">
                <p className="text-xs text-slate-400 font-bold">Preference Rate</p>
                <h3 className="text-3xl font-black mt-1 text-emerald-400">{preferenceScore}%</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Exporters */}
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Search Metadata</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Source Type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
              >
                {sourceTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Signal Type</label>
              <select
                value={signalType}
                onChange={(e) => setSignalType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
              >
                {signalTypes.map((st) => <option key={st}>{st}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Min Score: {minScore}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full cursor-pointer accent-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToJSON}
                className="flex-1 rounded-xl bg-slate-900 text-white px-3 py-3 text-xs font-black hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Export JSON
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 rounded-xl bg-blue-500 text-white px-3 py-3 text-xs font-black hover:bg-blue-600"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Signals Logger List */}
        {loading && <div className="text-center py-10 font-bold">Loading training signals...</div>}
        {error && <div className="rounded-3xl bg-red-500/10 border border-red-500/20 p-5 text-red-500 font-bold text-center mb-8">{error}</div>}

        {!loading && !error && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black">Logged Training Signals ({filteredSignals.length})</h2>
            <div className="grid gap-4">
              {filteredSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-md dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">Source: {sig.sourceType}</span>
                      <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-black text-fuchsia-500">Signal: {sig.signalType}</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">Signal Score: {sig.score}</span>
                  </div>

                  {sig.corpus && (
                    <p className="text-xs text-slate-500 font-bold mb-2">CONNECTED TO CORPUS: {sig.corpus.title}</p>
                  )}

                  <div className="rounded-2xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[160px]">
                    {JSON.stringify(sig.metadata, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
