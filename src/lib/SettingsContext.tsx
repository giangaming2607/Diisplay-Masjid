import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { MosqueSettings } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';

const DEFAULT_SETTINGS: MosqueSettings = {
  mosqueName: "Masjid Baiturrahman",
  mosqueAddress: "Jl. Merdeka No. 123, Jakarta, Indonesia",
  location: {
    lat: -6.2088,
    lng: 106.8456,
    city: "Jakarta",
    timezone: "WIB",
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
    logoUrl: "",
    bootBgUrl: "",
    layoutTemplate: "classic",
  },
  audio: {
    adzanActive: true,
    adzanVolume: 80,
    iqomahActive: true,
    iqomahDuration: 7,
    iqomahVolume: 60,
    sholatDuration: 15,
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
  socket: null;
}

const SettingsContext = createContext<SettingsContextProps>({
  settings: null,
  updateSettings: async () => {},
  socket: null,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<MosqueSettings | null>(null);

  // Validate Firestore Connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
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

    // Subscribe to Firestore for live real-time updates
    const docRef = doc(db, "mosqueSettings", "global");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as MosqueSettings;
        setSettings(data);
        localStorage.setItem('jasma_settings', JSON.stringify(data));
      } else {
        // Doc doesn't exist, let's initialize it in Firestore
        setDoc(docRef, DEFAULT_SETTINGS)
          .then(() => {
            setSettings(DEFAULT_SETTINGS);
            localStorage.setItem('jasma_settings', JSON.stringify(DEFAULT_SETTINGS));
          })
          .catch((err) => {
            console.error("Failed to initialize default settings:", err);
          });
      }
    }, (error) => {
      // Missing or insufficient permissions or other Firebase errors must be caught
      handleFirestoreError(error, OperationType.GET, "mosqueSettings/global");
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<MosqueSettings>) => {
    const current = settings || DEFAULT_SETTINGS;
    
    // Perform safety deep merging to preserve fields
    const merged: MosqueSettings = {
      ...current,
      ...newSettings,
      location: {
        ...current.location,
        ...(newSettings.location || {}),
      },
      display: {
        ...current.display,
        ...(newSettings.display || {}),
      },
      audio: {
        ...current.audio,
        ...(newSettings.audio || {}),
      },
      slides: newSettings.slides !== undefined ? newSettings.slides : current.slides,
      videos: newSettings.videos !== undefined ? newSettings.videos : current.videos,
    };

    // Optimistically update state & local storage
    setSettings(merged);
    localStorage.setItem('jasma_settings', JSON.stringify(merged));

    try {
      const docRef = doc(db, "mosqueSettings", "global");
      await setDoc(docRef, merged);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "mosqueSettings/global");
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, socket: null }}>
      {children}
    </SettingsContext.Provider>
  );
};
