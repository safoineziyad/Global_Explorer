// Additive "Explorer" feature data.
//
// Provenance rule for this module: "nearby discoveries" are real records looked
// up by distance in the curated landmark and nature datasets, never generated.
// Categories without a dataset are surfaced as unavailable rather than filled
// with invented names, coordinates or stories.

// NOTE: the explicit `.ts` extensions are required, not decorative. The audit
// tests load this module directly through Node's native type stripping, and
// Node's ESM resolver will not guess an extension for a bare specifier.
// `allowImportingTsExtensions` in tsconfig.json makes this legal for type
// checking, and Vite resolves it the same way.
import { landmarks } from './landmarks.ts'
import { natureSites } from './nature.ts'

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
  /** Slug of the underlying curated record. */
  slug: string
  kind: PlaceKind
  /** English reference name; `nameKey` resolves the localized version. */
  name: string
  nameKey: string
  category: DiscoveryCategory
  lat: number
  lng: number
  country: string
  /** Straight-line distance from the anchor, in metres. */
  distanceM: number
  /** Real, cited description from the source dataset — never generated. */
  story: string
  storyKey: string
  /** How many citations back this record. */
  sourceCount: number
  /** In-app route for the full record. */
  href: string
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
/* Verified places: the only source of "nearby discoveries"             */
/* ------------------------------------------------------------------ */
/*                                                                          */
/* Earlier versions of this file generated plausible-looking place names,   */
/* coordinates and "local legends" from a seeded PRNG and presented them as  */
/* real findings. Nothing in that output was true, so none of it remains.    */
/*                                                                          */
/* Discoveries are now looked up by real distance in the curated landmark    */
/* and nature datasets (both of which carry citations). Where a category has */
/* no dataset behind it, the UI says so instead of showing invented results. */
/* ------------------------------------------------------------------ */

export type PlaceKind = 'landmark' | 'nature'

export type VerifiedPlace = {
  /** Stable id, also used as the MiniMap point key. */
  id: string
  slug: string
  kind: PlaceKind
  /** English reference name; `nameKey` is the localized version. */
  name: string
  nameKey: string
  category: DiscoveryCategory
  lat: number
  lng: number
  country: string
  /** English reference description; `summaryKey` is the localized version. */
  summary: string
  summaryKey: string
  /** How many citations back this record. */
  sourceCount: number
  /** In-app route for the full record. */
  href: string
}

/**
 * Category assignment for landmarks. Nature records map to `nature`
 * automatically; everything else is a built structure. The Ancient Wonders go
 * under `history` because that is what they are, not because a generator put
 * them there.
 */
const LANDMARK_CATEGORY: Record<string, DiscoveryCategory> = {
  everest: 'nature',
  pyramids: 'history',
  'hanging-gardens-of-babylon': 'history',
  'statue-of-zeus': 'history',
  'temple-of-artemis': 'history',
  'mausoleum-at-halicarnassus': 'history',
  'colossus-of-rhodes': 'history',
  'lighthouse-of-alexandria': 'history',
}

function categoryForLandmark(slug: string, built: string): DiscoveryCategory {
  const explicit = LANDMARK_CATEGORY[slug]
  if (explicit) return explicit
  if (built === 'Natural formation') return 'nature'
  return 'architecture'
}

/**
 * Every landmark and nature record, flattened into one proximity-searchable
 * index. Built once at module load; the datasets are small and static.
 */
export const VERIFIED_PLACES: VerifiedPlace[] = [
  ...landmarks.map((record) => {
    const category = categoryForLandmark(record.slug, record.built)
    return {
      id: `landmark:${record.slug}`,
      slug: record.slug,
      kind: 'landmark' as const,
      name: record.name,
      nameKey: `content.landmark.${record.slug}.name`,
      category,
      lat: record.location.lat,
      lng: record.location.lng,
      country: record.country,
      summary: record.description,
      summaryKey: `content.landmark.${record.slug}.description`,
      sourceCount: record.sources?.length ?? 0,
      href: `/landmark/${record.slug}`,
    }
  }),
  ...natureSites.map((record) => ({
    id: `nature:${record.slug}`,
    slug: record.slug,
    kind: 'nature' as const,
    name: record.name,
    nameKey: `content.nature.${record.slug}.name`,
    category: 'nature' as DiscoveryCategory,
    lat: record.location.lat,
    lng: record.location.lng,
    country: record.country,
    summary: record.description,
    summaryKey: `content.nature.${record.slug}.description`,
    sourceCount: record.sources?.length ?? 0,
    href: `/nature/${record.slug}`,
  })),
]

