'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    // Skip service workers inside the native Capacitor shell — they cause
    // stale caches / blank screens on Android. PWA SW is web-only.
    if (Capacitor.isNativePlatform()) return;
    if (window.location.protocol.startsWith('capacitor')) return;
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('SW registration failed:', err));
  }, []);

  return null;
}
