import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { MosqueSettings } from '../types';

const DEFAULT_SETTINGS: MosqueSettings = {
  mosqueName: "Masjid Baiturrahman",
  mosqueAddress: "Jl. Merdeka No. 123, Jakarta, Indonesia",
  location: {
    lat: -6.2088,
    lng: 106.8456,
    city: "Jakarta",
  },
  display: {
    mode: "mixed",
    slideDuration: 10,
    mixedPattern: [
      { type: "schedule", duration: 15 },
      { type: "slide", duration: 10 },
      { type: "video", duration: 20 },
    ],
    runningText: "Selamat datang di Masjid Baiturrahman. Mari luruskan shaf sholat dan bergegas mempersiapkan sholat berjemaah.",
    runningTextSpeed: "medium",
    leftBgImage: "https://images.unsplash.com/photo-1564683214964-b31c0ee611fc?q=80&w=2070&auto=format&fit=crop",
    mediaFullScreen: false,
    bgColor: "#f3f4f6",
    boxColor: "#ffffff",
  },
  audio: {
    adzanActive: true,
    adzanVolume: 80,
    iqomahActive: true,
    iqomahDuration: 7,
    iqomahVolume: 60,
    warningAudioActive: true,
    warningMinutes: 3,
  },
  slides: [
    { id: "default_slide.jpg", url: "https://images.unsplash.com/photo-1594136979603-4c9197c36d22?q=80&w=2073&auto=format&fit=crop" }
  ],
  videos: [],
};

interface SettingsContextProps {
  settings: MosqueSettings | null;
  updateSettings: (newSettings: Partial<MosqueSettings>) => Promise<void>;
  socket: Socket | null;
}

const SettingsContext = createContext<SettingsContextProps>({
  settings: null,
  updateSettings: async () => {},
  socket: null,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<MosqueSettings | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Determine the base URL for the API and socket
    const baseUrl = window.location.origin;
    
    // Connect to websocket
    let newSocket: Socket | null = null;
    try {
      newSocket = io(baseUrl, {
        timeout: 5000,
        reconnectionAttempts: 3,
      });
      setSocket(newSocket);
    } catch (e) {
      console.warn("Could not establish websocket connection. Falling back into offline polling mode.", e);
    }

    // Try reading fallback from localStorage first immediately to avoid loading flash
    const localFallback = localStorage.getItem('jasma_settings');
    if (localFallback) {
      try {
        setSettings(JSON.parse(localFallback));
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }

    // Fetch initial settings from server & handle parsing failures gracefully
    fetch(`${baseUrl}/api/settings`)
      .then(async res => {
        if (!res.ok) throw new Error("HTTP error: " + res.status);
        const text = await res.text();
        // Shield from Vercel dynamic HTML fallback pages in static builds
        if (text.trim().startsWith("<")) {
          throw new Error("Invalid format: Server returned HTML page instead of JSON API settings.");
        }
        return JSON.parse(text);
      })
      .then(data => {
        if (data && typeof data === 'object' && 'mosqueName' in data) {
          setSettings(data);
          localStorage.setItem('jasma_settings', JSON.stringify(data));
        }
      })
      .catch(err => {
        console.warn("Bypassed server settings pull. Local storage active.", err);
        // Ensure settings are set to something valid so the UI doesn't remain blank
        setSettings(prev => prev || DEFAULT_SETTINGS);
      });

    // Listen for updates
    if (newSocket) {
      newSocket.on('settingsUpdated', (updatedSettings) => {
        setSettings(updatedSettings);
        localStorage.setItem('jasma_settings', JSON.stringify(updatedSettings));
      });
    }

    return () => {
      if (newSocket) newSocket.close();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<MosqueSettings>) => {
    // Determine current settings or fallback
    const current = settings || DEFAULT_SETTINGS;
    const merged = { ...current, ...newSettings };
    
    // Optimistic UI updates
    setSettings(merged);
    localStorage.setItem('jasma_settings', JSON.stringify(merged));
    
    try {
      await fetch(`${window.location.origin}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (e) {
      console.warn("API write unavailable. Saved to local storage successfully.", e);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, socket }}>
      {children}
    </SettingsContext.Provider>
  );
};
