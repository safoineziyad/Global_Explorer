// Additive "Explorer" feature data.
//
// All content here is clearly marked placeholder/mock data, structured so a
// real API can replace the generators later without touching the UI.

export type DiscoveryCategory =
  | 'nature'
  | 'history'
  | 'culture'
  | 'food'
  | 'discoveries'
  | 'architecture'

export type CategoryMeta = {
  id: DiscoveryCategory
  emoji: string
  /** Dot/legend colour. */
  color: string
  labelKey: string
  /** Which "within 1 km" counter this category feeds, if any. */
  counterKey?: string
}

/** Ordered exactly as requested: Nature, History, Culture, Food, Discoveries, Architecture. */
export const CATEGORIES: CategoryMeta[] = [
  { id: 'nature', emoji: '🟢', color: '#4fae6b', labelKey: 'category.nature', counterKey: 'nature' },
  { id: 'history', emoji: '🔵', color: '#4f8fd6', labelKey: 'category.history', counterKey: 'events' },
  { id: 'culture', emoji: '🟠', color: '#e0913f', labelKey: 'category.culture', counterKey: 'landmarks' },
  { id: 'food', emoji: '🟣', color: '#a86fd6', labelKey: 'category.food', counterKey: 'dishes' },
  { id: 'discoveries', emoji: '🔴', color: '#e05a5a', labelKey: 'category.discoveries' },
  { id: 'architecture', emoji: '🟡', color: '#e0c04f', labelKey: 'category.architecture', counterKey: 'landmarks' },
]

export const CATEGORY_BY_ID: Record<DiscoveryCategory, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<DiscoveryCategory, CategoryMeta>

export type ExplorerModeId = 'walk' | 'road' | 'world' | 'drone' | 'satellite' | 'history'

export type ExplorerMode = {
  id: ExplorerModeId
  emoji: string
  labelKey: string
}

export const EXPLORER_MODES: ExplorerMode[] = [
  { id: 'walk', emoji: '🚶', labelKey: 'explorer.modes.walk' },
  { id: 'road', emoji: '🚗', labelKey: 'explorer.modes.road' },
  { id: 'world', emoji: '✈️', labelKey: 'explorer.modes.world' },
  { id: 'drone', emoji: '🚁', labelKey: 'explorer.modes.drone' },
  { id: 'satellite', emoji: '🛰️', labelKey: 'explorer.modes.satellite' },
  { id: 'history', emoji: '⏳', labelKey: 'explorer.modes.history' },
]

/** Discovery radius (km) suggested by each explorer mode. */
export const MODE_RADIUS_KM: Record<ExplorerModeId, number> = {
  walk: 1,
  road: 10,
  world: 50,
  drone: 2,
  satellite: 25,
  history: 10,
}

/** Radius (km) the UI should switch to when a mode is selected. */
export function radiusForMode(mode: ExplorerModeId): number {
  return MODE_RADIUS_KM[mode] ?? 1
}

export type Discovery = {
  id: string
  name: string
  category: DiscoveryCategory
  lat: number
  lng: number
  /** Straight-line distance from the anchor, in metres. */
  distanceM: number
  story: string
}

export type GeoAnchor = { lat: number; lng: number }

const EARTH_RADIUS_KM = 6371

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: GeoAnchor, b: GeoAnchor): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/* ------------------------------------------------------------------ */
/* Deterministic mock generator                                        */
/* ------------------------------------------------------------------ */

