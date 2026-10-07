/**
 * Regression net for the removal of the fabricated "nearby discoveries" generator.
 *
 * `src/data/explorerFeatures.ts` used to synthesise place names, coordinates and
 * "local legend" stories with a seeded PRNG. Those functions are gone. Nearby
 * results are now real, cited records looked up by distance in the curated
 * landmark and nature datasets.
 *
 * These tests exist so the fabricator cannot quietly return, and so that an
 * "empty result" is never mistaken for a bug — with a 34-record curated set,
 * an empty result around most points is the honest, expected outcome.
 *
 * Runs under `node --test`. No network, no clock dependence, deterministic.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { landmarks } from '../src/data/landmarks.ts';
import { natureSites } from '../src/data/nature.ts';
import {
  CATEGORIES,
  CATEGORIES_WITH_DATA,
  VERIFIED_PLACES,
  categoryHasData,
  countsWithin,
  generateNearby,
  haversineKm,
} from '../src/data/explorerFeatures.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_SRC = fs.readFileSync(path.join(here, '..', 'src', 'data', 'explorerFeatures.ts'), 'utf8');

/** Every real record, keyed by the `kind:slug` id the index uses. */
const RECORDS = new Map([
  ...landmarks.map((r) => [`landmark:${r.slug}`, { kind: 'landmark', record: r }]),
  ...natureSites.map((r) => [`nature:${r.slug}`, { kind: 'nature', record: r }]),
]);

/** A few real anchors, chosen to exercise both the "hit" and "miss" paths. */
const ANCHORS = [
  { lat: 0, lng: 0 }, // open ocean: must be empty
  { lat: 48.8566, lng: 2.3522 }, // Paris
  { lat: 41.8902, lng: 12.4922 }, // Rome -> Colosseum
  { lat: 29.9792, lng: 31.1342 }, // Giza -> Pyramids
  { lat: 30.0444, lng: 31.2357 }, // Cairo
  { lat: -77.8497, lng: 166.6763 }, // Antarctica
  { lat: 89.9, lng: 0 }, // near the pole
  { lat: -90, lng: 180 },
];

const ALL_ANCHORS = [...ANCHORS, ...VERIFIED_PLACES.map((p) => ({ lat: p.lat, lng: p.lng }))];

/* ------------------------------------------------------------------ */
/* 1 — the fabricator is gone                                          */
/* ------------------------------------------------------------------ */

test('the seeded-PRNG generator has not returned', () => {
  for (const symbol of ['mulberry', 'hash32', 'NAME_POOLS', 'STORY_POOLS']) {
    assert.ok(
      !FEATURES_SRC.includes(symbol),
      `src/data/explorerFeatures.ts references "${symbol}" — the generator must stay deleted`,
    );
  }
});

test('none of the invented placeholder places that used to ship are present', () => {
  const invented = [
    'Cedar Grove',
    'Old Watchtower',
    'Spice Market',
    'Locals claim the water here never freezes',
  ];
  const corpus = FEATURES_SRC + JSON.stringify([...VERIFIED_PLACES.map((p) => [p.name, p.summary])]);
  for (const phrase of invented) {
    assert.ok(!corpus.includes(phrase), `invented content leaked back in: "${phrase}"`);
  }
});

/* ------------------------------------------------------------------ */
/* 2 — every returned discovery is a real record                       */
/* ------------------------------------------------------------------ */

test('every discovery maps to a real dataset record with unmodified coordinates', () => {
  let asserted = 0;
  for (const anchor of ALL_ANCHORS) {
    for (const d of generateNearby(anchor, 50)) {
      const entry = RECORDS.get(d.id);
      assert.ok(entry, `${d.id} is not in either dataset`);
      assert.equal(d.kind, entry.kind, `${d.id}: kind disagrees with its dataset`);
      assert.equal(d.slug, entry.record.slug, `${d.id}: slug disagrees with its dataset`);
      // Coordinates must be copied verbatim, not perturbed as they were when
      // the generator invented points around an anchor.
      assert.equal(d.lat, entry.record.location.lat, `${d.id}: latitude was altered`);
      assert.equal(d.lng, entry.record.location.lng, `${d.id}: longitude was altered`);
      assert.equal(d.country, entry.record.country, `${d.id}: country disagrees with its dataset`);
      assert.equal(d.name, entry.record.name, `${d.id}: name disagrees with its dataset`);
      assert.equal(d.story, entry.record.description, `${d.id}: summary disagrees with its dataset`);
      asserted += 1;
    }
  }
  assert.ok(asserted > 0, 'no discoveries were asserted — the test would pass vacuously');
});

test('distanceM is the rounded haversine distance to the record', () => {
  let asserted = 0;
  for (const anchor of ALL_ANCHORS) {
    for (const d of generateNearby(anchor, 200)) {
      const expected = Math.round(haversineKm(anchor, d) * 1000);
      assert.ok(
        Math.abs(d.distanceM - expected) <= 1,
        `${d.id}: distanceM ${d.distanceM} vs haversine ${expected}`,
      );
      asserted += 1;
    }
  }
  assert.ok(asserted > 0, 'no distances were asserted');
});

test('results stay inside the radius and are ordered nearest first', () => {
  for (const anchor of ALL_ANCHORS) {
    for (const radiusKm of [0.5, 1, 25, 200]) {
      const found = generateNearby(anchor, radiusKm);
      for (const d of found) {
        assert.ok(d.distanceM <= radiusKm * 1000, `${d.id} at ${d.distanceM}m exceeds ${radiusKm}km`);
      }
      for (let i = 1; i < found.length; i += 1) {
        assert.ok(
          found[i - 1].distanceM <= found[i].distanceM,
          `results not sorted nearest-first at ${anchor.lat},${anchor.lng} r=${radiusKm}`,
        );
      }
    }
  }
});

