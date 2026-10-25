import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Copy,
  Download,
  Printer,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Eye,
  Edit3
} from "lucide-react";

const EMPTY_DATA = {
  id: "",
  title: "",
  priority: "P2 - Medium",
  targetDate: "",
  assignee: "Rama Arly cendikiarizky",
  estimateHours: 0,
  problemStatement: "",
  targetOutcome: "",
  inScope: [""],
  outScope: [""],
  steps: [{ id: "s1", path: "", task: "", done: false }],
  edgeCases: [{ trigger: "", action: "" }],
  dod: [{ id: "d1", label: "", done: false }]
};

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem("clean_taskspec_doc_blank");
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...EMPTY_DATA,
          ...parsed,
          inScope: Array.isArray(parsed.inScope) ? parsed.inScope : [""],
          outScope: Array.isArray(parsed.outScope) ? parsed.outScope : [""],
          steps: Array.isArray(parsed.steps) ? parsed.steps : [{ id: "s1", path: "", task: "", done: false }],
          edgeCases: Array.isArray(parsed.edgeCases) ? parsed.edgeCases : [{ trigger: "", action: "" }],
          dod: Array.isArray(parsed.dod) ? parsed.dod : [{ id: "d1", label: "", done: false }]
        };
      }
    } catch (e) {
      console.warn("Storage error", e);
    }
    return EMPTY_DATA;
  });

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("form"); // "form" | "preview"

  // Autosave
  useEffect(() => {
    try {
      localStorage.setItem("clean_taskspec_doc_blank", JSON.stringify(data));
    } catch (e) {
      console.warn("Gagal menyimpan ke localStorage", e);
    }
  }, [data]);

  const updateField = (field, val) => {
    setData((prev) => ({ ...prev, [field]: val }));
  };

  const handleReset = () => {
    setData(EMPTY_DATA);
  };

  // List helpers
  const handleArrayChange = (field, index, value) => {
    const list = [...data[field]];
    list[index] = value;
    setData((prev) => ({ ...prev, [field]: list }));
  };

  const addArrayItem = (field) => {
    setData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (field, index) => {
    const list = data[field].filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, [field]: list.length > 0 ? list : [""] }));
  };

  // Steps
  const addStep = () => {
    const newStep = {
      id: "s" + Date.now(),
      path: "",
      task: "",
      done: false
    };
    setData((prev) => ({ ...prev, steps: [...prev.steps, newStep] }));
  };

  const updateStep = (id, key, val) => {
    setData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, [key]: val } : s))
    }));
  };

  const removeStep = (id) => {
    setData((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== id)
    }));
  };

  // Edge Cases
  const addEdgeCase = () => {
    setData((prev) => ({
      ...prev,
      edgeCases: [...prev.edgeCases, { trigger: "", action: "" }]
    }));
  };

  const updateEdgeCase = (index, key, val) => {
    const list = [...data.edgeCases];
    list[index][key] = val;
    setData((prev) => ({ ...prev, edgeCases: list }));
  };

  const removeEdgeCase = (index) => {
    setData((prev) => ({
      ...prev,
      edgeCases: prev.edgeCases.filter((_, i) => i !== index)
    }));
  };

  // DoD
  const addDod = () => {
    const item = { id: "d" + Date.now(), label: "", done: false };
    setData((prev) => ({ ...prev, dod: [...prev.dod, item] }));
  };

  const updateDod = (id, key, val) => {
    setData((prev) => ({
      ...prev,
      dod: prev.dod.map((d) => (d.id === id ? { ...d, [key]: val } : d))
    }));
  };

  const removeDod = (id) => {
    setData((prev) => ({
      ...prev,
      dod: prev.dod.filter((d) => d.id !== id)
    }));
  };

  // Export to Markdown
  const markdownText = useMemo(() => {
    const titleHeader = data.title.trim() ? data.title : "Spesifikasi Tugas";
    const idBadge = data.id.trim() ? `[${data.id}] ` : "";

    let md = `# ${idBadge}${titleHeader}\n\n`;
    md += `**Assignee:** ${data.assignee || "-"} | **Prioritas:** ${data.priority} | **Estimasi:** ${data.estimateHours || 0} Jam\n`;
    if (data.targetDate) md += `**Target Selesai:** ${data.targetDate}\n`;
    md += `\n---\n\n`;

    if (data.problemStatement.trim()) {
      md += `## 1. Masalah / Latar Belakang\n${data.problemStatement}\n\n`;
    }

    if (data.targetOutcome.trim()) {
      md += `## 2. Target Output\n${data.targetOutcome}\n\n`;
    }

    const inScopeFiltered = data.inScope.filter((s) => s.trim().length > 0);
    const outScopeFiltered = data.outScope.filter((s) => s.trim().length > 0);

    if (inScopeFiltered.length > 0 || outScopeFiltered.length > 0) {
      md += `## 3. Batasan Pengerjaan (Scope Guard)\n`;
      if (inScopeFiltered.length > 0) {
        md += `### Wajib Dikerjakan (In-Scope):\n`;
        inScopeFiltered.forEach((item) => {
          md += `- ${item}\n`;
        });
      }
      if (outScopeFiltered.length > 0) {
        md += `\n### Dilarang / Ditunda (Out-of-Scope):\n`;
        outScopeFiltered.forEach((item) => {
          md += `- ${item}\n`;
        });
      }
      md += `\n`;
    }

    const validSteps = data.steps.filter((s) => s.task.trim().length > 0 || s.path.trim().length > 0);
    if (validSteps.length > 0) {
      md += `## 4. Rencana Eksekusi Teknis\n`;
      validSteps.forEach((s) => {
        const check = s.done ? "[x]" : "[ ]";
        const pathPart = s.path.trim() ? `\`${s.path}\`: ` : "";
        md += `- ${check} ${pathPart}${s.task}\n`;
      });
      md += `\n`;
    }

    const validEdges = data.edgeCases.filter((e) => e.trigger.trim().length > 0 || e.action.trim().length > 0);
    if (validEdges.length > 0) {
      md += `## 5. Kondisi Khusus & Penanganan (Edge Cases)\n`;
      md += `| Kondisi / Skenario Error | Penanganan / Fallback |\n`;
      md += `| :--- | :--- |\n`;
      validEdges.forEach((e) => {
        md += `| ${e.trigger || "-"} | ${e.action || "-"} |\n`;
      });
      md += `\n`;
    }

    const validDod = data.dod.filter((d) => d.label.trim().length > 0);
    if (validDod.length > 0) {
      md += `## 6. Kriteria Verifikasi Selesai (Definition of Done)\n`;
      validDod.forEach((d) => {
        const check = d.done ? "[x]" : "[ ]";
        md += `- ${check} ${d.label}\n`;
      });
      md += `\n`;
    }

    return md;
  }, [data]);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(markdownText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      // Use clean string replacement without problematic inline regex literals
      const rawId = data.id || "task";
      const safeId = rawId.replace(new RegExp("[^a-zA-Z0-9_-]", "g"), "_");
      link.href = url;
      link.download = `${safeId}_spec.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Gagal mengunduh berkas", err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col antialiased">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-tight text-stone-900">PRD</span>
          <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">Execution Document Studio</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile view toggle */}
          <div className="flex md:hidden bg-stone-100 p-0.5 rounded border border-stone-200 text-xs">
            <button
              onClick={() => setActiveTab("form")}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 ${
                activeTab === "form" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Input</span>
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 ${
                activeTab === "preview" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>

          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-rose-600 hover:bg-stone-50 rounded border border-stone-200 transition-colors flex items-center gap-1.5"
            title="Kosongkan formulir"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kosongkan</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Tersalin!" : "Salin MD"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1.5 text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded flex items-center gap-1.5 transition-colors"
            title="Unduh .md"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-2.5 py-1.5 text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded flex items-center gap-1.5 transition-colors"
            title="Cetak atau PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </header>

      {/* Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Form Editor Pane */}
        <div className={`space-y-4 ${activeTab === "form" ? "block" : "hidden md:block"}`}>
          {/* Metadata Block */}
          <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3 shadow-xs">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">ID Tiket</label>
                <input
                  type="text"
                  value={data.id}
                  onChange={(e) => updateField("id", e.target.value)}
                  placeholder="Mis: PLN-101"
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5 text-xs font-mono focus:bg-white focus:outline-stone-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Judul Tugas / Fitur</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Judul spesifikasi tugas yang akan dikerjakan..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5 text-xs font-medium focus:bg-white focus:outline-stone-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Prioritas</label>
                <select
                  value={data.priority}
                  onChange={(e) => updateField("priority", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:bg-white focus:outline-stone-400"
                >
                  <option value="P0 - Critical Blocker">P0 - Critical</option>
                  <option value="P1 - High">P1 - High</option>
                  <option value="P2 - Medium">P2 - Medium</option>
                  <option value="P3 - Low">P3 - Low</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Target Selesai</label>
                <input
                  type="date"
                  value={data.targetDate}
                  onChange={(e) => updateField("targetDate", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 text-xs font-mono focus:bg-white focus:outline-stone-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Estimasi (Jam)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={data.estimateHours === 0 ? "" : data.estimateHours}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    updateField("estimateHours", isNaN(parsed) ? 0 : parsed);
                  }}
                  placeholder="0"
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5 text-xs font-mono focus:bg-white focus:outline-stone-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-500 mb-1">Nama Penginput / Assignee</label>
              <input
                type="text"
                value={data.assignee}
                onChange={(e) => updateField("assignee", e.target.value)}
                placeholder="Nama lengkap penginput data..."
                className="w-full bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:bg-white focus:outline-stone-400"
              />
            </div>
          </div>

          {/* Problem & Outcome Block */}
          <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3 shadow-xs">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wide mb-1">
                1. Masalah / Latar Belakang (Problem)
              </label>
              <textarea
                rows={3}
                value={data.problemStatement}
                onChange={(e) => updateField("problemStatement", e.target.value)}
                placeholder="Jelaskan masalah konkret atau kendala yang dihadapi..."
                className="w-full bg-stone-50 border border-stone-200 rounded-md p-2.5 text-xs text-stone-800 leading-relaxed focus:bg-white focus:outline-stone-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wide mb-1">
                2. Target Output (Expected Outcome)
              </label>
              <textarea
                rows={2}
                value={data.targetOutcome}
                onChange={(e) => updateField("targetOutcome", e.target.value)}
                placeholder="Hasil akhir yang diharapkan ketika tugas ini selesai..."
                className="w-full bg-stone-50 border border-stone-200 rounded-md p-2.5 text-xs text-stone-800 leading-relaxed focus:bg-white focus:outline-stone-400"
              />
            </div>
          </div>

          {/* Scope Guard (In-Scope vs Out-of-Scope) */}
          <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-4 shadow-xs">
            <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wide">
              3. Scope Guard (Batasan Kerja)
            </h3>

            {/* In-Scope */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-stone-600">
                  Wajib Dikerjakan (In-Scope):
                </span>
                <button
                  type="button"
                  onClick={() => addArrayItem("inScope")}
                  className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              </div>
              <div className="space-y-1.5">
                {data.inScope.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-xs text-stone-400 w-4 font-mono">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange("inScope", idx, e.target.value)}
                      placeholder="Hal spesifik yang harus dituntaskan..."
                      className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs focus:bg-white focus:outline-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem("inScope", idx)}
                      className="p-1 text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Out-of-Scope */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-stone-600">
                  Dilarang / Ditunda (Out-of-Scope):
                </span>
                <button
                  type="button"
                  onClick={() => addArrayItem("outScope")}
                  className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              </div>
              <div className="space-y-1.5">
                {data.outScope.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-xs text-stone-400 w-4 font-mono">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange("outScope", idx, e.target.value)}
                      placeholder="Hal yang sengaja ditunda agar tidak melebar..."
                      className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs focus:bg-white focus:outline-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem("outScope", idx)}
                      className="p-1 text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Technical Execution Steps */}
          <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wide">
                4. Rencana Langkah Teknis
              </h3>
              <button
                type="button"
                onClick={addStep}
                className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Langkah
              </button>
            </div>

            <div className="space-y-2">
              {data.steps.map((s, index) => (
                <div key={s.id} className="p-2.5 rounded bg-stone-50 border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] font-mono text-stone-400">#{index + 1}</span>
                      <input
                        type="text"
                        value={s.path}
                        onChange={(e) => updateStep(s.id, "path", e.target.value)}
                        placeholder="Path file / Modul (opsional)"
                        className="text-xs font-mono bg-white border border-stone-200 rounded px-2 py-0.5 w-44"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(s.id)}
                      className="p-1 text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={s.task}
                    onChange={(e) => updateStep(s.id, "task", e.target.value)}
                    placeholder="Deskripsi langkah teknis yang akan dieksekusi..."
                    className="w-full text-xs bg-white border border-stone-200 rounded px-2.5 py-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Edge Cases Matrix */}
          <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wide">
                5. Kondisi Khusus & Error (Edge Cases)
              </h3>
              <button
                type="button"
                onClick={addEdgeCase}
                className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Skenario
              </button>
            </div>

            <div className="space-y-2">
              {data.edgeCases.map((edge, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-stone-50 rounded border border-stone-200/80 relative group">
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">Jika Terjadi:</label>
                    <input
                      type="text"
                      value={edge.trigger}
                      onChange={(e) => updateEdgeCase(index, "trigger", e.target.value)}
                      placeholder="Contoh: Nomor IDPEL tidak ditemukan"
                      className="w-full text-xs bg-white border border-stone-200 rounded px-2 py-1"
                    />
                  </div>
                  <div className="flex items-end gap-1.5">
                    <div className="flex-1">
                      <label className="block text-[10px] text-stone-400 mb-0.5">Penanganan / Fallback:</label>
                      <input
                        type="text"
                        value={edge.action}
                        onChange={(e) => updateEdgeCase(index, "action", e.target.value)}
                        placeholder="Contoh: Tandai status dan catat log error"
                        className="w-full text-xs bg-white border border-stone-200 rounded px-2 py-1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEdgeCase(index)}
                      className="p-1 text-stone-400 hover:text-rose-600 mb-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Definition of Done (DoD) */}
          <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wide">
                6. Kriteria Selesai (Definition of Done)
              </h3>
              <button
                type="button"
                onClick={addDod}
                className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Kriteria
              </button>
            </div>

            <div className="space-y-1.5">
              {data.dod.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateDod(item.id, "label", e.target.value)}
                    placeholder="Contoh: Semua baris data telah divalidasi tanpa error"
                    className="flex-1 bg-stone-50 border border-stone-200 rounded px-2.5 py-1 text-xs focus:bg-white focus:outline-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeDod(item.id)}
                    className="p-1 text-stone-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Document Preview Sheet */}
        <div className={`sticky top-16 ${activeTab === "preview" ? "block" : "hidden md:block"}`}>
          <div className="bg-white rounded-lg border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6 print:p-0 print:border-none print:shadow-none">
            {/* Header / Meta */}
            <div className="border-b border-stone-200 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-stone-500">
                  {data.id ? data.id : "ID TIKET"}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700">
                  {data.priority}
                </span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                {data.title || "Spesifikasi Tugas Baru"}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 pt-1">
                <span>
                  Assignee: <strong className="text-stone-800">{data.assignee || "-"}</strong>
                </span>
                <span>
                  Estimasi: <strong className="text-stone-800">{data.estimateHours || 0} Jam</strong>
                </span>
                {data.targetDate && (
                  <span>
                    Target: <strong className="text-stone-800">{data.targetDate}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* 1. Problem & Outcome */}
            {(data.problemStatement.trim() || data.targetOutcome.trim()) && (
              <section className="space-y-3 text-xs leading-relaxed">
                {data.problemStatement.trim() && (
                  <div>
                    <h3 className="font-semibold text-stone-900 uppercase tracking-wide text-[11px] mb-1">
                      1. Masalah / Latar Belakang
                    </h3>
                    <p className="text-stone-700 whitespace-pre-line bg-stone-50 p-2.5 rounded border border-stone-100">
                      {data.problemStatement}
                    </p>
                  </div>
                )}
                {data.targetOutcome.trim() && (
                  <div>
                    <h3 className="font-semibold text-stone-900 uppercase tracking-wide text-[11px] mb-1">
                      2. Target Output
                    </h3>
                    <p className="text-stone-700 whitespace-pre-line bg-stone-50 p-2.5 rounded border border-stone-100">
                      {data.targetOutcome}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* 2. Scope Guard */}
            {(data.inScope.some((s) => s.trim()) || data.outScope.some((s) => s.trim())) && (
              <section className="space-y-2 text-xs">
                <h3 className="font-semibold text-stone-900 uppercase tracking-wide text-[11px]">
                  Batasan Pengerjaan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {data.inScope.some((s) => s.trim()) && (
                    <div className="bg-stone-50 p-2.5 rounded border border-stone-200/80">
                      <span className="font-semibold text-stone-800 text-[11px] block mb-1">
                        In-Scope (Dikerjakan):
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-stone-700">
                        {data.inScope
                          .filter((s) => s.trim())
                          .map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {data.outScope.some((s) => s.trim()) && (
                    <div className="bg-stone-50 p-2.5 rounded border border-stone-200/80">
                      <span className="font-semibold text-stone-600 text-[11px] block mb-1">
                        Out-of-Scope (Ditunda):
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-stone-500">
                        {data.outScope
                          .filter((s) => s.trim())
                          .map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 3. Steps Checklist */}
            <section className="space-y-2 text-xs">
              <h3 className="font-semibold text-stone-900 uppercase tracking-wide text-[11px]">
                3. Rencana Eksekusi Teknis
              </h3>
              <div className="space-y-1.5 pt-1">
                {data.steps.some((s) => s.task.trim() || s.path.trim()) ? (
                  data.steps
                    .filter((s) => s.task.trim() || s.path.trim())
                    .map((s) => (
                      <div
                        key={s.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => updateStep(s.id, "done", !s.done)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            updateStep(s.id, "done", !s.done);
                          }
                        }}
                        className="flex items-start gap-2 p-2 rounded hover:bg-stone-50 cursor-pointer border border-stone-100 select-none focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                      >
                        <span className="mt-0.5 text-stone-400">
                          {s.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-stone-800" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <div className="flex-1">
                          {s.path && (
                            <code className="text-[11px] font-mono font-medium text-stone-700 mr-2 bg-stone-100 px-1.5 py-0.5 rounded">
                              {s.path}
                            </code>
                          )}
                          <span className={s.done ? "line-through text-stone-400" : "text-stone-800"}>
                            {s.task}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-stone-400 italic p-2 bg-stone-50 rounded border border-dashed border-stone-200">
                    Belum ada langkah pengerjaan yang ditambahkan.
                  </p>
                )}
              </div>
            </section>

            {/* 4. Edge Cases */}
            {data.edgeCases.some((e) => e.trigger.trim() || e.action.trim()) && (
              <section className="space-y-2 text-xs">
                <h3 className="font-semibold text-stone-900 uppercase tracking-wide text-[11px]">
                  4. Kondisi Khusus & Error
                </h3>
                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase text-stone-500 font-mono">
                      <tr>
                        <th className="p-2">Jika Terjadi</th>
                        <th className="p-2">Penanganan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {data.edgeCases
                        .filter((e) => e.trigger.trim() || e.action.trim())
                        .map((edge, i) => (
                          <tr key={i}>
                            <td className="p-2 font-medium">{edge.trigger || "-"}</td>
                            <td className="p-2 text-stone-600">{edge.action || "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 5. Definition of Done */}
            <section className="space-y-2 text-xs">
              <h3 className="font-semibold text-stone-900 uppercase tracking-wide text-[11px]">
                5. Kriteria Verifikasi Selesai (DoD)
              </h3>
              <div className="space-y-1 pt-1">
                {data.dod.some((d) => d.label.trim()) ? (
                  data.dod
                    .filter((d) => d.label.trim())
                    .map((d) => (
                      <div
                        key={d.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => updateDod(d.id, "done", !d.done)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            updateDod(d.id, "done", !d.done);
                          }
                        }}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-stone-50 cursor-pointer select-none focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                      >
                        <span className="text-stone-400">
                          {d.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-stone-800" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <span className={d.done ? "line-through text-stone-400" : "text-stone-700"}>
                          {d.label}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-stone-400 italic p-2 bg-stone-50 rounded border border-dashed border-stone-200">
                    Belum ada kriteria selesai (DoD) yang ditentukan.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}