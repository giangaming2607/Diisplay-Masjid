import React, { useState, useEffect } from "react";
import { useSettings } from "../../lib/SettingsContext";
import { Save, Map, Navigation, ShieldCheck } from "lucide-react";

export default function AdminLocation() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    lat: 0,
    lng: 0,
    city: "",
    timezone: "WIB" as "WIB" | "WITA" | "WIT",
  });
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        lat: settings.location.lat,
        lng: settings.location.lng,
        city: settings.location.city,
        timezone: settings.location.timezone || "WIB",
      });
    }
  }, [settings]);

  if (!settings) return <div>Loading...</div>;

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Fitur GPS/Geolokasi tidak didukung oleh browser Anda.");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = parseFloat(position.coords.latitude.toFixed(6));
        const longitude = parseFloat(position.coords.longitude.toFixed(6));
        
        // Determine timezone based on Indonesian longitude boundaries
        let tz: "WIB" | "WITA" | "WIT" = "WIB";
        if (longitude >= 125.0) {
          tz = "WIT";
        } else if (longitude >= 110.0) {
          tz = "WITA";
        }

        // Cross-check with system time zone offset as a backup guess
        const offsetHours = -new Date().getTimezoneOffset() / 60;
        if (offsetHours === 9) tz = "WIT";
        else if (offsetHours === 8) tz = "WITA";
        else if (offsetHours === 7) tz = "WIB";

        setFormData((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          timezone: tz,
        }));
        setDetecting(false);
        alert(`🎉 Lokasi Berhasil Dideteksi!\n\nLatitude: ${latitude}\nLongitude: ${longitude}\nZona Waktu Otomatis: ${tz}`);
      },
      (error) => {
        setDetecting(false);
        let errorMsg = "Gagal mendeteksi lokasi.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Izin lokasi ditolak oleh browser. Silakan izinkan deteksi lokasi/GPS di pojok browser Anda.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Sinyal lokasi GPS tidak tersedia atau dinonaktifkan.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Deteksi lokasi timeout.";
        }
        alert(`⚠️ ${errorMsg}\n\nSilakan masukkan koordinat secara manual di bawah.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      location: {
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        city: formData.city,
        timezone: formData.timezone,
      }
    });
    alert("Lokasi & Zona Waktu Berhasil Disimpan & Diterapkan!");
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 font-sans">Lokasi & Zona Waktu</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div className="flex gap-4 items-start">
            <Map className="text-blue-600 mt-1 flex-shrink-0 whitespace-nowrap" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Pengaturan Titik Koordinat & Zona Waktu</p>
              <p>Sistem ini menggunakan koordinat GPS (Bujur & Lintang) untuk secara otomatis menghitung waktu sholat serta mendeteksi zona waktu (WIB, WITA, WIT) yang sesuai secara real-time.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition shrink-0 uppercase tracking-wider"
          >
            <Navigation className="w-4 h-4" />
            {detecting ? "Mendeteksi..." : "Izinkan & Deteksi Lokasi"}
          </button>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Zona Waktu (Timezone)</label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium"
            >
              <option value="WIB">WIB (Waktu Indonesia Barat - GMT+7)</option>
              <option value="WITA">WITA (Waktu Indonesia Tengah - GMT+8)</option>
              <option value="WIT">WIT (Waktu Indonesia Timur - GMT+9)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-150 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold">
            <ShieldCheck className="w-4 h-4" /> Terkoneksi Aman lewat Firebase
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md"
          >
            <Save className="w-5 h-5" />
            SIMPAN PENGATURAN AREA
          </button>
        </div>
      </form>
    </div>
  );
}
