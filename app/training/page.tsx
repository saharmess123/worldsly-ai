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
  input: string;
  output: string;
  category: string;
  isValid: boolean;
  validationError: string | null;
  isDuplicate: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
};

const sourceTypes = ["All", "feedback", "history", "corpus"];
const signalTypes = ["All", "preference", "demonstration", "curated"];

export default function TrainingPage() {
  const [signals, setSignals] = useState<TrainingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [showAllRecords, setShowAllRecords] = useState(false);

  const [summary, setSummary] = useState({
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    duplicateRecords: 0,
  });

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
        setSummary(data.summary);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Filter logic
  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      // If we are only showing clean records, filter out invalid or duplicates
      if (!showAllRecords && (!s.isValid || s.isDuplicate)) {
        return false;
      }

      const matchesSource = sourceType === "All" || s.sourceType === sourceType;
      const matchesSignal = signalType === "All" || s.signalType === signalType;
      const matchesScore = s.score >= minScore;
      
      const metaString = JSON.stringify(s.metadata || {}).toLowerCase();
      const matchesSearch =
        s.sourceType.toLowerCase().includes(search.toLowerCase()) ||
        s.signalType.toLowerCase().includes(search.toLowerCase()) ||
        s.input.toLowerCase().includes(search.toLowerCase()) ||
        s.output.toLowerCase().includes(search.toLowerCase()) ||
        metaString.includes(search.toLowerCase());

      return matchesSource && matchesSignal && matchesScore && matchesSearch;
    });
  }, [signals, sourceType, signalType, minScore, search, showAllRecords]);



  // Dataset readiness levels
  const readiness = useMemo(() => {
    const count = summary.validRecords;
    if (count >= 100) {
      return { level: "Training Ready", color: "text-emerald-500", barColor: "from-emerald-500 to-teal-400", pct: 100 };
    } else if (count >= 30) {
      return { level: "Usable Dataset", color: "text-blue-500", barColor: "from-blue-500 to-cyan-400", pct: Math.min(95, Math.round((count / 100) * 100)) };
    } else if (count >= 10) {
      return { level: "Early Dataset", color: "text-amber-500", barColor: "from-amber-500 to-yellow-400", pct: Math.min(29, Math.round((count / 30) * 100)) };
    } else {
      return { level: "Not Ready", color: "text-red-500", barColor: "from-red-500 to-rose-400", pct: Math.max(5, Math.round((count / 10) * 100)) };
    }
  }, [summary]);

  // Exporters
  function exportToJSON() {
    // Only export clean validated pairs
    const cleanDataset = filteredSignals
      .filter((s) => s.isValid && !s.isDuplicate)
      .map((s) => ({
        input: s.input,
        output: s.output,
        category: s.category,
        score: s.score,
        sourceType: s.sourceType,
      }));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanDataset, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "wordsly_training_dataset.json");
    dlAnchor.click();
  }

  function exportToCSV() {
    // Only export clean validated pairs
    let csvContent = "data:text/csv;charset=utf-8,input,output,category,score,sourceType\n";
    const cleanDataset = filteredSignals.filter((s) => s.isValid && !s.isDuplicate);
    
    cleanDataset.forEach((s) => {
      const orig = `"${s.input.replace(/"/g, '""')}"`;
      const imp = `"${s.output.replace(/"/g, '""')}"`;
      csvContent += `${orig},${imp},${s.category},${s.score},${s.sourceType}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", encodedUri);
    dlAnchor.setAttribute("download", "wordsly_training_dataset.csv");
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
            <h1 className="text-4xl font-black md:text-5xl leading-tight">Dataset Builder</h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Compile raw interaction signals into a clean, duplicate-free dataset of prompt training pairs (weak prompts &rarr; improved prompts) for model fine-tuning.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={generateSignals}
                disabled={generating}
                className="rounded-2xl bg-blue-500 px-6 py-4 font-black text-white hover:bg-blue-600 transition disabled:opacity-50"
              >
                {generating ? "Compiling..." : "Generate Learning Signals"}
              </button>
            </div>
            {generationMsg && (
              <p className="mt-3 text-sm font-bold text-emerald-500">{generationMsg}</p>
            )}
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white dark:border-white/10 dark:bg-white/5">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-2xl font-black">Dataset Readiness</h2>
              <span className={`text-xs font-black rounded-full bg-white/10 px-3 py-1 ${readiness.color}`}>{readiness.level}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 font-semibold">Targets 100+ clean records for a fully ready model fine-tuning.</p>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400 font-bold">Readiness Level</span>
                <span className="font-black text-sm">{readiness.pct}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${readiness.barColor}`}
                  style={{ width: `${readiness.pct}%` }}
                />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-xs font-bold">
              <div className="rounded-3xl bg-white/5 p-4 border border-white/10">
                <p className="text-slate-400">Total Valid Records</p>
                <h3 className="text-2xl font-black mt-1 text-emerald-400">{summary.validRecords}</h3>
              </div>
              <div className="rounded-3xl bg-white/5 p-4 border border-white/10">
                <p className="text-slate-400">Deduplicated Items</p>
                <h3 className="text-2xl font-black mt-1 text-blue-400">{summary.duplicateRecords}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings for Pollution/Invalid Records */}
        {summary.invalidRecords > 0 && (
          <div className="mb-8 rounded-3xl bg-red-500/10 border border-red-500/20 p-5 text-red-500 font-bold flex justify-between items-center">
            <div>
              <p className="text-sm font-black">Warning: Dataset Pollution Detected</p>
              <p className="text-xs font-semibold mt-1">
                Found {summary.invalidRecords} invalid records (empty inputs/outputs, or identical inputs/outputs) and {summary.duplicateRecords} duplicate records. They are excluded from the default dataset exports.
              </p>
            </div>
            <button
              onClick={() => setShowAllRecords(!showAllRecords)}
              className="text-xs bg-red-500/10 hover:bg-red-500/20 rounded-xl px-4 py-2 border border-red-500/20 transition shrink-0"
            >
              {showAllRecords ? "Hide Polluted Records" : "Inspect Polluted Records"}
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-white/10 pb-1">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-6 py-3 font-black text-sm border-b-2 transition ${
              activeTab === "preview"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Dataset Preview
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-6 py-3 font-black text-sm border-b-2 transition ${
              activeTab === "raw"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Raw Ingested Signals
          </button>
        </div>

        {/* Filters and Exporters */}
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Search Keywords</label>
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

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Listing {filteredSignals.length} records matching active filters.</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAllRecords}
                onChange={(e) => setShowAllRecords(e.target.checked)}
                className="rounded accent-blue-500"
              />
              <span>Show invalid/duplicate records</span>
            </label>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <div className="text-center py-10 font-bold">Loading dataset signals...</div>}
        {error && <div className="rounded-3xl bg-red-500/10 border border-red-500/20 p-5 text-red-500 font-bold text-center mb-8">{error}</div>}

        {/* Rendering Content TABS */}
        {!loading && !error && activeTab === "preview" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black">Dataset Preview ({filteredSignals.length})</h2>
            <div className="grid gap-6">
              {filteredSignals.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-2xl dark:bg-white/5 relative ${
                    !item.isValid
                      ? "border-red-500/30 bg-red-500/5"
                      : item.isDuplicate
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-slate-200 bg-white/80 dark:border-white/10"
                  }`}
                >
                  <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">Category: {item.category}</span>
                      <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-500 dark:text-slate-300">Source: {item.sourceType}</span>
                    </div>

                    <div className="flex gap-2 items-center">
                      {!item.isValid ? (
                        <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-500">Invalid: {item.validationError}</span>
                      ) : item.isDuplicate ? (
                        <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-500">Duplicate Record</span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">Valid Unique Record</span>
                      )}
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">Score: {item.score}</span>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60 text-xs">
                      <h4 className="font-black text-slate-500 mb-2">INPUT (WEAK PROMPT)</h4>
                      <p className="leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.input || <span className="italic text-slate-400">Empty</span>}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs">
                      <h4 className="font-black text-blue-500 mb-2">OUTPUT (IMPROVED PROMPT)</h4>
                      <p className="leading-6 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{item.output || <span className="italic text-slate-400">Empty</span>}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredSignals.length === 0 && (
              <div className="text-center py-12 rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 dark:border-white/10 dark:bg-white/5">
                <h3 className="text-xl font-black">No training records found. Try generating learning signals or adjusting the filter.</h3>
              </div>
            )}
          </div>
        )}

        {!loading && !error && activeTab === "raw" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black">Raw Ingested Signals Log ({filteredSignals.length})</h2>
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
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">Score: {sig.score}</span>
                  </div>

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
