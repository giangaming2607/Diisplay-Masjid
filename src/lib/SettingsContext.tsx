import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { MosqueSettings } from '../types';

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
    const newSocket = io(baseUrl);
    setSocket(newSocket);

    // Fetch initial settings
    fetch(`${baseUrl}/api/settings`)
      .then(res => res.json())
      .then(data => setSettings(data));

    // Listen for updates
    newSocket.on('settingsUpdated', (updatedSettings) => {
      setSettings(updatedSettings);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<MosqueSettings>) => {
    if (!settings) return;
    
    const merged = { ...settings, ...newSettings };
    // Optimistic update
    setSettings(merged);
    
    await fetch(`${window.location.origin}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, socket }}>
      {children}
    </SettingsContext.Provider>
  );
};
