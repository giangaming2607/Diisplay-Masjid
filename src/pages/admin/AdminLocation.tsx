import React, { useState, useEffect } from "react";
import { useSettings } from "../../lib/SettingsContext";
import { Save, Map } from "lucide-react";

export default function AdminLocation() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    lat: 0,
    lng: 0,
    city: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        lat: settings.location.lat,
        lng: settings.location.lng,
        city: settings.location.city,
      });
    }
  }, [settings]);

  if (!settings) return <div>Loading...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      location: {
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        city: formData.city,
      }
    });
    alert("Lokasi Berhasil Disimpan & Diterapkan!");
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 font-sans">Lokasi & Zona Waktu</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4 items-start mb-6">
          <Map className="text-blue-600 mt-1 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Pengaturan Titik Koordinat</p>
            <p>Sistem ini menggunakan kordinat bujur dan lintang untuk secara otomatis menghitung waktu sholat yang sangat akurat berdasarkan standar algoritma metode Kementerian Agama RI.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Garis Lintang (Latitude)</label>
            <input
              type="number"
              step="any"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Garis Bujur (Longitude)</label>
            <input
              type="number"
              step="any"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Kota / Kabupaten</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Contoh: Jakarta"
            required
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
          >
            <Save className="w-5 h-5" />
            SIMPAN LOKASI
          </button>
        </div>
      </form>
    </div>
  );
}
