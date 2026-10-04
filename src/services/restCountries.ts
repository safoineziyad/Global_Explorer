import {
  fallbackCountries,
  findFallbackCountry,
  flagUrls,
  type CountryRecord,
} from '../data/countries'
import { normalizeCountryRecord } from './restCountriesSchema'

export { normalizeCountryRecord } from './restCountriesSchema'

// VITE_ variables are shipped to the browser. Use only a public/restricted key;
// production deployments should proxy this API through a server.
export const REST_COUNTRIES_BASE = 'https://api.restcountries.com/countries/v5'

const BUNDLED_COUNTRIES_URL = '/data/countries.json'
const REST_COUNTRIES_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REST_COUNTRIES_KEY) || ''
const HAS_REMOTE_API = Boolean(REST_COUNTRIES_KEY)
const COUNTRY_STORAGE_KEY = 'global-explorer:country-data:v1'
const COUNTRY_STORAGE_TTL_MS = 24 * 60 * 60 * 1000

// Request only the documented v5 data groups used by this application.
export const REST_COUNTRIES_FIELDS = [
  'names',
  'codes',
  'capitals',
  'flag',
  'coordinates',
  'region',
  'subregion',
  'population',
  'area',
  'borders',
  'currencies',
  'languages',
  'timezones',
  'tlds',
  'independent',
  'memberships',
  'landlocked',
  'maps',
].join(',')

export type FetchCountriesOptions = {
  signal?: AbortSignal
  /** Abort the request after this many milliseconds. 0 disables the timeout. */
  timeoutMs?: number
  /** Ignore saved and in-memory data and retry the provider. */
  forceRefresh?: boolean
}

const DEFAULT_TIMEOUT_MS = 8000
const ALL_COUNTRIES_URL = `${REST_COUNTRIES_BASE}/all?response_fields=${REST_COUNTRIES_FIELDS}`

type ApiObject = Record<string, unknown>

function isObject(value: unknown): value is ApiObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

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
let bundledCountriesLoad: Promise<CountryRecord[]> | null = null
let countryApiError: Error | null = null

function withDerivedFlags(record: CountryRecord): CountryRecord {
  const normalized =
    record.cca3 === 'SJM' && record.area === -1 ? { ...record, area: 61399 } : record
  if (normalized.flags || !normalized.cca2) return normalized
  return {
    ...normalized,
    flags: flagUrls(normalized.cca2, normalized.name?.common ?? normalized.cca3),
  }
}

/**
 * Loads the bundled worldwide dataset (`/data/countries.json`) once and caches
 * it. Concurrent callers share one in-flight request. Falls back to the 20
 * hand-curated records if the file is missing.
 */
export function loadBundledCountries(): Promise<CountryRecord[]> {
  if (bundledCountriesCache) return Promise.resolve(bundledCountriesCache)
  if (bundledCountriesLoad) return bundledCountriesLoad

  bundledCountriesLoad = (async () => {
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
  })()

  return bundledCountriesLoad
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
  const pickList = <T,>(next: T[] | undefined, previous: T[] | undefined) =>
    next?.length ? next : previous
  const pickRecord = <T extends Record<string, unknown>>(
    next: T | undefined,
    previous: T | undefined
  ) => next && Object.keys(next).length ? next : previous
  return {
    ...base,
    ...remote,
    cca2: remote.cca2 ?? base.cca2,
    name: {
      common: remote.name?.common || base.name.common,
      official: remote.name?.official || base.name.official,
    },
    capital: pickList(remote.capital, base.capital),
    population: remote.population ?? base.population,
    area: remote.area !== undefined && remote.area >= 0 ? remote.area : base.area,
    flags: { ...base.flags, ...remote.flags },
    latlng: remote.latlng ?? base.latlng,
    region: remote.region ?? base.region,
    subregion: remote.subregion ?? base.subregion,
    maps: { ...base.maps, ...remote.maps },
    languages: pickRecord(remote.languages, base.languages),
    currencies: pickRecord(remote.currencies, base.currencies),
    timezones: pickList(remote.timezones, base.timezones),
    borders: pickList(remote.borders, base.borders),
    tld: pickList(remote.tld, base.tld),
    independent: remote.independent ?? base.independent,
    unMember: remote.unMember ?? base.unMember,
    landlocked: remote.landlocked ?? base.landlocked,
    startOfWeek: remote.startOfWeek ?? base.startOfWeek,
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

function extractCountryList(payload: unknown): CountryRecord[] {
  const values = Array.isArray(payload)
    ? payload
    : isObject(payload) && Array.isArray(payload.data)
      ? payload.data
      : isObject(payload) && Array.isArray(payload.results)
        ? payload.results
        : normalizeCountryRecord(payload)
          ? [payload]
        : []
  return values
    .map(normalizeCountryRecord)
    .filter((country): country is CountryRecord => country !== null)
}

function readStoredCountries(): CountryRecord[] | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(COUNTRY_STORAGE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as { savedAt?: number; countries?: unknown }
    if (
      typeof cached.savedAt !== 'number' ||
      Date.now() - cached.savedAt > COUNTRY_STORAGE_TTL_MS ||
      !Array.isArray(cached.countries)
    ) {
      localStorage.removeItem(COUNTRY_STORAGE_KEY)
      return null
    }
    const records = cached.countries.filter(
      (country): country is CountryRecord =>
        isObject(country) &&
        typeof country.cca3 === 'string' &&
        isObject(country.name) &&
        typeof country.name.common === 'string'
    )
    return records.length >= 200 ? records : null
  } catch (error) {
    console.warn('[REST Countries] Could not read local country cache.', error)
    return null
  }
}

function writeStoredCountries(countries: CountryRecord[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(
      COUNTRY_STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), countries })
    )
  } catch (error) {
    console.warn('[REST Countries] Could not save local country cache.', error)
  }
}

