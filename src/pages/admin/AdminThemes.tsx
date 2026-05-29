import React from "react";
import { useSettings } from "../../lib/SettingsContext";
import { Palette, Check, Sparkles, AlertCircle, LayoutGrid, Tv2 } from "lucide-react";

interface DesignPreset {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  boxColor: string;
  leftBgImage: string;
  textColorPreset: "dark" | "light";
  primaryBadge: string;
  previewColors: string[];
}

const THEME_PRESETS: DesignPreset[] = [
  {
    id: "emerald_royal",
    name: "Emerald Royal Masjid (Klasik)",
    description: "Desain hijau kubah masjid agung tradisional yang damai, khusyuk, dan menenangkan mata jemaah.",
    bgColor: "#f0fdf4", // Soft green tint
    boxColor: "#ffffff",
    leftBgImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2074&auto=format&fit=crop",
    textColorPreset: "dark",
    primaryBadge: "Menenangkan",
    previewColors: ["#059669", "#10b981", "#ffffff", "#f0fdf4"]
  },
  {
    id: "midnight_calm",
    name: "Midnight Blue (Malam Syahdu)",
    description: "Sangat elegan dengan balutan warna biru tua gelap dan emas yang tajam. Ideal untuk layar Smart-TV modern beresolusi tinggi.",
    bgColor: "#0f172a", // Deep navy/slate
    boxColor: "#1e293b", // Slate card
    leftBgImage: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=2071&auto=format&fit=crop",
    textColorPreset: "light",
    primaryBadge: "Sangat Rekomendasi",
    previewColors: ["#0f172a", "#1e293b", "#e2e8f0", "#f59e0b"]
  },
  {
    id: "makkah_sand",
    name: "Baitullah Warm Sand (Senja Emas)",
    description: "Warna krem pasir gundukan hangat dan pancaran matahari terbenam Ka'bah di Makkah Al-Mukarramah.",
    bgColor: "#fffbeb", // Sandy amber/yellow tint
    boxColor: "#ffffff",
    leftBgImage: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=2070&auto=format&fit=crop",
    textColorPreset: "dark",
    primaryBadge: "Favorit",
    previewColors: ["#b45309", "#d97706", "#ffffff", "#fffbeb"]
  },
  {
    id: "pristine_minimalist",
    name: "Pristine White (Minimalis Putih)",
    description: "Desain moderen berpola bersih, putih susu murni dipadu aksen abu-abu muda. Terlihat sangat bersih dan lapang.",
    bgColor: "#fafafa",
    boxColor: "#ffffff",
    leftBgImage: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=1964&auto=format&fit=crop",
    textColorPreset: "dark",
    primaryBadge: "Modern",
    previewColors: ["#1f2937", "#4b5563", "#ffffff", "#f4f4f5"]
  },
  {
    id: "cyber_space",
    name: "Futuristic Cyber Dark (Edisi TV Layar Lebar)",
    description: "Gaya futuristis bernuansa hitam legam (AMOLED pitch black) dengan aksen hijau neon menyala untuk keterbacaan super tinggi.",
    bgColor: "#090d16",
    boxColor: "#111827",
    leftBgImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop",
    textColorPreset: "light",
    primaryBadge: "Layar TV Tajam",
    previewColors: ["#090d16", "#111827", "#10b981", "#ffffff"]
  },
  {
    id: "serene_turqoise",
    name: "Kubah Tosca Sejuk (Turquoise Dome)",
    description: "Warna tosca kombinasi putih dan biru laut dangkal yang memberikan kesan sejuk di dalam rumah ibadah.",
    bgColor: "#eafbfa",
    boxColor: "#ffffff",
    leftBgImage: "https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=2070&auto=format&fit=crop",
    textColorPreset: "dark",
    primaryBadge: "Menyegarkan Berwarna",
    previewColors: ["#0d9488", "#06b6d4", "#ffffff", "#e0f2fe"]
  }
];

interface LayoutTemplatePreset {
  id: string;
  name: string;
  description: string;
  badge: string;
}

