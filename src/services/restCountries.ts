import {
  fallbackCountries,
  findFallbackCountry,
  flagUrls,
  type CountryRecord,
} from '../data/countries'

// REST Countries deprecated v1–v4 (they now return a `success:false` body) and
// v5 requires an API key. The live API is therefore opt-in: set
// `VITE_REST_COUNTRIES_KEY` at build time to try it, otherwise the bundled
// offline dataset is used. The bundled dataset is served from the app's own
// origin, so it is never CORS-blocked.
export const REST_COUNTRIES_BASE = 'https://restcountries.com/v5'

const BUNDLED_COUNTRIES_URL = '/data/countries.json'
const REST_COUNTRIES_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REST_COUNTRIES_KEY) || ''
const HAS_REMOTE_API = Boolean(REST_COUNTRIES_KEY)

// Only request the fields the app actually renders; this keeps responses small
// and reduces the chance of hitting the API's rate limits.
export const REST_COUNTRIES_FIELDS = [
  'cca2',
  'cca3',
  'name',
  'capital',
  'region',
  'subregion',
  'population',
  'area',
  'flags',
  'latlng',
  'languages',
  'currencies',
  'timezones',
  'borders',
  'tld',
  'independent',
  'unMember',
  'landlocked',
  'startOfWeek',
  'maps',
].join(',')

export type FetchCountriesOptions = {
  signal?: AbortSignal
  /** Abort the request after this many milliseconds. 0 disables the timeout. */
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 8000
const ALL_COUNTRIES_URL = `${REST_COUNTRIES_BASE}/all?fields=${REST_COUNTRIES_FIELDS}`

async function requestJson<T>(url: string, options: FetchCountriesOptions = {}): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null

  const external = options.signal
  if (external) {
    if (external.aborted) {
      controller.abort()
    } else {
      external.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: HAS_REMOTE_API ? { Authorization: `Bearer ${REST_COUNTRIES_KEY}` } : undefined,
    })
    if (!response.ok) {
      throw new Error(`REST Countries request failed: ${response.status} ${response.statusText}`)
    }
    return (await response.json()) as T
  } finally {
    if (timer !== null) clearTimeout(timer)
  }
}

/* ------------------------------------------------------------------ */
/* Bundled offline dataset                                             */
/* ------------------------------------------------------------------ */

let bundledCountriesCache: CountryRecord[] | null = null

function withDerivedFlags(record: CountryRecord): CountryRecord {
  if (record.flags || !record.cca2) return record
  return { ...record, flags: flagUrls(record.cca2, record.name?.common ?? record.cca3) }
}

/**
 * Loads the bundled worldwide dataset (`/data/countries.json`) once and caches
 * it. Falls back to the 20 hand-curated records if the file is missing.
 */
export async function loadBundledCountries(): Promise<CountryRecord[]> {
  if (bundledCountriesCache) return bundledCountriesCache
  try {
    const response = await fetch(BUNDLED_COUNTRIES_URL)
    if (response.ok) {
      const data = (await response.json()) as CountryRecord[]
      if (Array.isArray(data) && data.length > 0) {
        bundledCountriesCache = data.map(withDerivedFlags)
        return bundledCountriesCache
      }
    }
  } catch {
    // Offline / missing file: fall through to the curated records.
  }
  bundledCountriesCache = fallbackCountries.map((country) => ({ ...country }))
  return bundledCountriesCache
}

/** Bundled world data with the hand-curated records taking precedence. */
function mergeBundled(world: CountryRecord[]): CountryRecord[] {
  const byCode = new Map<string, CountryRecord>()
  for (const country of world) {
    if (!country?.cca3) continue
    byCode.set(country.cca3.toUpperCase(), country)
  }
  for (const country of fallbackCountries) {
    if (!country?.cca3) continue
    const code = country.cca3.toUpperCase()
    const base = byCode.get(code)
    byCode.set(code, base ? combine(base, country) : country)
  }
  return Array.from(byCode.values()).sort((a, b) =>
    a.name.common.localeCompare(b.name.common)
  )
}

function combine(base: CountryRecord, remote: CountryRecord): CountryRecord {
  return {
    ...base,
    ...remote,
    name: { ...base.name, ...remote.name },
    flags: { ...base.flags, ...remote.flags },
    maps: { ...base.maps, ...remote.maps },
    languages: remote.languages ?? base.languages,
    currencies: remote.currencies ?? base.currencies,
  }
}

