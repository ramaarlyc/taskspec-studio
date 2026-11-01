import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Edit3,
  FolderOpen,
  Upload,
  Sparkles,
  X,
  FileCode
} from "lucide-react";

export interface TaskStep {
  id: string;
  path: string;
  task: string;
  done: boolean;
}

export interface EdgeCase {
  trigger: string;
  action: string;
}

export interface DodItem {
  id: string;
  label: string;
  done: boolean;
}

export interface TaskSpecData {
  id: string;
  title: string;
  priority: string;
  targetDate: string;
  assignee: string;
  estimateHours: number;
  problemStatement: string;
  targetOutcome: string;
  inScope: string[];
  outScope: string[];
  steps: TaskStep[];
  edgeCases: EdgeCase[];
  dod: DodItem[];
}

export interface SavedDocRecord {
  docId: string;
  updatedAt: number;
  data: TaskSpecData;
}

const EMPTY_DATA: TaskSpecData = {
  id: "",
  title: "",
  priority: "P2 - Medium",
  targetDate: "",
  assignee: "Rama Arly Cendikiarizky",
  estimateHours: 0,
  problemStatement: "",
  targetOutcome: "",
  inScope: [""],
  outScope: [""],
  steps: [{ id: "s1", path: "", task: "", done: false }],
  edgeCases: [{ trigger: "", action: "" }],
  dod: [{ id: "d1", label: "", done: false }]
};

const TEMPLATES: Record<string, { label: string; data: TaskSpecData }> = {
  blank: {
    label: "Kosong (Blank Canvas)",
    data: EMPTY_DATA
  },
  bugfix: {
    label: "Investigasi & Perbaikan Bug",
    data: {
      id: "BUG-",
      title: "Investigasi dan Penanganan Error Input",
      priority: "P0 - Critical Blocker",
      targetDate: "",
      assignee: "Rama Arly Cendikiarizky",
      estimateHours: 4,
      problemStatement: "Terjadi error unhandled exception saat user mengunggah berkas tanpa header kolom yang sesuai.",
      targetOutcome: "Validasi format berkas sebelum parsing dan notifikasi error yang jelas bagi pengguna.",
      inScope: [
        "Validasi ekstensi dan schema header file",
        "Penambahan safe fallback try-catch",
        "Logging error yang dapat dilacak"
      ],
      outScope: [
        "Pemberian opsi konversi format file otomatis",
        "Redesain total UI form"
      ],
      steps: [
        { id: "s1", path: "src/utils/validator.ts", task: "Buat unit test pengecekan header kolom file", done: false },
        { id: "s2", path: "src/services/parser.ts", task: "Tambahkan validasi boundary sebelum loop pembacaan", done: false }
      ],
      edgeCases: [
        { trigger: "File kosong (0 KB)", action: "Tampilkan toast peringatan dan batalkan proses" },
        { trigger: "Koneksi terputus saat upload", action: "Retry otomatis maksimal 3 kali" }
      ],
      dod: [
        { id: "d1", label: "Unit test validator lulus 100%", done: false },
        { id: "d2", label: "Tidak ada silent fail saat file corrupt diuji", done: false }
      ]
    }
  },
  feature: {
    label: "Pengembangan Fitur / PRD",
    data: {
      id: "FEAT-",
      title: "Implementasi Modul Ekspor Laporan Otomatis",
      priority: "P1 - High",
      targetDate: "",
      assignee: "Rama Arly Cendikiarizky",
      estimateHours: 12,
      problemStatement: "Pengguna membutuhkan ringkasan rekapitulasi data dalam format PDF/Excel siap cetak.",
      targetOutcome: "Tombol cetak dan ekspor menghasilkan berkas yang rapi sesuai format standar perusahaan.",
      inScope: [
        "Pembuatan generator layout tabel PDF",
        "Pengelompokan data berdasarkan kategori dan tanggal",
        "Kompilasi client-side tanpa beban server"
      ],
      outScope: [
        "Pengiriman berkas otomatis via email terjadwal",
        "Penyimpanan arsip di cloud storage pihak ketiga"
      ],
      steps: [
        { id: "s1", path: "src/components/ReportView.tsx", task: "Desain layout tampilan cetak CSS print-friendly", done: false },
        { id: "s2", path: "src/hooks/useExport.ts", task: "Integrasi library pembuat berkas PDF/Excel", done: false }
      ],
      edgeCases: [
        { trigger: "Data berisi lebih dari 1000 baris", action: "Aktifkan pagination tabel saat proses render" }
      ],
      dod: [
        { id: "d1", label: "Tampilan hasil cetak bersih dan tidak terpotong antar halaman", done: false },
        { id: "d2", label: "File hasil unduhan dapat dibuka tanpa corrupt", done: false }
      ]
    }
  },
  automation: {
    label: "Otomasi / RPA Pipeline",
    data: {
      id: "AUTO-",
      title: "Pipeline Otomasi Pencocokan Data Antar Sistem",
      priority: "P1 - High",
      targetDate: "",
      assignee: "Rama Arly Cendikiarizky",
      estimateHours: 16,
      problemStatement: "Rekonsiliasi manual antar dokumen memakan waktu berjam-jam dan rentan kekeliruan ketik.",
      targetOutcome: "Skrip eksekusi otomatis mencocokkan field kunci dan menghasilkan laporan deviasi secara instan.",
      inScope: [
        "Script pembacaan dokumen input terstruktur",
        "Engine logika pencocokan toleransi persentase",
        "Output file rekonsiliasi berformat CSV/Excel"
      ],
      outScope: [
        "Eksekusi auto-approval tanpa review PIC",
        "Integrasi API eksternal non-standar"
      ],
      steps: [
        { id: "s1", path: "scripts/matcher.py", task: "Susun algoritma pencocokan ID referensi dan nominal", done: false },
        { id: "s2", path: "scripts/reporter.py", task: "Generate rekap temuan selisih", done: false }
      ],
      edgeCases: [
        { trigger: "Nomor referensi memiliki spasi/tanda baca ganda", action: "Normalisasi string sebelum perbandingan" }
      ],
      dod: [
        { id: "d1", label: "Akurasi pencocokan 100% pada data sampel uji", done: false },
        { id: "d2", label: "Kecepatan eksekusi di bawah 1 menit per 1000 baris", done: false }
      ]
    }
  }
};