/**
 * Categories we have a real dataset for. The rest render as "no data"
 * rather than being silently filled with invented results.
 */
export const CATEGORIES_WITH_DATA: DiscoveryCategory[] = [
  ...new Set(VERIFIED_PLACES.map((place) => place.category)),
]

/** True when this category can return verified records. */
export function categoryHasData(category: DiscoveryCategory): boolean {
  return CATEGORIES_WITH_DATA.includes(category)
}

/**
 * Finds real, cited records within `radiusKm` of `anchor`, nearest first.
 *
 * Returns an empty array when nothing in the curated dataset is in range —
 * which is the common case, because the dataset is a small curated set of
 * landmarks and natural sites rather than a complete local gazetteer. Callers
 * must render that as an explicit "no verified places in range" state.
 */
export function generateNearby(
  anchor: GeoAnchor,
  radiusKm: number,
  enabled?: Partial<Record<DiscoveryCategory, boolean>>
): Discovery[] {
  if (!Number.isFinite(anchor?.lat) || !Number.isFinite(anchor?.lng)) return []
  const radius = Number.isFinite(radiusKm) ? Math.max(0, radiusKm) : 0
  const out: Discovery[] = []

  for (const place of VERIFIED_PLACES) {
    if (enabled && enabled[place.category] === false) continue
    const distanceKm = haversineKm(anchor, place)
    if (distanceKm > radius) continue
    out.push({
      id: place.id,
      slug: place.slug,
      kind: place.kind,
      name: place.name,
      nameKey: place.nameKey,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      country: place.country,
      distanceM: Math.round(distanceKm * 1000),
      story: place.summary,
      storyKey: place.summaryKey,
      sourceCount: place.sourceCount,
      href: place.href,
    })
  }

  return out.sort((a, b) => a.distanceM - b.distanceM)
}

/**
 * Counts verified records within `meters` for the My Location counters.
 *
 * Only counts categories we actually have data for. `dishes` has no dataset at
 * all, so it is reported as `null` rather than a misleading `0` — the UI shows
 * "no data" instead of "zero dishes nearby".
 */
export function countsWithin(
  discoveries: Discovery[],
  meters = 1000
): { landmarks: number; events: number; nature: number; dishes: null } {
  const counts = { landmarks: 0, events: 0, nature: 0, dishes: null as null }
  for (const d of discoveries) {
    if (d.distanceM > meters) continue
    if (d.category === 'architecture' || d.category === 'culture') counts.landmarks++
    else if (d.category === 'history') counts.events++
    else if (d.category === 'nature') counts.nature++
  }
  return counts
}

/* ------------------------------------------------------------------ */
/* Explorer progress derived from places the user actually opened.      */
/* ------------------------------------------------------------------ */

export type ExplorerXp = {
  level: number
  countries: number
  landmarks: number
  discoveries: number
  cultures: number
  routes: number
}

export function xpFor(visited: readonly string[]): ExplorerXp {
  const uniqueVisited = [...new Set(visited)]
  const count = (prefix: string) => new Set(
    uniqueVisited.filter((key) => key.startsWith(`${prefix}:`)).map((key) => key.slice(prefix.length + 1))
  ).size
  const total = uniqueVisited.length
  return {
    level: Math.floor(total / 5) + 1,
    countries: count('country'),
    landmarks: count('landmark'),
    discoveries: 0,
    cultures: 0,
    routes: 0,
  }
}