const LAYOUT_PRESETS: LayoutTemplatePreset[] = [
  {
    id: "classic",
    name: "Classic Split (Jadwal Kiri, Slide Kanan)",
    description: "Tata letak seimbang paling populer. Bagian kiri memuat foto masjid & daftar tabel waktu sholat vertikal, bagian kanan mutlak untuk penayangan slide informasi.",
    badge: "Tata Letak Default"
  },
  {
    id: "sidebar-right",
    name: "Inverted Split (Slide Kiri, Jadwal Kanan)",
    description: "Menukar fokus penglihatan dengan menempatkan slide media slideshow besar di sebelah kiri, sedangkan modul tabel jadwal sholat di sisi kanan.",
    badge: "Moderen Seimbang"
  },
  {
    id: "modern-grid",
    name: "Bento Grid Dashboard Layout",
    description: "Desain asimetris bernuansa digital modern. Slide media tampil megah berdampingan dengan kotak jadwal berbentuk grid bento di sampingnya.",
    badge: "Modern & Kreatif"
  },
  {
    id: "minimal-elegant",
    name: "Minimalist Fullscreen Video & Overlays",
    description: "Merubah seluruh layar latar belakang sebagai bingkai pemutaran slide penuh (Fullscreen background), dengan info jam & jadwal diletakkan melayang transparan di atasnya.",
    badge: "Maksimal Sinematik"
  },
  {
    id: "boxed-bottom-schedule",
    name: "Split Jam Digital & Jadwal Horizontal",
    description: "Desain layout TV terbaru mirip Layout 05: jam digital kalender di bagian kanan atas info masjid, slide media di tengah dominan, serta susunan waktu sholat mendatar (horizontal) solid di bagian bawah.",
    badge: "Visual Terbaru"
  }
];

