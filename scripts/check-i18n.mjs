#!/usr/bin/env node
/**
 * check-i18n.mjs
 *
 * Verifies that the English, French and Arabic locale files expose exactly
 * the same set of translation keys, and that each file has 220 keys.
 * Exits non-zero on the first mismatch.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const EXPECTED_COUNT = 220;
const LOCALES = ['en', 'fr', 'ar'];

// Directories that might contain locale files, plus file name patterns.
const LOCALE_DIRS = [
  path.join(rootDir, 'src', 'i18n'),
  path.join(rootDir, 'src', 'locales'),
  path.join(rootDir, 'src', 'i18n', 'locales'),
  path.join(rootDir, 'src', 'translations'),
  path.join(rootDir, 'locales'),
  path.join(rootDir, 'public', 'locales'),
];

function candidateNames(locale) {
  return [
    // Prefer the TypeScript modules the app actually imports.
    `${locale}.ts`,
    `${locale}.js`,
    `${locale}.json`,
    `${locale}.translation.json`,
    path.join(locale, 'common.json'),
    path.join(locale, 'translation.json'),
    path.join(locale, 'index.json'),
  ];
}

function findLocaleFiles() {
  const found = {};
  for (const dir of LOCALE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const locale of LOCALES) {
      if (found[locale]) continue;
      for (const name of candidateNames(locale)) {
        const file = path.join(dir, name);
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
          found[locale] = file;
          break;
        }
      }
    }
  }
  return found;
}

function flattenKeys(value, prefix = '', out = []) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) out.push(prefix);
    return out;
  }
  for (const key of Object.keys(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    flattenKeys(value[key], next, out);
  }
  return out;
}

/**
 * Extract the first top-level object literal from a TS/JS module and
 * evaluate it. The locale modules are plain data (`const en = { ... }`),
 * so this works without a TypeScript dependency.
 */
function extractObjectLiteral(raw, file) {
  const eq = raw.indexOf('=');
  const start = raw.indexOf('{', eq === -1 ? 0 : eq);
  if (start === -1) throw new Error(`no object literal found in ${file}`);

  let depth = 0;
  let i = start;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        inString = false;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      quote = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
  }

  if (depth !== 0) throw new Error(`unbalanced braces in ${file}`);
  const literal = raw.slice(start, i + 1);
  // eslint-disable-next-line no-new-func
  return new Function('"use strict"; return (' + literal + ');')();
}

function readKeys(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const ext = path.extname(file).toLowerCase();
  const data =
    ext === '.json'
      ? JSON.parse(raw)
      : extractObjectLiteral(raw, file);
  return flattenKeys(data).sort();
}

function main() {
  const files = findLocaleFiles();

  const missing = LOCALES.filter((l) => !files[l]);
  if (missing.length > 0) {
    console.error(`i18n check failed: missing locale file(s) for: ${missing.join(', ')}`);
    console.error('Searched:\n  ' + LOCALE_DIRS.map((d) => path.relative(rootDir, d)).join('\n  '));
    process.exit(1);
  }

  const keysByLocale = {};
  for (const locale of LOCALES) {
    try {
      keysByLocale[locale] = readKeys(files[locale]);
    } catch (err) {
      console.error(`i18n check failed: could not parse ${files[locale]}: ${err.message}`);
      process.exit(1);
    }
  }

  // Count check.
  let failed = false;
  for (const locale of LOCALES) {
    const count = keysByLocale[locale].length;
    if (count !== EXPECTED_COUNT) {
      console.error(`i18n check failed: ${locale} has ${count} keys, expected ${EXPECTED_COUNT}`);
      failed = true;
    }
  }

  // Key-set equality check against English (and transitively all locales).
  const reference = 'en';
  const refSet = new Set(keysByLocale[reference]);
  for (const locale of LOCALES) {
    if (locale === reference) continue;
    const set = new Set(keysByLocale[locale]);
    const missingKeys = [...refSet].filter((k) => !set.has(k));
    const extraKeys = [...set].filter((k) => !refSet.has(k));
    if (missingKeys.length > 0) {
      failed = true;
      console.error(`${locale} is missing ${missingKeys.length} key(s) present in ${reference}:`);
      for (const k of missingKeys.slice(0, 25)) console.error(`  - ${k}`);
      if (missingKeys.length > 25) console.error(`  ... and ${missingKeys.length - 25} more`);
    }
    if (extraKeys.length > 0) {
      failed = true;
      console.error(`${locale} has ${extraKeys.length} key(s) not present in ${reference}:`);
      for (const k of extraKeys.slice(0, 25)) console.error(`  + ${k}`);
      if (extraKeys.length > 25) console.error(`  ... and ${extraKeys.length - 25} more`);
    }
  }

  if (failed) process.exit(1);

  console.log(
    `i18n check passed: ${LOCALES.join(', ')} each have identical key sets (${EXPECTED_COUNT} keys)`
  );
  console.log(
    '  ' +
      LOCALES.map((l) => `${l}: ${path.relative(rootDir, files[l])}`).join('\n  ')
  );
}

main();
