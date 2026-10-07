#!/usr/bin/env node
/**
 * Refreshes public/data/countries.json from the REST Countries v5 API.
 *
 * Usage: npm run data:countries
 *
 * CREDENTIALS - read this before adding a key
 * -------------------------------------------
 * This is a BUILD-TIME-ONLY Node script. It authenticates with the
 * NON-prefixed variable `REST_COUNTRIES_API_KEY`, resolved from the process
 * environment first and then from the git-ignored `.env` file at the repo root.
 *
 * The name intentionally carries NO `VITE_` prefix. Every `VITE_`-prefixed
 * variable is statically inlined into the client bundle at build time and is
 * therefore PUBLIC: anything reachable through `import.meta.env` ships to every
 * visitor's browser. A `VITE_` variable is not a safe place to keep a secret,
 * so it must not be this script's normal source.
 *
 * `VITE_REST_COUNTRIES_KEY` is still accepted as a last-resort fallback so that
 * existing checkouts are not hard-broken, but choosing it prints a loud warning
 * to stderr: the key has to be treated as already-compromised and rotated into
 * `REST_COUNTRIES_API_KEY`. If neither variable is set the run aborts before any
 * request is made and before any file is touched.
 *
 * The bundled dataset is what the app serves at runtime; this script only
 * refreshes it, and the client keeps working offline with no key at all.
 *
 * DATA SAFETY
 * -----------
 * - Merge, never replace: a field absent from an API response keeps its
 *   already-bundled value, and countries absent from the API response are kept.
 * - REST Countries' `area: -1` sentinel means "unknown"; that value is never
 *   persisted, and a previously-good bundled area is kept in its place.
 * - Every record is validated (3-letter uppercase alpha_3 + non-empty
 *   name.common) before the file is written, and a summary of what changed is
 *   printed to stderr so the diff is visible in CI logs.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataFile = path.join(root, 'public', 'data', 'countries.json')
const envFile = path.join(root, '.env')
const apiBase = 'https://api.restcountries.com/countries/v5'
/** Build-time-only secret. Never give this a `VITE_` prefix. */
const credentialEnv = 'REST_COUNTRIES_API_KEY'
/** Legacy name kept for backwards compatibility only. See the header comment. */
const legacyCredentialEnv = 'VITE_REST_COUNTRIES_KEY'
const fields = [
  'names', 'codes', 'capitals', 'flag', 'coordinates', 'region', 'subregion', 'population',
  'area', 'borders', 'currencies', 'languages', 'timezones', 'tlds',
  'independent', 'memberships', 'landlocked', 'maps',
].join(',')
/** Minimum plausible number of valid records before we overwrite the bundle. */
const minimumRecords = 200
const validCca3 = /^[A-Z]{3}$/