/** Merge one remote record over its bundled fallback, if any. */
export function mergeCountry(remote: CountryRecord): CountryRecord {
  const base = findFallbackCountry(remote?.cca3)
  if (!base) return remote
  return combine(base, remote)
}

/**
 * Merge remote records over the bundled set, keyed by cca3.
 * Remote values win; bundled records fill in any missing countries.
 */
export function mergeWithFallback(
  remote: CountryRecord[] | null | undefined,
  fallback: CountryRecord[] = fallbackCountries
): CountryRecord[] {
  const byCode = new Map<string, CountryRecord>()

  for (const country of fallback) {
    if (!country?.cca3) continue
    byCode.set(country.cca3.toUpperCase(), country)
  }

  if (Array.isArray(remote)) {
    for (const country of remote) {
      if (!country?.cca3) continue
      const code = country.cca3.toUpperCase()
      const base = byCode.get(code)
      byCode.set(code, base ? combine(base, country) : country)
    }
  }

  return Array.from(byCode.values()).sort((a, b) =>
    a.name.common.localeCompare(b.name.common)
  )
}

/** Accepts both a bare array (v3) and the v5 `{ data: [...] }` envelope. */
function extractCountryList(payload: unknown): CountryRecord[] {
  if (Array.isArray(payload)) return payload as CountryRecord[]
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: CountryRecord[] }).data
  }
  return []
}

/**
 * Fetch every country. Uses the live API only when an API key is configured;
 * otherwise (and on any failure) returns the bundled offline dataset.
 */
export async function fetchAllCountries(
  options: FetchCountriesOptions = {}
): Promise<CountryRecord[]> {
  const bundled = mergeBundled(await loadBundledCountries())
  if (!HAS_REMOTE_API) return bundled

  try {
    const payload = await requestJson<unknown>(ALL_COUNTRIES_URL, options)
    const remote = extractCountryList(payload)
    if (remote.length === 0) throw new Error('Unexpected REST Countries response')
    return mergeWithFallback(remote, bundled)
  } catch {
    return bundled
  }
}

/**
 * Fetch a single country by cca3. Uses the hand-curated record first, then the
 * bundled worldwide dataset, and only tries the live API when a key is set.
 */
export async function fetchCountry(
  cca3: string | undefined | null,
  options: FetchCountriesOptions = {}
): Promise<CountryRecord | null> {
  const code = cca3?.toUpperCase()
  if (!code) return null

  if (HAS_REMOTE_API) {
    try {
      const url = `${REST_COUNTRIES_BASE}/alpha/${code}?fields=${REST_COUNTRIES_FIELDS}`
      const payload = await requestJson<unknown>(url, options)
      const remote = extractCountryList(payload)
      if (remote[0]) {
        return mergeCountry(remote[0])
      }
    } catch {
      // Fall through to the bundled data.
    }
  }

  const curated = findFallbackCountry(code)
  if (curated) return { ...curated }

  const world = await loadBundledCountries()
  const base = world.find((country) => country.cca3.toUpperCase() === code)
  return base ? { ...withDerivedFlags(base) } : null
}

let cachedCountries: CountryRecord[] | null = null

/** Cached wrapper around fetchAllCountries. */
export async function getCountries(
  options: FetchCountriesOptions = {}
): Promise<CountryRecord[]> {
  if (cachedCountries) return cachedCountries
  cachedCountries = await fetchAllCountries(options)
  return cachedCountries
}

export function clearCountriesCache(): void {
  cachedCountries = null
}

export function findCountry(
  countries: CountryRecord[],
  cca3: string | undefined | null
): CountryRecord | undefined {
  if (!cca3) return undefined
  const code = cca3.toUpperCase()
  return countries.find((country) => country.cca3.toUpperCase() === code)
}

export default {
  REST_COUNTRIES_BASE,
  REST_COUNTRIES_FIELDS,
  fetchAllCountries,
  fetchCountry,
  getCountries,
  loadBundledCountries,
  mergeCountry,
  mergeWithFallback,
  clearCountriesCache,
  findCountry,
}
