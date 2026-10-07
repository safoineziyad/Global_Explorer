/**
 * Guard against i18n keys being resolved against the wrong dictionary.
 *
 * The app has two independent translation bundles:
 *   - `src/i18n/{en,fr,ar}.ts`  reached via `useT()`   (usually named `t`)
 *   - `src/i18n/features.ts`    reached via `useFeaturesT()` (`featureT`)
 *
 * A missing key does not throw and does not render blank: the translator
 * returns the key string itself, so the UI quietly shows "site.nature" to the
 * user. `check-i18n.mjs` cannot catch this because both bundles are internally
 * consistent — it never checks that a page resolves a key against the bundle
 * that defines it.
 *
 * This test scans the source for key literals passed to each translator and
 * asserts each one exists in the bundle that translator reads.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const SRC = path.join(root, 'src');

/** Recursively collect source files. */
function collect(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** All keys defined by a dictionary module, read straight from its source. */
function keysOf(relativePath) {
  const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const keys = new Set();
  for (const m of text.matchAll(/^\s*'([a-zA-Z][\w.]*)':/gm)) keys.add(m[1]);
  return keys;
}

/** Flatten the nested `en.ts` object literal into dotted key paths. */
function flatten(object, prefix = '', out = new Set()) {
  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, path, out);
    else out.add(path);
  }
  return out;
}

// `en.ts` is pure nested data with no imports, so it can be loaded directly
// rather than pattern-matched. Reading the real object is what makes this test
// trustworthy: a regex over the source would silently miss keys and pass.
const { default: enDictionary } = await import('../src/i18n/en.ts');

const MAIN_KEYS = flatten(enDictionary);
const FEATURE_KEYS = keysOf(path.join('src', 'i18n', 'features.ts'));

/**
 * `content.*` keys are resolved dynamically by `featureTranslate` via
 * `resolveContentKey`, from the curated content dictionaries rather than a
 * static table, so they cannot be validated against `features.ts`.
 */
const isDynamic = (key) => key.startsWith('content.');

const files = collect(SRC);
const filesWithTsx = files.filter((f) => f.endsWith('.tsx'));

test('the two i18n bundles are non-empty and disjoint where it matters', () => {
  assert.ok(MAIN_KEYS.size > 100, `main bundle looks wrong: ${MAIN_KEYS.size} keys`);
  assert.ok(FEATURE_KEYS.size > 100, `feature bundle looks wrong: ${FEATURE_KEYS.size} keys`);
  // Sanity: the two bundles must not be the same dictionary, or this test
  // would be checking nothing.
  assert.notDeepEqual(
    [...MAIN_KEYS].sort(),
    [...FEATURE_KEYS].sort(),
    'the bundles appear to be identical',
  );
});

test('featureT(...) is only ever called with keys the feature bundle defines', () => {
  const missing = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\bfeatureT\(\s*'([\w.]+)'/g)) {
      const key = m[1];
      if (isDynamic(key)) continue;
      if (!FEATURE_KEYS.has(key)) {
        missing.push(`${path.relative(root, file)}: featureT('${key}')`);
      }
    }
  }
  assert.deepEqual(missing, [], 'featureT() called with keys absent from src/i18n/features.ts');
});

test('useFeaturesT() destructured as t() is only called with feature-bundle keys', () => {
  // Matches `const t = useFeaturesT()` and then `t('some.key')`.
  const missing = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const names = new Set();
    for (const m of text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*useFeaturesT\s*\(/g)) names.add(m[1]);
    if (names.size === 0) continue;
    const pattern = new RegExp(`\\b(${[...names].join('|')})\\(\\s*'([\\w.]+)'`, 'g');
    for (const m of text.matchAll(pattern)) {
      const key = m[2];
      if (isDynamic(key)) continue;
      if (!FEATURE_KEYS.has(key)) {
        missing.push(`${path.relative(root, file)}: ${m[1]}('${key}')`);
      }
    }
  }
  assert.deepEqual(
    missing,
    [],
    'a variable bound to useFeaturesT() is called with a key the feature bundle lacks',
  );
});

test('useT() destructured as t() is only called with main-bundle keys', () => {
  // This is the check that catches the real-world regression: a page that
  // reaches for `site.nature` (a *feature* key) through the *main* translator,
  // which silently renders the literal string "site.nature" to the user.
  const missing = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const names = new Set();
    for (const m of text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*useT\s*\(/g)) names.add(m[1]);
    if (names.size === 0) continue;
    const pattern = new RegExp(`\\b(${[...names].join('|')})\\(\\s*'([\\w.]+)'`, 'g');
    for (const m of text.matchAll(pattern)) {
      const key = m[2];
      if (!MAIN_KEYS.has(key)) {
        missing.push(`${path.relative(root, file)}: ${m[1]}('${key}')`);
      }
    }
  }
  assert.deepEqual(missing, [], 'the main translator was asked for keys it does not define');
});

test('the scanner actually inspected the component tree', () => {
  // Guards against this file silently passing because a regex stopped matching.
  assert.ok(filesWithTsx.length >= 20, `expected many components, found ${filesWithTsx.length}`);
  const sample = fs.readFileSync(path.join(root, 'src', 'pages', 'Nature.tsx'), 'utf8');
  assert.ok(sample.includes('useT()'), 'expected Nature.tsx to use the main translator');
  assert.ok(sample.includes('useFeaturesT()'), 'expected Nature.tsx to use the feature translator');
});
