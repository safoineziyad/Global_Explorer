import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { robinsonProject } from '../src/lib/robinson.ts'
import { MODE_RADIUS_KM, generateNearby, haversineKm, xpFor } from '../src/data/explorerFeatures.ts'
import { landmarks } from '../src/data/landmarks.ts'
import { natureSites } from '../src/data/nature.ts'
import { normalizeCountryRecord } from '../src/services/restCountriesSchema.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))

const atlas = readJson('public/data/countries-110m.json')
const countries = readJson('public/data/countries.json')
const sitemap = fs.readFileSync(path.join(root, 'public/sitemap.xml'), 'utf8')

test('atlas: 177 unique drawable shapes', () => {
  assert.equal(atlas.shapes.length, 177)
  const seen = new Set()
  for (const s of atlas.shapes) {
    assert.match(s.cca3, /^[A-Z]{3}$/)
    assert.ok(s.d && s.d.length > 0, `missing d: ${s.cca3}`)
    assert.ok(!/NaN|undefined|Infinity/.test(s.d), `bad d: ${s.cca3}`)
    assert.ok(Array.isArray(s.rings) && s.rings.length > 0, `missing rings: ${s.cca3}`)
    assert.ok(!seen.has(s.cca3), `duplicate: ${s.cca3}`)
    seen.add(s.cca3)
  }
  assert.equal(seen.size, 177)
})

test('countries: 250 unique records with core fields', () => {
  assert.equal(countries.length, 250)
  const seen = new Set()
  for (const c of countries) {
    assert.match(c.cca2, /^[A-Z]{2}$/)
    assert.match(c.cca3, /^[A-Z]{3}$/)
    const name = typeof c.name === 'string' ? c.name : c.name?.common
    assert.ok(name && name.length > 0, `name: ${c.cca3}`)
    assert.ok(Number.isFinite(c.area) && c.area >= 0, `area: ${c.cca3}`)
    assert.ok(Array.isArray(c.latlng) && c.latlng.length === 2, `latlng: ${c.cca3}`)
    assert.ok(Number.isFinite(c.latlng[0]) && Number.isFinite(c.latlng[1]), `latlng finite: ${c.cca3}`)
    assert.ok(!seen.has(c.cca3), `duplicate: ${c.cca3}`)
    seen.add(c.cca3)
  }
  assert.equal(seen.size, 250)
  assert.equal(countries.find((country) => country.cca3 === 'SJM').area, 61399)
  assert.equal(countries.find((country) => country.cca3 === 'FSM').currencies.USD.name, 'United States dollar')
})

test('coverage: only CYN/KOS/SOL are atlas-only', () => {
  const data = new Set(countries.map((c) => c.cca3))
  const atlasOnly = atlas.shapes.map((s) => s.cca3).filter((c) => !data.has(c)).sort()
  assert.deepEqual(atlasOnly, ['CYN', 'KOS', 'SOL'])
})

test('robinsonProject is finite across the grid and matches atlas anchors', () => {
  for (let lat = -90; lat <= 90; lat += 5) {
    for (let lon = -180; lon <= 180; lon += 30) {
      const [x, y] = robinsonProject(lon, lat, 1000, 500)
      assert.ok(Number.isFinite(x) && Number.isFinite(y), `NaN at ${lon},${lat}`)
    }
  }
  assert.deepEqual(robinsonProject(0, 0, 1000, 500), [500, 250])
  assert.deepEqual(robinsonProject(0, 90, 1000, 500), [500, 0])
  assert.deepEqual(robinsonProject(0, -90, 1000, 500), [500, 500])
})

test('nearby lookup returns only verified places inside the radius', () => {
  const anchor = { lat: landmarks.find((place) => place.slug === 'petra').location.lat, lng: landmarks.find((place) => place.slug === 'petra').location.lng }
  const radiusKm = 1
  const first = generateNearby(anchor, radiusKm)
  const second = generateNearby(anchor, radiusKm)
  assert.deepEqual(first, second)
  assert.ok(first.length > 0)
  for (const d of first) {
    assert.ok(d.distanceM <= radiusKm * 1000, `distanceM ${d.distanceM}`)
    assert.ok(haversineKm(anchor, d) <= radiusKm + 0.02, `haversine ${haversineKm(anchor, d)}`)
    assert.ok(d.slug)
    assert.ok(d.sourceCount > 0)
  }
})

