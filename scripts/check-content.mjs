#!/usr/bin/env node
/**
 * check-content.mjs
 *
 * Verifies that the localized landmark/nature copy in src/i18n/content.{en,fr,ar}.ts
 * stays in step with the English reference and with the curated datasets:
 *
 *   1. every landmark/nature slug in src/data has copy in all three locales
 *   2. no locale carries a slug that is no longer in the dataset
 *   3. required fields are present and non-empty in every locale
 *   4. list lengths (facts/wildlife/activities) match English exactly
 *   5. Arabic strings contain no stray Latin text (a corruption guard — a
 *      partially-translated or garbled string shows up as Latin characters
 *      embedded in Arabic prose)
 *   6. French/Arabic strings are not identical to English for prose fields,
 *      which would mean an untranslated copy-paste slipped through
 *
 * Exits non-zero with a report if anything fails.
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');

const LANDMARK_TEXT_FIELDS = ['name', 'type', 'built', 'period', 'description'];
const LANDMARK_OPTIONAL_FIELDS = ['height', 'bestTime'];
const NATURE_TEXT_FIELDS = ['name', 'type', 'description', 'climate', 'bestTime'];
const NATURE_OPTIONAL_FIELDS = ['area', 'established'];
const LIST_FIELDS = ['facts', 'wildlife', 'activities'];

/** Load the TS data/content modules by transpiling them with the local esbuild. */
async function loadModule(relativePath, exportNames) {
  const file = path.join(rootDir, relativePath);
  if (!fs.existsSync(file)) throw new Error(`missing file: ${relativePath}`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gce-check-'));
  const outfile = path.join(dir, 'out.mjs');
  await build({
    entryPoints: [file],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    logLevel: 'error',
  });
  const mod = await import(pathToFileURL(outfile).href);
  const out = {};
  for (const name of exportNames) out[name] = mod[name];
  return out;
}

const errors = [];
const fail = (msg) => errors.push(msg);

/** Latin letters other than the ones legitimately part of transliterated names. */
const LATIN_ALLOWED = new Set([
  // Common romanised forms that appear inside otherwise-Arabic strings.
  'mausoleum', 'iso', 'unesco', 'hd',
]);

/**
 * Words that are spelled identically in English and French by design: either
 * international proper names used as-is in French, or words French borrowed
 * unchanged. Listed explicitly so a genuinely untranslated copy-paste still
 * fails the check, while these legitimate cases do not produce noise.
 */
const FR_IDENTICAL_ALLOWED = new Set([
  'Jaguar',
  'Lion',
  'Puma',
  'Capybara',
  'Guanaco',
  'Bison',
  'Camping',
  'Trekking',
  'Addax',
  'Cave of the Winds',
]);

/** Arabic uses its own script, so any identical prose is genuinely untranslated. */
const AR_IDENTICAL_ALLOWED = new Set();

function findLatin(str) {
  // Arabic prose should be fully Arabic. Any run of 2+ Latin letters is a bug.
  const matches = str.match(/[A-Za-z]{2,}/g);
  if (!matches) return [];
  return matches.filter((word) => !LATIN_ALLOWED.has(word.toLowerCase()));
}

function checkRecordSet({
  label,
  dataset,
  locales,
  textFields,
  optionalFields,
  listFields,
}) {
  const slugs = Object.keys(dataset);
  if (slugs.length === 0) fail(`${label}: dataset is empty`);

  const reference = locales.en;

  // 1 + 2: slug parity in both directions.
  for (const [localeName, dict] of Object.entries(locales)) {
    const dictSlugs = new Set(Object.keys(dict));
    for (const slug of slugs) {
      if (!dictSlugs.has(slug)) {
        fail(`${label}: ${localeName} is missing copy for "${slug}"`);
      }
    }
    for (const slug of dictSlugs) {
      if (!slugs.includes(slug)) {
        fail(`${label}: ${localeName} has copy for "${slug}", which is not in the dataset`);
      }
    }
  }

  for (const slug of slugs) {
    const en = reference[slug];
    if (!en) continue;

    for (const [localeName, dict] of Object.entries(locales)) {
      const copy = dict[slug];
      if (!copy) continue;

      // 3: required fields present and non-empty.
      for (const field of textFields) {
        if (typeof copy[field] !== 'string' || copy[field].trim() === '') {
          fail(`${label}/${slug}: ${localeName} field "${field}" is missing or empty`);
        }
      }
      // Optional fields must exist together across locales, or not at all.
      for (const field of optionalFields) {
        const inEn = typeof en[field] === 'string';
        const inLocale = typeof copy[field] === 'string';
        if (inEn && !inLocale) {
          fail(`${label}/${slug}: ${localeName} is missing optional field "${field}"`);
        }
        if (inLocale && copy[field].trim() === '') {
          fail(`${label}/${slug}: ${localeName} optional field "${field}" is empty`);
        }
      }

      // 4: list lengths match English exactly.
      for (const field of listFields) {
        const expected = en[field];
        if (!Array.isArray(expected)) continue;
        const actual = copy[field];
        if (!Array.isArray(actual)) {
          fail(`${label}/${slug}: ${localeName} field "${field}" is not an array`);
          continue;
        }
        if (actual.length !== expected.length) {
          fail(
            `${label}/${slug}: ${localeName} field "${field}" has ${actual.length} entries, English has ${expected.length}`
          );
        }
        actual.forEach((entry, i) => {
          if (typeof entry !== 'string' || entry.trim() === '') {
            fail(`${label}/${slug}: ${localeName} ${field}[${i}] is empty`);
          }
        });
      }

      // 5: no stray Latin inside Arabic copy.
      if (localeName === 'ar') {
        const prose = [
          ...textFields.map((f) => copy[f]),
          ...optionalFields.map((f) => copy[f]),
          ...LIST_FIELDS.flatMap((f) => (Array.isArray(copy[f]) ? copy[f] : [])),
        ].filter((v) => typeof v === 'string');
        for (const str of prose) {
          const latin = findLatin(str);
          if (latin.length > 0) {
            fail(
              `${label}/${slug}: Arabic string contains untranslated Latin text [${latin.join(', ')}] in: ${JSON.stringify(str.slice(0, 90))}`
            );
          }
        }
      }

      // 6: prose must actually be translated (numbers and units excepted).
      if (localeName !== 'en') {
        const allowIdentical = localeName === 'fr' ? FR_IDENTICAL_ALLOWED : AR_IDENTICAL_ALLOWED;
        const proseFields = ['description', ...LIST_FIELDS].filter((f) => Array.isArray(copy[f]) || f === 'description');
        for (const field of proseFields) {
          const values = Array.isArray(copy[field]) ? copy[field] : [copy[field]];
          const expectedValues = Array.isArray(en[field]) ? en[field] : [en[field]];
          values.forEach((value, i) => {
            const enValue = expectedValues[i];
            if (typeof value !== 'string' || typeof enValue !== 'string') return;
            if (
              value.trim() !== '' &&
              value === enValue &&
              !allowIdentical.has(enValue.trim())
            ) {
              fail(
                `${label}/${slug}: ${localeName} "${field}"[${i}] is byte-identical to English — untranslated copy: ${JSON.stringify(value.slice(0, 90))}`
              );
            }
          });
        }
      }
    }
  }
}

const [{ landmarks }, { natureSites }, en, fr, ar] = await Promise.all([
  loadModule(path.join('src', 'data', 'landmarks.ts'), ['landmarks']),
  loadModule(path.join('src', 'data', 'nature.ts'), ['natureSites']),
  loadModule(path.join('src', 'i18n', 'content.en.ts'), ['landmarksEn', 'natureEn']),
  loadModule(path.join('src', 'i18n', 'content.fr.ts'), ['landmarksFr', 'natureFr']),
  loadModule(path.join('src', 'i18n', 'content.ar.ts'), ['landmarksAr', 'natureAr']),
]);

checkRecordSet({
  label: 'landmark',
  dataset: landmarks.reduce((acc, record) => ({ ...acc, [record.slug]: record }), {}),
  locales: {
    en: en.landmarksEn,
    fr: fr.landmarksFr,
    ar: ar.landmarksAr,
  },
  textFields: LANDMARK_TEXT_FIELDS,
  optionalFields: LANDMARK_OPTIONAL_FIELDS,
  listFields: ['facts'],
});

checkRecordSet({
  label: 'nature',
  dataset: natureSites.reduce((acc, record) => ({ ...acc, [record.slug]: record }), {}),
  locales: {
    en: en.natureEn,
    fr: fr.natureFr,
    ar: ar.natureAr,
  },
  textFields: NATURE_TEXT_FIELDS,
  optionalFields: NATURE_OPTIONAL_FIELDS,
  listFields: ['facts', 'wildlife', 'activities'],
});

if (errors.length > 0) {
  console.error(`check-content: ${errors.length} problem(s) found\n`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}

console.log(
  `check-content: OK — ${Object.keys(landmarks).length} landmarks and ${Object.keys(natureSites).length} nature sites localized in en/fr/ar`
);