function readEnvValue(contents, key) {
  const line = contents.split(/\r?\n/).find((entry) => entry.trim().startsWith(`${key}=`))
  if (!line) return ''
  return line.slice(line.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
}

async function readEnvFile() {
  try {
    return await fs.readFile(envFile, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return ''
    throw error
  }
}

/**
 * Resolves the API credential. Precedence:
 *   1. process env `REST_COUNTRIES_API_KEY`
 *   2. .env file `REST_COUNTRIES_API_KEY`
 *   3. process env `VITE_REST_COUNTRIES_KEY` (deprecated, warns)
 *   4. .env file `VITE_REST_COUNTRIES_KEY` (deprecated, warns)
 * The deprecated names are only reached when `REST_COUNTRIES_API_KEY` is absent.
 */
function resolveCredential(envContents) {
  const fromProcess = (name) => process.env[name]?.trim() ?? ''
  const fromFile = (name) => (envContents ? readEnvValue(envContents, name).trim() : '')

  const primary = fromProcess(credentialEnv) || fromFile(credentialEnv)
  if (primary) return { key: primary, varName: credentialEnv, origin: fromProcess(credentialEnv) ? 'process environment' : '.env', deprecated: false }

  const legacyInProcess = fromProcess(legacyCredentialEnv)
  const legacy = legacyInProcess || fromFile(legacyCredentialEnv)
  if (legacy) {
    return {
      key: legacy,
      varName: legacyCredentialEnv,
      origin: legacyInProcess ? 'process environment' : '.env',
      deprecated: true,
    }
  }

  return null
}

function warnDeprecatedCredential({ varName, origin }) {
  console.error([
    '',
    '  ===============================  SECURITY WARNING  ===============================',
    `  [country-sync] Using the DEPRECATED variable ${varName} (from the ${origin})`,
    '  as the REST Countries API credential.',
    '',
    '  Every `VITE_`-prefixed variable is statically inlined into the client bundle',
    '  at build time and is therefore PUBLIC: this value is shipped to every',
    "  visitor's browser and must be considered compromised. A `VITE_` variable is",
    '  NOT a safe place to keep a secret.',
    '',
    `  Fix this: move the key to the build-time-only variable ${credentialEnv}`,
    '  (shell environment, or the git-ignored .env file, neither of which is ever',
    '  bundled) and ROTATE the exposed key.',
    '',
    '  ================================================================================',
    '',
  ].join('\n'))
}

function recordFromApi(record) {
  const code = record?.codes?.alpha_3
  const common = record?.names?.common
  if (typeof code !== 'string' || typeof common !== 'string') return null
  const capitals = Array.isArray(record.capitals) ? record.capitals : []
  const currencies = Object.fromEntries((record.currencies ?? [])
    .filter((item) => item?.code && item?.name)
    .map((item) => [item.code, { name: item.name, ...(item.symbol ? { symbol: item.symbol } : {}) }]))
  const languages = Object.fromEntries((record.languages ?? [])
    .filter((item) => item?.name)
    .map((item) => [item.iso_639_3 ?? item.code ?? item.bcp47 ?? item.name.toLowerCase(), item.name]))
  const area = typeof record.area === 'number' ? record.area : record.area?.kilometers
  const flagSvg = record.flag?.url_svg
  const flagPng = record.flag?.url_png
  const flags = flagSvg || flagPng
    ? { ...(flagSvg ? { svg: flagSvg } : {}), ...(flagPng ? { png: flagPng } : {}), alt: `Flag of ${common}` }
    : undefined
  const maps = record.maps
    ? {
        ...(record.maps.google_maps ? { googleMaps: record.maps.google_maps } : {}),
        ...(record.maps.open_street_maps ? { openStreetMaps: record.maps.open_street_maps } : {}),
      }
    : undefined
  const coordinates = record.coordinates
  const latlng = Array.isArray(coordinates?.latlng)
    ? coordinates.latlng
    : typeof coordinates?.lat === 'number' && typeof coordinates?.lng === 'number'
      ? [coordinates.lat, coordinates.lng]
      : typeof coordinates?.latitude === 'number' && typeof coordinates?.longitude === 'number'
        ? [coordinates.latitude, coordinates.longitude]
        : undefined
  const output = {
    cca3: code.toUpperCase(),
    cca2: record.codes.alpha_2?.toUpperCase(),
    name: { common, official: record.names.official ?? common },
    ...(capitals.length ? { capital: capitals
      .slice()
      .sort((a, b) => Number(Boolean(b?.primary)) - Number(Boolean(a?.primary)))
      .map((item) => item?.name)
      .filter((name) => typeof name === 'string') } : {}),
    region: record.region,
    subregion: record.subregion,
    population: record.population,
    area,
    flags,
    ...(Object.keys(languages).length ? { languages } : {}),
    ...(Object.keys(currencies).length ? { currencies } : {}),
    ...(record.timezones?.length ? { timezones: record.timezones } : {}),
    ...(record.borders?.length ? { borders: record.borders } : {}),
    ...(record.tlds?.length ? { tld: record.tlds } : {}),
    independent: record.independent,
    unMember: record.memberships?.un,
    landlocked: record.landlocked,
    startOfWeek: record.start_of_week,
    maps,
    latlng,
  }
  // Dropping undefined keys here is what makes the merge non-destructive below:
  // a field the API omits is absent from `output`, so spreading it over the
  // bundled record cannot erase a good bundled value.
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value !== undefined))
}

/** A record is only written if it has a 3-letter uppercase code and a usable name. */
function isWritable(country) {
  return typeof country?.cca3 === 'string'
    && validCca3.test(country.cca3)
    && typeof country?.name?.common === 'string'
    && country.name.common.trim().length > 0
}

function listCodes(codes) {
  const shown = codes.slice(0, 20).join(', ')
  return codes.length > 20 ? `${shown}, ... (+${codes.length - 20} more)` : shown
}

