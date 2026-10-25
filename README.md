# TaskSpec Studio 📋

Interactive PRD (Product Requirement Document) & Technical Task Specification Studio.

Live Web App: **[https://ramaarlyc.github.io/taskspec-studio/](https://ramaarlyc.github.io/taskspec-studio/)**

## Fitur Utama

- 📝 **Live Form Editor & Document Preview**: Isi spesifikasi tugas dengan visualisasi dokumen real-time.
- 💾 **Autosave LocalStorage**: Data tersimpan otomatis di browser tanpa khawatir hilang saat refresh.
- 🎯 **Scope Guard Matrix**: Pemisahan jelas antara hal yang wajib dikerjakan (*In-Scope*) dan ditunda (*Out-of-Scope*).
- ⚙️ **Technical Execution Steps**: Rencana teknis modular per path berkas / modul dengan checkbox progres.
- ⚠️ **Edge Cases Matrix**: Pencatatan skenario error dan mitigasi/fallback penanganannya.
- ✅ **Definition of Done (DoD)**: Kriteria checklist verifikasi selesai.
- 📤 **Export Serbaguna**: Salin Markdown (MD), unduh file `.md`, dan cetak / simpan ke PDF.

## Struktur Berkas

- `taskspec_studio.tsx`: Berkas komponen sumber utama React.
- `index.html`: Aplikasi web standalone siap jalan (GitHub Pages).
- `src/`: Source code React + Tailwind CSS.
- `package.json`: Konfigurasi dependensi dan skrip build.

## Pengembangan Lokal

```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Kompilasi rilis produksi
npm run build
```
