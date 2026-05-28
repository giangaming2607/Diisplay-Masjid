import React, { useState, useEffect } from "react";
import { useSettings } from "../../lib/SettingsContext";
import { Save } from "lucide-react";

export default function AdminGeneral() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    mosqueName: "",
    mosqueAddress: "",
    runningText: "",
    runningTextSpeed: "medium",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        mosqueName: settings.mosqueName,
        mosqueAddress: settings.mosqueAddress,
        runningText: settings.display.runningText,
        runningTextSpeed: settings.display.runningTextSpeed,
      });
    }
  }, [settings]);

  if (!settings) return <div>Loading...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      mosqueName: formData.mosqueName,
      mosqueAddress: formData.mosqueAddress,
      display: {
        ...settings.display,
        runningText: formData.runningText,
        runningTextSpeed: formData.runningTextSpeed as any,
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