async function main() {
  const credential = resolveCredential(await readEnvFile())
  if (!credential) {
    throw new Error([
      `No REST Countries API key found. Set the build-time-only variable ${credentialEnv}`,
      'in your shell environment or in your git-ignored .env file before syncing country',
      `data. Do NOT use ${legacyCredentialEnv}: VITE_ variables are inlined into the`,
      'public client bundle. No files were changed.',
    ].join(' '))
  }
  if (credential.deprecated) warnDeprecatedCredential(credential)

  const response = await fetch(`${apiBase}/all?response_fields=${fields}`, {
    headers: { Authorization: `Bearer ${credential.key}` },
  })
  if (!response.ok) {
    throw new Error(`Country sync failed with HTTP ${response.status}; local country data was not changed.`)
  }
  const payload = await response.json()
  const apiRecords = Array.isArray(payload) ? payload : payload?.data ?? payload?.results
  if (!Array.isArray(apiRecords)) {
    throw new Error('Country API returned an unexpected response; local country data was not changed.')
  }
  const normalized = apiRecords.map(recordFromApi).filter(Boolean)
  const codes = new Set(normalized.map((country) => country.cca3))
  if (normalized.length < minimumRecords || codes.size !== normalized.length) {
    throw new Error(`Country API returned ${normalized.length} valid records; refusing to replace local data.`)
  }

  const local = JSON.parse(await fs.readFile(dataFile, 'utf8'))
  const previous = new Map(local.map((country) => [country.cca3, country]))
  const merged = normalized.map((remote) => {
    const old = previous.get(remote.cca3) ?? {}
    const combined = { ...old, ...remote, name: { ...old.name, ...remote.name } }
    // -1 is REST Countries' "unknown area" sentinel. Never persist it, and do not
    // let it erase a good bundled area either: fall back to the bundled value.
    if (combined.area === -1) {
      if (typeof old.area === 'number' && old.area > 0) combined.area = old.area
      else delete combined.area
    }
    if (!combined.flags && combined.cca2) {
      const code = combined.cca2.toLowerCase()
      combined.flags = {
        svg: `https://flags.restcountries.com/v5/svg/${code}.svg`,
        png: `https://flags.restcountries.com/v5/w320/${code}.png`,
        alt: `Flag of ${combined.name.common}`,
      }
    }
    return combined
  })
  // Countries the API no longer returns are retained from the bundle.
  const latestCodes = new Set(merged.map((country) => country.cca3))
  for (const country of local) {
    if (!latestCodes.has(country.cca3)) merged.push(country)
  }

  const rejected = merged.filter((country) => !isWritable(country))
  const writable = merged.filter(isWritable)
  for (const country of rejected) {
    console.error(`[country-sync] Skipping invalid record ${JSON.stringify(country?.cca3 ?? null)}: needs a 3-letter uppercase alpha_3 code and a non-empty name.common.`)
  }
  if (rejected.length) console.error(`[country-sync] ${rejected.length} record(s) failed validation and will not be written.`)
  if (writable.length < minimumRecords) {
    throw new Error(`Only ${writable.length} records passed validation; refusing to write local country data.`)
  }
  writable.sort((a, b) => a.name.common.localeCompare(b.name.common))

  // Change summary on stderr: the diff stays visible in CI logs without changing
  // the success output on stdout.
  const added = []
  const updated = []
  for (const country of writable) {
    const old = previous.get(country.cca3)
    if (!old) added.push(country.cca3)
    else if (JSON.stringify(old) !== JSON.stringify(country)) updated.push(country.cca3)
  }
  const retained = local.filter((country) => !latestCodes.has(country.cca3))
  console.error(`[country-sync] Change summary for ${path.relative(root, dataFile)}: ${writable.length} records would be written (+${added.length} new, ~${updated.length} updated, ${writable.length - added.length - updated.length} unchanged, ${retained.length} retained from the bundle).`)
  if (added.length) console.error(`[country-sync]   new: ${listCodes(added)}`)
  if (updated.length) console.error(`[country-sync]   updated: ${listCodes(updated)}`)
  if (retained.length) console.error(`[country-sync]   retained (not in API response): ${listCodes(retained.map((country) => country.cca3))}`)

  await fs.writeFile(dataFile, `${JSON.stringify(writable)}\n`)
  console.log(`Updated ${writable.length} country records from REST Countries v5.`)
}

main().catch((error) => {
  console.error(`[country-sync] ${error.message}`)
  process.exitCode = 1
})
