import React from "react";
import { useSettings } from "../../lib/SettingsContext";
import { Palette, Check, Sparkles, AlertCircle } from "lucide-react";

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

export default function AdminThemes() {
  const { settings, updateSettings } = useSettings();

  if (!settings) return <div className="p-4">Loading settings...</div>;

  const currentBgColor = settings.display.bgColor || "#f3f4f6";
  const currentBoxColor = settings.display.boxColor || "#ffffff";
  const currentLeftBg = settings.display.leftBgImage || "";

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

  const activePresetId = getSelectedPresetId();

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-100 p-2.5 rounded-lg text-blue-700">
          <Palette className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-sans">Ubah Desain Tampilan</h2>
          <p className="text-sm text-gray-500">Pilih dari galeri desain profesional yang kami buatkan khusus untuk Masjid Anda</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex gap-3 text-sm mb-8 mt-4">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Tema Otomatis & Cerdas: </span>
          Semua template di bawah mengatur warna latar utama, warna kotak jadwal, dan gambar poster masjid sebelah kiri dalam satu kali klik. Warna teks pada layar utama juga otomatis beradaptasi kontras agar selalu terbaca sangat terang bahkan di TV jauh!
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Manual styling fallback indicator */}
      <div className="mt-8 border-t border-gray-200/80 pt-6 text-center text-xs text-gray-400">
        Jika Anda ingin menyesuaikan warna secara manual kustom satu per satu, silakan masuk ke menu <span className="font-semibold text-gray-500">Media & Slides</span>.
      </div>
    </div>
  );
}
