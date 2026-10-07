/**
 * Progressive Web App plumbing: service-worker registration, install prompts and
 * update notifications.
 *
 * Framework-free on purpose. The module-level store follows the same
 * subscribe/snapshot pattern as `services/atlas`, so every component shares one
 * listener set and one cached snapshot (`hooks/usePwa` binds it to React).
 *
 * See public/sw.js for the caching strategies and docs/PWA.md for the design.
 */

export type PwaState = {
  /** The browser offered an install prompt that has not been consumed yet. */
  canInstall: boolean
  /**
   * iOS Safari never fires `beforeinstallprompt`, so there is nothing to capture
   * and the UI has to fall back to Share -> Add to Home Screen instructions.
   */
  isIos: boolean
  /** Already launched from the home screen, so no install prompt is relevant. */
  isStandalone: boolean
  /** A newer worker finished installing and is waiting to take over. */
  updateReady: boolean
  /** The active worker has precached the shell and data, so offline use works. */
  offlineReady: boolean
}

const INITIAL_STATE: PwaState = {
  canInstall: false,
  isIos: false,
  isStandalone: false,
  updateReady: false,
  offlineReady: false,
}

let state: PwaState = INITIAL_STATE
const listeners = new Set<() => void>()

/**
 * Captured `beforeinstallprompt` event. Chrome only fires it once per page
 * load, so it has to be held until the user actually asks to install.
 */
let deferredPrompt: (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null =
  null

function setState(patch: Partial<PwaState>): void {
  const next = { ...state, ...patch }
  if (
    next.canInstall === state.canInstall &&
    next.isIos === state.isIos &&
    next.isStandalone === state.isStandalone &&
    next.updateReady === state.updateReady &&
    next.offlineReady === state.offlineReady
  ) {
    return
  }
  state = next
  for (const listener of listeners) listener()
}

export function subscribePwa(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPwaSnapshot(): PwaState {
  return state
}

export function getPwaServerSnapshot(): PwaState {
  return INITIAL_STATE
}

// ---------------------------------------------------------------------------
// Environment detection
// ---------------------------------------------------------------------------

/** True inside the Capacitor native shell, where the container owns the bundle. */
export function isNativeShell(): boolean {
  if (typeof window === 'undefined') return false
  const capacitor = (
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor
  if (!capacitor) return false
  return capacitor.isNativePlatform ? capacitor.isNativePlatform() : true
}

/** True when displayed as an installed app rather than a browser tab. */
export function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone === true) return true
  return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
}

/**
 * iOS/iPadOS detection. iPadOS 13+ presents a desktop Safari user agent, so it
 * is identified by the Mac platform string plus touch support.
 */
export function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return /Mac/.test(navigator.platform) && (navigator.maxTouchPoints || 0) > 1
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

let registered = false

/**
 * Register the service worker. Safe to call unconditionally: no-ops when the
 * browser has no service-worker support, inside the native shell, and in dev
 * builds where the worker would only cache stale assets.
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || registered) return
  if (!('serviceWorker' in navigator)) return
  if (isNativeShell()) return
  if (import.meta.env.DEV) return

  registered = true

  const base = import.meta.env.BASE_URL || '/'
  const swUrl = new URL('sw.js', new URL(base, window.location.origin)).pathname

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(swUrl, { scope: base })

      // A worker is already controlling the page (a previous visit).
      if (navigator.serviceWorker.controller) setState({ offlineReady: true })

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state !== 'installed') return
          if (navigator.serviceWorker.controller) {
            // An old worker is still in charge: this is an update, not a first install.
            setState({ updateReady: true })
          } else {
            setState({ offlineReady: true })
          }
        })
      })

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setState({ offlineReady: true, updateReady: false })
      })
    } catch (error) {
      // A failed registration must never break the site; the app stays online-only.
      console.warn('[pwa] service worker registration failed', error)
    }
  }

  if (document.readyState === 'complete') {
    void register()
  } else {
    window.addEventListener('load', () => void register(), { once: true })
  }
}

/**
 * Wire up the install-prompt events. Called once from `main.tsx` so the events
 * are captured as early as possible.
 */
export function initPwa(): void {
  if (typeof window === 'undefined') return

  setState({
    isIos: detectIos(),
    isStandalone: detectStandalone(),
  })

  window.addEventListener('beforeinstallprompt', (event) => {
    // Suppress the browser's mini-infobar so only our own UI offers the install.
    event.preventDefault()
    deferredPrompt = event as typeof deferredPrompt
    setState({ canInstall: true })
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    setState({ canInstall: false, isStandalone: true })
  })

  const media = typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: standalone)') : null
  if (media?.addEventListener) {
    media.addEventListener('change', (event) => setState({ isStandalone: event.matches }))
  }
}

// ---------------------------------------------------------------------------
// User actions
// ---------------------------------------------------------------------------

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

/** Show the browser's own install dialog. No-op where none is available. */
export async function promptInstall(): Promise<InstallOutcome> {
  if (!deferredPrompt) return 'unavailable'
  try {
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    return choice.outcome === 'accepted' ? 'accepted' : 'dismissed'
  } catch {
    return 'unavailable'
  } finally {
    deferredPrompt = null
    setState({ canInstall: false })
  }
}

/** Activate the waiting worker and reload once it has taken control. */
export function applyUpdate(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    window.location.reload()
    return
  }

  void navigator.serviceWorker.getRegistration().then((registration) => {
    const worker = registration?.waiting
    if (!worker) {
      window.location.reload()
      return
    }
    // Reload only once the new worker is actually in charge, otherwise the page
    // would come back up still being served by the old one.
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.location.reload()
      },
      { once: true },
    )
    worker.postMessage({ type: 'SKIP_WAITING' })
  })
}