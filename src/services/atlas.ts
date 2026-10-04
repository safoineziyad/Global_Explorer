import type { Atlas, AtlasShape } from '../types'

// Ring encoding produced by scripts/build-atlas.mjs:
//   quantise lon/lat by Q (round(coord * Q)), then delta-encode as an
//   interleaved stream of x-delta, y-delta, x-delta, y-delta, ...
//   Each integer delta is base36 encoded and the stream is comma-separated.
//
// decodeRing reverses that exactly: deltas are added back into independent
// x and y accumulators and finally divided by Q to recover lon/lat degrees.

export const ATLAS_Q = 10
export const ATLAS_URL = '/data/countries-110m.json'

const BASE36_DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

export type LonLat = [number, number]

export type GlobeCountry = {
  cca3: string
  name: string
  rings: LonLat[][]
  label: LonLat | null
  /** Natural Earth rank; higher = larger. Used for draw/hit-test order. */
  rank: number
}

/** Decode a single base36 integer, including a leading minus for deltas. */
export function decodeBase36(value: string): number {
  if (!value) return 0
  const text = value.trim()
  if (!text) return 0

  let sign = 1
  let index = 0
  const head = text[0]
  if (head === '-') {
    sign = -1
    index = 1
  } else if (head === '+') {
    index = 1
  }

  let result = 0
  for (; index < text.length; index++) {
    const digit = BASE36_DIGITS.indexOf(text[index].toLowerCase())
    if (digit < 0) continue
    result = result * 36 + digit
  }
  return sign * result
}

/**
 * Decode one comma-separated ring string into [lon, lat] pairs.
 * x and y deltas are accumulated independently, exactly as encoded.
 */
export function decodeRing(encoded: string, q: number = ATLAS_Q): LonLat[] {
  if (!encoded) return []
  const tokens = encoded.split(',')
  const points: LonLat[] = []
  let x = 0
  let y = 0

  // Pairs are (xd, yd); a dangling token is ignored.
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    x += decodeBase36(tokens[i])
    y += decodeBase36(tokens[i + 1])
    points.push([x / q, y / q])
  }
  return points
}

/** Decode every ring of a shape, dropping empty rings. */
export function decodeRings(rings: string[] | undefined, q: number = ATLAS_Q): LonLat[][] {
  if (!rings || rings.length === 0) return []
  const decoded: LonLat[][] = []
  for (const ring of rings) {
    const points = decodeRing(ring, q)
    if (points.length > 0) decoded.push(points)
  }
  return decoded
}

export function shapeHasRings(shape: AtlasShape | undefined | null): boolean {
  return Boolean(shape && shape.rings && shape.rings.length > 0)
}

export function findShapeByCca3(
  atlas: Atlas | null | undefined,
  cca3: string | undefined | null
): AtlasShape | undefined {
  if (!atlas || !cca3) return undefined
  const code = cca3.toUpperCase()
  return atlas.shapes.find((shape) => shape.cca3.toUpperCase() === code)
}

let countriesCache: { atlas: Atlas; countries: GlobeCountry[] } | null = null

/**
 * Build the list of countries with globe-fillable rings.
 * Shapes without rings (rare) are skipped because they cannot be filled.
 */
export function globeCountries(atlas: Atlas | null | undefined): GlobeCountry[] {
  if (!atlas || !Array.isArray(atlas.shapes)) return []
  // Decoding ~180 shapes' rings is not free; cache by atlas identity so every
  // consumer (Globe, World, panels) shares one decode instead of redoing it.
  if (countriesCache && countriesCache.atlas === atlas) return countriesCache.countries

  const countries: GlobeCountry[] = []
  for (const shape of atlas.shapes) {
    if (!shapeHasRings(shape)) continue
    countries.push({
      cca3: shape.cca3,
      name: shape.name,
      rings: decodeRings(shape.rings),
      label: shape.label ?? null,
      rank: shape.rank ?? 0,
    })
  }
  // Descending rank: hit-testing walks the list in reverse so small
  // countries win over large neighbours, and labels are placed biggest-first.
  countries.sort((a, b) => b.rank - a.rank)
  countriesCache = { atlas, countries }
  return countries
}

/** Fetch and parse the bundled Natural Earth atlas. */
export async function loadAtlas(url: string = ATLAS_URL, signal?: AbortSignal): Promise<Atlas> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Failed to load atlas: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as Atlas
}

/* ------------------------------------------------------------------ */
/* Shared atlas store: one fetch + one decode for the whole app.        */
/* ------------------------------------------------------------------ */

export type AtlasState = {
  atlas: Atlas | null
  loading: boolean
  error: string | null
}

const initialAtlasState: AtlasState = { atlas: null, loading: false, error: null }

let atlasCache: Atlas | null = null
let atlasLoad: Promise<Atlas> | null = null
let atlasState: AtlasState = initialAtlasState
const atlasListeners = new Set<() => void>()

function emitAtlas(next: AtlasState): void {
  atlasState = next
  for (const listener of atlasListeners) listener()
}

/** Subscribe to shared atlas state (for `useSyncExternalStore`). */
export function subscribeAtlas(listener: () => void): () => void {
  atlasListeners.add(listener)
  return () => {
    atlasListeners.delete(listener)
  }
}

/** Current shared atlas state. Returns a stable reference between updates. */
export function getAtlasSnapshot(): AtlasState {
  return atlasState
}

/** State used during server rendering / hydration before any fetch starts. */
export function getAtlasServerSnapshot(): AtlasState {
  return initialAtlasState
}

/**
 * Load the atlas exactly once per page load.
 *
 * Concurrent callers share the same in-flight promise; later callers get the
 * cached value. On failure the in-flight promise is cleared so a subsequent
 * call can retry, and the error is surfaced through the shared store.
 */
export function loadAtlasOnce(url: string = ATLAS_URL): Promise<Atlas> {
  if (atlasCache) return Promise.resolve(atlasCache)
  if (atlasLoad) return atlasLoad

  emitAtlas({ atlas: atlasCache, loading: true, error: null })

  atlasLoad = loadAtlas(url).then(
    (atlas) => {
      atlasCache = atlas
      atlasLoad = null
      emitAtlas({ atlas, loading: false, error: null })
      return atlas
    },
    (err: unknown) => {
      atlasLoad = null
      const message = err instanceof Error ? err.message : 'Failed to load atlas'
      emitAtlas({ atlas: atlasCache, loading: false, error: message })
      throw err
    }
  )

  return atlasLoad
}

/** Reset the atlas store (used for an explicit retry). */
export function clearAtlasCache(): void {
  atlasCache = null
  atlasLoad = null
  countriesCache = null
  emitAtlas(initialAtlasState)
}

export default {
  ATLAS_Q,
  ATLAS_URL,
  decodeBase36,
  decodeRing,
  decodeRings,
  globeCountries,
  findShapeByCca3,
  loadAtlas,
  loadAtlasOnce,
  subscribeAtlas,
  getAtlasSnapshot,
  getAtlasServerSnapshot,
  clearAtlasCache,
}