/**
 * Fetch every country. Uses the live API only when an API key is configured;
 * otherwise (and on any failure) returns the bundled offline dataset.
 */
export async function fetchAllCountries(
  options: FetchCountriesOptions = {}
): Promise<CountryRecord[]> {
  const bundled = mergeBundled(await loadBundledCountries())
  countryApiError = null
  if (!options.forceRefresh) {
    const stored = readStoredCountries()
    if (stored) return mergeWithFallback(stored, bundled)
  }
  if (!HAS_REMOTE_API) return bundled

  try {
    const payload = await requestJson<unknown>(ALL_COUNTRIES_URL, options)
    const remote = extractCountryList(payload)
    if (remote.length < 200) {
      throw new Error(`REST Countries returned only ${remote.length} valid records; expected a worldwide dataset.`)
    }
    const countries = mergeWithFallback(remote, bundled)
    writeStoredCountries(countries)
    return countries
  } catch (error) {
    countryApiError = error instanceof Error ? error : new Error('Unknown REST Countries request failure')
    console.warn('[REST Countries] Live data unavailable; using bundled country data.', countryApiError)
    return bundled
  }
}

export function isRemoteCountryApiConfigured(): boolean {
  return HAS_REMOTE_API
}

export function getCountryApiError(): Error | null {
  return countryApiError
}

/**
 * Fetch a single country by cca3. Uses the hand-curated record first, then the
 * bundled worldwide dataset, and only tries the live API when a key is set.
 * Results (and concurrent in-flight requests) are cached per cca3 so repeat
 * visits and StrictMode double-invokes do not refetch.
 */
export function fetchCountry(
  cca3: string | undefined | null,
  options: FetchCountriesOptions = {}
): Promise<CountryRecord | null> {
  const code = cca3?.toUpperCase()
  if (!code) return Promise.resolve(null)

  if (options.forceRefresh) countryCache.delete(code)
  const cached = options.forceRefresh ? undefined : countryCache.get(code)
  if (cached) return Promise.resolve(cached)
  const inFlight = options.forceRefresh ? undefined : countryLoads.get(code)
  if (inFlight) return inFlight

  const load = loadCountry(code, options).then(
    (record) => {
      countryLoads.delete(code)
      if (record) countryCache.set(code, record)
      return record
    },
    (err: unknown) => {
      countryLoads.delete(code)
      throw err
    }
  )
  countryLoads.set(code, load)
  return load
}

async function loadCountry(
  code: string,
  options: FetchCountriesOptions
): Promise<CountryRecord | null> {
  if (HAS_REMOTE_API) {
    countryApiError = null
    try {
      const url = `${REST_COUNTRIES_BASE}/codes.alpha_3/${code}?response_fields=${REST_COUNTRIES_FIELDS}`
      const payload = await requestJson<unknown>(url, options)
      const remote = extractCountryList(payload)
      if (remote[0]) {
        countryApiError = null
        return mergeCountry(remote[0])
      }
      throw new Error('REST Countries returned no record for the requested code.')
    } catch (error) {
      countryApiError = error instanceof Error ? error : new Error('Unknown REST Countries request failure')
      console.warn(`[REST Countries] Could not refresh ${code}; using bundled country data.`, countryApiError)
    }
  }

  const curated = findFallbackCountry(code)
  if (curated) return { ...curated }

  const world = await loadBundledCountries()
  const base = world.find((country) => country.cca3.toUpperCase() === code)
  return base ? { ...withDerivedFlags(base) } : null
}

const countryCache = new Map<string, CountryRecord>()
const countryLoads = new Map<string, Promise<CountryRecord | null>>()

let cachedCountries: CountryRecord[] | null = null
let countriesLoad: Promise<CountryRecord[]> | null = null

/** Cached, in-flight-deduped wrapper around fetchAllCountries. */
export function getCountries(options: FetchCountriesOptions = {}): Promise<CountryRecord[]> {
  if (options.forceRefresh) {
    cachedCountries = null
    countriesLoad = null
  }
  if (cachedCountries) return Promise.resolve(cachedCountries)
  if (countriesLoad) return countriesLoad

  countriesLoad = fetchAllCountries(options).then(
    (countries) => {
      cachedCountries = countries
      countriesLoad = null
      return countries
    },
    (err: unknown) => {
      countriesLoad = null
      throw err
    }
  )
  return countriesLoad
}

export function getCountryApiStatus(): { configured: boolean; error: Error | null } {
  return { configured: HAS_REMOTE_API, error: countryApiError }
}

export function clearCountriesCache(): void {
  cachedCountries = null
  countriesLoad = null
  bundledCountriesCache = null
  bundledCountriesLoad = null
  countryCache.clear()
  countryLoads.clear()
  countryApiError = null
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
  getCountryApiStatus,
  normalizeCountryRecord,
  mergeCountry,
  mergeWithFallback,
  clearCountriesCache,
  findCountry,
}
