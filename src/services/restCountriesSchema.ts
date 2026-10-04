import type { CountryRecord } from '../data/countries'

type ApiObject = Record<string, unknown>

function isObject(value: unknown): value is ApiObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** Normalize a REST Countries v5 record into the shape consumed by the UI. */
export function normalizeCountryRecord(value: unknown): CountryRecord | null {
  if (!isObject(value)) return null
  const names = isObject(value.names) ? value.names : {}
  const codes = isObject(value.codes) ? value.codes : {}
  const code3 = nonEmptyString(codes.alpha_3) ?? nonEmptyString(value.cca3)
  const code2 = nonEmptyString(codes.alpha_2) ?? nonEmptyString(value.cca2)
  const common = nonEmptyString(names.common) ?? nonEmptyString(value.name)
  if (!code3 || !common) return null

  const capitals = Array.isArray(value.capitals) ? value.capitals.filter(isObject) : []
  const capital = capitals
    .sort((a, b) => Number(Boolean(b.primary)) - Number(Boolean(a.primary)))
    .map((entry) => nonEmptyString(entry.name))
    .filter((name): name is string => Boolean(name))
  const currencies = Object.fromEntries(
    (Array.isArray(value.currencies) ? value.currencies.filter(isObject) : []).flatMap((entry) => {
      const code = nonEmptyString(entry.code)
      const name = nonEmptyString(entry.name)
      if (!code || !name) return []
      const symbol = nonEmptyString(entry.symbol)
      return [[code, { name, ...(symbol ? { symbol } : {}) }]]
    })
  )
  const languages = Object.fromEntries(
    (Array.isArray(value.languages) ? value.languages.filter(isObject) : []).flatMap((entry) => {
      const name = nonEmptyString(entry.name)
      if (!name) return []
      const key = nonEmptyString(entry.iso_639_3) ??
        nonEmptyString(entry.iso639_3) ??
        nonEmptyString(entry.code) ??
        nonEmptyString(entry.bcp47) ??
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return [[key, name]]
    })
  )
  const flags = isObject(value.flag) ? value.flag : {}
  const countryCoordinates = isObject(value.coordinates) ? value.coordinates : {}
  const areaValue = isObject(value.area) ? value.area.kilometers : value.area
  const maps = isObject(value.maps) ? value.maps : {}
  const memberships = isObject(value.memberships) ? value.memberships : {}
  const tld = Array.isArray(value.tlds)
    ? value.tlds.filter((item): item is string => typeof item === 'string')
    : []
  const timezones = Array.isArray(value.timezones)
    ? value.timezones.filter((item): item is string => typeof item === 'string')
    : []
  const borders = Array.isArray(value.borders)
    ? value.borders.filter((item): item is string => typeof item === 'string')
    : []
  const population =
    typeof value.population === 'number' && Number.isFinite(value.population) && value.population >= 0
      ? value.population
      : undefined
  const area =
    typeof areaValue === 'number' && Number.isFinite(areaValue) && areaValue >= 0
      ? areaValue
      : undefined
  const svg = nonEmptyString(flags.url_svg) ??
    nonEmptyString(flags.svg) ??
    (code2 ? `https://flags.restcountries.com/v5/svg/${code2.toLowerCase()}.svg` : undefined)
  const png = nonEmptyString(flags.url_png) ??
    nonEmptyString(flags.png) ??
    (code2 ? `https://flags.restcountries.com/v5/w320/${code2.toLowerCase()}.png` : undefined)
  const capitalCoordinates = capitals.find((entry) => {
    const coordinates = isObject(entry.coordinates) ? entry.coordinates : {}
    return typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number'
  })
  const coordinates = capitalCoordinates && isObject(capitalCoordinates.coordinates)
    ? capitalCoordinates.coordinates
    : undefined
  const latlng = Array.isArray(value.latlng) && value.latlng.length >= 2
    ? value.latlng
    : typeof countryCoordinates.lat === 'number' && typeof countryCoordinates.lng === 'number'
      ? [countryCoordinates.lat, countryCoordinates.lng]
      : typeof countryCoordinates.latitude === 'number' && typeof countryCoordinates.longitude === 'number'
        ? [countryCoordinates.latitude, countryCoordinates.longitude]
        : coordinates
          ? [coordinates.lat, coordinates.lng]
          : undefined
  const commonName = nonEmptyString(names.common) ?? common
  const official = nonEmptyString(names.official) ?? commonName
  const region = nonEmptyString(value.region)
  const subregion = nonEmptyString(value.subregion)
  const googleMaps = nonEmptyString(maps.google_maps) ?? nonEmptyString(maps.googleMaps)
  const openStreetMaps = nonEmptyString(maps.open_street_maps) ?? nonEmptyString(maps.openStreetMaps)
  const independent = typeof value.independent === 'boolean' ? value.independent : undefined
  const unMember = typeof memberships.un === 'boolean' ? memberships.un : undefined
  const landlocked = typeof value.landlocked === 'boolean' ? value.landlocked : undefined
  const startOfWeek = nonEmptyString(value.start_of_week)

  return {
    cca3: code3.toUpperCase(),
    ...(code2 ? { cca2: code2.toUpperCase() } : {}),
    name: { common: commonName, official },
    ...(capital.length ? { capital } : {}),
    ...(region ? { region } : {}),
    ...(subregion ? { subregion } : {}),
    ...(population !== undefined ? { population } : {}),
    ...(area !== undefined ? { area } : {}),
    ...(svg || png
      ? { flags: { ...(svg ? { svg } : {}), ...(png ? { png } : {}), alt: `Flag of ${commonName}` } }
      : {}),
    ...(Array.isArray(latlng) && typeof latlng[0] === 'number' && typeof latlng[1] === 'number'
      ? { latlng: [latlng[0], latlng[1]] as [number, number] }
      : {}),
    ...(Object.keys(languages).length ? { languages } : {}),
    ...(Object.keys(currencies).length ? { currencies } : {}),
    ...(timezones.length ? { timezones } : {}),
    ...(borders.length ? { borders: borders.map((code) => code.toUpperCase()) } : {}),
    ...(tld.length ? { tld } : {}),
    ...(independent !== undefined ? { independent } : {}),
    ...(unMember !== undefined ? { unMember } : {}),
    ...(landlocked !== undefined ? { landlocked } : {}),
    ...(startOfWeek ? { startOfWeek } : {}),
    ...(googleMaps || openStreetMaps
      ? { maps: { ...(googleMaps ? { googleMaps } : {}), ...(openStreetMaps ? { openStreetMaps } : {}) } }
      : {}),
  }
}
