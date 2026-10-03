import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { robinsonProject } from '../src/lib/robinson.ts'
import { MODE_RADIUS_KM, generateNearby, haversineKm } from '../src/data/explorerFeatures.ts'

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
    assert.ok(Number.isFinite(c.area), `area: ${c.cca3}`)
    assert.ok(Array.isArray(c.latlng) && c.latlng.length === 2, `latlng: ${c.cca3}`)
    assert.ok(Number.isFinite(c.latlng[0]) && Number.isFinite(c.latlng[1]), `latlng finite: ${c.cca3}`)
    assert.ok(!seen.has(c.cca3), `duplicate: ${c.cca3}`)
    seen.add(c.cca3)
  }
  assert.equal(seen.size, 250)
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

test('generateNearby stays inside the radius', () => {
  const anchor = { lat: 48.8566, lng: 2.3522 }
  const radiusKm = 1
  const first = generateNearby(anchor, radiusKm)
  const second = generateNearby(anchor, radiusKm)
  assert.deepEqual(first, second)
  assert.ok(first.length > 0)
  for (const d of first) {
    assert.ok(d.distanceM <= radiusKm * 1000, `distanceM ${d.distanceM}`)
    assert.ok(haversineKm(anchor, d) <= radiusKm + 0.02, `haversine ${haversineKm(anchor, d)}`)
  }
})

test('every explorer mode maps to a positive radius', () => {
  const modes = ['walk', 'road', 'world', 'drone', 'satellite', 'history']
  for (const m of modes) {
    assert.ok(MODE_RADIUS_KM[m] > 0 && MODE_RADIUS_KM[m] <= 50, m)
  }
})

test('sitemap includes /time-travel and every route', () => {
  assert.ok(sitemap.includes('<loc>/time-travel</loc>'))
  const count = (sitemap.match(/<loc>/g) || []).length
  assert.equal(count, 202)
})
