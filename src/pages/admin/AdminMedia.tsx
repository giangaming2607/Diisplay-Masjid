import React, { useState, useEffect } from "react";
import { useSettings } from "../../lib/SettingsContext";
import { Save, UploadCloud, Trash2, Image as ImageIcon, Film, Palette, Maximize, Check, Plus, Link2 } from "lucide-react";
import { saveLocalFile, deleteLocalFile } from "../../lib/indexedDB";

export default function AdminMedia() {
  const { settings, updateSettings } = useSettings();
  const [mode, setMode] = useState<any>("mixed");
  const [slideDuration, setSlideDuration] = useState(10);
  const [slides, setSlides] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [leftBgImage, setLeftBgImage] = useState("");
  const [mediaFullScreen, setMediaFullScreen] = useState(false);
  const [bgColor, setBgColor] = useState("#f3f4f6");
  const [boxColor, setBoxColor] = useState("#ffffff");
  const [manualSlideUrl, setManualSlideUrl] = useState("");
  const [manualVideoUrl, setManualVideoUrl] = useState("");

  useEffect(() => {
    if (settings) {
      setMode(settings.display.mode);
      setSlideDuration(settings.display.slideDuration);
      setSlides(settings.slides || []);
      setVideos(settings.videos || []);
      setLeftBgImage(settings.display.leftBgImage || "https://images.unsplash.com/photo-1564683214964-b31c0ee611fc?q=80&w=2070&auto=format&fit=crop");
      setMediaFullScreen(!!settings.display.mediaFullScreen);
      setBgColor(settings.display.bgColor || "#f3f4f6");
      setBoxColor(settings.display.boxColor || "#ffffff");
    }
  }, [settings]);

  if (!settings) return <div className="p-6 text-gray-500">Memuat pengaturan...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      display: {
        ...settings.display,
        mode,
        slideDuration,
        leftBgImage,
        mediaFullScreen,
        bgColor,
        boxColor,
      },
      slides,
      videos,
    });
    alert("Semua Pengaturan Media & Tampilan Berhasil Disimpan!");
  };

  const compressImage = (file: File, maxWidth = 1080, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'slide' | 'video' | 'leftBg') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size limit (Batas maksimal 1 GB sesuai permintaan user)
    if (type === 'video' && file.size > 1024 * 1024 * 1024) {
      alert("⚠️ Video melebihi batas maksimal 1 GB!");
      return;
    }

    try {
      if (type === 'leftBg' || type === 'slide') {
        const compressedBase64 = await compressImage(file);
        if (type === 'leftBg') {
          setLeftBgImage(compressedBase64);
        } else if (type === 'slide') {
          const timestampId = `slide-${Date.now()}`;
          setSlides([...slides, { id: timestampId, url: compressedBase64 }]);
        }
      } else if (type === 'video') {
        // Menyimpan file video biner asli langsung ke IndexedDB agar mendukung file s/d 1 GB
        const timestampId = `local-video-${Date.now()}`;
        
        // Informasikan proses simpan sedang berjalan
        const processMsg = file.size > 50 * 1024 * 1024 
          ? "Sedang memproses video berukuran besar (+50MB) ke penyimpanan TV lokal. Harap tunggu sebentar..." 
          : "Menyimpan video ke penyimpanan TV lokal...";
        
        console.log(processMsg);
        
        await saveLocalFile(timestampId, file);
        
        // Simpan metadata ringan ke Firestore agar tidak melebihi 1MB
        setVideos([
          ...videos, 
          { 
            id: timestampId, 
            url: timestampId, 
            name: file.name, 
            size: (file.size / (1024 * 1024)).toFixed(1) + " MB", 
            isLocal: true 
          }
        ]);
        
        alert(`🎉 Video "${file.name}" berhasil disimpan ke TV Lokal!`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Proses pemrosesan file gagal, silakan coba lagi.");
    }
  };

  const removeFile = async (filename: string, type: 'slide' | 'video') => {
    if (type === 'slide') {
      setSlides(slides.filter(s => s.id !== filename));
    } else {
      // Hapus video dari IndexedDB
      try {
        await deleteLocalFile(filename);
      } catch (e) {
        console.error("Fail to remove video from IndexedDB:", e);
      }
      setVideos(videos.filter(v => v.id !== filename));
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-sans">Media, Videotron & Tampilan Layar</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola konten visual, video Fullscreen, dan warna tema masjid Anda.</p>
        </div>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition"
        >
          <Save className="w-5 h-5" />
          Simpan Semua
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ROW 1: Mode & Fullscreen Toggle */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Mode Tampilan Area Kanan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "schedule", label: "⏰ Selalu Jadwal & Jam" },
                { id: "slide", label: "🖼️ Selalu Gambar/Slide" },
                { id: "video", label: "🎬 Selalu Video (Videotron)" },
                { id: "mixed", label: "⚖️ Mode Campuran Bergantian" },
              ].map(m => (
                <label key={m.id} className={`flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition ${mode === m.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="mode"
                    value={m.id}
                    checked={mode === m.id}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-gray-700 text-sm">{m.label}</span>
                </label>
              ))}
            </div>

            {mode !== 'schedule' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Durasi Pergantian Slide (Detik)</label>
                <input
                  type="number"
                  className="w-full sm:w-1/3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={slideDuration}
                  onChange={(e) => setSlideDuration(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Maximize className="text-blue-600 w-5 h-5" /> Mode Ukuran Media
              </h4>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Pilih apakah tayangan gambar/video diputar di dalam kotak (split screen) atau langsung tampil <b>Layar Penuh (Full Screen Videotron)</b> menutupi seluruh TV.
              </p>
            </div>
            <div className="space-y-2">
              <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${!mediaFullScreen ? 'bg-blue-50 border-blue-400' : 'bg-white hover:bg-gray-50'}`}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-800">Menyesuaikan Ruang (Split)</span>
                  <span className="text-[10px] text-gray-500">Jadwal & jam tetap terlihat</span>
                </div>
                <input
                  type="radio"
                  name="mediaFullScreen"
                  checked={!mediaFullScreen}
                  onChange={() => setMediaFullScreen(false)}
                  className="w-4 h-4 text-blue-600"
                />
              </label>

              <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${mediaFullScreen ? 'bg-blue-50 border-blue-400 font-bold' : 'bg-white hover:bg-gray-50'}`}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-800">Layar Penuh (Full Screen)</span>
                  <span className="text-[10px] text-gray-500">Slide/Video menutupi seluruh TV</span>
                </div>
                <input
                  type="radio"
                  name="mediaFullScreen"
                  checked={mediaFullScreen}
                  onChange={() => setMediaFullScreen(true)}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* ROW 2: Left column Photo Customization */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <ImageIcon className="text-emerald-600 w-5 h-5" /> Foto Latar Belakang Masjid (Sisi Kiri)
          </h3>
          <p className="text-xs text-gray-500 mb-4 font-sans">
            Sisi kiri layar utama menampilkan foto masjid Anda yang indah. Unggah foto resolusi tinggi untuk hasil terbaik.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="relative h-44 rounded-xl border border-gray-200 overflow-hidden bg-gray-100 shadow-inner group">
              <img src={leftBgImage} alt="Masque Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                <span className="text-white text-xs font-bold">Foto Masjid Aktif</span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex flex-col items-center justify-center pt-3 pb-4">
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600 font-medium">Klik untuk pilih & unggah Foto Masjid Baru</p>
                  <p className="text-[10px] text-gray-400 mt-1">Mendukung format JPG, PNG (Kompres Otomatis)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'leftBg')} />
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Atau masukkan Link URL Foto langsung (Contoh: https://...)"
                  value={leftBgImage.startsWith("data:") ? "" : leftBgImage}
                  onChange={(e) => setLeftBgImage(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLeftBgImage("https://images.unsplash.com/photo-1564683214964-b31c0ee611fc?q=80&w=2070&auto=format&fit=crop")}
                  className="text-xs text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition font-medium"
                >
                  Gunakan Foto Default
                </button>
                <button
                  type="button"
                  onClick={() => setLeftBgImage("https://images.unsplash.com/photo-1594136979603-4c9197c36d22?q=80&w=2073&auto=format&fit=crop")}
                  className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded transition font-medium"
                >
                  Sunset Masjid Tema
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Visual Theme Customization (Colors) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Palette className="text-orange-600 w-5 h-5" /> Pengaturan Warna & Tema Layar
          </h3>
          <p className="text-xs text-gray-500 mb-4 font-sans">
            Sesuaikan warna latar belakang dan warna kotak utama agar selaras dengan dekorasi fisik masjid Anda.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Warna Latar Belakang Utama</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono uppercase"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {["#f3f4f6", "#ffffff", "#e5e7eb", "#f9fafb", "#0f172a"].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBgColor(c)}
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Warna Kotak Informasi / Card</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={boxColor}
                  onChange={(e) => setBoxColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={boxColor}
                  onChange={(e) => setBoxColor(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono uppercase"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {["#ffffff", "#f9fafb", "#0f172a", "#1e293b", "#ecfdf5"].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBoxColor(c)}
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: Uploading Normal Slide & Normal Video */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Slides Upload */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <ImageIcon className="text-blue-600" /> Foto Slide Kegiatan / Pengumuman
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Unggah brosur kegiatan, spanduk pengajian, atau laporan keuangan. Gambar akan terputar otomatis.
            </p>
            
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500"><span className="font-semibold">Klik untuk unggah</span> (JPG, PNG)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'slide')} />
              </label>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Atau tempel Link URL Gambar langsung (https://...)"
                  value={manualSlideUrl}
                  onChange={(e) => setManualSlideUrl(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualSlideUrl) {
                      const tempId = `slide-link-${Date.now()}`;
                      setSlides([...slides, { id: tempId, url: manualSlideUrl }]);
                      setManualSlideUrl("");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {slides.map((slide, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <img src={slide.url} alt="slide" className="w-16 h-12 object-cover rounded" />
                  <span className="flex-1 truncate text-xs text-gray-600 font-mono">{slide.id}</span>
                  <button type="button" onClick={() => removeFile(slide.id, 'slide')} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {slides.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">Belum ada gambar slide diunggah.</p>}
            </div>
          </div>

          {/* Videos Upload */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Film className="text-red-600" /> Video Ceramah / Kajian (Videotron)
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Unggah video kajian, pengumuman berformat video, atau dokumentasi masjid. Diputar berulang secara dinamis.
            </p>
            
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500"><span className="font-semibold">Klik untuk unggah</span> (MP4, Maks 1 GB)</p>
                </div>
                <input type="file" className="hidden" accept="video/mp4" onChange={(e) => handleFileUpload(e, 'video')} />
              </label>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Atau tempel Link URL Video langsung (.mp4)"
                  value={manualVideoUrl}
                  onChange={(e) => setManualVideoUrl(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualVideoUrl) {
                      const tempId = `video-link-${Date.now()}`;
                      setVideos([...videos, { id: tempId, url: manualVideoUrl }]);
                      setManualVideoUrl("");
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {videos.map((vid, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-16 h-12 bg-black rounded flex items-center justify-center">
                    <Film className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 truncate text-xs text-gray-600 font-mono">{vid.id}</span>
                  <button type="button" onClick={() => removeFile(vid.id, 'video')} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {videos.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">Belum ada video diunggah.</p>}
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