test('every explorer mode maps to a positive radius', () => {
  const modes = ['walk', 'road', 'world', 'drone', 'satellite', 'history']
  for (const m of modes) {
    assert.ok(MODE_RADIUS_KM[m] > 0 && MODE_RADIUS_KM[m] <= 50, m)
  }
})

test('wonder tags cover the New Seven and all seven Ancient Wonders', () => {
  const newSeven = landmarks.filter((place) => place.wonderLists?.includes('new-seven')).map((place) => place.slug).sort()
  assert.deepEqual(newSeven, [
    'chichen-itza',
    'christ-redeemer',
    'colosseum',
    'great-wall',
    'machu-picchu',
    'petra',
    'taj-mahal',
  ])
  assert.deepEqual(
    landmarks.filter((place) => place.wonderLists?.includes('ancient-seven')).map((place) => place.slug),
    [
      'pyramids',
      'hanging-gardens-of-babylon',
      'statue-of-zeus',
      'temple-of-artemis',
      'mausoleum-at-halicarnassus',
      'colossus-of-rhodes',
      'lighthouse-of-alexandria',
    ]
  )
  assert.ok(natureSites.filter((place) => place.wonderLists?.includes('natural-highlights')).length > 0)
})

test('Explorer progress contains only distinct visited place records', () => {
  assert.deepEqual(xpFor([]), {
    level: 1,
    countries: 0,
    landmarks: 0,
    discoveries: 0,
    cultures: 0,
    routes: 0,
  })
  assert.deepEqual(xpFor(['country:FRA', 'country:FRA', 'landmark:petra']), {
    level: 1,
    countries: 1,
    landmarks: 1,
    discoveries: 0,
    cultures: 0,
    routes: 0,
  })
})

test('REST Countries v5 records normalize to the UI country schema', () => {
  const country = normalizeCountryRecord({
    names: { common: 'Canada', official: 'Canada' },
    codes: { alpha_2: 'CA', alpha_3: 'CAN' },
    capitals: [{ name: 'Ottawa', primary: true, coordinates: { lat: 45.42, lng: -75.7 } }],
    flag: { url_svg: 'https://flags.restcountries.com/v5/svg/ca.svg' },
    region: 'Americas',
    subregion: 'North America',
    population: 38005238,
    area: { kilometers: 9984670 },
    currencies: [{ code: 'CAD', name: 'Canadian dollar', symbol: '$' }],
    languages: [{ name: 'English', bcp47: 'en' }, { name: 'French', bcp47: 'fr' }],
    timezones: ['UTC-08:00', 'UTC-07:00'],
    borders: ['USA'],
    tlds: ['.ca'],
    memberships: { un: true },
    landlocked: false,
    maps: { google_maps: 'https://maps.example/ca' },
  })
  assert.deepEqual(country, {
    cca3: 'CAN',
    cca2: 'CA',
    name: { common: 'Canada', official: 'Canada' },
    capital: ['Ottawa'],
    region: 'Americas',
    subregion: 'North America',
    population: 38005238,
    area: 9984670,
    flags: {
      svg: 'https://flags.restcountries.com/v5/svg/ca.svg',
      png: 'https://flags.restcountries.com/v5/w320/ca.png',
      alt: 'Flag of Canada',
    },
    latlng: [45.42, -75.7],
    languages: { en: 'English', fr: 'French' },
    currencies: { CAD: { name: 'Canadian dollar', symbol: '$' } },
    timezones: ['UTC-08:00', 'UTC-07:00'],
    borders: ['USA'],
    tld: ['.ca'],
    unMember: true,
    landlocked: false,
    maps: { googleMaps: 'https://maps.example/ca' },
  })
})

test('REST Countries invalid and missing fields are omitted for fallback merging', () => {
  const country = normalizeCountryRecord({
    names: { common: 'Testland' },
    codes: { alpha_3: 'TST', alpha_2: 'TS' },
    area: { kilometers: -1 },
    capitals: [],
    timezones: [],
  })
  assert.ok(country)
  assert.equal('area' in country, false)
  assert.equal('capital' in country, false)
  assert.equal('timezones' in country, false)
})

test('sitemap includes /time-travel and every route', () => {
  assert.ok(sitemap.includes('<loc>/time-travel</loc>'))
  assert.ok(sitemap.includes('<loc>/directory</loc>'))
  assert.ok(sitemap.includes('<loc>/privacy</loc>'))
  const count = (sitemap.match(/<loc>/g) || []).length
  assert.equal(count, 280)
})
