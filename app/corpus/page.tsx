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
  metadata: {
    tags?: string[];
    approvedDate?: string;
    version?: number;
    versionHistory?: Array<{
      version: number;
      prompt: string;
      improvedVersion: string;
      updatedAt: string;
    }>;
    source?: {
      name?: string;
      url?: string;
    };
    curation?: {
      reviewer?: string;
      reason?: string;
    };
    [key: string]: unknown;
  };
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
  const [sortBy, setSortBy] = useState("newest");

  // Modals & UI Control
  const [detailItem, setDetailItem] = useState<CorpusItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);

  // New item form states
  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newImproved, setNewImproved] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newModel, setNewModel] = useState("GPT-style");
  const [newQuality, setNewQuality] = useState(85);
  const [newPatterns, setNewPatterns] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newCurationReason, setNewCurationReason] = useState("");
  const [newMetadata, setNewMetadata] = useState("");

  // Edit item form states
  const [editItem, setEditItem] = useState<CorpusItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editImproved, setEditImproved] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editModel, setEditModel] = useState("GPT-style");
  const [editQuality, setEditQuality] = useState(85);
  const [editPatterns, setEditPatterns] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editSourceName, setEditSourceName] = useState("");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editReviewerName, setEditReviewerName] = useState("");
  const [editCurationReason, setEditCurationReason] = useState("");

  const [viewArchived, setViewArchived] = useState(false);

  async function fetchCorpus(showArchived = viewArchived) {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/corpus?archived=${showArchived}`);
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
    fetchCorpus(viewArchived);
  }, [viewArchived]);

  async function handleArchive(item: CorpusItem, archiveState: boolean) {
    const actionText = archiveState ? "archive" : "unarchive";
    if (!confirm(`Are you sure you want to ${actionText} this prompt?`)) return;
    try {
      const res = await fetch("/api/corpus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          title: item.title,
          prompt: item.prompt,
          improvedVersion: item.improvedVersion,
          category: item.category,
          model: item.model,
          qualityScore: item.qualityScore,
          patterns: item.patterns,
          metadata: item.metadata,
          isArchived: archiveState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCorpusItems((prev) => prev.filter((x) => x.id !== item.id));
        if (detailItem?.id === item.id) setDetailItem(null);
      } else {
        alert(data.error || `Failed to ${actionText} prompt.`);
      }
    } catch {
      alert(`Error trying to ${actionText} prompt.`);
    }
  }

  async function handleRestoreVersion(versionItem: {
    version: number;
    prompt: string;
    improvedVersion: string;
    updatedAt: string;
  }) {
    if (!detailItem) return;
    if (!confirm(`Are you sure you want to restore Version ${versionItem.version}? This will replace the active content.`)) return;
    try {
      const res = await fetch("/api/corpus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: detailItem.id,
          title: detailItem.title,
          prompt: versionItem.prompt,
          improvedVersion: versionItem.improvedVersion,
          category: detailItem.category,
          model: detailItem.model,
          qualityScore: detailItem.qualityScore,
          patterns: detailItem.patterns,
          metadata: detailItem.metadata,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDetailItem(null); // Close modal
        fetchCorpus(viewArchived); // Refresh
        alert("Prompt version restored successfully!");
      } else {
        alert(data.error || "Failed to restore version.");
      }
    } catch {
      alert("Error restoring version.");
    }
  }

  const filteredCorpus = useMemo(() => {
    const filtered = corpusItems.filter((item) => {
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
        ${(item.metadata?.tags || []).join(" ")}
        ${item.metadata?.source?.name || ""}
        ${item.metadata?.curation?.reviewer || ""}
      `.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesCategory && matchesModel && matchesScore && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === "oldest") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === "quality-desc") {
        return b.qualityScore - a.qualityScore;
      }
      if (sortBy === "quality-asc") {
        return a.qualityScore - b.qualityScore;
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
  }, [corpusItems, search, category, selectedModel, minQuality, sortBy]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = corpusItems.length;
    if (total === 0) {
      return {
        avgQuality: 0,
        highQualityCount: 0, // >= 90%
        midQualityCount: 0,  // 80 - 89%
        lowQualityCount: 0,  // < 80%
        categoryBreakdown: {} as Record<string, number>,
        modelBreakdown: {} as Record<string, number>,
        avgOriginalLength: 0,
        avgImprovedLength: 0,
      };
    }

    let totalScore = 0;
    let high = 0;
    let mid = 0;
    let low = 0;
    let origLenSum = 0;
    let impLenSum = 0;

    const catMap: Record<string, number> = {};
    const modMap: Record<string, number> = {};

    corpusItems.forEach((item) => {
      totalScore += item.qualityScore;
      origLenSum += item.prompt.length;
      impLenSum += (item.improvedVersion || "").length;

      if (item.qualityScore >= 90) high++;
      else if (item.qualityScore >= 80) mid++;
      else low++;

      catMap[item.category] = (catMap[item.category] || 0) + 1;
      modMap[item.model] = (modMap[item.model] || 0) + 1;
    });

    return {
      avgQuality: Math.round(totalScore / total),
      highQualityCount: high,
      midQualityCount: mid,
      lowQualityCount: low,
      categoryBreakdown: catMap,
      modelBreakdown: modMap,
      avgOriginalLength: Math.round(origLenSum / total),
      avgImprovedLength: Math.round(impLenSum / total),
    };
  }, [corpusItems]);

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
        if (detailItem?.id === id) setDetailItem(null);
      } else {
        alert(data.error || "Could not delete item");
      }
    } catch {
      alert("Error calling delete API");
    }
  }

  async function handleCreate(e: React.FormEvent, forceBypass = false) {
    e.preventDefault();
    if (!newTitle || !newPrompt) {
      alert("Title and Prompt are required!");
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedMetadata: any = {};
    if (newMetadata) {
      try {
        parsedMetadata = JSON.parse(newMetadata);
      } catch {
        alert("Invalid JSON format in Metadata field.");
        return;
      }
    }

    // Add UI fields into metadata
    parsedMetadata.tags = newTags.split(",").map(t => t.trim()).filter(Boolean);
    parsedMetadata.source = {
      name: newSourceName || undefined,
      url: newSourceUrl || undefined,
    };
    parsedMetadata.curation = {
      reviewer: newReviewerName || undefined,
      reason: newCurationReason || undefined,
    };
    parsedMetadata.approvedDate = new Date().toISOString();

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
          force: forceBypass,
        }),
      });
      
      const data = await res.json();
      if (res.status === 409) {
        if (confirm(`${data.error}\nDo you want to add it anyway (force duplicate)?`)) {
          handleCreate(e, true);
        }
        return;
      }

      if (data.success) {
        setShowCreateModal(false);
        // Reset form
        setNewTitle("");
        setNewPrompt("");
        setNewImproved("");
        setNewPatterns("");
        setNewTags("");
        setNewSourceName("");
        setNewSourceUrl("");
        setNewReviewerName("");
        setNewCurationReason("");
        setNewMetadata("");
        fetchCorpus();
      } else {
        alert(data.error || "Failed to create corpus prompt");
      }
    } catch {
      alert("Error submitting to corpus API");
    }
  }

  function startEditing(item: CorpusItem) {
    setEditItem(item);
    setEditTitle(item.title);
    setEditPrompt(item.prompt);
    setEditImproved(item.improvedVersion);
    setEditCategory(item.category);
    setEditModel(item.model);
    setEditQuality(item.qualityScore);
    setEditPatterns(item.patterns.join(", "));
    setEditTags((item.metadata?.tags || []).join(", "));
    setEditSourceName(item.metadata?.source?.name || "");
    setEditSourceUrl(item.metadata?.source?.url || "");
    setEditReviewerName(item.metadata?.curation?.reviewer || "");
    setEditCurationReason(item.metadata?.curation?.reason || "");
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;

    const tagsArray = editTags.split(",").map(t => t.trim()).filter(Boolean);
    const patternArray = editPatterns.split(",").map(p => p.trim()).filter(Boolean);

    // Keep existing metadata items, update nested metadata elements
    const updatedMetadata = {
      ...editItem.metadata,
      tags: tagsArray,
      source: {
        name: editSourceName || undefined,
        url: editSourceUrl || undefined,
      },
      curation: {
        reviewer: editReviewerName || undefined,
        reason: editCurationReason || undefined,
      },
    };

    try {
      const res = await fetch("/api/corpus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          title: editTitle,
          prompt: editPrompt,
          improvedVersion: editImproved,
          category: editCategory,
          model: editModel,
          qualityScore: Number(editQuality),
          patterns: patternArray,
          metadata: updatedMetadata,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditItem(null);
        fetchCorpus();
      } else {
        alert(data.error || "Failed to update corpus prompt");
      }
    } catch {
      alert("Error updating corpus prompt");
    }
  }

  // Exports
  function exportToJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredCorpus, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "wordsly_corpus_prompts.json");
    dlAnchor.click();
  }

  function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,ID,Title,Category,Model,QualityScore,ApprovedDate,Tags,OriginalPrompt,ImprovedPrompt\n";
    
    filteredCorpus.forEach((item) => {
      const id = item.id;
      const title = `"${item.title.replace(/"/g, '""')}"`;
      const cat = item.category;
      const mod = item.model;
      const score = item.qualityScore;
      const approvedDate = item.metadata?.approvedDate ? new Date(item.metadata.approvedDate).toLocaleDateString() : "";
      const tags = `"${(item.metadata?.tags || []).join(", ").replace(/"/g, '""')}"`;
      const orig = `"${item.prompt.replace(/"/g, '""')}"`;
      const imp = `"${item.improvedVersion.replace(/"/g, '""')}"`;
      
      csvContent += `${id},${title},${cat},${mod},${score},${approvedDate},${tags},${orig},${imp}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", encodedUri);
    dlAnchor.setAttribute("download", "wordsly_corpus_prompts.csv");
    dlAnchor.click();
  }

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
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-2xl bg-blue-500 px-6 py-4 font-black text-white hover:bg-blue-600 transition"
              >
                + Add Curated Prompt
              </button>
              <button
                onClick={() => setShowStatsDrawer(!showStatsDrawer)}
                className="rounded-2xl bg-slate-800 px-6 py-4 font-black text-white hover:bg-slate-700 transition dark:bg-white/10 dark:hover:bg-white/15"
              >
                {showStatsDrawer ? "Hide Stats Dashboard" : "Show Quality Stats"}
              </button>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white dark:border-white/10 dark:bg-white/5">
            <h2 className="text-2xl font-black">Corpus Overview</h2>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs text-slate-400 font-bold">Total Prompts</p>
                <h3 className="text-3xl font-black mt-2">{corpusItems.length}</h3>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs text-slate-400 font-bold">Avg Quality Score</p>
                <h3 className="text-3xl font-black mt-2">{stats.avgQuality}%</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Quality Stats Dashboard */}
        {showStatsDrawer && (
          <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-blue-500/5 p-5 border border-blue-500/10">
              <h3 className="text-sm font-black text-blue-500 mb-3">QUALITY TIERS</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-emerald-500">Tier A (≥90%):</span>
                  <span className="font-black">{stats.highQualityCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-blue-500">Tier B (80-89%):</span>
                  <span className="font-black">{stats.midQualityCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-amber-500">Tier C (&lt;80%):</span>
                  <span className="font-black">{stats.lowQualityCount}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-fuchsia-500/5 p-5 border border-fuchsia-500/10">
              <h3 className="text-sm font-black text-fuchsia-500 mb-3">BY CATEGORIES</h3>
              <div className="space-y-2 text-xs font-bold max-h-[100px] overflow-y-auto">
                {Object.entries(stats.categoryBreakdown).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between">
                    <span>{cat}:</span>
                    <span className="font-black">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-cyan-500/5 p-5 border border-cyan-500/10">
              <h3 className="text-sm font-black text-cyan-500 mb-3">BY TARGET MODEL</h3>
              <div className="space-y-2 text-xs font-bold max-h-[100px] overflow-y-auto">
                {Object.entries(stats.modelBreakdown).map(([mod, val]) => (
                  <div key={mod} className="flex justify-between">
                    <span>{mod}:</span>
                    <span className="font-black">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-emerald-500/5 p-5 border border-emerald-500/10">
              <h3 className="text-sm font-black text-emerald-500 mb-3">AVG PROMPT LENGTH</h3>
              <div className="space-y-2 text-sm font-bold">
                <div className="flex justify-between">
                  <span>Original:</span>
                  <span className="font-black text-slate-500 dark:text-slate-400">{stats.avgOriginalLength} chars</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimized:</span>
                  <span className="font-black text-emerald-500">{stats.avgImprovedLength} chars</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Exporters Section */}
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          {/* Status Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
            <button
              onClick={() => setViewArchived(false)}
              className={`rounded-xl px-5 py-2.5 text-xs font-black transition ${
                !viewArchived 
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-white/5 dark:text-slate-300"
              }`}
            >
              📂 Active Prompts
            </button>
            <button
              onClick={() => setViewArchived(true)}
              className={`rounded-xl px-5 py-2.5 text-xs font-black transition ${
                viewArchived 
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" 
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-white/5 dark:text-slate-300"
              }`}
            >
              📥 Archived Prompts ({viewArchived ? corpusItems.length : "Browse"})
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-black text-slate-500 mb-1">Search Database</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, prompt, patterns, tags..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Model Compatibility</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
              >
                {models.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black outline-none dark:border-white/10 dark:bg-slate-950 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="quality-desc">Quality: High to Low</option>
                <option value="quality-asc">Quality: Low to High</option>
                <option value="title-asc">Title: A to Z</option>
                <option value="title-desc">Title: Z to A</option>
              </select>
            </div>
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

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center flex-wrap gap-3">
            <span className="text-xs font-bold text-slate-500">Filtered Result: {filteredCorpus.length} prompts</span>
            <div className="flex gap-2">
              <button
                onClick={exportToJSON}
                className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2 text-xs font-black hover:bg-slate-800 transition"
              >
                Export JSON
              </button>
              <button
                onClick={exportToCSV}
                className="rounded-xl bg-blue-500 text-white px-4 py-2 text-xs font-black hover:bg-blue-600 transition"
              >
                Export CSV
              </button>
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
                      {item.metadata?.approvedDate && (
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-500">
                          Approved: {new Date(item.metadata.approvedDate).toLocaleDateString()}
                        </span>
                      )}
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
                    {!viewArchived ? (
                      <>
                        <button
                          onClick={() => startEditing(item)}
                          className="rounded-xl bg-blue-500/10 px-4 py-2 text-xs font-black text-blue-500 hover:bg-blue-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleArchive(item, true)}
                          className="rounded-xl bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-500 hover:bg-amber-500/20"
                        >
                          Archive
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleArchive(item, false)}
                        className="rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-500 hover:bg-emerald-500/20"
                      >
                        Unarchive
                      </button>
                    )}
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

                <div className="mt-4 flex flex-wrap gap-4 items-center">
                  {item.patterns && item.patterns.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-slate-500 mb-1">REUSABLE PATTERNS</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.patterns.map((pat) => (
                          <span key={pat} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-500">{pat}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.metadata?.tags && item.metadata.tags.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-slate-500 mb-1">TAGS</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.metadata.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-black text-indigo-500 dark:text-indigo-400">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredCorpus.length === 0 && !loading && (
          <div className="text-center py-12 rounded-[2.5rem] border border-dashed border-slate-300 bg-white/80 dark:border-white/10 dark:bg-white/5">
            <h3 className="text-xl font-black">No prompts matched the active filters</h3>
          </div>
        )}

        {/* Modal: View Details & History */}
        {detailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">{detailItem.category}</span>
                    {detailItem.metadata?.tags?.map((t) => (
                      <span key={t} className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-black text-indigo-500">{t}</span>
                    ))}
                  </div>
                  <h2 className="text-3xl font-black">{detailItem.title}</h2>
                </div>
                <button onClick={() => setDetailItem(null)} className="text-2xl font-black hover:text-red-500">×</button>
              </div>

              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3 text-sm border-b border-slate-200 dark:border-white/10 pb-4">
                  <div>
                    <h4 className="font-black text-slate-500 text-xs">MODEL COMPATIBILITY</h4>
                    <p className="font-bold mt-1">{detailItem.model}</p>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-500 text-xs">APPROVED DATE</h4>
                    <p className="font-bold mt-1">
                      {detailItem.metadata?.approvedDate 
                        ? new Date(detailItem.metadata.approvedDate).toLocaleString() 
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-500 text-xs">CURRENT VERSION</h4>
                    <p className="font-bold mt-1">v{detailItem.metadata?.version || 1}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <h4 className="font-black text-xs text-slate-500 mb-2">ORIGINAL PROMPT</h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{detailItem.prompt}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-500/5 p-4 border border-blue-500/10">
                    <h4 className="font-black text-xs text-blue-500 mb-2">IMPROVED PROMPT</h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{detailItem.improvedVersion}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-white/5">
                    <h4 className="font-black text-xs text-slate-500 mb-2">SOURCE METADATA</h4>
                    {detailItem.metadata?.source?.name ? (
                      <p className="text-sm font-bold">
                        Source: {" "}
                        {detailItem.metadata.source.url ? (
                          <a href={detailItem.metadata.source.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                            {detailItem.metadata.source.name}
                          </a>
                        ) : (
                          detailItem.metadata.source.name
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No source metadata provided</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-white/5">
                    <h4 className="font-black text-xs text-slate-500 mb-2">CURATION DETAILS</h4>
                    {detailItem.metadata?.curation?.reviewer ? (
                      <div className="text-sm">
                        <p className="font-bold">Reviewer: <span className="text-slate-600 dark:text-slate-300">{detailItem.metadata.curation.reviewer}</span></p>
                        {detailItem.metadata.curation.reason && (
                          <p className="mt-1 text-xs text-slate-500 font-semibold">Reason: &quot;{detailItem.metadata.curation.reason}&quot;</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No curation metadata provided</p>
                    )}
                  </div>
                </div>

                {/* Revision Version History section */}
                <div>
                  <h3 className="text-sm font-black text-slate-500 mb-2">REVISION HISTORY</h3>
                  {detailItem.metadata?.versionHistory && detailItem.metadata.versionHistory.length > 0 ? (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                      {detailItem.metadata.versionHistory.map((hist) => (
                        <div key={hist.version} className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-xs bg-slate-50 dark:bg-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-blue-500">Version {hist.version}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400 font-bold">{new Date(hist.updatedAt).toLocaleString()}</span>
                              <button
                                onClick={() => handleRestoreVersion(hist)}
                                className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[10px] font-black text-blue-500 hover:bg-blue-500/20"
                              >
                                Restore
                              </button>
                            </div>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            <div>
                              <p className="font-bold text-slate-500">Prompt:</p>
                              <p className="text-slate-600 dark:text-slate-300 italic truncate">{hist.prompt}</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-500">Improved Version:</p>
                              <p className="text-slate-600 dark:text-slate-300 italic truncate">{hist.improvedVersion}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">This is the original version. No revisions recorded yet.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-500 mb-2">ALL METADATA SCHEMA</h3>
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
            <div className="w-full max-w-3xl rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Add Prompt to Curated Corpus</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-2xl font-black hover:text-red-500">×</button>
              </div>

              <form onSubmit={(e) => handleCreate(e, false)} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-black mb-1">Title *</label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Marketing copy helper"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
                    >
                      {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1">Model Compatibility</label>
                    <select
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black mb-1">Original Prompt *</label>
                    <textarea
                      required
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      placeholder="Paste the raw prompt..."
                      rows={5}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 resize-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1">Improved Version (Optional)</label>
                    <textarea
                      value={newImproved}
                      onChange={(e) => setNewImproved(e.target.value)}
                      placeholder="Paste optimized prompt variant..."
                      rows={5}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 resize-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black mb-1">Patterns (Comma separated)</label>
                    <input
                      value={newPatterns}
                      onChange={(e) => setNewPatterns(e.target.value)}
                      placeholder="e.g. Expert Role, Context Depth, Structure Rules"
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1">Tags (Comma separated)</label>
                    <input
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="e.g. productivity, helper, sql"
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 border-t border-slate-200 dark:border-white/10 pt-3">
                  <div>
                    <h4 className="font-black text-xs text-slate-500 mb-2">SOURCE INFO</h4>
                    <div className="space-y-2">
                      <input
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        placeholder="Source Name (e.g. Reddit)"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 dark:border-white/10 dark:bg-slate-900 font-bold text-xs"
                      />
                      <input
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        placeholder="Source URL"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 dark:border-white/10 dark:bg-slate-900 font-bold text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-500 mb-2">CURATION REVIEW</h4>
                    <div className="space-y-2">
                      <input
                        value={newReviewerName}
                        onChange={(e) => setNewReviewerName(e.target.value)}
                        placeholder="Reviewer Name (e.g. Ines)"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 dark:border-white/10 dark:bg-slate-900 font-bold text-xs"
                      />
                      <input
                        value={newCurationReason}
                        onChange={(e) => setNewCurationReason(e.target.value)}
                        placeholder="Reason for inclusion"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 dark:border-white/10 dark:bg-slate-900 font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Advanced Raw Metadata (JSON, Optional)</label>
                  <textarea
                    value={newMetadata}
                    onChange={(e) => setNewMetadata(e.target.value)}
                    placeholder='e.g. { "originalityScore": 82 }'
                    rows={2}
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

        {/* Modal: Edit Curated Prompt */}
        {editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Edit Curated Prompt (v{editItem.metadata?.version || 1})</h2>
                <button onClick={() => setEditItem(null)} className="text-2xl font-black hover:text-red-500">×</button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-black mb-1">Title *</label>
                  <input
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
                    >
                      {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1">Model Compatibility</label>
                    <select
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
                    >
                      {models.filter(m => m !== "All").map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Quality Score ({editQuality}%)</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={editQuality}
                    onChange={(e) => setEditQuality(Number(e.target.value))}
                    className="w-full cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black mb-1">Original Prompt *</label>
                    <textarea
                      required
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 resize-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1">Improved Version (Optional)</label>
                    <textarea
                      value={editImproved}
                      onChange={(e) => setEditImproved(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 resize-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black mb-1">Patterns (Comma separated)</label>
                    <input
                      value={editPatterns}
                      onChange={(e) => setEditPatterns(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1">Tags (Comma separated)</label>
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-white/10 dark:bg-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 border-t border-slate-200 dark:border-white/10 pt-3">
                  <div>
                    <h4 className="font-black text-xs text-slate-500 mb-2">SOURCE INFO</h4>
                    <div className="space-y-2">
                      <input
                        value={editSourceName}
                        onChange={(e) => setEditSourceName(e.target.value)}
                        placeholder="Source Name"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 dark:border-white/10 dark:bg-slate-900 font-bold text-xs"
                      />
                      <input
                        value={editSourceUrl}
                        onChange={(e) => setEditSourceUrl(e.target.value)}
                        placeholder="Source URL"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 dark:border-white/10 dark:bg-slate-900 font-bold text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-500 mb-2">CURATION REVIEW</h4>
                    <div className="space-y-2">
                      <input
                        value={editReviewerName}
                        onChange={(e) => setEditReviewerName(e.target.value)}
                        placeholder="Reviewer Name"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 dark:border-white/10 dark:bg-slate-900 font-bold text-xs"
                      />
                      <input
                        value={editCurationReason}
                        onChange={(e) => setEditCurationReason(e.target.value)}
                        placeholder="Reason for inclusion"
                        className="w-full rounded-xl border border-slate-300 bg-white p-2 dark:border-white/10 dark:bg-slate-900 font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEditItem(null)}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-600"
                  >
                    Save Changes
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
