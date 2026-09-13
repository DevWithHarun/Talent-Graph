import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talentgraph.app',
  appName: 'Talent Graph',
  webDir: 'dist/public',
  // NOTE: no `server.url` here — that is dev live-reload only.
  // Keeping it would make the installed APK try to load http://localhost:5173
  // and show a blank screen outside your PC.
  // For dev live-reload, temporarily add:
  // server: { url: 'http://YOUR_PC_IP:5173', cleartext: true },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      showSpinner: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e',
    },
  },
};

export default config;
