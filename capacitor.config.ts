import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor wraps the very same `dist/` bundle the website serves, so the
 * Android app and the PWA never drift apart. There is no second frontend and no
 * Kotlin/Swift to maintain.
 *
 * `src/services/pwa.ts` detects this shell (`isNativeShell`) and skips service
 * worker registration, because the native container already owns the bundle.
 */
const config: CapacitorConfig = {
  appId: 'com.globalexplorer.app',
  appName: 'Global Explorer',
  webDir: 'dist',
  server: {
    // A secure https origin inside the WebView, so localStorage and geolocation
    // behave exactly as they do on the web.
    androidScheme: 'https',
  },
  android: {
    // Match --ge-bg so launching the app does not flash white.
    backgroundColor: '#0b111c',
  },
}

export default config