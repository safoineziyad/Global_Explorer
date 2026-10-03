import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ExplorerModeId, GeoAnchor } from '../data/explorerFeatures'

export type GeoStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unsupported'
export type LocationSource = 'gps' | 'fallback' | 'manual'

export type PresetLocation = GeoAnchor & { id: string; name: string; emoji: string }

/** A default anchor so every feature works even without GPS consent. */
export const DEFAULT_ANCHOR: GeoAnchor = { lat: 31.6295, lng: -7.9811 }

export const LOCATION_PRESETS: PresetLocation[] = [
  { id: 'marrakech', name: 'Marrakech', emoji: '🇲🇦', lat: 31.6295, lng: -7.9811 },
  { id: 'rome', name: 'Rome', emoji: '🇮🇹', lat: 41.9028, lng: 12.4964 },
  { id: 'cairo', name: 'Cairo', emoji: '🇪🇬', lat: 30.0444, lng: 31.2357 },
  { id: 'baghdad', name: 'Baghdad', emoji: '🇮🇶', lat: 33.3152, lng: 44.3661 },
  { id: 'paris', name: 'Paris', emoji: '🇫🇷', lat: 48.8566, lng: 2.3522 },
  { id: 'timbuktu', name: 'Timbuktu', emoji: '🇲🇱', lat: 16.7735, lng: -3.0074 },
  { id: 'london', name: 'London', emoji: '🇬🇧', lat: 51.5072, lng: -0.1276 },
  { id: 'newyork', name: 'New York', emoji: '🇺🇸', lat: 40.7128, lng: -74.006 },
  { id: 'tokyo', name: 'Tokyo', emoji: '🇯🇵', lat: 35.6762, lng: 139.6503 },
]

export type ExplorerPanelId =
  | 'location'
  | 'around'
  | 'machine'
  | 'geodiscovery'
  | 'ai'
  | 'xp'

export type ExplorerContextValue = {
  mode: ExplorerModeId
  setMode: (mode: ExplorerModeId) => void
  point: GeoAnchor
  locationSource: LocationSource
  geoStatus: GeoStatus
  requestLocation: (track?: boolean) => void
  setManualPoint: (preset: PresetLocation) => void
  radiusKm: number
  setRadiusKm: (km: number) => void
  timeTravelOn: boolean
  setTimeTravelOn: (on: boolean) => void
  nearMeOn: boolean
  setNearMeOn: (on: boolean) => void
  year: number
  setYear: (year: number) => void
  activePanel: ExplorerPanelId | null
  openPanel: (panel: ExplorerPanelId) => void
  closePanel: () => void
  visited: string[]
  addVisited: (key: string) => void
}

const STORAGE_KEY = 'global-explorer:explorer'

type Persisted = {
  mode?: ExplorerModeId
  radiusKm?: number
  timeTravelOn?: boolean
  nearMeOn?: boolean
  year?: number
  visited?: string[]
}

function loadPersisted(): Persisted {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Persisted
  } catch {
    return {}
  }
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null)

export function ExplorerProvider({ children }: { children?: ReactNode }) {
  const initial = useMemo(loadPersisted, [])
  const [mode, setMode] = useState<ExplorerModeId>(initial.mode ?? 'walk')
  const [radiusKm, setRadiusKm] = useState<number>(initial.radiusKm ?? 1)
  const [timeTravelOn, setTimeTravelOn] = useState<boolean>(initial.timeTravelOn ?? false)
  const [nearMeOn, setNearMeOn] = useState<boolean>(initial.nearMeOn ?? false)
  const [year, setYear] = useState<number>(initial.year ?? 2026)
  const [visited, setVisited] = useState<string[]>(initial.visited ?? [])
  const [activePanel, setActivePanel] = useState<ExplorerPanelId | null>(null)

  const [point, setPoint] = useState<GeoAnchor>(DEFAULT_ANCHOR)
  const [locationSource, setLocationSource] = useState<LocationSource>('fallback')
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const watchRef = useRef<number | null>(null)

  // Persist the additive layer state (best effort).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mode, radiusKm, timeTravelOn, nearMeOn, year, visited })
      )
    } catch {
      // Persistence is best effort.
    }
  }, [mode, radiusKm, timeTravelOn, nearMeOn, year, visited])

  useEffect(() => {
    return () => {
      if (watchRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current)
      }
    }
  }, [])

  const requestLocation = useCallback((track = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('unsupported')
      return
    }
    setGeoStatus('locating')
    const onSuccess = (position: GeolocationPosition) => {
      setPoint({ lat: position.coords.latitude, lng: position.coords.longitude })
      setLocationSource('gps')
      setGeoStatus('granted')
    }
    const onError = () => {
      setGeoStatus('denied')
      setLocationSource('fallback')
    }
    if (track) {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      })
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 15000,
      })
    }
  }, [])

  const setManualPoint = useCallback((preset: PresetLocation) => {
    setPoint({ lat: preset.lat, lng: preset.lng })
    setLocationSource('manual')
    setGeoStatus('granted')
  }, [])

  const addVisited = useCallback((key: string) => {
    setVisited((prev) => (prev.includes(key) ? prev : [...prev, key].slice(-200)))
  }, [])

  const openPanel = useCallback((panel: ExplorerPanelId) => setActivePanel(panel), [])
  const closePanel = useCallback(() => setActivePanel(null), [])

  const value = useMemo<ExplorerContextValue>(
    () => ({
      mode,
      setMode,
      point,
      locationSource,
      geoStatus,
      requestLocation,
      setManualPoint,
      radiusKm,
      setRadiusKm,
      timeTravelOn,
      setTimeTravelOn,
      nearMeOn,
      setNearMeOn,
      year,
      setYear,
      activePanel,
      openPanel,
      closePanel,
      visited,
      addVisited,
    }),
    [
      mode,
      point,
      locationSource,
      geoStatus,
      requestLocation,
      setManualPoint,
      radiusKm,
      timeTravelOn,
      nearMeOn,
      year,
      activePanel,
      openPanel,
      closePanel,
      visited,
      addVisited,
    ]
  )

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>
}

export function useExplorer(): ExplorerContextValue {
  const context = useContext(ExplorerContext)
  if (!context) throw new Error('useExplorer must be used within an ExplorerProvider')
  return context
}

export default ExplorerContext
