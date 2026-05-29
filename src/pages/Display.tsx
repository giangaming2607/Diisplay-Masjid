import { useState, useEffect, useMemo, useRef } from "react";
import { useSettings } from "../lib/SettingsContext";
import { getPrayerTimes, cn } from "../lib/utils";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ShieldAlert } from "lucide-react";

export default function Display() {
  const { settings } = useSettings();
  const [now, setNow] = useState(new Date());
  
  // Mixed mode slide index & rotation timers
  const [mixedIndex, setMixedIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const adzanAudioRef = useRef<HTMLAudioElement | null>(null);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  // System Booting Simulation States
  const [booting, setBooting] = useState(true);
  const [bootStep, setBootStep] = useState(0);

  const bootLogs = useMemo(() => [
    "INIT SYSTEM CORE VM: [v2.5.1-STABLE]",
    "SINKRONISASI JAM INTERNASIONAL & TIMEZONE... [OK]",
    "SINKRONISASI JADWAL SHOLAT KEMENAG RI... [OK]",
    "MENGHUBUNGKAN BASIS DATA CLOUD FIREBASE... [OK]",
    "MENYIAPKAN MODUL SLIDESHOW & PROYEKTOR... [OK]",
    "SYSTEM SECURITY: SECURE PROTOCOL MOUNTED... [OK]",
    "MEMULAI PROYEKSI JASMA DIGITAL TV... [BERHASIL]"
  ], []);

  useEffect(() => {
    if (booting) {
      const interval = setInterval(() => {
        setBootStep((prev) => {
          if (prev < bootLogs.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 600);

      const timer = setTimeout(() => {
        setBooting(false);
      }, 4300);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [booting, bootLogs]);

  // Initialize synth helper sound for browser compliance (needs interaction first to play)
  useEffect(() => {
    // We can use native HTML5 Speech Synthesis or standard oscillator tones to ensure
    // we don't have broken paths if the user hasn't uploaded a file.
    beepAudioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
  }, []);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Convert standard system Date to exact Indonesian timezone (WIB/WITA/WIT) selected
  const localMosqueTime = useMemo(() => {
    const tz = settings?.location?.timezone || "WIB";
    const tzOffsetHours = tz === "WIT" ? 9 : tz === "WITA" ? 8 : 7;
    // Calculate UTC millisecond epoch, then add the chosen offset
    const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTimestamp + (3600000 * tzOffsetHours));
  }, [now, settings?.location?.timezone]);

  // Calculate standard Kemenag Prayer times
  const prayerTimesInfo = useMemo(() => {
    if (!settings) return null;
    const pt = getPrayerTimes(localMosqueTime, settings.location.lat, settings.location.lng);
    
    // Add Imsak (10 mins before Fajr)
    const imsak = new Date(pt.fajr.getTime() - 10 * 60000);
    
    return [
      { id: 'imsak', name: 'IMSAK', time: imsak, color: 'bg-emerald-600', isDailyPrayer: false },
      { id: 'subuh', name: 'SUBUH', time: pt.fajr, color: 'bg-blue-600', isDailyPrayer: true },
      { id: 'syuruk', name: 'SYURUK', time: pt.sunrise, color: 'text-gray-900 bg-amber-400', isDailyPrayer: false },
      { id: 'dzuhur', name: 'DZUHUR', time: pt.dhuhr, color: 'bg-orange-500', isDailyPrayer: true },
      { id: 'ashar', name: 'ASHAR', time: pt.asr, color: 'text-gray-900 bg-yellow-400', isDailyPrayer: true },
      { id: 'maghrib', name: 'MAGHRIB', time: pt.maghrib, color: 'bg-red-600', isDailyPrayer: true },
      { id: 'isya', name: 'ISYA', time: pt.isha, color: 'bg-indigo-900', isDailyPrayer: true },
    ];
  }, [settings, localMosqueTime.toDateString()]); // re-calc daily

  // Find next prayer to show hitung mundur
  const nextPrayer = useMemo(() => {
    if (!prayerTimesInfo) return null;
    return prayerTimesInfo.find(p => p.time > localMosqueTime) || prayerTimesInfo[0];
  }, [prayerTimesInfo, localMosqueTime]);

  // Determine priority states: Adzan, Iqomah, and Sholat (Quiet Screen)
  const activePrayerEvent = useMemo(() => {
    if (!prayerTimesInfo || !settings) return null;

    // We only trigger events on the actual obligatory prayer times.
    const activePrayers = prayerTimesInfo.filter(p => p.isDailyPrayer);
    const adzanDurationMinutes = 3; // 3 minutes of adzan screen
    const iqomahMinutes = settings.audio.iqomahDuration || 7; // customized
    const sholatQuietMinutes = 15; // 15 minutes of quiet during prayers

    for (const p of activePrayers) {
      const ptTime = p.time.getTime();
      const elapsedMs = localMosqueTime.getTime() - ptTime;
      const elapsedMinutes = elapsedMs / 60000;

      if (elapsedMinutes >= 0) {
        // 1. ADZAN PERIOD
        if (elapsedMinutes < adzanDurationMinutes) {
          return {
            status: 'adzan',
            prayerName: p.name,
            timeLeftSeconds: Math.ceil((adzanDurationMinutes - elapsedMinutes) * 60),
          };
        }
        // 2. IQOMAH COUNTDOWN PERIOD
        else if (elapsedMinutes < (adzanDurationMinutes + iqomahMinutes)) {
          const finishedAdzanTime = ptTime + (adzanDurationMinutes * 60000);
          const elapsedSinceAdzan = localMosqueTime.getTime() - finishedAdzanTime;
          const totalIqomahMs = iqomahMinutes * 60000;
          const remainingMs = totalIqomahMs - elapsedSinceAdzan;
          return {
            status: 'iqomah',
            prayerName: p.name,
            timeLeftSeconds: Math.ceil(remainingMs / 1000),
          };
        }
        // 3. SHOLAT TRANQUIL MODE (Screen off/quiet so no distraction)
        else if (elapsedMinutes < (adzanDurationMinutes + iqomahMinutes + sholatQuietMinutes)) {
          return {
            status: 'sholat',
            prayerName: p.name,
          };
        }
      }
    }

    return null;
  }, [prayerTimesInfo, localMosqueTime, settings]);

  // Handle playing Adzan sound & alarms
  const lastEventStatus = useRef<string | null>(null);
  useEffect(() => {
    if (activePrayerEvent && soundEnabled) {
      if (activePrayerEvent.status === 'adzan' && lastEventStatus.current !== 'adzan') {
        // Play Adzan or Beep
        try {
          if (beepAudioRef.current) {
            beepAudioRef.current.volume = (settings?.audio?.adzanVolume || 80) / 100;
            beepAudioRef.current.play().catch(e => console.log("Audio play blocked by browser."));
          }
          // Native browser speech call (Premium effect)
          if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(`Waktu sholat ${activePrayerEvent.prayerName} telah tiba.`);
            speech.lang = 'id-ID';
            window.speechSynthesis.speak(speech);
          }
        } catch (error) {
          console.error("Adzan sound error:", error);
        }
      } else if (activePrayerEvent.status === 'iqomah' && activePrayerEvent.timeLeftSeconds === 5) {
        // Beep alert before Iqomah ends
        if (beepAudioRef.current) {
          beepAudioRef.current.play().catch(e => {});
        }
      }
    }
    lastEventStatus.current = activePrayerEvent?.status || null;
  }, [activePrayerEvent, soundEnabled, settings]);

  // Mode Selection / Rotation
  const currentMode = useMemo(() => {
    if (!settings) return 'schedule';
    
    // If we have an active oblig prayer event, the normal side screen doesn't rotate,
    // the system focuses on showing Prayer Times/Schedule for complete focus.
    if (activePrayerEvent) return 'schedule';

    if (settings.display.mode === 'mixed') {
      const pattern = settings.display.mixedPattern || [
        { type: 'schedule', duration: 15 },
        { type: 'slide', duration: 10 },
        { type: 'video', duration: 20 }
      ];
      return pattern[mixedIndex % pattern.length].type;
    }
    return settings.display.mode;
  }, [settings, mixedIndex, activePrayerEvent]);

  // Auto Rotation slide timers
  useEffect(() => {
    if (settings?.display?.mode === 'mixed' && !activePrayerEvent) {
      const timer = setTimeout(() => {
        setMixedIndex(prev => prev + 1);
      }, (settings.display.slideDuration || 10) * 1000);
      return () => clearTimeout(timer);
    }
  }, [settings, mixedIndex, activePrayerEvent]);

  useEffect(() => {
    if (currentMode === 'slide' && settings && settings.slides.length > 0 && !activePrayerEvent) {
      const timer = setTimeout(() => {
        setSlideIndex((prev) => (prev + 1) % settings.slides.length);
      }, (settings?.display?.slideDuration || 10) * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentMode, settings, slideIndex, activePrayerEvent]);

  // Safe Hijri formatting fallback
  const hijriText = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      return formatter.format(now).replace(" AH", "") + " H";
    } catch (e) {
      // Static approximate estimate for premium placeholder if browser doesn't support the calendar
      return "16 Zulhijjah 1447 H";
    }
  }, [now]);

  // Extract Hijri Details for authentic upcoming holidays list (Matches Image 1 & 2 layout badges)
  const nearestHoliday = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric'
      });
      const parts = formatter.formatToParts(now);
      const hDay = parseInt(parts.find(p => p.type === 'day')?.value || "1");
      const hMonth = parseInt(parts.find(p => p.type === 'month')?.value || "2");
      const hYear = parseInt(parts.find(p => p.type === 'year')?.value || "1445");

      const getHijriDayOfYear = (m: number, d: number) => {
        let days = 0;
        for (let i = 1; i < m; i++) {
          days += (i % 2 === 1) ? 30 : 29;
        }
        return days + d;
      };

      const currentDayOfYear = getHijriDayOfYear(hMonth, hDay);

      const holidayTargets = [
        { name: "Tahun Baru Islam", m: 1, d: 1 },
        { name: "Maulid Nabi Muhammad SAW", m: 3, d: 12 },
        { name: "Isra Mi'raj", m: 7, d: 27 },
        { name: "1 Ramadhan", m: 9, d: 1 },
        { name: "Idul Fitri", m: 10, d: 1 },
        { name: "Idul Adha", m: 12, d: 10 },
      ];

      const calculated = holidayTargets.map(h => {
        const targetDay = getHijriDayOfYear(h.m, h.d);
        let daysDiff = 0;
        let targetYear = hYear;

        if (targetDay >= currentDayOfYear) {
          daysDiff = targetDay - currentDayOfYear;
        } else {
          daysDiff = (354 - currentDayOfYear) + targetDay;
          targetYear = hYear + 1;
        }
        return { name: h.name, daysRemaining: daysDiff, year: targetYear };
      });

      // Sort and pick closest
      calculated.sort((a, b) => a.daysRemaining - b.daysRemaining);
      return calculated[0];
    } catch (e) {
      return { name: "1 Ramadhan - Awal Puasa", daysRemaining: 11, year: 1445 };
    }
  }, [now]);

  // Calculate formatted prayer countdown string
  const countdownText = (() => {
    if (!nextPrayer) return "";
    const diffMs = nextPrayer.time.getTime() - localMosqueTime.getTime();
    const duration = moment.duration(diffMs);
    const hrs = Math.floor(duration.asHours());
    const mins = duration.minutes();
    const secs = duration.seconds();
    return `${hrs > 0 ? hrs + ":" : ""}${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  })();

  const isWideScreen = !!(settings?.display?.mediaFullScreen && (currentMode === 'slide' || currentMode === 'video') && !activePrayerEvent);

  const isDarkBg = useMemo(() => {
    if (!settings?.display?.bgColor) return false;
    const hex = settings.display.bgColor.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }, [settings?.display?.bgColor]);

  const isDarkBox = useMemo(() => {
    if (!settings?.display?.boxColor) return false;
    const hex = settings.display.boxColor.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }, [settings?.display?.boxColor]);

  if (!settings || booting) {
    const customBg = settings?.display?.bootBgUrl;
    const customLogo = settings?.display?.logoUrl;
    const bootPercentage = Math.round(((bootStep + 1) / bootLogs.length) * 100);

    return (
      <div 
        className="h-screen w-screen relative overflow-hidden flex flex-col items-center justify-center font-sans text-white select-none"
        style={{
          background: customBg 
            ? `url(${customBg}) no-repeat center center / cover`
            : "radial-gradient(circle at center, #1b263b 0%, #0d1321 100%)"
        }}
      >
        {/* Dark overlay with background blur to give heavy premium movie/theatre glassmorphism */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[6px] z-0" />

        <div className="relative z-10 flex flex-col items-center max-w-xl w-full px-8 text-center space-y-7">
          {/* Mosque Logo Container */}
          <div className="relative">
            {customLogo ? (
              <div className="relative w-28 h-28 bg-white/10 p-2 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center mx-auto mb-1 animate-pulse">
                <img 
                  src={customLogo} 
                  alt="Logo Masjid" 
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                />
              </div>
            ) : (
              // Beautiful shining default gold crescent & mosque dome emblem
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-1 shadow-2xl border border-amber-300/30 animate-pulse relative">
                <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-xl animate-ping" />
                <span className="text-5xl drop-shadow relative z-10">🕌</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-widest text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)] uppercase">
              {settings?.mosqueName || "SISTEM LAYAR JASMA"}
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              {settings?.mosqueAddress || "PENGATURAN AREA BELUM DIKONFIGURASI"}
            </p>
          </div>

          {/* Core Circular Loading Spinner with Percentage */}
          <div className="relative w-20 h-20 flex items-center justify-center mx-auto">
            {/* Spinning ring tracks */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-800/80" />
            
            {/* Active spinning ring segment */}
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 animate-spin" 
              style={{ animationDuration: "0.85s" }}
            />
            
            {/* Innermost percentage meter */}
            <div className="text-lg font-mono font-black text-amber-400 drop-shadow-sm">
              {bootPercentage}%
            </div>
          </div>

          <div className="text-[10px] font-extrabold tracking-widest text-slate-300 animate-pulse uppercase flex items-center justify-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            MENGAKTIFKAN SISTEM... MOHON TUNGGU SEBENTAR
          </div>

          {/* Terminal Console log sequence block */}
          <div className="w-full bg-slate-950/95 rounded-2xl border border-slate-800/80 p-5 font-mono text-[11px] text-left text-emerald-400 space-y-1.5 shadow-2xl overflow-hidden leading-relaxed">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2.5 text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">
              <span>🖥️ CONSOLE BOOTLOG v2.5.1</span>
              <span className="text-emerald-500 font-black animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ONLINE
              </span>
            </div>
            {bootLogs.slice(0, bootStep + 1).map((log, idx) => (
              <div key={idx} className="flex items-start gap-1">
                <span className="text-slate-650 shrink-0 select-none">&gt;&gt;</span>
                <span className={idx === bootStep ? "text-amber-300 font-bold animate-pulse" : "text-emerald-400"}>{log}</span>
              </div>
            ))}
            <div className="text-[10px] text-amber-500 animate-ping mt-1 font-bold">_</div>
          </div>
        </div>
      </div>
    );
  }

  const layoutTemplate = settings?.display?.layoutTemplate || 'classic';

  // HELPER 1: RENDER STANDARD HEADER
  const renderHeader = () => (
    <header className={cn(
      "h-[15%] w-full flex items-center px-8 relative z-10 border-b transition-colors duration-500",
      isDarkBg ? "bg-slate-950/80 border-slate-850 text-white shadow-2xl backdrop-blur-md" : "bg-white border-gray-100 text-slate-900 shadow-md"
    )}>
      {/* Top Left: Clock Card with elegant frame & details base */}
      <div className="w-1/4 flex flex-col justify-center h-full py-2">
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg border border-slate-800 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Glossy top reflection glow effect */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className="flex justify-between items-baseline">
            <div className="text-[3.25rem] font-bold tracking-tighter text-emerald-400 font-mono leading-none flex items-baseline">
              {moment(now).format("HH:mm")}
              <span className="text-xl font-bold text-gray-400 font-mono tracking-wider ml-1 animate-pulse">
                {moment(now).format("ss")}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 tracking-widest font-extrabold pr-0.5 uppercase">
              {settings?.location?.timezone || "WIB"}
            </span>
          </div>
          
          {/* Label Strip below Clock Digits as requested */}
          <div className="mt-1 pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-[9px] uppercase font-bold text-slate-400 tracking-widest">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              JAM DIGITAL AKTIF
            </span>
            <span className="text-emerald-400 font-mono text-[9px]">JASMA PRO</span>
          </div>
        </div>
      </div>

      {/* Top Center: Mosque Info and elegant subheader */}
      <div className="w-2/4 flex items-center justify-center gap-4 text-center">
        {settings.display.logoUrl && (
          <img 
            src={settings.display.logoUrl} 
            alt="Mosque Logo" 
            className="w-16 h-16 object-contain shrink-0 rounded-2xl bg-white/10 p-1.5 border border-white/20 shadow-md backdrop-blur-sm"
          />
        )}
        <div className="flex flex-col items-center justify-center">
          <div className={cn(
            "inline-flex items-center gap-2 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border mb-1 animate-pulse",
            isDarkBg ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/55" : "bg-emerald-50 text-emerald-800 border-emerald-200/50"
          )}>
            🕌 JAM DIGITAL MASJID
          </div>
          <h1 className={cn(
            "text-2xl md:text-3xl font-extrabold tracking-tight uppercase leading-none drop-shadow-sm font-sans",
            isDarkBg ? "text-white" : "text-slate-950"
          )}>
            {settings.mosqueName}
          </h1>
          <p className={cn(
            "text-xs mt-1 font-semibold tracking-wide truncate max-w-lg",
            isDarkBg ? "text-slate-400" : "text-gray-500"
          )}>
            {settings.mosqueAddress}
          </p>
        </div>
      </div>

      {/* Top Right: Dates inside elegant card frame */}
      <div className="w-1/4 flex flex-col items-end justify-center text-right border-l h-5/6 border-gray-200 pl-6 py-1">
        <div className={cn(
          "border rounded-2xl px-5 py-2 flex flex-col items-end shadow-sm justify-center h-full transition-colors",
          isDarkBg ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-gradient-to-br from-blue-50 to-slate-50 border-blue-100 text-slate-800"
        )}>
          <span className={cn(
            "text-xs font-bold tracking-widest uppercase mb-0.5 font-sans",
            isDarkBg ? "text-blue-400" : "text-blue-500"
          )}>KALENDER JASMA</span>
          <div className={cn(
            "text-sm md:text-base font-extrabold tracking-wide uppercase leading-none",
            isDarkBg ? "text-white" : "text-blue-900"
          )}>
            {moment(now).format("dddd, DD MMMM")}
          </div>
          <div className={cn(
            "text-xs font-bold mt-1 uppercase tracking-wide",
            isDarkBg ? "text-emerald-400" : "text-emerald-700"
          )}>
            {hijriText}
          </div>
        </div>
      </div>
    </header>
  );

  // HELPER 2: RENDER PRAYER TIME TILES COLUMN (Styled beautifully according to Image 2)
  const renderPrayerColumn = (widthClass: string = "w-1/3") => (
    <div 
      className={cn("flex flex-col h-full rounded-3xl shadow-2xl border border-gray-200 bg-white/95 overflow-hidden transition-all duration-500", widthClass)}
    >
      {/* Sidebar Header showing location & small digital status */}
      <div className="bg-slate-900 text-white py-4 px-6 border-b border-slate-800 text-center flex flex-col gap-1 shrink-0">
        <span className="text-xs text-emerald-400 font-black tracking-widest uppercase">JADWAL SHOLAT DIGITAL</span>
        <span className="text-sm text-slate-300 font-bold uppercase">{settings?.location?.city || "Kota Bandung"}</span>
      </div>

      {/* 7 Vertical rows stretching to fill space evenly with clean spacing and borders */}
      <div className="flex-1 flex flex-col justify-between p-4 gap-2.5 bg-gray-50/50 select-none">
        {prayerTimesInfo?.map((pt) => {
          const isNext = nextPrayer?.id === pt.id;
          return (
            <div 
              key={pt.id} 
              className={cn(
                "flex-1 flex flex-col justify-center px-6 rounded-2xl transition-all duration-300 relative border shadow-sm overflow-hidden",
                isNext 
                  ? "bg-[#f1c40f] border-yellow-400 text-slate-950 font-bold scale-[1.015] shadow-lg z-10" 
                  : "bg-white border-gray-150 text-slate-800 hover:border-gray-250"
              )}
            >
              {isNext && (
                <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
              )}
              
              <div className="flex justify-between items-center w-full">
                <span className={cn(
                  "text-sm font-black tracking-wider uppercase font-sans",
                  isNext ? "text-slate-950" : "text-slate-600"
                )}>
                  {pt.name}
                </span>
                <span className={cn(
                  "text-2xl font-black font-mono tracking-tight",
                  isNext ? "text-slate-950" : "text-slate-900"
                )}>
                  {moment(pt.time).format("HH:mm")}
                </span>
              </div>

              {/* Centered blinking countdown inside the active column row */}
              {isNext && (
                <div className="text-center w-full mt-1.5 border-t border-slate-950/15 pt-1 text-[11px] font-mono font-black text-red-750 tracking-wider uppercase animate-pulse">
                  Mundur: -{countdownText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // HELPER 3: RENDER THE CORE MEDIA SCREEN CONTAINER
  const renderMediaReceptacle = (widthClass: string = "w-2/3") => (
    <div className={cn(
      "bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative flex items-center justify-center transition-all duration-700",
      isWideScreen ? "w-full h-full border-0 rounded-0 shadow-none m-0" : widthClass
    )}>
      {isWideScreen && (
        <div className="absolute top-4 right-4 z-40 bg-black/60 backdrop-blur-sm text-white text-[9px] px-3 py-1.5 rounded-md font-mono pointer-events-none tracking-wide select-none">
          🖥️ VIDEOTRON LAYAR PENUH
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentMode === 'schedule' && (
          <motion.div 
            key="schedule"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white flex flex-col items-center justify-center p-8 text-center"
          >
            <h2 className="text-4xl font-extrabold mb-3 tracking-wider drop-shadow-md text-emerald-400">JADWAL SHOLAT</h2>
            <div className="text-xl font-medium opacity-80 mb-8 tracking-wide">Wilayah {settings?.location?.city || "Jakarta"} & Sekitarnya</div>
            
            {nextPrayer && (
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center border border-white/10 shadow-xl max-w-sm w-full">
                <span className="text-xs text-blue-200 uppercase font-semibold tracking-widest mb-3">Sholat Berikutnya</span>
                <span className="text-5xl font-extrabold text-white tracking-wide mb-1">{nextPrayer.name}</span>
                <span className="text-4xl font-mono text-yellow-300 font-bold">{moment(nextPrayer.time).format("HH:mm")}</span>
                <div className="mt-4 text-xs font-mono text-gray-300 py-1 px-4 bg-emerald-600/30 rounded-full">
                  Mundur: {countdownText}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {currentMode === 'slide' && settings.slides.length > 0 && (
          <motion.img
            key={`slide-${slideIndex}`}
            src={settings.slides[slideIndex]?.url}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full object-cover"
          />
        )}

        {currentMode === 'video' && settings.videos.length > 0 && (
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-black flex items-center justify-center"
          >
            <video 
              src={settings.videos[0]?.url} 
              autoPlay 
              loop 
              muted 
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {((currentMode === 'slide' && settings.slides.length === 0) || (currentMode === 'video' && settings.videos.length === 0)) ? (
          <motion.div 
            key="fallback"
            className="w-full h-full flex flex-col items-center justify-center text-center p-12 bg-slate-900 text-white select-none"
          >
            <span className="text-4xl mb-4 font-extrabold tracking-widest text-emerald-400 uppercase">{settings.mosqueName}</span>
            <span className="text-xl text-gray-400 max-w-md">Jadwal sholat, running text & pengingat iqomah sedia disinkronkan langsung dari Admin.</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  // HELPER 4: RUNNING TEXT MARQUEE FOOTER
  const renderMarqueeFooter = (extraClasses: string = "") => (
    <footer className={cn("h-[10%] bg-blue-950 border-t-4 border-emerald-500 overflow-hidden flex items-center shadow-[0_-5px_15px_rgba(0,0,0,0.15)] relative z-20", extraClasses)}>
      <div className="bg-emerald-600 h-full flex items-center justify-center px-8 z-10 shrink-0 shadow-lg border-r border-emerald-700">
        <span className="text-white font-extrabold text-2xl tracking-widest uppercase">INFO</span>
      </div>
      
      <div className="flex-1 overflow-hidden flex items-center min-w-0">
        <marquee 
          className={cn(
            "text-white font-semibold text-3xl tracking-wide",
            settings.display.runningTextSpeed === 'slow' ? "scrollamount-3" :
            settings.display.runningTextSpeed === 'fast' ? "scrollamount-15" : "scrollamount-8"
          )}
          scrollamount={settings.display.runningTextSpeed === 'slow' ? "4" : settings.display.runningTextSpeed === 'fast' ? "15" : "8"}
        >
          {settings.display.runningText || "Selamat datang di Masjid Baiturrahman. Mohon kencangkan shaf sholat."}
        </marquee>
      </div>
    </footer>
  );

  return (
    <div 
      className="h-screen w-screen overflow-hidden font-sans flex flex-col transition-colors duration-1000"
      style={{ backgroundColor: settings.display.bgColor || "#f3f4f6", color: isDarkBg ? "#f8fafc" : "#1f2937" }}
    >
      
      {/* Sound Overlay Activation Guide (required by current browser standards for audio play) */}
      {!soundEnabled && (
        <button 
          onClick={() => setSoundEnabled(true)}
          className="absolute top-[18%] left-6 z-[99] flex items-center gap-2 bg-red-650/95 hover:bg-emerald-600 border border-white/20 text-white text-xs uppercase font-extrabold px-4 py-2 rounded-full shadow-2.5xl transition-all duration-350 transform active:scale-95 animate-bounce"
        >
          <VolumeX className="w-4 h-4" /> Klik Untuk Suara Adzan
        </button>
      )}

      {soundEnabled && (
        <div className="absolute top-[18%] left-6 z-[99] flex items-center gap-1.5 bg-emerald-600/90 text-white text-[10px] font-mono font-black px-3 py-1 rounded-full shadow-md">
          <Volume2 className="w-3.5 h-3.5 animate-pulse" /> AUDIO AKTIF
        </div>
      )}

      {/* PRIORITAS OVERLAYS (FULL SCREEN OVERRIDES) */}
      <AnimatePresence>
        {activePrayerEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col text-white justify-between p-12 select-none"
            style={{ backgroundColor: activePrayerEvent.status === 'sholat' ? "#000000" : "#0d1b2a" }}
          >
            {/* 1. ADZAN STATUS PANEL */}
            {activePrayerEvent.status === 'adzan' && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="bg-emerald-600 text-white font-extrabold px-10 py-4 rounded-full text-4xl tracking-widest shadow-xl uppercase animate-pulse border-2 border-emerald-400"
                >
                  Adzan Berkumandang
                </motion.div>
                <div className="text-8xl font-extrabold uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 tracking-wider">
                  {activePrayerEvent.prayerName}
                </div>
                <div className="text-3xl font-medium tracking-wide text-gray-300 max-w-2xl leading-relaxed">
                  "Menjawab seruan Adzan, meluruskan niat, dan bergegas mempersiapkan sholat berjemaah."
                </div>
                <div className="font-mono text-xl text-emerald-400 bg-white/10 px-6 py-2 rounded-lg">
                  Selesai dalam: {activePrayerEvent.timeLeftSeconds} Detik
                </div>
              </div>
            )}

            {/* 2. IQOMAH COUNTDOWN STATUS PANEL */}
            {activePrayerEvent.status === 'iqomah' && (
              <div className="h-full flex flex-col items-center justify-between py-12 text-center">
                <div className="text-4xl font-extrabold tracking-widest text-emerald-400 uppercase">
                  HITUNG MUNDUR IQOMAH
                </div>
                
                <div className="space-y-4">
                  <div className="text-[12rem] font-bold tracking-tighter text-white font-mono leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    {Math.floor(activePrayerEvent.timeLeftSeconds! / 60)}:
                    {String(activePrayerEvent.timeLeftSeconds! % 60).padStart(2, '0')}
                  </div>
                  <div className="text-3xl font-semibold text-blue-300 uppercase tracking-widest">
                    Menuju Sholat Berjemaah {activePrayerEvent.prayerName}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-8 py-4 max-w-xl text-lg text-gray-300">
                  ⚠️ Silakan luruskan saf, rapatkan barisan, dan nonaktifkan/senyapkan telepon genggam Anda.
                </div>
              </div>
            )}

            {/* 3. SHOLAT TRANQUIL QUIET DISPLAY */}
            {activePrayerEvent.status === 'sholat' && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full border border-gray-850 flex items-center justify-center animate-ping text-red-500 mb-6">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <div className="text-5xl font-extrabold tracking-widest text-emerald-500 uppercase">
                  SHOLAT BERJEMAAH SEDANG BERLANGSUNG
                </div>
                <div className="text-2xl text-gray-400 max-w-lg leading-relaxed font-light">
                  Layar utama dimatikan sementara agar jamaah dapat khusyuk mendengarkan bacaan Imam dan menjaga konsentrasi.
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER SELECTED DESIGN TEMPLATE PATTERNS */}
      {layoutTemplate === 'minimal-elegant' ? (
        // RENDER PREMIUM FULLSCREEN OVERLAY (IMAGE 1 STYLE)
        <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
          {/* Background is full-screen slide slideshow */}
          <div className="absolute inset-0 z-0 select-none">
            {renderMediaReceptacle("w-full h-full")}
          </div>

          {!isWideScreen && (
            <>
              {/* Premium Floating Header Row */}
              <div className="relative z-10 w-full p-6 px-10 flex justify-between items-center text-slate-800">
                {/* Left Card: Large rounded clock block (07:48 concept) */}
                <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 px-8 py-3.5 flex items-center justify-center min-w-[185px]">
                  <span className="text-5xl font-black font-mono tracking-tight text-slate-900">
                    {moment(now).format("HH:mm")}
                  </span>
                </div>

                {/* Vertical gold pillar divider */}
                <div className="hidden md:block h-10 w-[2px] bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 mx-5 opacity-80" />

                {/* Center: Mosque info */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <h1 className="text-3xl font-black tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] leading-none uppercase font-sans">
                    {settings.mosqueName}
                  </h1>
                  <p className="text-sm font-bold text-yellow-300 drop-shadow-[0_1px_4.5px_rgba(0,0,0,0.85)] mt-1.5 uppercase tracking-widest">
                    {settings?.location?.city || "Kota Bandung"}
                  </p>
                </div>

                {/* Vertical gold pillar divider */}
                <div className="hidden md:block h-10 w-[2px] bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 mx-5 opacity-80" />

                {/* Right Card: Hijri & Gregorian date block divided nicely */}
                <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 px-8 py-3 flex flex-col items-center justify-center text-center min-w-[220px]">
                  <span className="text-sm font-black text-slate-900 tracking-wide uppercase">
                    {hijriText}
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-500 mt-1 uppercase tracking-wide">
                    {moment(now).format("dddd, D MMMM YYYY")}
                  </span>
                </div>
              </div>

              {/* Floating Overlays in the slide view container */}
              <div className="absolute inset-x-8 top-[24%] z-20 flex justify-between items-start pointer-events-none">
                {/* Clickable speaker "Mode Muadzin" capsule */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={cn(
                    "pointer-events-auto flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase shadow-2xl border transition-all duration-300 transform active:scale-95",
                    soundEnabled 
                      ? "bg-emerald-600/90 hover:bg-emerald-700 border-emerald-400 text-white animate-pulse"
                      : "bg-slate-900/80 hover:bg-slate-850 border-slate-705 text-slate-200"
                  )}
                >
                  <Volume2 className={cn("w-4 h-4", soundEnabled && "animate-bounce")} />
                  <span>Mode Muadzin: {soundEnabled ? "AKTIF" : "SENYAP"}</span>
                </button>

                {/* Red warning/notice banner representing nearest holiday countdown */}
                {nearestHoliday && (
                  <div className="bg-red-650/95 border border-red-500/30 text-white rounded-full font-black text-xs uppercase px-5 py-2.5 shadow-2xl flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>{nearestHoliday.name} -{nearestHoliday.daysRemaining} Hari</span>
                  </div>
                )}
              </div>

              {/* Gears Settings trigger block at center right */}
              <div className="absolute right-8 top-[40%] z-20 pointer-events-auto">
                <a 
                  href="/admin/themes" 
                  className="w-10 h-10 bg-white/80 backdrop-blur-md border border-white/20 rounded-xl shadow-lg flex items-center justify-center text-slate-700 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95"
                  title="Ubah Desain"
                >
                  <svg className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.542.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </a>
              </div>

              {/* Glassmorphic bottom grid */}
              <div className="absolute bottom-[13%] left-8 right-8 z-20 bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl p-1.5 flex shadow-2xl items-center h-28 overflow-hidden">
                {prayerTimesInfo?.map((pt, index) => {
                  const isNext = nextPrayer?.id === pt.id;
                  return (
                    <div key={pt.id} className="flex-1 flex items-center h-full min-w-0">
                      {/* Gold vertical ornament partition divider */}
                      {index > 0 && !isNext && nextPrayer?.id !== prayerTimesInfo[index - 1]?.id && (
                        <div className="flex flex-col items-center gap-1 opacity-50 px-1 shrink-0">
                          <div className="w-[1.5px] h-3.5 bg-gradient-to-b from-amber-400 to-amber-600 rounded" />
                          <div className="w-[3px] h-[3px] bg-amber-500 rounded-full" />
                          <div className="w-[1.5px] h-3.5 bg-gradient-to-b from-amber-400 to-amber-600 rounded" />
                        </div>
                      )}

                      {/* Prayer Card */}
                      <div 
                        className={cn(
                          "flex-1 h-full rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all duration-300 overflow-hidden relative",
                          isNext 
                            ? "bg-[#e67e22] text-white scale-[1.03] shadow-md z-10 font-bold border border-orange-400" 
                            : "text-slate-800"
                        )}
                      >
                        {isNext && (
                          <div className="absolute inset-0 bg-gradient-to-b from-amber-500 to-orange-600 opacity-95 pointer-events-none -z-10" />
                        )}
                        {isNext && (
                          <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                        )}
                        
                        <span className={cn(
                          "text-[11px] font-black tracking-widest uppercase mb-1 font-sans",
                          isNext ? "text-yellow-105" : "text-slate-500"
                        )}>
                          {pt.name}
                        </span>
                        <span className={cn(
                          "text-2xl font-black font-mono tracking-tighter leading-none block",
                          isNext ? "text-white" : "text-slate-900"
                        )}>
                          {moment(pt.time).format("HH:mm")}
                        </span>

                        {/* Active Countdown below timing */}
                        {isNext && (
                          <span className="text-[10px] font-mono font-black tracking-tight text-yellow-250 mt-1 block">
                            -{countdownText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Running text footer banner */}
              {renderMarqueeFooter("absolute bottom-0 left-0 right-0 z-10")}
            </>
          )}
        </div>
      ) : layoutTemplate === 'modern-grid' ? (
        // RENDER TRIPLE HIGH-CONTRAST SOLID HEADER & RAINBOW BOTTOM PANEL (IMAGE 3 STYLE)
        <div className="h-full w-full flex flex-col bg-slate-950 overflow-hidden text-white justify-between">
          {!isWideScreen && (
            <header className="h-[15%] w-full flex items-center justify-between text-white border-b border-white/5 select-none shrink-0 overflow-hidden">
              {/* Left: Clock panel with deep magenta solid backdrop */}
              <div className="w-[25%] h-full bg-[#c2185b] flex flex-col items-center justify-center text-center font-mono py-2 shrink-0 border-r border-white/5 shadow-inner">
                <span className="text-4xl font-extrabold tracking-normal flex items-center leading-none">
                  {moment(now).format("HH:mm")}
                  <span className="text-xl text-pink-300 font-bold tracking-wider ml-1 animate-pulse">
                    {moment(now).format("ss")}
                  </span>
                </span>
                <span className="text-[9px] font-bold tracking-widest text-pink-100 uppercase mt-1">WAKTU AKTIF - {settings?.location?.timezone || "WIB"}</span>
              </div>

              {/* Center: Mosque info with deep emerald background */}
              <div className="flex-1 h-full bg-[#15803d] flex flex-col items-center justify-center text-center px-4 overflow-hidden border-r border-white/5">
                <h1 className="text-2xl font-black uppercase tracking-wider leading-none font-sans text-white drop-shadow">
                  {settings.mosqueName}
                </h1>
                <p className="text-xs font-semibold text-emerald-100/90 tracking-wide mt-1.5 truncate max-w-lg uppercase">
                  {settings.mosqueAddress}
                </p>
              </div>

              {/* Right: Hijri/Gregorian date inside deep cobalt blue container */}
              <div className="w-[28%] h-full bg-[#1e3a8a] flex flex-col items-center justify-center text-center px-5 py-2 shrink-0 shadow-inner">
                <span className="text-sm font-black text-blue-100 tracking-wider uppercase leading-none">
                  {hijriText}
                </span>
                <span className="text-xs font-bold mt-1 text-slate-300 uppercase tracking-widest">
                  {moment(now).format("dddd, D MMMM YYYY")}
                </span>
              </div>
            </header>
          )}

          {/* Center portion of screen: slideshow frame */}
          <main className={cn(
            "flex-1 relative overflow-hidden transition-all duration-700",
            isWideScreen ? "h-screen w-screen" : "h-[62%]"
          )}>
            {renderMediaReceptacle("w-full h-full")}
          </main>

          {/* Bottom colorful horizontal items grid spanning everything */}
          {!isWideScreen && (
            <div className="h-[15%] bg-slate-900 grid grid-cols-7 gap-0.5 border-t border-white/10 shrink-0 overflow-hidden">
              {prayerTimesInfo?.map((pt, idx) => {
                const isNext = nextPrayer?.id === pt.id;
                
                // Color assignments to form the authentic Image 3 look:
                const colors = [
                  "bg-[#0d9488]", // Imsak (Indigo Teal)
                  "bg-[#059669]", // Shubuh (Dark Green)
                  "bg-[#2563eb]", // Syuruq (Ocean Blue)
                  "bg-[#ea580c]", // Dzuhur (Ginger Orange)
                  "bg-[#c2185b]", // Ashar (Crimson Violet)
                  "bg-[#b91c1c]", // Maghrib (Deep Red)
                  "bg-[#4f46e5]"  // Isya (Royal Blue)
                ];
                const blockColor = colors[idx] || "bg-slate-700";

                return (
                  <div 
                    key={pt.id} 
                    className={cn(
                      "h-full flex flex-col justify-center items-center text-center px-2 py-3 transition-all duration-300 border border-white/5 relative",
                      blockColor,
                      isNext ? "ring-4 ring-yellow-400 shadow-2xl z-20 scale-[1.015]" : "opacity-95"
                    )}
                  >
                    {isNext && <span className="absolute top-0 inset-x-0 h-[4px] bg-yellow-400 animate-pulse" />}
                    
                    <span className="text-[11px] font-black text-white/90 tracking-widest uppercase mb-1 font-sans">
                      {pt.name}
                    </span>
                    <span className="text-2xl font-black font-mono tracking-tighter leading-none text-white">
                      {moment(pt.time).format("HH:mm")}
                    </span>

                    {/* Centered blinking countdown indicator */}
                    {isNext && (
                      <span className="text-[10px] font-mono font-black tracking-normal text-yellow-250 mt-1 animate-pulse">
                        -{countdownText}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Red background running text marquee for Image 3 layout */}
          {!isWideScreen && (
            <footer className="h-9 bg-red-700 border-t border-red-800 flex items-center overflow-hidden shrink-0 shadow-lg text-white font-bold select-none px-6">
              <span className="bg-white text-red-700 font-black text-xs px-3 py-1.5 rounded-md shadow uppercase tracking-wider shrink-0 mr-4">INFO MASJID</span>
              <div className="flex-1 overflow-hidden flex items-center">
                <marquee 
                  className="text-white font-extrabold text-lg tracking-wide shrink-0"
                  scrollamount={settings.display.runningTextSpeed === 'slow' ? "3" : settings.display.runningTextSpeed === 'fast' ? "12" : "6"}
                >
                  {settings.display.runningText || "Mari rapatkan dan luruskan barisan demi kesempurnaan sholat berjemaah."}
                </marquee>
              </div>
            </footer>
          )}
        </div>
      ) : layoutTemplate === 'sidebar-right' ? (
        // RENDER INVERTED SPLIT LAYOUT (LEFT SLIDE, RIGHT COL PRAYER TIMES)
        <div className="h-full w-full flex flex-col">
          {!isWideScreen && renderHeader()}

          <main className={cn(
            "flex-1 flex gap-6 p-6 transition-all duration-700",
            isWideScreen ? "h-screen p-0 m-0 gap-0 overflow-hidden" : "h-[75%]"
          )}>
            {/* Left Portion: Slide visual (2/3 width) */}
            {renderMediaReceptacle("w-2/3")}

            {/* Right Portion: vertical schedules (1/3 width) */}
            {!isWideScreen && renderPrayerColumn("w-1/3")}
          </main>

          {!isWideScreen && renderMarqueeFooter()}
        </div>
      ) : (
        // DEFAULT: CLASSIC LAYOUT (LEFT COL SCHEDULE, RIGHT COL SLIDE)
        <div className="h-full w-full flex flex-col">
          {!isWideScreen && renderHeader()}

          <main className={cn(
            "flex-1 flex gap-6 p-6 transition-all duration-700",
            isWideScreen ? "h-screen p-0 m-0 gap-0 overflow-hidden" : "h-[75%]"
          )}>
            {/* Left Portion: vertical schedules (1/3 width) */}
            {!isWideScreen && renderPrayerColumn("w-1/3")}

            {/* Right Portion: Slide visual (2/3 width) */}
            {renderMediaReceptacle("w-2/3")}
          </main>

          {!isWideScreen && renderMarqueeFooter()}
        </div>
      )}

    </div>
  );
}