export default function AdminThemes() {
  const { settings, updateSettings } = useSettings();

  if (!settings) return <div className="p-4">Loading settings...</div>;

  const currentBgColor = settings.display.bgColor || "#f3f4f6";
  const currentBoxColor = settings.display.boxColor || "#ffffff";
  const currentLeftBg = settings.display.leftBgImage || "";
  const currentLayout = settings.display.layoutTemplate || "classic";

  // Helper to determine active theme match
  const getSelectedPresetId = () => {
    const matched = THEME_PRESETS.find(
      (p) =>
        p.bgColor.toLowerCase() === currentBgColor.toLowerCase() &&
        p.boxColor.toLowerCase() === currentBoxColor.toLowerCase()
    );
    return matched ? matched.id : "manual";
  };

  const handleApplyPreset = (preset: DesignPreset) => {
    updateSettings({
      display: {
        ...settings.display,
        bgColor: preset.bgColor,
        boxColor: preset.boxColor,
        leftBgImage: preset.leftBgImage,
      },
    });
    alert(`🎉 Desain "${preset.name}" berhasil diterapkan secara global!`);
  };

  const handleApplyLayout = (layoutId: string) => {
    updateSettings({
      display: {
        ...settings.display,
        layoutTemplate: layoutId
      }
    });
    alert(`📐 Tata Letak Tampilan berhasil diubah menjadi "${layoutId.toUpperCase()}"!`);
  };

  const activePresetId = getSelectedPresetId();

  return (
    <div className="max-w-6xl pb-16">
      {/* SECTION 1: COLOR THEME PRESETS */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-100 p-2.5 rounded-lg text-blue-700">
          <Palette className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-sans">1. Pilih Tema Warna Display</h2>
          <p className="text-sm text-gray-500">Pilih dari galeri desain profesional yang kami buatkan khusus untuk Masjid Anda</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex gap-3 text-sm mb-6 mt-4">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Tema Otomatis & Cerdas: </span>
          Semua template di bawah mengatur warna latar utama, warna kotak jadwal, dan gambar poster masjid sebelah kiri dalam satu kali klik. Warna teks pada layar utama juga otomatis beradaptasi kontras agar selalu terbaca sangat terang bahkan di TV jauh!
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {THEME_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <div
              key={preset.id}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col justify-between transition-all duration-350 relative ${
                isActive
                  ? "ring-4 ring-blue-500 border-transparent shadow-md scale-[1.01]"
                  : "border-gray-200/80 hover:border-gray-300 hover:shadow"
              }`}
            >
              {/* Highlight badge for selected */}
              {isActive && (
                <div className="absolute top-3 right-3 z-10 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wide">
                  <Check className="w-3 h-3" /> Dipakai
                </div>
              )}

              {/* Card visual mockup top section */}
              <div className="relative h-40 bg-gray-100 overflow-hidden shrink-0 select-none">
                <img
                  src={preset.leftBgImage}
                  alt={preset.name}
                  className="w-full h-full object-cover brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-between p-4">
                  <span className="self-start text-[10px] font-extrabold bg-white/15 backdrop-blur-md text-white px-2 py-0.5 rounded border border-white/20 uppercase tracking-widest">
                    {preset.primaryBadge}
                  </span>
                  
                  {/* Small visual preview bar */}
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[10px] font-mono text-gray-300">Warna Palette:</span>
                    <div className="flex gap-1">
                      {preset.previewColors.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-gray-900 text-base leading-tight uppercase font-sans">
                    {preset.name}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-normal">
                    {preset.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase transition tracking-wider flex items-center justify-center gap-1.5 ${
                    isActive
                      ? "bg-slate-100 text-slate-700 cursor-default"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  }`}
                  disabled={isActive}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isActive ? "Desain Aktif" : "Pasang Desain Ini"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2: DYNAMIC LAYOUT TEMPLATE SELECTOR */}
      <div className="flex items-center gap-3 mb-2 border-t border-gray-100 pt-8">
        <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-700">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-sans">2. Ubah Tata Letak Posisi Display</h2>
          <p className="text-sm text-gray-500">Sesuaikan penempatan posisi slide dokumentasi, table jadwal sholat, info jam, dan banner digital masjid</p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex gap-3 text-sm mb-6 mt-4">
        <Tv2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Live Preview Miniatur: </span>
          Silakan perhatikan petunjuk visual skema struktur bento di setiap item sebelum menentukan pilihan terbaik bagi tata letak layar atau Smart-TV masjid Anda.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LAYOUT_PRESETS.map((tmpl) => {
          const isSelected = currentLayout === tmpl.id;
          return (
            <div
              key={tmpl.id}
              className={`bg-white rounded-2xl shadow-sm border p-5 flex flex-col justify-between transition-all duration-350 ${
                isSelected
                  ? "ring-4 ring-emerald-500 border-transparent shadow-md bg-emerald-50/5"
                  : "border-gray-200/80 hover:border-gray-300 hover:shadow"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isSelected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {tmpl.badge}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <Check className="w-3 h-3" /> Sangat Aktif
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-gray-900 text-base mb-1.5 uppercase font-sans">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  {tmpl.description}
                </p>

                {/* VISUAL LAYOUT PREVIEW PANEL (Interactive rendered miniature blueprint) */}
                <div className="border border-gray-200/90 rounded-2xl p-3 bg-gray-50 flex flex-col h-32 w-full justify-between mb-4 shadow-inner relative overflow-hidden select-none">
                  {/* Miniature header line */}
                  <div className="flex justify-between items-center bg-zinc-800 text-white h-4 px-2 rounded-md shrink-0">
                    <div className="flex items-center gap-0.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
                      <span className="text-[6px] text-zinc-400 font-mono">05:14</span>
                    </div>
                    <span className="text-[6px] font-black uppercase text-amber-400 max-w-[40%] truncate">BAITURRAHMAN</span>
                    <span className="text-[5px] text-emerald-400 font-mono">29 Syaf</span>
                  </div>

                  {/* Miniature Body containers depending on selected template */}
                  <div className="flex-1 flex gap-1.5 my-1.5 min-h-0">
                    {tmpl.id === 'classic' && (
                      <>
                        {/* Left column: prayer schedules */}
                        <div className="w-[30%] bg-emerald-700/85 rounded-lg flex flex-col justify-between p-1 shrink-0 animate-fadeIn">
                          <div className="h-0.5 bg-white/30 rounded w-full" />
                          <div className="h-0.5 bg-white/35 rounded w-full" />
                          <div className="h-0.5 bg-white/30 rounded w-full" />
                          <div className="h-0.5 bg-emerald-400/80 rounded w-full animate-pulse" />
                          <div className="h-0.5 bg-white/30 rounded w-full" />
                        </div>
                        {/* Right column: slides slideshow container */}
                        <div className="flex-1 bg-sky-950 rounded-lg flex flex-col items-center justify-center p-1 relative text-center">
                          <div className="w-full h-full bg-cover bg-center rounded opacity-40" style={{ backgroundImage: `url(${currentLeftBg})` }} />
                          <div className="absolute inset-0 flex items-center justify-center text-[7px] text-white font-extrabold tracking-wide uppercase">MEDIA PREVIEW</div>
                        </div>
                      </>
                    )}

                    {tmpl.id === 'sidebar-right' && (
                      <>
                        {/* Left column: slides slideshow container */}
                        <div className="flex-1 bg-sky-950 rounded-lg flex flex-col items-center justify-center p-1 relative text-center">
                          <div className="w-full h-full bg-cover bg-center rounded opacity-40" style={{ backgroundImage: `url(${currentLeftBg})` }} />
                          <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center text-[7px] text-white font-extrabold tracking-wide uppercase">MEDIA PREVIEW</div>
                        </div>
                        {/* Right column: prayer schedules */}
                        <div className="w-[30%] bg-emerald-700/85 rounded-lg flex flex-col justify-between p-1 shrink-0 animate-fadeIn">
                          <div className="h-0.5 bg-white/30 rounded w-full" />
                          <div className="h-0.5 bg-white/35 rounded w-full" />
                          <div className="h-0.5 bg-white/30 rounded w-full" />
                          <div className="h-0.5 bg-emerald-400/80 rounded w-full animate-pulse" />
                          <div className="h-0.5 bg-white/30 rounded w-full" />
                        </div>
                      </>
                    )}

                    {tmpl.id === 'modern-grid' && (
                      <>
                        {/* Left column: media slides preview */}
                        <div className="w-[55%] bg-sky-950 rounded-lg flex flex-col items-center justify-center p-1 relative text-center">
                          <div className="w-full h-full bg-cover bg-center rounded opacity-30" style={{ backgroundImage: `url(${currentLeftBg})` }} />
                          <div className="absolute inset-0 flex items-center justify-center text-[6px] text-white font-extrabold tracking-wide uppercase">SLIDESHOW</div>
                        </div>
                        {/* Right column: grid layout styles */}
                        <div className="w-[45%] grid grid-cols-2 gap-0.5 bg-emerald-950/20 p-1 rounded-lg shrink-0 overflow-hidden">
                          <div className="bg-emerald-600 rounded-sm h-full" />
                          <div className="bg-emerald-600 rounded-sm h-full" />
                          <div className="bg-emerald-600 rounded-sm h-full" />
                          <div className="bg-amber-500 rounded-sm h-full animate-pulse" />
                          <div className="bg-emerald-600 rounded-sm h-full" />
                          <div className="bg-emerald-600 rounded-sm h-full" />
                        </div>
                      </>
                    )}

                    {tmpl.id === 'minimal-elegant' && (
                      <div className="w-full bg-sky-950 rounded-lg flex flex-col justify-between p-1.5 relative text-center overflow-hidden">
                        <div className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${currentLeftBg})` }} />
                        <div className="relative z-10 flex justify-between items-center text-[5px] text-white bg-black/40 p-0.5 rounded-sm">
                          <span>🕌 KABAR UTAMA</span>
                          <span>HARI INI</span>
                        </div>
                        <div className="relative z-10 text-[7px] text-white font-black tracking-widest uppercase">PEMUTARAN FULLSCREEN</div>
                        {/* Transparent floating indicators */}
                        <div className="relative z-10 flex gap-0.5 justify-around w-full bg-black/60 p-0.5 rounded-sm">
                          <div className="w-2 h-1 bg-emerald-500 rounded-sm" />
                          <div className="w-2 h-1 bg-emerald-500 rounded-sm" />
                          <div className="w-2 h-1 bg-emerald-500 rounded-sm" />
                          <div className="w-2 h-1 bg-amber-500 rounded-sm" />
                          <div className="w-2 h-1 bg-emerald-500 rounded-sm" />
                        </div>
                      </div>
                    )}

                    {tmpl.id === 'boxed-bottom-schedule' && (
                      <div className="w-full bg-white rounded-lg flex flex-col p-1 gap-1 relative overflow-hidden">
                        {/* Top: Header left & digital clock right */}
                        <div className="flex justify-between items-start bg-emerald-900 border-2 border-amber-500 text-white rounded p-0.5 shadow">
                           <div className="text-[4px] font-bold">🕌 Masjid Abu Bakar</div>
                           <div className="text-[6px] font-black font-mono">08:30 <span className="text-[4px]">29 Okt 2025</span></div>
                        </div>
                        {/* Middle: Media Area */}
                        <div className="flex-1 bg-sky-950 rounded flex items-center justify-center relative text-center shadow-inner overflow-hidden">
                          <div className="absolute inset-0 w-full h-full bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${currentLeftBg})` }} />
                          <div className="relative z-10 text-[6px] text-white font-black tracking-widest uppercase items-center drop-shadow-md">MEDIA SLIDE / VIDEO</div>
                        </div>
                        {/* Bottom: Horizontal schedules */}
                        <div className="flex gap-0.5 w-full bg-slate-100 rounded-sm p-0.5 shrink-0 justify-between items-center shadow-inner h-3">
                          <div className="flex-1 h-full bg-red-600 rounded-sm" />
                          <div className="flex-1 h-full bg-amber-600 rounded-sm" />
                          <div className="flex-1 h-full bg-blue-600 rounded-sm" />
                          <div className="flex-1 h-full bg-emerald-600 rounded-sm" />
                          <div className="flex-1 h-full bg-purple-600 rounded-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Running text footer banner */}
                  <div className="bg-emerald-600 text-[5px] text-white font-mono px-1 h-3 rounded flex items-center overflow-hidden shrink-0">
                    <span className="font-extrabold mr-1 border-r border-white/20 pr-1 shrink-0">RODA</span>
                    <marquee className="text-white/80 shrink-0">Silakan luruskan shaf sholat berjemaah...</marquee>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyLayout(tmpl.id)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase transition tracking-wider flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-100 text-slate-700 cursor-default"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                }`}
                disabled={isSelected}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {isSelected ? "Tata Letak Aktif" : "Pasang Posisi Ini"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Manual styling fallback indicator */}
      <div className="mt-12 border-t border-gray-200/80 pt-6 text-center text-xs text-gray-400">
        Jika Anda ingin menyesuaikan warna secara manual kustom satu per satu, silakan masuk ke menu <span className="font-semibold text-gray-500">Media & Slides</span>.
      </div>
    </div>
  );
}
