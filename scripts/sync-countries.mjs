#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataFile = path.join(root, 'public', 'data', 'countries.json')
const envFile = path.join(root, '.env')
const apiBase = 'https://api.restcountries.com/countries/v5'
const fields = [
  'names', 'codes', 'capitals', 'flag', 'coordinates', 'region', 'subregion', 'population',
  'area', 'borders', 'currencies', 'languages', 'timezones', 'tlds',
  'independent', 'memberships', 'landlocked', 'maps',
].join(',')

function readEnvValue(contents, key) {
  const line = contents.split(/\r?\n/).find((entry) => entry.trim().startsWith(`${key}=`))
  if (!line) return ''
  return line.slice(line.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
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
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value !== undefined))
}

async function main() {
  let apiKey = process.env.VITE_REST_COUNTRIES_KEY ?? ''
  if (!apiKey) {
    try {
      apiKey = readEnvValue(await fs.readFile(envFile, 'utf8'), 'VITE_REST_COUNTRIES_KEY')
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  if (!apiKey) {
    throw new Error('Set VITE_REST_COUNTRIES_KEY in your ignored .env file before syncing country data.')
  }

  const response = await fetch(`${apiBase}/all?response_fields=${fields}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
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
  if (normalized.length < 200 || codes.size !== normalized.length) {
    throw new Error(`Country API returned ${normalized.length} valid records; refusing to replace local data.`)
  }

  const local = JSON.parse(await fs.readFile(dataFile, 'utf8'))
  const previous = new Map(local.map((country) => [country.cca3, country]))
  const merged = normalized.map((remote) => {
    const old = previous.get(remote.cca3) ?? {}
    const combined = { ...old, ...remote, name: { ...old.name, ...remote.name } }
    if (combined.area === -1) delete combined.area
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
  const latestCodes = new Set(merged.map((country) => country.cca3))
  for (const country of local) {
    if (!latestCodes.has(country.cca3)) merged.push(country)
  }
  merged.sort((a, b) => a.name.common.localeCompare(b.name.common))
  await fs.writeFile(dataFile, `${JSON.stringify(merged)}\n`)
  console.log(`Updated ${merged.length} country records from REST Countries v5.`)
}

main().catch((error) => {
  console.error(`[country-sync] ${error.message}`)
  process.exitCode = 1
})
