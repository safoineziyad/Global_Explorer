/**
 * wonders.test.mjs
 *
 * Guards the honesty guarantees of the wonder datasets in src/data:
 *
 *   - the two Seven Wonders canons are complete, and their slug lists in
 *     landmarks.ts agree with the records that carry the wonder-list tags
 *   - every record still carries the structural fields the UI and sitemap need
 *   - slugs are unique inside each collection (landmarks and nature sites are
 *     separate route trees, so a slug may legitimately exist in both)
 *   - lost ancient wonders are never presented as still standing, and the one
 *     that survives (Giza) is the only one marked extant
 *   - contested records cite sources, with well-formed check dates
 *   - WONDER_LIST_META never claims a curated selection is an official canon
 *   - the wonder-list filters in src/pages/Directory.tsx produce exactly the
 *     slug sets the data implies
 *
 * The TS data modules are transpiled with the local esbuild (a Vite dependency),
 * the same way scripts/check-content.mjs loads them, so no build step or new
 * dependency is needed. Nothing here touches the network: `checked` dates are
 * compared against a format regex and a calendar round-trip, never against now.
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gce-wonders-'))

after(() => fs.rmSync(buildDir, { recursive: true, force: true }))

/** Transpile one src/data module with esbuild and import the named exports. */
async function loadDataModule(relativePath, exportNames) {
  const file = path.join(root, relativePath)
  assert.ok(fs.existsSync(file), `missing data module: ${relativePath}`)
  const outfile = path.join(buildDir, `${path.basename(file, '.ts')}.mjs`)
  await build({
    entryPoints: [file],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    logLevel: 'error',
  })
  const mod = await import(pathToFileURL(outfile).href)
  const picked = {}
  for (const name of exportNames) picked[name] = mod[name]
  return picked
}

const [landmarkData, natureData] = await Promise.all([
  loadDataModule(path.join('src', 'data', 'landmarks.ts'), [
    'landmarks',
    'WONDER_LIST_META',
    'ANCIENT_SEVEN_SLUGS',
    'NEW_SEVEN_SLUGS',
  ]),
  loadDataModule(path.join('src', 'data', 'nature.ts'), ['natureSites']),
])

const { landmarks, WONDER_LIST_META, ANCIENT_SEVEN_SLUGS, NEW_SEVEN_SLUGS } = landmarkData
const { natureSites } = natureData

/** The canon attributed to Antipater of Sidon, in the order the data declares it. */
const CANONICAL_ANCIENT_SEVEN = [
  'pyramids',
  'hanging-gardens-of-babylon',
  'statue-of-zeus',
  'temple-of-artemis',
  'mausoleum-at-halicarnassus',
  'colossus-of-rhodes',
  'lighthouse-of-alexandria',
]

/** The New7Wonders.org list from the 2007 public poll. */
const CANONICAL_NEW_SEVEN = [
  'christ-redeemer',
  'colosseum',
  'great-wall',
  'machu-picchu',
  'petra',
  'taj-mahal',
  'chichen-itza',
]

const WONDER_LIST_IDS = ['new-seven', 'ancient-seven', 'natural-highlights']

/** Giza is the only ancient wonder that still stands. */
const ONLY_SURVIVING_ANCIENT_WONDER = 'pyramids'

/**
 * Entries in this dataset that appear on a published natural-wonders register
 * (the New7Wonders of Nature lists). Everything else that is merely "often
 * called a wonder" must leave `officialWonderList` unset or false, which is why
 * grand-canyon and great-barrier-reef — widely but wrongly claimed as official
 * register entries — are not listed here.
 */
const PUBLISHED_NATURAL_REGISTER = ['halong-bay', 'iguazu-falls', 'lake-baikal', 'victoria-falls']

const bySlug = (records, slug) => records.find((record) => record.slug === slug)
const slugsFor = (records, listId) =>
  records.filter((record) => record.wonderLists?.includes(listId)).map((record) => record.slug)
const sorted = (values) => [...values].sort()

