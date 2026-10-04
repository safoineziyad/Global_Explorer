import { useEffect, useState } from 'react'

/**
 * Tracks the browser's online/offline status via `navigator.onLine` and the
 * `online` / `offline` window events. Returns `true` when the app should assume
 * the network is reachable. Defaults to `true` during SSR / first paint so we
 * never flash an offline banner before the browser reports its state.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Re-sync in case the value changed between render and effect.
    setOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}

export default useOnline
