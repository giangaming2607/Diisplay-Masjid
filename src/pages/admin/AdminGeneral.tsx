import React, { useState, useEffect } from "react";
import { useSettings } from "../../lib/SettingsContext";
import { Save, UploadCloud, Trash2, Image as ImageIcon, Sparkles } from "lucide-react";
import { saveLocalFile } from "../../lib/indexedDB";
import ResolvingImage from "../../components/ResolvingImage";

export default function AdminGeneral() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    mosqueName: "",
    mosqueAddress: "",
    runningText: "",
    runningTextSpeed: "medium",
    logoUrl: "",
    bootBgUrl: "",
    fullScreenBgImage: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        mosqueName: settings.mosqueName,
        mosqueAddress: settings.mosqueAddress,
        runningText: settings.display.runningText,
        runningTextSpeed: settings.display.runningTextSpeed,
        logoUrl: settings.display.logoUrl || "",
        bootBgUrl: settings.display.bootBgUrl || "",
        fullScreenBgImage: settings.display.fullScreenBgImage || "",
      });
    }
  }, [settings]);

  if (!settings) return <div>Loading...</div>;

  const compressImage = (file: File, maxWidth = 800, quality = 0.75): Promise<string> => {
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file, 600, 0.95); // Extremely sharp higher-quality logo
      setFormData(prev => ({ ...prev, logoUrl: b64 }));
    } catch (err) {
      alert("Gagal memproses gambar logo.");
    }
  };

  const handleBootBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const timestampId = `local-bootBg-${Date.now()}`;
      await saveLocalFile(timestampId, file);
      setFormData(prev => ({ ...prev, bootBgUrl: timestampId }));
      alert(`🎉 Background booting "${file.name}" berhasil disimpan ke TV Lokal dengan kualitas 4K murni!`);
    } catch (err) {
      console.error("Boot bg upload error:", err);
      alert("Gagal memproses gambar latar booting.");
    }
  };

  const handleFullScreenBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const timestampId = `local-fullScreenBg-${Date.now()}`;
      await saveLocalFile(timestampId, file);
      setFormData(prev => ({ ...prev, fullScreenBgImage: timestampId }));
      alert(`🎉 Foto full screen utama berhasil disimpan dengan kualitas 4K murni!`);
    } catch (err) {
      console.error("Full screen bg upload error:", err);
      alert("Gagal memproses gambar foto full screen.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      mosqueName: formData.mosqueName,
      mosqueAddress: formData.mosqueAddress,
      display: {
        ...settings.display,
        runningText: formData.runningText,
        runningTextSpeed: formData.runningTextSpeed as any,
        logoUrl: formData.logoUrl,
        bootBgUrl: formData.bootBgUrl,
        fullScreenBgImage: formData.fullScreenBgImage,
      }
    });
    alert("Pengaturan Berhasil Disimpan & Diterapkan!");
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 font-sans">Data & Informasi Masjid</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Masjid / Musholla</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            value={formData.mosqueName}
            onChange={(e) => setFormData({ ...formData, mosqueName: e.target.value })}
            required
            placeholder="Contoh: MASJID AGUNG AL-IKHLAS"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat Lengkap</label>
          <textarea
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            value={formData.mosqueAddress}
            onChange={(e) => setFormData({ ...formData, mosqueAddress: e.target.value })}
            required
            rows={2}
            placeholder="Contoh: Jl. Merdeka No. 12, Kota Hijau"
          />
        </div>

        <hr className="border-gray-100" />

        {/* LOGO & BOOT BACKGROUND BRANDING SECTION */}
        <hr className="border-gray-100" />

        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Logo Masjid & Background Booting TV
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Sesuaikan logo resmi Masjid yang tampil di pojok layar utama, serta ganti background yang tampil saat TV pertama kali menyala (booting system).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Uploader 1: Logo */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Logo Instansi / Masjid</label>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logoUrl ? (
                    <ResolvingImage src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-350" />
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] py-2 px-3.5 rounded-lg cursor-pointer transition uppercase tracking-wider">
                    <UploadCloud className="w-4 h-4" /> Unggah Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logoUrl: "" }))}
                      className="ml-2 inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold py-1.5 px-2.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100/50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                  <p className="text-[10px] text-gray-400">Dimensi ideal persegi (PNG transparan disarankan)</p>
                </div>
              </div>
            </div>

            {/* Uploader 2: Boot Background */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Latar Belakang Booting TV</label>
              
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                  {formData.bootBgUrl ? (
                    <ResolvingImage src={formData.bootBgUrl} alt="Boot Background Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-slate-900 border-none flex items-center justify-center flex-col text-[8px] text-gray-500 font-bold uppercase p-1 text-center">
                      <span>Hitam Bawaan</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] py-2 px-3.5 rounded-lg cursor-pointer transition uppercase tracking-wider">
                    <UploadCloud className="w-4 h-4" /> Unggah Background
                    <input type="file" className="hidden" accept="image/*" onChange={handleBootBgUpload} />
                  </label>
                  {formData.bootBgUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, bootBgUrl: "" }))}
                      className="ml-2 inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold py-1.5 px-2.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100/50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                  <p className="text-[10px] text-gray-400">Background saat screen TV menyala (JPG/PNG)</p>
                </div>
              </div>
            </div>
            {/* Uploader 3: Full Screen Background */}
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Foto Full Screen (Latar Belakang TV Utama)</label>
              <p className="text-[10px] text-gray-500 mb-2">Ini akan mengubah warna latar belakang solid menjadi foto custom (berlaku untuk mode Classic/Modern Grid).</p>
              
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                  {formData.fullScreenBgImage ? (
                    <ResolvingImage src={formData.fullScreenBgImage} alt="Full Screen Background Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gray-100 border-none flex items-center justify-center flex-col text-[8px] text-gray-400 font-bold uppercase p-1 text-center">
                      <span>Warna Polos</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] py-2 px-3.5 rounded-lg cursor-pointer transition uppercase tracking-wider">
                    <UploadCloud className="w-4 h-4" /> Unggah Foto Full Screen
                    <input type="file" className="hidden" accept="image/*" onChange={handleFullScreenBgUpload} />
                  </label>
                  {formData.fullScreenBgImage && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, fullScreenBgImage: "" }))}
                      className="ml-2 inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold py-1.5 px-2.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100/50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                  <p className="text-[10px] text-gray-400">Rekomendasi 1920x1080 (Lanskap)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <h3 className="text-lg font-bold text-gray-800 mt-6">Pengaturan Tulisan Berjalan (Running Text)</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Isi Tulisan Berjalan</label>
          <p className="text-xs text-gray-500 mb-2">Gunakan tanda | untuk memisahkan antar pengumuman.</p>
          <textarea
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-mono text-sm"
            value={formData.runningText}
            onChange={(e) => setFormData({ ...formData, runningText: e.target.value })}
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Kecepatan Gerakan</label>
          <select
            className="w-full md:w-1/3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            value={formData.runningTextSpeed}
            onChange={(e) => setFormData({ ...formData, runningTextSpeed: e.target.value })}
          >
            <option value="slow">Lambat</option>
            <option value="medium">Sedang</option>
            <option value="fast">Cepat</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
          >
            <Save className="w-5 h-5" />
            SIMPAN & TERAPKAN LANGSUNG
          </button>
        </div>
      </form>
    </div>
  );
}