function assertValidSource(source, where) {
  assert.ok(source && typeof source === 'object' && !Array.isArray(source), `${where}: source is not an object`)
  assert.equal(typeof source.label, 'string', `${where}: label must be a string`)
  assert.ok(source.label.trim().length > 0, `${where}: label is empty`)
  assert.equal(typeof source.url, 'string', `${where}: url must be a string`)
  assert.match(source.url, /^https?:\/\/\S+$/, `${where}: url must be an absolute http(s) URL`)
  assert.equal(typeof source.checked, 'string', `${where}: checked must be a string`)
  assert.match(source.checked, /^\d{4}-\d{2}-\d{2}$/, `${where}: checked must look like YYYY-MM-DD`)
  // Catches impossible dates such as 2026-02-31 that satisfy the regex.
  assert.equal(
    new Date(`${source.checked}T00:00:00Z`).toISOString().slice(0, 10),
    source.checked,
    `${where}: checked is not a real calendar date`,
  )
}

/** Structural fields both collections share; see README data contract. */
function assertValidRecord(record, kind) {
  const where = `${kind}/${record?.slug ?? '<missing slug>'}`
  for (const field of ['slug', 'name', 'country', 'description']) {
    assert.equal(typeof record[field], 'string', `${where}: ${field} must be a string`)
    assert.ok(record[field].trim().length > 0, `${where}: ${field} is empty`)
  }
  assert.match(record.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${where}: slug must be lowercase kebab-case`)

  assert.ok(record.location && typeof record.location === 'object', `${where}: location is missing`)
  assert.ok(Number.isFinite(record.location.lat), `${where}: location.lat must be a number`)
  assert.ok(
    record.location.lat >= -90 && record.location.lat <= 90,
    `${where}: location.lat ${record.location.lat} is outside [-90, 90]`,
  )
  assert.ok(Number.isFinite(record.location.lng), `${where}: location.lng must be a number`)
  assert.ok(
    record.location.lng >= -180 && record.location.lng <= 180,
    `${where}: location.lng ${record.location.lng} is outside [-180, 180]`,
  )

  assert.ok(Array.isArray(record.facts), `${where}: facts must be an array`)
  assert.ok(record.facts.length > 0, `${where}: facts is empty`)
  record.facts.forEach((fact, index) => {
    assert.equal(typeof fact, 'string', `${where}: facts[${index}] must be a string`)
    assert.ok(fact.trim().length > 0, `${where}: facts[${index}] is empty`)
  })
}

/* ------------------------------------------------------------------ */
/* 1 + 2 — canon completeness                                           */
/* ------------------------------------------------------------------ */

test('ancient seven: the dataset covers all seven canonical wonders exactly once', () => {
  const tagged = slugsFor(landmarks, 'ancient-seven')
  assert.equal(tagged.length, 7, `expected 7 ancient wonders, found ${tagged.length}: ${tagged.join(', ')}`)
  assert.deepEqual(sorted(tagged), sorted(CANONICAL_ANCIENT_SEVEN))
  assert.equal(new Set(tagged).size, 7, 'a slug is tagged as an ancient wonder more than once')
  // The exported constant is what other modules import, so it must agree.
  assert.equal(ANCIENT_SEVEN_SLUGS.length, 7)
  assert.deepEqual(sorted(ANCIENT_SEVEN_SLUGS), sorted(CANONICAL_ANCIENT_SEVEN))
  assert.equal(new Set(ANCIENT_SEVEN_SLUGS).size, 7)
  for (const slug of CANONICAL_ANCIENT_SEVEN) {
    assert.ok(bySlug(landmarks, slug), `landmark "${slug}" is missing from the dataset`)
  }
})

test('new seven: the dataset covers all seven official wonders exactly once', () => {
  const tagged = slugsFor(landmarks, 'new-seven')
  assert.equal(tagged.length, 7, `expected 7 new wonders, found ${tagged.length}: ${tagged.join(', ')}`)
  assert.deepEqual(sorted(tagged), sorted(CANONICAL_NEW_SEVEN))
  assert.equal(new Set(tagged).size, 7, 'a slug is tagged as a new wonder more than once')
  assert.equal(NEW_SEVEN_SLUGS.length, 7)
  assert.deepEqual(sorted(NEW_SEVEN_SLUGS), sorted(CANONICAL_NEW_SEVEN))
  assert.equal(new Set(NEW_SEVEN_SLUGS).size, 7)
  for (const slug of CANONICAL_NEW_SEVEN) {
    assert.ok(bySlug(landmarks, slug), `landmark "${slug}" is missing from the dataset`)
  }
})

/* ------------------------------------------------------------------ */
/* 3 + 4 — structural fields and slug uniqueness                       */
/* ------------------------------------------------------------------ */

test('records: every landmark carries the required structural fields', () => {
  assert.ok(Array.isArray(landmarks) && landmarks.length > 0, 'landmarks must be a non-empty array')
  for (const record of landmarks) assertValidRecord(record, 'landmark')
})

test('records: every nature site carries the required structural fields', () => {
  assert.ok(Array.isArray(natureSites) && natureSites.length > 0, 'natureSites must be a non-empty array')
  for (const record of natureSites) assertValidRecord(record, 'nature')
})

test('records: every country code is a real ISO 3166-1 alpha-3 code', () => {
  const shipped = new Set(
    JSON.parse(fs.readFileSync(path.join(root, 'public', 'data', 'countries.json'), 'utf8')).map(
      (country) => country.cca3,
    ),
  )
  for (const record of [...landmarks, ...natureSites]) {
    const where = `${record.slug}: country`
    assert.match(record.country, /^[A-Z]{3}$/, `${where} must be uppercase alpha-3, got "${record.country}"`)
    assert.ok(shipped.has(record.country), `${where} "${record.country}" is not in the shipped country dataset`)
  }
})

test('uniqueness: no slug repeats within the landmarks collection', () => {
  const seen = new Set()
  for (const record of landmarks) {
    assert.ok(!seen.has(record.slug), `duplicate landmark slug: "${record.slug}"`)
    seen.add(record.slug)
  }
  assert.equal(seen.size, landmarks.length)
})

test('uniqueness: no slug repeats within the nature sites collection', () => {
  const seen = new Set()
  for (const record of natureSites) {
    assert.ok(!seen.has(record.slug), `duplicate nature slug: "${record.slug}"`)
    seen.add(record.slug)
  }
  assert.equal(seen.size, natureSites.length)
})

/* ------------------------------------------------------------------ */
/* 5 — lost-wonder honesty                                             */
/* ------------------------------------------------------------------ */

test('lost wonders: the six destroyed ancient wonders are marked lost and Giza extant', () => {
  const destroyed = CANONICAL_ANCIENT_SEVEN.filter((slug) => slug !== ONLY_SURVIVING_ANCIENT_WONDER)
  assert.equal(destroyed.length, 6)
  for (const slug of destroyed) {
    const record = bySlug(landmarks, slug)
    assert.ok(record, `landmark "${slug}" is missing`)
    assert.equal(record.status, 'lost', `ancient wonder "${slug}" must be marked status: 'lost'`)
  }
  const giza = bySlug(landmarks, ONLY_SURVIVING_ANCIENT_WONDER)
  assert.equal(giza.status, 'extant', 'the Pyramids of Giza are the one ancient wonder that still stands')
  // Nothing outside the ancient canon may claim a lost status.
  for (const record of landmarks) {
    if (record.status === undefined) continue
    assert.ok(
      CANONICAL_ANCIENT_SEVEN.includes(record.slug),
      `"${record.slug}" claims status "${record.status}" but is not an ancient wonder`,
    )
  }
})

test('lost wonders: every ancient wonder states a confidence and Babylon is disputed', () => {
  for (const slug of CANONICAL_ANCIENT_SEVEN) {
    const record = bySlug(landmarks, slug)
    assert.ok(record, `landmark "${slug}" is missing`)
    assert.ok(
      ['verified', 'attested', 'disputed'].includes(record.confidence),
      `ancient wonder "${slug}" has no usable confidence value (got ${JSON.stringify(record.confidence)})`,
    )
  }
  const babylon = bySlug(landmarks, 'hanging-gardens-of-babylon')
  assert.equal(
    babylon.confidence,
    'disputed',
    'the Hanging Gardens have never been located; their very existence is contested',
  )

  // Confidence and status must agree: only a surviving site can be "verified",
  // and nothing that still stands may be hedged as merely attested.
  for (const slug of CANONICAL_ANCIENT_SEVEN) {
    const record = bySlug(landmarks, slug)
    if (record.status === 'extant') {
      assert.equal(record.confidence, 'verified', `"${slug}" still stands, so it can be stated as verified`)
    } else {
      assert.ok(
        record.confidence === 'attested' || record.confidence === 'disputed',
        `"${slug}" no longer survives, so it cannot be presented as verified`,
      )
    }
  }
})

/* ------------------------------------------------------------------ */
/* 6 — provenance                                                      */
/* ------------------------------------------------------------------ */

test('provenance: every nature record cites at least one source', () => {
  for (const record of natureSites) {
    assert.ok(Array.isArray(record.sources), `nature/${record.slug}: sources must be an array`)
    assert.ok(record.sources.length > 0, `nature/${record.slug}: sources is empty`)
  }
})

test('provenance: every ancient wonder cites sources, since none but Giza can be visited', () => {
  for (const slug of CANONICAL_ANCIENT_SEVEN) {
    const record = bySlug(landmarks, slug)
    assert.ok(Array.isArray(record.sources), `landmark/${slug}: sources must be an array`)
    assert.ok(
      record.sources.length > 0,
      `landmark/${slug}: the record is attested/disputed and must cite where the description comes from`,
    )
  }
})

test('provenance: every source entry has a label, an http(s) url and a real ISO checked date', () => {
  let checkedCount = 0
  for (const record of landmarks) {
    for (const source of record.sources ?? []) {
      assertValidSource(source, `landmark/${record.slug}`)
      checkedCount += 1
    }
  }
  for (const record of natureSites) {
    for (const source of record.sources ?? []) {
      assertValidSource(source, `nature/${record.slug}`)
      checkedCount += 1
    }
  }
  assert.ok(checkedCount > 0, 'no sources were found at all')
})

test('provenance: every landmark cites at least one source', () => {
  const missing = landmarks.filter((record) => !Array.isArray(record.sources) || record.sources.length === 0)
  assert.deepEqual(missing.map((record) => record.slug), [])
})

/* ------------------------------------------------------------------ */
/* 7 — list metadata honesty                                           */
/* ------------------------------------------------------------------ */

test('list metadata: new seven is official and complete, natural highlights is neither', () => {
  assert.deepEqual(Object.keys(WONDER_LIST_META).sort(), [...WONDER_LIST_IDS].sort())
  for (const id of WONDER_LIST_IDS) {
    assert.ok(WONDER_LIST_META[id], `WONDER_LIST_META is missing "${id}"`)
    assert.equal(WONDER_LIST_META[id].id, id, `WONDER_LIST_META["${id}"].id does not match its key`)
  }

  const newSeven = WONDER_LIST_META['new-seven']
  assert.equal(newSeven.official, true, 'the New7Wonders list is an official, complete canon')
  assert.equal(newSeven.complete, true, 'the New7Wonders list is exhaustive, all seven are present')

  const highlights = WONDER_LIST_META['natural-highlights']
  assert.equal(
    highlights.complete,
    false,
    'natural highlights are a curated selection and must never be presented as exhaustive',
  )
  assert.equal(
    highlights.official,
    false,
    'natural highlights are a curated selection and must never be presented as official',
  )
  // The ancient list is complete as a set of names but is not a modern register.
  assert.equal(WONDER_LIST_META['ancient-seven'].official, false)
})

test('list metadata: every wonder list carries a distinct label and a non-empty note', () => {
  for (const id of WONDER_LIST_IDS) {
    const meta = WONDER_LIST_META[id]
    for (const field of ['labelKey', 'noteKey']) {
      assert.equal(typeof meta[field], 'string', `WONDER_LIST_META["${id}"].${field} must be a string`)
      assert.ok(meta[field].trim().length > 0, `WONDER_LIST_META["${id}"].${field} is empty`)
    }
  }
  const notes = WONDER_LIST_IDS.map((id) => WONDER_LIST_META[id].noteKey)
  assert.equal(new Set(notes).size, notes.length, `wonder-list notes must be distinct, got ${notes.join(', ')}`)
  const labels = WONDER_LIST_IDS.map((id) => WONDER_LIST_META[id].labelKey)
  assert.equal(new Set(labels).size, labels.length, `wonder-list labels must be distinct, got ${labels.join(', ')}`)
})

/* ------------------------------------------------------------------ */
/* 8 — curated vs official                                             */
/* ------------------------------------------------------------------ */

test('curated vs official: a curated highlight never claims an official register', () => {
  const highlights = natureSites.filter((site) => site.wonderLists?.includes('natural-highlights'))
  assert.ok(highlights.length > 0, 'no nature record is tagged as a curated highlight')
  for (const site of highlights) {
    if (PUBLISHED_NATURAL_REGISTER.includes(site.slug)) continue
    assert.notEqual(
      site.officialWonderList,
      true,
      `nature/${site.slug} is a curated highlight, not on a published register, so it must not claim officialWonderList: true`,
    )
  }
  // The flag must be a boolean wherever it appears at all, so the UI branch in
  // Nature.tsx (`if (site.officialWonderList)`) can never read a string.
  for (const site of natureSites) {
    if (site.officialWonderList === undefined) continue
    assert.equal(typeof site.officialWonderList, 'boolean', `nature/${site.slug}: officialWonderList must be a boolean`)
  }
})

test('curated vs official: angel-falls is explicitly not on an official register', () => {
  const angelFalls = bySlug(natureSites, 'angel-falls')
  assert.ok(angelFalls, 'nature/angel-falls is missing from the dataset')
  assert.equal(
    angelFalls.officialWonderList,
    false,
    'Angel Falls is widely called a wonder but is not on any published natural-wonders register',
  )
  assert.ok(!PUBLISHED_NATURAL_REGISTER.includes('angel-falls'))
})

test('curated vs official: records claiming an official register cite their sources', () => {
  const claiming = natureSites.filter((site) => site.officialWonderList === true)
  assert.ok(claiming.length > 0, 'no nature record claims an official register, which is itself suspicious')
  for (const site of claiming) {
    assert.ok(Array.isArray(site.sources) && site.sources.length > 0, `nature/${site.slug}: must cite sources`)
  }
})

/* ------------------------------------------------------------------ */
/* 9 — what the wonder-list filter UI will show                        */
/* ------------------------------------------------------------------ */

test('ui filter: filtering landmarks by wonder list yields the expected slugs and counts', () => {
  // Mirrors the landmark filter in src/pages/Directory.tsx:
  //   item.wonderLists?.includes(wonderFilter)
  assert.deepEqual(sorted(slugsFor(landmarks, 'new-seven')), sorted(CANONICAL_NEW_SEVEN))
  assert.equal(slugsFor(landmarks, 'new-seven').length, 7)

  assert.deepEqual(sorted(slugsFor(landmarks, 'ancient-seven')), sorted(CANONICAL_ANCIENT_SEVEN))
  assert.equal(slugsFor(landmarks, 'ancient-seven').length, 7)

  // Everest is the only landmark in the curated natural highlights.
  assert.deepEqual(slugsFor(landmarks, 'natural-highlights'), ['everest'])
  assert.equal(slugsFor(landmarks, 'natural-highlights').length, 1)
})

test('ui filter: a landmark is never counted in two wonder lists at once', () => {
  for (const record of landmarks) {
    const lists = record.wonderLists ?? []
    assert.equal(
      new Set(lists).size,
      lists.length,
      `landmark/${record.slug}: wonderLists contains a duplicate tag`,
    )
    assert.ok(lists.length <= 1, `landmark/${record.slug}: tagged with ${lists.join(', ')} — filters would double-count it`)
    for (const id of lists) {
      assert.ok(WONDER_LIST_IDS.includes(id), `landmark/${record.slug}: unknown wonder-list id "${id}"`)
    }
  }
  // Every tag a record carries must be renderable by the detail page.
  for (const record of landmarks) {
    for (const id of record.wonderLists ?? []) {
      assert.ok(WONDER_LIST_META[id], `landmark/${record.slug}: no WONDER_LIST_META for "${id}"`)
    }
  }
})

test('ui filter: the nature filter only offers the curated natural-highlights list', () => {
  // Mirrors the nature branch in Directory.tsx, which only ever matches
  // 'natural-highlights'; the other two ids must therefore return nothing.
  assert.equal(slugsFor(natureSites, 'natural-highlights').length, 7)
  assert.equal(slugsFor(natureSites, 'new-seven').length, 0)
  assert.equal(slugsFor(natureSites, 'ancient-seven').length, 0)
  for (const site of natureSites) {
    for (const id of site.wonderLists ?? []) {
      assert.equal(id, 'natural-highlights', `nature/${site.slug}: unexpected wonder-list id "${id}"`)
    }
  }
})