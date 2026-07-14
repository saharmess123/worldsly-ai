"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type CorpusItem = {
  id: string;
  title: string;
  category: string;
  model: string;
  prompt: string;
  improvedVersion: string;
  qualityScore: number;
  patterns: string[];
  metadata: any;
  createdAt?: string;
};

const categories = ["All", "General", "Coding", "Research", "Marketing", "Education", "Image Generation"];
const models = ["All", "GPT-style", "Claude style", "Gemini style", "Coding Assistant", "Midjourney", "General"];

export default function CorpusPage() {
  const [corpusItems, setCorpusItems] = useState<CorpusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedModel, setSelectedModel] = useState("All");
  const [minQuality, setMinQuality] = useState(0);

  // Modals & UI Control
  const [detailItem, setDetailItem] = useState<CorpusItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New item form
  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newImproved, setNewImproved] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newModel, setNewModel] = useState("GPT-style");
  const [newQuality, setNewQuality] = useState(85);
  const [newPatterns, setNewPatterns] = useState("");
  const [newMetadata, setNewMetadata] = useState("");

  async function fetchCorpus() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/corpus");
      const data = await res.json();
      if (data.success) {
        setCorpusItems(data.items);
      } else {
        setError(data.error || "Failed to load corpus");
      }
    } catch {
      setError("Failed to fetch from SQLite Corpus API");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCorpus();
  }, []);

  const filteredCorpus = useMemo(() => {
    return corpusItems.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesModel = selectedModel === "All" || item.model.toLowerCase().includes(selectedModel.toLowerCase());
      const matchesScore = item.qualityScore >= minQuality;

      const searchText = `
        ${item.title}
        ${item.category}
        ${item.model}
        ${item.prompt}
        ${item.improvedVersion}
        ${(item.patterns || []).join(" ")}
      `.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesCategory && matchesModel && matchesScore && matchesSearch;
    });
  }, [corpusItems, search, category, selectedModel, minQuality]);

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this prompt from the Corpus?")) return;
    try {
      const res = await fetch(`/api/corpus?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCorpusItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(data.error || "Could not delete item");
      }
    } catch {
      alert("Error calling delete API");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newPrompt) {
      alert("Title and Prompt are required!");
      return;
    }
    
    let parsedMetadata = {};
    if (newMetadata) {
      try {
        parsedMetadata = JSON.parse(newMetadata);
      } catch {
        alert("Invalid JSON format in Metadata field.");
        return;
      }
    }

    const patternArray = newPatterns.split(",").map(p => p.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/corpus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          prompt: newPrompt,
          improvedVersion: newImproved,
          category: newCategory,
          model: newModel,
          qualityScore: Number(newQuality),
          patterns: patternArray,
          metadata: parsedMetadata,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        // Reset form
        setNewTitle("");
        setNewPrompt("");
        setNewImproved("");
        setNewPatterns("");
        setNewMetadata("");
        fetchCorpus();
      } else {
        alert(data.error || "Failed to create corpus prompt");
      }
    } catch {
      alert("Error submitting to corpus API");
    }
  }

  const averageQuality = corpusItems.length
    ? Math.round(corpusItems.reduce((sum, item) => sum + item.qualityScore, 0) / corpusItems.length)
    : 0;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-6 text-slate-950 dark:bg-[#030712] dark:text-white relative">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
            <h1 className="text-4xl font-black md:text-5xl leading-tight">Approved Prompt Corpus</h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Where verified high-quality prompts are archived to support models like PromptMaster.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-2xl bg-blue-500 px-6 py-4 font-black text-white hover:bg-blue-600 transition"
              >
                + Add Curated Prompt
              </button>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white dark:border-white/10 dark:bg-white/5">
            <h2 className="text-2xl font-black">Corpus Stats</h2>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs text-slate-400 font-bold">Total Prompts</p>
                <h3 className="text-3xl font-black mt-2">{corpusItems.length}</h3>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs text-slate-400 font-bold">Avg Quality Score</p>
                <h3 className="text-3xl font-black mt-2">{averageQuality}%</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, prompt, patterns..."
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
            >
              {models.map((m) => <option key={m}>{m}</option>)}
            </select>
            <div className="flex flex-col justify-center px-2">
              <label className="text-xs font-black text-slate-500 mb-1">Min Quality Score: {minQuality}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={minQuality}
                onChange={(e) => setMinQuality(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 dark:bg-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <div className="text-center py-10 font-bold text-lg">Loading corpus items...</div>}
        {error && <div className="rounded-3xl bg-red-500/10 border border-red-500/20 p-5 text-red-500 font-bold text-center mb-8">{error}</div>}

        {/* Prompts Cards */}
        {!loading && !error && (
          <div className="grid gap-6">
            {filteredCorpus.map((item) => (
              <div
                key={item.id}
                className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-500/60 dark:border-white/10 dark:bg-white/5"
              >
                <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">{item.category}</span>
                      <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-500 dark:text-slate-300">{item.model}</span>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">Quality: {item.qualityScore}%</span>
                    </div>
                    <h2 className="text-2xl font-black">{item.title}</h2>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setDetailItem(item)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-xl bg-red-500/10 px-4 py-2 text-xs font-black text-red-500 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-black text-sm">Original Prompt</h3>
                      <button
                        onClick={() => copyText(item.id + "-orig", item.prompt)}
                        className="text-xs font-bold text-blue-500 hover:underline"
                      >
                        {copiedId === item.id + "-orig" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm leading-7 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.prompt}</p>
                  </div>

                  <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-black text-sm text-blue-600 dark:text-blue-300">Improved Version</h3>
                      <button
                        onClick={() => copyText(item.id + "-imp", item.improvedVersion)}
                        className="text-xs font-bold text-blue-500 hover:underline"
                      >
                        {copiedId === item.id + "-imp" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm leading-7 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{item.improvedVersion}</p>
                  </div>
                </div>

                {item.patterns && item.patterns.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-black text-slate-500 mb-2">REUSABLE PATTERNS</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.patterns.map((pat) => (
                        <span key={pat} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-500">{pat}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredCorpus.length === 0 && !loading && (
          <div className="text-center py-12 rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 dark:border-white/10 dark:bg-white/5">
            <h3 className="text-xl font-black">No prompts matched the active filters</h3>
          </div>
        )}

        {/* Modal: View Details */}
        {detailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">{detailItem.category}</span>
                  <h2 className="text-3xl font-black mt-2">{detailItem.title}</h2>
                </div>
                <button onClick={() => setDetailItem(null)} className="text-2xl font-black hover:text-red-500">×</button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-500 mb-1">MODEL COMPATIBILITY</h3>
                  <p className="font-bold">{detailItem.model}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <h4 className="font-black text-xs text-slate-500 mb-2">ORIGINAL PROMPT</h4>
                    <p className="text-sm whitespace-pre-wrap">{detailItem.prompt}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-500/5 p-4 border border-blue-500/10">
                    <h4 className="font-black text-xs text-blue-500 mb-2">IMPROVED PROMPT</h4>
                    <p className="text-sm whitespace-pre-wrap">{detailItem.improvedVersion}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-500 mb-2">PATTERNS</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailItem.patterns.map((p) => (
                      <span key={p} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-500">{p}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-500 mb-2">METADATA / ADVANCED METRICS</h3>
                  <pre className="rounded-2xl bg-slate-950 p-4 text-xs text-emerald-400 font-mono overflow-x-auto">
                    {JSON.stringify(detailItem.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Curated Prompt */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Add Prompt to Curated Corpus</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-2xl font-black hover:text-red-500">×</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-black mb-1">Title</label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Marketing copy helper"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900"
                    >
                      {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1">Model Compatibility</label>
                    <select
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900"
                    >
                      {models.filter(m => m !== "All").map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Quality Score ({newQuality}%)</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={newQuality}
                    onChange={(e) => setNewQuality(Number(e.target.value))}
                    className="w-full cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Original Prompt</label>
                  <textarea
                    required
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Paste the raw prompt..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Improved Version (Optional)</label>
                  <textarea
                    value={newImproved}
                    onChange={(e) => setNewImproved(e.target.value)}
                    placeholder="Paste optimized prompt variant..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Patterns (Comma separated tags)</label>
                  <input
                    value={newPatterns}
                    onChange={(e) => setNewPatterns(e.target.value)}
                    placeholder="e.g. Expert Role, Context Depth, Structure Rules"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Metadata (JSON format, Optional)</label>
                  <textarea
                    value={newMetadata}
                    onChange={(e) => setNewMetadata(e.target.value)}
                    placeholder='e.g. { "originalityScore": 82, "structureScore": 88 }'
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-900 font-mono resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-600"
                  >
                    Save Curated Prompt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
