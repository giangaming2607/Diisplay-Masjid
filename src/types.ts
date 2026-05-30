export interface MosqueSettings {
  mosqueName: string;
  mosqueAddress: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    timezone?: 'WIB' | 'WITA' | 'WIT';
  };
  display: {
    mode: 'schedule' | 'slide' | 'video' | 'mixed';
    slideDuration: number;
    mixedPattern: Array<{ type: 'schedule' | 'slide' | 'video'; duration: number }>;
    runningText: string;
    runningTextSpeed: 'slow' | 'medium' | 'fast';
    leftBgImage?: string;
    mediaFullScreen?: boolean;
    bgColor?: string;
    boxColor?: string;
    logoUrl?: string;
    bootBgUrl?: string;
    fullScreenBgImage?: string;
    layoutTemplate?: 'classic' | 'modern-grid' | 'sidebar-right' | 'minimal-elegant' | 'boxed-bottom-schedule' | 'layout-03' | 'layout-06' | 'layout-08';
  };
  audio: {
    adzanActive: boolean;
    adzanVolume: number;
    iqomahActive: boolean;
    iqomahDuration: number;
    iqomahVolume: number;
    sholatDuration: number;
    warningAudioActive: boolean;
    warningMinutes: number;
  };
  slides: Array<{ url: string; id: string }>;
  videos: Array<{ url: string; id: string }>;
}