test('a zero radius returns nothing, and an empty result is a normal outcome', () => {
  // Nothing is within 0 km of open ocean.
  assert.deepEqual(generateNearby({ lat: 0, lng: 0 }, 0), []);

  // A record sitting exactly on the anchor IS within a 0 km radius, so this is
  // a boundary case that must be kept rather than rounded away.
  const onTop = generateNearby({ lat: 41.8902, lng: 12.4922 }, 0);
  assert.deepEqual(
    onTop.map((d) => d.id),
    ['landmark:colosseum'],
  );
  assert.equal(onTop[0].distanceM, 0);

  // Mid-ocean there is genuinely nothing in a 34-record curated set. This is
  // the expected result, not a failure — and it must not be padded with data.
  assert.deepEqual(generateNearby({ lat: 0, lng: 0 }, 50), []);
});

test('the same arguments always produce the same result', () => {
  for (const anchor of ANCHORS) {
    const a = generateNearby(anchor, 50);
    const b = generateNearby(anchor, 50);
    assert.deepEqual(a, b);
  }
});

/* ------------------------------------------------------------------ */
/* 3 — category filtering and honest "no data" reporting                */
/* ------------------------------------------------------------------ */

test('disabled categories are excluded and unknown categories return nothing', () => {
  const anchor = { lat: 41.8902, lng: 12.4922 };
  const off = generateNearby(anchor, 50, { nature: false });
  assert.ok(off.every((d) => d.category !== 'nature'), 'a disabled category leaked through');

  for (const d of generateNearby(anchor, 50)) {
    assert.ok(CATEGORIES_WITH_DATA.includes(d.category), `${d.id}: category ${d.category} has no dataset`);
  }
});

test('categoryHasData reports availability truthfully', () => {
  // These three have no dataset at all and must never promise results.
  for (const id of ['culture', 'food', 'discoveries']) {
    assert.equal(categoryHasData(id), false, `${id} should have no dataset`);
  }
  for (const id of ['nature', 'history', 'architecture']) {
    assert.equal(categoryHasData(id), true, `${id} should have a dataset`);
  }
  assert.ok(CATEGORIES_WITH_DATA.length > 0 && CATEGORIES_WITH_DATA.length < CATEGORIES.length);
});

/* ------------------------------------------------------------------ */
/* 4 — bad input degrades to an empty list, never an exception         */
/* ------------------------------------------------------------------ */

test('invalid anchors and radii return an empty list instead of throwing', () => {
  const bad = [
    { lat: NaN, lng: 0 },
    { lat: 0, lng: NaN },
    { lat: 0, lng: Infinity },
    { lat: Infinity, lng: Infinity },
  ];
  for (const anchor of bad) {
    assert.deepEqual(generateNearby(anchor, 10), [], `${JSON.stringify(anchor)} should yield []`);
  }
  assert.deepEqual(generateNearby({ lat: 0, lng: 0 }, NaN), [], 'NaN radius should yield []');
  assert.deepEqual(generateNearby({ lat: 0, lng: 0 }, -5), [], 'a negative radius should yield []');
});

/* ------------------------------------------------------------------ */
/* 5 — countsWithin must not claim "zero" where it means "unknown"     */
/* ------------------------------------------------------------------ */

test('dishes is reported as unknown (null), never as zero', () => {
  assert.equal(countsWithin([]).dishes, null);
  const found = generateNearby({ lat: 41.8902, lng: 12.4922 }, 50);
  assert.ok(found.length > 0, 'expected at least one record near Rome');
  assert.equal(countsWithin(found).dishes, null, 'there is no food dataset, so this must stay null');
});

test('counts are zero for an empty list and respect the radius', () => {
  assert.deepEqual(countsWithin([]), { landmarks: 0, events: 0, nature: 0, dishes: null });

  const found = generateNearby({ lat: 29.9792, lng: 31.1342 }, 50);
  const near = countsWithin(found, 1000);
  const all = countsWithin(found, 50_000);
  assert.ok(near.landmarks + near.events + near.nature <= all.landmarks + all.events + all.nature);

  let total = 0;
  for (const d of found) {
    if (d.distanceM > 1000) continue;
    if (d.category === 'nature') total += 1;
  }
  assert.equal(near.nature, total);
});

/* ------------------------------------------------------------------ */
/* 6 — provenance travels with every result                            */
/* ------------------------------------------------------------------ */

test('every discovery carries provenance and a route to its record', () => {
  for (const place of VERIFIED_PLACES) {
    assert.ok(place.sourceCount >= 1, `${place.id}: has no cited source`);
    assert.ok(place.href.length > 0, `${place.id}: has no href`);
    assert.match(place.href, /^\/(landmark|nature)\//, `${place.id}: unexpected href "${place.href}"`);
    assert.equal(place.nameKey, `content.${place.kind}.${place.slug}.name`);
    assert.equal(place.summaryKey, `content.${place.kind}.${place.slug}.description`);
  }
});

/* ------------------------------------------------------------------ */
/* 7 — the index itself                                                */
/* ------------------------------------------------------------------ */

test('VERIFIED_PLACES covers both datasets exactly once', () => {
  assert.equal(VERIFIED_PLACES.length, landmarks.length + natureSites.length);
  assert.equal(new Set(VERIFIED_PLACES.map((p) => p.id)).size, VERIFIED_PLACES.length, 'duplicate ids');

  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  for (const place of VERIFIED_PLACES) {
    assert.ok(categoryIds.has(place.category), `${place.id}: unknown category "${place.category}"`);
  }
});