function hash32(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NAME_POOLS: Record<DiscoveryCategory, string[]> = {
  nature: ['Cedar Grove', 'Blue Spring', 'Granite Ridge', 'Willow Marsh', 'Sunset Bluff', 'Old Oak Park'],
  history: ['Old Watchtower', 'Merchants’ Quarter', 'Ancient Rampart', 'Fountain Square', 'Old Mill', 'Caravan Gate'],
  culture: ['Artisan Alley', 'Storytellers’ Hall', 'Handicraft Souk', 'Music Courtyard', 'Mural Wall', 'Puppet Theatre'],
  food: ['Spice Market', 'Bread Oven', 'Mint Tea House', 'Harbour Grill', 'Saffron Kitchen', 'Night Market'],
  discoveries: ['Forgotten Observatory', 'Hidden Cistern', 'Star Chart Room', 'Sunken Garden', 'First Well', 'Secret Library'],
  architecture: ['Tiled Mosque', 'Arch Bridge', 'Wind Towers', 'Carved Portal', 'Ramparts Gate', 'Court of Arches'],
}

const STORY_POOLS: Record<DiscoveryCategory, string[]> = {
  nature: [
    'A quiet green refuge said to be older than the city walls.',
    'Locals claim the water here never freezes.',
  ],
  history: [
    'A trade stop where caravans once exchanged news as well as goods.',
    'The site of an old watch post guarding the road.',
  ],
  culture: [
    'Generations of craftspeople have worked at this spot.',
    'A meeting place for music and storytelling.',
  ],
  food: [
    'A recipe here is said to be centuries old.',
    'Travellers once planned their journeys around this kitchen.',
  ],
  discoveries: [
    'A find that quietly changed how people read the sky.',
    'Records here hint at a much older settlement.',
  ],
  architecture: [
    'A style that spread far beyond this region.',
    'Built with techniques passed down over generations.',
  ],
}

/**
 * Deterministically derives mock discoveries around an anchor. The same anchor
 * and radius always produce the same list, so results are stable while a real
 * data source is unavailable.
 */
export function generateNearby(
  anchor: GeoAnchor,
  radiusKm: number,
  enabled?: Partial<Record<DiscoveryCategory, boolean>>
): Discovery[] {
  const out: Discovery[] = []
  for (const category of CATEGORIES) {
    if (enabled && enabled[category.id] === false) continue
    const rng = mulberry(hash32(`${anchor.lat.toFixed(3)}:${anchor.lng.toFixed(3)}:${category.id}`))
    const count = 2 + Math.floor(rng() * 3)
    for (let i = 0; i < count; i++) {
      const meters = Math.sqrt(rng()) * Math.max(0, radiusKm) * 1000
      const bearing = rng() * Math.PI * 2
      const dLat = (meters / 1000 / 111.32) * Math.cos(bearing)
      const dLng = (meters / 1000 / (111.32 * Math.max(0.2, Math.cos(toRadians(anchor.lat))))) * Math.sin(bearing)
      const names = NAME_POOLS[category.id]
      const stories = STORY_POOLS[category.id]
      out.push({
        id: `${category.id}-${anchor.lat.toFixed(3)}-${anchor.lng.toFixed(3)}-${i}`,
        name: names[(hash32(`${anchor.lat}-${anchor.lng}-${category.id}-${i}`) % names.length + names.length) % names.length],
        category: category.id,
        lat: anchor.lat + dLat,
        lng: anchor.lng + dLng,
        distanceM: Math.round(meters),
        story: stories[i % stories.length],
      })
    }
  }
  return out.sort((a, b) => a.distanceM - b.distanceM)
}

/** Counts the "within 1 km" numbers requested for the My Location panel. */
export function countsWithin(discoveries: Discovery[], meters = 1000): Record<string, number> {
  const counts: Record<string, number> = { landmarks: 0, events: 0, dishes: 0, nature: 0 }
  for (const d of discoveries) {
    if (d.distanceM > meters) continue
    if (d.category === 'architecture' || d.category === 'culture') counts.landmarks++
    else if (d.category === 'history') counts.events++
    else if (d.category === 'food') counts.dishes++
    else if (d.category === 'nature') counts.nature++
  }
  return counts
}

/* ------------------------------------------------------------------ */
/* Explorer XP (sample, curiosity-based)                               */
/* ------------------------------------------------------------------ */

export type ExplorerXp = {
  level: number
  countries: number
  landmarks: number
  discoveries: number
  cultures: number
  routes: number
}

export const XP_SAMPLE: ExplorerXp = {
  level: 12,
  countries: 18,
  landmarks: 74,
  discoveries: 31,
  cultures: 22,
  routes: 14,
}

/** Adds discoveries/landmarks found during the session on top of the sample. */
export function xpFor(visitedCount: number): ExplorerXp {
  const bonus = Math.min(visitedCount, 99)
  return {
    level: XP_SAMPLE.level + Math.floor(bonus / 5),
    countries: XP_SAMPLE.countries,
    landmarks: XP_SAMPLE.landmarks + bonus,
    discoveries: XP_SAMPLE.discoveries + bonus,
    cultures: XP_SAMPLE.cultures,
    routes: XP_SAMPLE.routes,
  }
}
