# Android Studio emulator and PWA guide

Global Explorer is a React/Vite website with a web app manifest and a
production service worker. It can be viewed on an Android Studio virtual phone
in Chrome and, when served from HTTPS, installed as a Progressive Web App (PWA).

There are therefore **two** install targets, both built from the same `dist/`
bundle and the same React code — no Kotlin/Swift rewrite:

1. **The PWA** — the website itself, installable from Chrome/Safari, sharing the
   production URL and the SEO surface.
2. **The Capacitor Android shell** (`android/`) — a native WebView wrapper that
   produces a real APK/AAB for the Play Store. It has its own bundle and its own
   launcher icon, and it deliberately skips the service worker because the native
   container already owns the files.

## Requirements

- Node.js 23.6 or newer and npm
- Android Studio with Android SDK Platform Tools and an Android Virtual Device
- Google Chrome available in the emulator (use a system image that includes
  Google Play, or install Chrome in the virtual device)
- JDK 21+ and the Android SDK for building the native APK (Android Studio bundles
  its own JDK; nothing else needs Java installed)

## Preview the development site in the emulator

1. In Android Studio, open **Device Manager**, create a virtual phone, and
   start it.
2. In PowerShell, from the repository root, install dependencies and start Vite
   on the host network interface:

   ```powershell
   npm ci
   npm run dev -- --host 0.0.0.0
   ```

   Vite uses port `3000` for this project. Keep this terminal running.
3. Open Chrome inside the emulator and visit:

   ```text
   http://10.0.2.2:3000
   ```

   Android Emulator reserves `10.0.2.2` as the address of the development
   computer. Do not use `localhost` in emulator Chrome; that points to the
   virtual phone itself.

This is the quickest way to inspect the responsive mobile website and use Vite
hot reload. The development build deliberately does not register the service
worker, and this HTTP address is not a secure context for service-worker use.
Therefore, this local preview is **not** the install/offline PWA test.

## Install and test the PWA in the emulator (without deploying)

A production build is required, because the worker is registered only outside
development. In PowerShell:

```powershell
npm run build
npm run preview -- --host 0.0.0.0
adb reverse tcp:3000 tcp:3000
```

Then open `http://localhost:3000` in the emulator's Chrome.

`adb reverse` forwards the device's loopback to the host, so `localhost` resolves
to your machine **and** counts as a secure origin for service-worker use. Opening
`http://10.0.2.2:3000` works for loading the page but the service worker is
silently rejected there, because `10.0.2.2` is not a secure context — that single
detail is why a local PWA test can appear to "do nothing". Repeat the `adb`
command after rebooting the emulator.

## Install and test the PWA on a real HTTPS deployment

1. Build and deploy the site to an HTTPS host, or use an existing HTTPS
   deployment. Browsers require HTTPS (except for their own loopback origins).
2. Start the Android virtual phone and open Chrome.
3. Navigate to the HTTPS site URL. Wait for the page to finish loading and for
   the service worker to install.
4. Use the site's **Install** prompt when Chrome offers it. If no prompt is
   shown, open Chrome's menu and select **Install app** or **Add to Home
   screen** (the menu label varies by Chrome version).
5. Launch **Global Explorer** from the emulator's home screen. Once the
   service worker has cached the app shell and bundled datasets, enable
   airplane mode and reopen it to check the offline experience.

The app's manifest is `public/site.webmanifest`, its service worker is
`public/sw.js`, and registration/install UI is implemented in
`src/services/pwa.ts` and `src/components/PwaPrompt.tsx`. The worker precaches
the application shell and both bundled datasets plus the hashed entry assets
read out of the built shell; lazily loaded route chunks are cached as they are
requested. Offline deep links fall back to the shared app shell, which lets the
client router render the route, and a 5xx response falls back the same way.
Live REST Countries requests and other cross-origin requests are not available
offline. Icons and social cards are generated from the `--ge-*` palette in
`src/index.css` by `npm run icons`.

## Building the native APK with Android Studio

The native shell reuses `dist/`, so always sync after a web build:

```powershell
npm run cap:sync   # npm run build && cap sync android
npm run cap:open   # opens the project in Android Studio
```

Then in Android Studio: pick an Android Virtual Device (or a plugged-in phone)
and press **Run**. For a distributable build use **Build > Build Bundle(s)/
APK(s) > Build APK(s)**, and for the Play Store **Build > Generate Signed
Bundle** to produce the AAB.

Notes:

- `android/app/src/main/assets/public` is a copy of `dist/`. It is generated and
  gitignored (`android/.gitignore`); `npm run cap:sync` refreshes it.
- The launcher icon is generated, not hand-drawn: `npm run icons` rewrites every
  `mipmap-*/ic_launcher*.png` and the adaptive background colour, so the icon can
  never drift from the web app.
- Nothing about the React code changes to become an Android app; there is no
  Kotlin/Swift source in this repository to maintain.

## iOS

Android Studio cannot test iOS at all — no Safari, no Add to Home Screen, no iOS
install behaviour. Adding the iOS shell (`npx cap add ios`) can be done from
Windows but building it requires a Mac with Xcode. Until then, test iOS through
the PWA on a real iPhone (Safari's **Share > Add to Home Screen**).

On iOS the install bar cannot show a button, because Safari never fires
`beforeinstallprompt`; it shows the `pwa.iosInstallHint` instructions instead.

## Troubleshooting: blank page while offline

Two non-obvious things keep the offline shell alive. Both are covered by
`tests/pwa.test.mjs`, but they are easy to reintroduce.

**`Vary: Origin` on cached responses.** A proxy in front of the host adds
`Vary: Origin` to everything it serves, and Cache Storage honours `Vary` by
comparing the *stored* request's headers against the incoming one. The
precache stores a copy fetched by a plain `fetch()`, which sends no `Origin`
header — while `dist/index.html` declares `crossorigin` on its entry script and
stylesheet, making those CORS-mode requests that do send one. Every match
misses, the worker falls through to the network, and the app renders a blank
page with two 502s for the entry assets. The navigation itself keeps working
(no `Origin` on a GET navigation), which hides the cause. Every `cache.match()`
in `public/sw.js` therefore passes `MATCH` (`{ ignoreVary: true }`); a test
fails if one is written without it.

**Precaching every route chunk.** Lazily imported route chunks do not exist in
`index.html`, so the worker cannot discover them from the shell. The
`ge-pwa-precache-manifest` plugin in `vite.config.ts` writes
`dist/sw-manifest.json` (all 19 build outputs) and stamps a hash of it into
`dist/sw.js`. The stamp matters as much as the list: without it the source
`public/sw.js` is byte-identical between deploys, the browser never installs
the update, and clients stay on the previous shell and its stale asset names
until a hard reload. The hash also names the cache, so `activate` drops the
previous build's copy instead of accumulating dead chunks.