const STORAGE_KEY_ACTIVE = "clean_taskspec_doc_blank";
const STORAGE_KEY_HISTORY = "clean_taskspec_history_v1";

export default function App() {
  const [data, setData] = useState<TaskSpecData>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_ACTIVE);
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

  const [history, setHistory] = useState<SavedDocRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("History parse error", e);
    }
    return [];
  });

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Autosave current document
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(data));
    } catch (e) {
      console.warn("Gagal menyimpan ke localStorage", e);
    }
  }, [data]);

  // Sync to history list on title/id updates
  useEffect(() => {
    const docId = data.id.trim() || "doc_active";

    setHistory((prev) => {
      const existingIdx = prev.findIndex((item) => item.docId === docId || (data.id && item.data.id === data.id));
      const record: SavedDocRecord = {
        docId: docId,
        updatedAt: Date.now(),
        data: data
      };

      let nextList: SavedDocRecord[];
      if (existingIdx >= 0) {
        nextList = [...prev];
        nextList[existingIdx] = record;
      } else {
        nextList = [record, ...prev];
      }

      const trimmed = nextList.slice(0, 20);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
      } catch (err) {
        console.warn("History save error", err);
      }
      return trimmed;
    });
  }, [data.id, data.title, data.problemStatement]);

  const updateField = (field: keyof TaskSpecData, val: any) => {
    setData((prev) => ({ ...prev, [field]: val }));
  };

  const handleReset = () => {
    setData(EMPTY_DATA);
  };

  // Load from template (Fitur 3)
  const handleSelectTemplate = (templateKey: string) => {
    const tpl = TEMPLATES[templateKey];
    if (tpl) {
      setData({ ...tpl.data });
    }
  };

  // Multi-doc history operations (Fitur 1)
  const handleLoadDoc = (record: SavedDocRecord) => {
    setData(record.data);
    setIsHistoryOpen(false);
  };

  const handleDeleteHistoryDoc = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.docId !== docId);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(filtered));
      } catch (err) {
        console.warn("History save error", err);
      }
      return filtered;
    });
  };

  const handleCreateNewDoc = () => {
    setData(EMPTY_DATA);
    setIsHistoryOpen(false);
  };

  // Import JSON / Markdown (Fitur 2)
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          setData({
            ...EMPTY_DATA,
            ...parsed,
            inScope: Array.isArray(parsed.inScope) ? parsed.inScope : [""],
            outScope: Array.isArray(parsed.outScope) ? parsed.outScope : [""],
            steps: Array.isArray(parsed.steps) ? parsed.steps : [{ id: "s1", path: "", task: "", done: false }],
            edgeCases: Array.isArray(parsed.edgeCases) ? parsed.edgeCases : [{ trigger: "", action: "" }],
            dod: Array.isArray(parsed.dod) ? parsed.dod : [{ id: "d1", label: "", done: false }]
          });
          alert("Dokumen JSON berhasil diimpor.");
        } else {
          const lines = text.split("\n");
          let title = "";
          let id = "";
          const firstLine = lines[0] || "";
          if (firstLine.startsWith("#")) {
            const rawTitle = firstLine.replace(/^#+\s*/, "").trim();
            const idMatch = rawTitle.match(/^\[(.*?)\]\s*(.*)$/);
            if (idMatch) {
              id = idMatch[1];
              title = idMatch[2];
            } else {
              title = rawTitle;
            }
          }

          setData((prev) => ({
            ...prev,
            id: id || prev.id,
            title: title || prev.title,
            problemStatement: prev.problemStatement || text.slice(0, 500)
          }));
          alert("Berkas Markdown terbaca dan judul berhasil diekstrak.");
        }
      } catch (err) {
        alert("Gagal membaca berkas: Format tidak valid.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  // Export JSON (Fitur 2)
  const handleExportJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const rawId = data.id || "task";
      const safeId = rawId.replace(new RegExp("[^a-zA-Z0-9_-]", "g"), "_");
      link.href = url;
      link.download = `${safeId}_spec.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Gagal mengekspor JSON", err);
    }
  };

  // List helpers
  const handleArrayChange = (field: "inScope" | "outScope", index: number, value: string) => {
    const list = [...data[field]];
    list[index] = value;
    setData((prev) => ({ ...prev, [field]: list }));
  };

  const addArrayItem = (field: "inScope" | "outScope") => {
    setData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (field: "inScope" | "outScope", index: number) => {
    const list = data[field].filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, [field]: list.length > 0 ? list : [""] }));
  };

  // Steps
  const addStep = () => {
    const newStep: TaskStep = {
      id: "s" + Date.now(),
      path: "",
      task: "",
      done: false
    };
    setData((prev) => ({ ...prev, steps: [...prev.steps, newStep] }));
  };

  const updateStep = (id: string, key: keyof TaskStep, val: any) => {
    setData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, [key]: val } : s))
    }));
  };

  const removeStep = (id: string) => {
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

  const updateEdgeCase = (index: number, key: keyof EdgeCase, val: string) => {
    const list = [...data.edgeCases];
    list[index][key] = val;
    setData((prev) => ({ ...prev, edgeCases: list }));
  };

  const removeEdgeCase = (index: number) => {
    setData((prev) => ({
      ...prev,
      edgeCases: prev.edgeCases.filter((_, i) => i !== index)
    }));
  };

  // DoD
  const addDod = () => {
    const item: DodItem = { id: "d" + Date.now(), label: "", done: false };
    setData((prev) => ({ ...prev, dod: [...prev.dod, item] }));
  };

  const updateDod = (id: string, key: keyof DodItem, val: any) => {
    setData((prev) => ({
      ...prev,
      dod: prev.dod.map((d) => (d.id === id ? { ...d, [key]: val } : d))
    }));
  };

  const removeDod = (id: string) => {
    setData((prev) => ({
      ...prev,
      dod: prev.dod.filter((d) => d.id !== id)
    }));
  };

  // Progress metrics calculation (Fitur 4)
  const stepsTotal = useMemo(() => data.steps.filter((s) => s.task.trim() || s.path.trim()).length, [data.steps]);
  const stepsDone = useMemo(() => data.steps.filter((s) => (s.task.trim() || s.path.trim()) && s.done).length, [data.steps]);
  const stepsPercent = stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : 0;

  const dodTotal = useMemo(() => data.dod.filter((d) => d.label.trim()).length, [data.dod]);
  const dodDone = useMemo(() => data.dod.filter((d) => d.label.trim() && d.done).length, [data.dod]);
  const dodPercent = dodTotal > 0 ? Math.round((dodDone / dodTotal) * 100) : 0;

  const overallPercent = useMemo(() => {
    const totalItems = stepsTotal + dodTotal;
    if (totalItems === 0) return 0;
    return Math.round(((stepsDone + dodDone) / totalItems) * 100);
  }, [stepsTotal, stepsDone, dodTotal, dodDone]);

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
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,.md,.txt"
        className="hidden"
      />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-tight text-stone-900">TaskSpec</span>
          <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">Execution Document Studio</span>
          
          {/* Multi-Doc History Toggle Button */}
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="ml-2 px-2.5 py-1 text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Buka Daftar Riwayat Dokumen"
          >
            <FolderOpen className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Draf</span>
            <span className="bg-stone-200 text-stone-700 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
              {history.length}
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Template Quick Starter Dropdown */}
          <div className="hidden lg:flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleSelectTemplate(e.target.value);
                  e.target.value = "";
                }
              }}
              className="bg-transparent text-stone-700 text-xs focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Pilih Template...</option>
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <option key={key} value={key}>{tpl.label}</option>
              ))}
            </select>
          </div>

          {/* Import / Export JSON */}
          <button
            onClick={handleImportClick}
            className="px-2.5 py-1.5 text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Impor Dokumen (JSON / MD)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Impor</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1.5 text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ekspor Data JSON"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>

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
            className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-rose-600 hover:bg-stone-50 rounded border border-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Kosongkan formulir"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kosongkan</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Tersalin!" : "Salin MD"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1.5 text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Unduh .md"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-2.5 py-1.5 text-xs text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak atau PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </header>

      {/* Multi-Document Drawer Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col p-4 border-l border-stone-200 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-stone-700" />
                <h3 className="font-semibold text-sm text-stone-900">Riwayat Draf Dokumen</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-3 pb-2">
              <button
                onClick={handleCreateNewDoc}
                className="w-full py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Dokumen Baru</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 space-y-1">
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Belum ada draf tersimpan di riwayat.
                </div>
              ) : (
                history.map((item) => {
                  const isActive = data.id === item.data.id && data.title === item.data.title;
                  return (
                    <div
                      key={item.docId}
                      onClick={() => handleLoadDoc(item)}
                      className={`p-2.5 rounded-md cursor-pointer transition-colors flex items-center justify-between group ${
                        isActive ? "bg-stone-100 border border-stone-300" : "hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {item.data.id && (
                            <span className="font-mono text-[10px] px-1 bg-stone-200 text-stone-700 rounded">
                              {item.data.id}
                            </span>
                          )}
                          <h4 className="text-xs font-medium text-stone-900 truncate">
                            {item.data.title || "Spesifikasi Tanpa Judul"}
                          </h4>
                        </div>
                        <p className="text-[10px] text-stone-400">
                          {new Date(item.updatedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteHistoryDoc(e, item.docId)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition-opacity cursor-pointer"
                        title="Hapus draf ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Form Editor Pane */}
        <div className={`space-y-4 ${activeTab === "form" ? "block" : "hidden md:block"}`}>
          {/* Metadata Block */}
          <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3 shadow-xs">
            {/* Mobile Template Selector */}
            <div className="lg:hidden pb-2 border-b border-stone-100 flex items-center justify-between">
              <span className="text-[11px] font-medium text-stone-500">Preset Template:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectTemplate(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs"
                defaultValue=""
              >
                <option value="" disabled>Pilih...</option>
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <option key={key} value={key}>{tpl.label}</option>
                ))}
              </select>
            </div>

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
                  className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer"
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
                      className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
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
                  className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer"
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
                      className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
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
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wide">
                  4. Rencana Langkah Teknis
                </h3>
                {stepsTotal > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                    {stepsDone}/{stepsTotal} ({stepsPercent}%)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={addStep}
                className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer"
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
                      className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
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
                className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer"
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
                      className="p-1 text-stone-400 hover:text-rose-600 mb-0.5 cursor-pointer"
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
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wide">
                  6. Kriteria Selesai (Definition of Done)
                </h3>
                {dodTotal > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                    {dodDone}/{dodTotal} ({dodPercent}%)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={addDod}
                className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer"
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
                    className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
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
            <div className="border-b border-stone-200 pb-4 space-y-3">
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

              {/* Progress Summary Metric (Fitur 4) */}
              {(stepsTotal > 0 || dodTotal > 0) && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                    <span className="font-medium">Total Progres Eksekusi</span>
                    <span className="font-mono font-bold text-stone-900">{overallPercent}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200/80">
                    <div
                      className="bg-stone-900 h-full rounded-full transition-all duration-300"
                      style={{ width: `${overallPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-stone-400 mt-1 font-mono">
                    <span>Langkah: {stepsDone}/{stepsTotal}</span>
                    <span>DoD: {dodDone}/{dodTotal}</span>
                  </div>
                </div>
              )}
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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-900 uppercase tracking-wide text-[11px]">
                  3. Rencana Eksekusi Teknis
                </h3>
                {stepsTotal > 0 && (
                  <span className="text-[10px] font-mono text-stone-500">
                    {stepsDone} dari {stepsTotal} selesai
                  </span>
                )}
              </div>
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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-900 uppercase tracking-wide text-[11px]">
                  5. Kriteria Verifikasi Selesai (DoD)
                </h3>
                {dodTotal > 0 && (
                  <span className="text-[10px] font-mono text-stone-500">
                    {dodDone} dari {dodTotal} selesai
                  </span>
                )}
              </div>
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
