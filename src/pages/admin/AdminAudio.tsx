import React, { useState, useEffect } from "react";
import { useSettings } from "../../lib/SettingsContext";
import { Save, Clock } from "lucide-react";

export default function AdminAudio() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    adzanActive: true,
    adzanVolume: 80,
    iqomahActive: true,
    iqomahDuration: 7,
    iqomahVolume: 60,
    sholatDuration: 15,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        adzanActive: settings.audio.adzanActive,
        adzanVolume: settings.audio.adzanVolume,
        iqomahActive: settings.audio.iqomahActive,
        iqomahDuration: settings.audio.iqomahDuration,
        iqomahVolume: settings.audio.iqomahVolume,
        sholatDuration: settings.audio.sholatDuration || 15,
      });
    }
  }, [settings]);

  if (!settings) return <div>Loading...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      audio: {
        ...settings.audio,
        adzanActive: formData.adzanActive,
        adzanVolume: formData.adzanVolume,
        iqomahActive: formData.iqomahActive,
        iqomahDuration: formData.iqomahDuration,
        iqomahVolume: formData.iqomahVolume,
        sholatDuration: formData.sholatDuration,
      }
    });
    alert("Pengaturan Waktu & Audio Berhasil Disimpan & Diterapkan!");
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 font-sans flex items-center gap-2">
        <Clock className="w-6 h-6 text-amber-500" />
        Pengaturan Waktu Jeda
      </h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Durasi Waktu Iqomah (Menit)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              value={formData.iqomahDuration}
              onChange={(e) => setFormData({ ...formData, iqomahDuration: parseInt(e.target.value) })}
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Waktu hitung mundur Iqomah setelah Adzan selesai.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Waktu Layar Diam Saat Sholat (Menit)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              value={formData.sholatDuration}
              onChange={(e) => setFormData({ ...formData, sholatDuration: parseInt(e.target.value) })}
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Menampilkan himbauan tenang & durasi sebelum kembali ke layar normal.</p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}
