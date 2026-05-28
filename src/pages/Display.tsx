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
    const tz = settings?.location.timezone || "WIB";
    const tzOffsetHours = tz === "WIT" ? 9 : tz === "WITA" ? 8 : 7;
    // Calculate UTC millisecond epoch, then add the chosen offset
    const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTimestamp + (3600000 * tzOffsetHours));
  }, [now, settings?.location.timezone]);

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
      { id: 'maghrib', name: 'MAGHRIB', time: pt.maghrib, color: 'bg-red-650', isDailyPrayer: true },
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
            beepAudioRef.current.volume = (settings?.audio.adzanVolume || 80) / 100;
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
    if (settings?.display.mode === 'mixed' && !activePrayerEvent) {
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
      }, (settings.display.slideDuration || 10) * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentMode, settings, slideIndex, activePrayerEvent]);

  if (!settings) return <div className="h-screen flex text-white bg-slate-950 items-center justify-center font-sans">Memuat Layar Jasma...</div>;

  const hijriFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

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

  const isWideScreen = settings.display.mediaFullScreen && (currentMode === 'slide' || currentMode === 'video') && !activePrayerEvent;

  const isDarkBg = useMemo(() => {
    if (!settings?.display.bgColor) return false;
    const hex = settings.display.bgColor.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }, [settings?.display.bgColor]);

  const isDarkBox = useMemo(() => {
    if (!settings?.display.boxColor) return false;
    const hex = settings.display.boxColor.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }, [settings?.display.boxColor]);

  return (
    <div 
      className="h-screen w-screen overflow-hidden font-sans flex flex-col transition-colors duration-1000"
      style={{ backgroundColor: settings.display.bgColor || "#f3f4f6", color: isDarkBg ? "#f8fafc" : "#1f2937" }}
    >
      
      {/* Sound Overlay Activation Guide (required by current browser standards for audio play) */}
      {!soundEnabled && (
        <button 
          onClick={() => setSoundEnabled(true)}
          className="absolute top-2 left-2 z-[99] flex items-center gap-1 bg-red-600/95 hover:bg-emerald-600 border border-white text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow-lg transition animate-bounce"
        >
          <VolumeX className="w-3.5 h-3.5" /> Klik Untuk Suara Adzan
        </button>
      )}

      {soundEnabled && (
        <div className="absolute top-2 left-2 z-[99] flex items-center gap-1 bg-emerald-600/90 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
          <Volume2 className="w-3 h-3 animate-pulse" /> AUDIO AKTIF
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

      {/* NORMAL LAYOUT DISPLAY */}
      <AnimatePresence>
        {!isWideScreen && (
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
                    {settings.location.timezone || "WIB"}
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
            <div className="w-2/4 flex flex-col items-center justify-center text-center">
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
                  {hijriFormatter.format(now).replace(" AH", "")} H
                </div>
              </div>
            </div>
          </header>
        )}
      </AnimatePresence>

      {/* MAIN BODY LAYOUT */}
      <main className={cn(
        "flex-1 flex gap-6 p-6 transition-all duration-700",
        isWideScreen ? "h-screen p-0 m-0 gap-0 overflow-hidden" : "h-[75%]"
      )}>
        
        {/* LEFT COLUMN: Image & Prayer Times (Hidden under WideScreen Slides) */}
        {!isWideScreen && (
          <div 
            className="w-1/3 flex flex-col rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-500"
            style={{ backgroundColor: settings.display.boxColor || "#ffffff" }}
          >
            {/* Mosque Image (Top half of left col) */}
            <div className="flex-1 relative bg-gray-200 overflow-hidden max-h-[35%]">
              <img 
                src={settings.display.leftBgImage || "https://images.unsplash.com/photo-1564683214964-b31c0ee611fc?q=80&w=2070&auto=format&fit=crop"} 
                alt="Mosque Main" 
                className="absolute inset-0 w-full h-full object-cover select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end">
                <div className="p-4 w-full">
                  <span className="text-yellow-400 text-[10px] font-bold tracking-widest pl-0.5 uppercase">Menuju Waktu Sholat</span>
                  {nextPrayer && (
                    <div className="text-white text-2xl font-extrabold flex justify-between items-center w-full mt-1">
                      <span className="tracking-wide uppercase text-sm font-sans">{nextPrayer.name}</span>
                      <span className="font-mono text-emerald-300 tracking-tight text-xl">{countdownText}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Prayer Time Blocks (Bottom half) berderet rapi */}
            <div className="p-4 grid grid-cols-1 gap-1.5 flex-1 justify-center">
              {prayerTimesInfo?.map((pt) => {
                const isNext = nextPrayer?.id === pt.id;
                
                return (
                  <div 
                    key={pt.id} 
                    className={cn(
                      "flex justify-between items-center px-5 py-2 rounded-xl shadow-sm text-white font-bold transition-all duration-500 relative overflow-hidden",
                      pt.color,
                      isNext ? "ring-4 ring-emerald-500 ring-offset-white scale-[1.02] shadow-xl z-10" : "opacity-95"
                    )}
                  >
                    {/* Active gloss glow indicator for next prayer time */}
                    {isNext && (
                      <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                    )}
                    <span className="text-xs md:text-sm tracking-wider uppercase drop-shadow-sm font-sans">{pt.name}</span>
                    <span className="text-base md:text-lg font-mono tracking-tight drop-shadow-sm">{moment(pt.time).format("HH:mm")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN / FULLSCREEN RECEPTACLE: Dynamic Media Display */}
        <div className={cn(
          "bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative flex items-center justify-center transition-all duration-700",
          isWideScreen ? "w-full h-full border-0 rounded-0 shadow-none m-0" : "w-2/3"
        )}>
          
          {/* Full Screen Dismiss Notification overlay for admin reference */}
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
                <div className="text-xl font-medium opacity-80 mb-8 tracking-wide">Wilayah {settings.location.city} & Sekitarnya</div>
                
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

            {/* Fallback pattern if no media uploaded */}
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

      </main>

      {/* FOOTER: RUNNING TEXT & BANNER */}
      {!isWideScreen && (
        <footer className="h-[10%] bg-blue-950 border-t-4 border-emerald-500 overflow-hidden flex items-center shadow-[0_-5px_15px_rgba(0,0,0,0.15)] relative z-20">
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
      )}

    </div>
  );
}
