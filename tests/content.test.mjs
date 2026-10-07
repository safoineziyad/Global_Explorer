import { after, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

/**
 * Durable regression net for the localized curated copy in
 * src/i18n/content.{en,fr,ar}.ts.
 *
 * scripts/check-content.mjs is the build-time gate; this suite is the fast
 * equivalent that `npm test` runs on every change. It loads the TypeScript
 * modules with the repo's own esbuild — the same technique check-content.mjs
 * uses — so it stays dependency-free, offline and deterministic (no network,
 * no filesystem writes outside the OS temp dir).
 *
 * What is asserted, and why:
 *   1. slug parity between src/data/* and each locale, in both directions
 *   2. required fields present and non-empty in every locale
 *   3. list lengths identical to English, entry by entry
 *   4. no empty / whitespace-only array entries
 *   5. optional fields (height/bestTime, area/established) consistent everywhere
 *   6. prose actually translated; Arabic free of embedded Latin words
 *   7. Arabic strings really are Arabic script (RTL sanity)
 *   8. coverage totals, so a silently deleted record fails the suite
 *   9. resolveContentKey() — the lookup behind the `content.landmark.<slug>.<field>`
 *      and `content.nature.<slug>.<field>` keys used by src/i18n/features.ts —
 *      agrees with the locale dictionaries
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['en', 'fr', 'ar']

const LANDMARK_REQUIRED = ['name', 'type', 'built', 'period', 'description']
const LANDMARK_OPTIONAL = ['height', 'bestTime']
const LANDMARK_LISTS = ['facts']
const NATURE_REQUIRED = ['name', 'type', 'description', 'climate', 'bestTime']
const NATURE_OPTIONAL = ['area', 'established']
const NATURE_LISTS = ['facts', 'wildlife', 'activities']

/**
 * Arabic script sanity (RTL): an Arabic string must contain a real Arabic
 * letter, somewhere in U+0600–U+06FF. The block also holds punctuation,
 * diacritics and Arabic-Indic digits, so those code-point ranges are excluded —
 * otherwise a digits-only string such as "٢٠٢٠" would pass as Arabic script.
 */
const ARABIC_BLOCK = [0x0600, 0x06ff]
const ARABIC_NON_LETTER_RANGES = [
  [0x0600, 0x061f], // signs and punctuation
  [0x064b, 0x065f], // diacritics
  [0x0660, 0x0669], // Arabic-Indic digits
  [0x0670, 0x0670], // superscript alef
  [0x06d6, 0x06ed], // Quranic annotation marks
  [0x06f0, 0x06f9], // extended Arabic-Indic digits
]

/** True when the string contains at least one actual Arabic letter. */
function hasArabicLetter(value) {
  return [...value].some((char) => {
    const code = char.codePointAt(0)
    if (code < ARABIC_BLOCK[0] || code > ARABIC_BLOCK[1]) return false
    return !ARABIC_NON_LETTER_RANGES.some(([from, to]) => code >= from && code <= to)
  })
}

/**
 * Words that are spelled identically in English and French on purpose: either
 * international proper names French keeps as-is (Jaguar, Bison, Capybara…) or
 * loanwords French does not translate (Camping, Trekking). Kept local to this
 * file, and mirrored from scripts/check-content.mjs, so any *other* copy-pasted
 * English string still fails — a genuinely untranslated sentence is never one of
 * these single terms.
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
])

const tempDirs = []

/** Transpile a TS module with esbuild and import it, as scripts/check-content.mjs does. */
async function loadModule(relativePath, exportNames) {
  const file = path.join(root, relativePath)
  assert.ok(fs.existsSync(file), `missing source file: ${relativePath}`)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gce-content-test-'))
  tempDirs.push(dir)
  const outfile = path.join(dir, 'out.mjs')
  await build({
    entryPoints: [file],
    outfile,
    bundle: true,
    format: 'esm',
    // `node` (not `neutral`) so React, pulled in by src/i18n/content.ts, keeps
    // working through its CJS entry point after bundling.
    platform: 'node',
    logLevel: 'error',
  })
  const mod = await import(pathToFileURL(outfile).href)
  const picked = {}
  for (const name of exportNames) {
    assert.ok(name in mod, `${relativePath} does not export "${name}"`)
    picked[name] = mod[name]
  }
  return picked
}

after(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

const [dataMod, natureMod, enMod, frMod, arMod, contentMod] = await Promise.all([
  loadModule(path.join('src', 'data', 'landmarks.ts'), ['landmarks']),
  loadModule(path.join('src', 'data', 'nature.ts'), ['natureSites']),
  loadModule(path.join('src', 'i18n', 'content.en.ts'), ['landmarksEn', 'natureEn']),
  loadModule(path.join('src', 'i18n', 'content.fr.ts'), ['landmarksFr', 'natureFr']),
  loadModule(path.join('src', 'i18n', 'content.ar.ts'), ['landmarksAr', 'natureAr']),
  loadModule(path.join('src', 'i18n', 'content.ts'), [
    'landmarkCopy',
    'natureCopy',
    'resolveContentKey',
    'LOCALIZED_LANDMARK_SLUGS',
    'LOCALIZED_NATURE_SLUGS',
  ]),
])

const { landmarks } = dataMod
const { natureSites } = natureMod
const { landmarkCopy, natureCopy, resolveContentKey } = contentMod

/** One entry per dataset kind, wiring slugs, dictionaries and field contracts together. */
const DATASETS = {
  landmark: {
    kind: 'landmark',
    records: landmarks,
    slugs: landmarks.map((record) => record.slug),
    locales: { en: enMod.landmarksEn, fr: frMod.landmarksFr, ar: arMod.landmarksAr },
    required: LANDMARK_REQUIRED,
    optional: LANDMARK_OPTIONAL,
    lists: LANDMARK_LISTS,
  },
  nature: {
    kind: 'nature',
    records: natureSites,
    slugs: natureSites.map((record) => record.slug),
    locales: { en: enMod.natureEn, fr: frMod.natureFr, ar: arMod.natureAr },
    required: NATURE_REQUIRED,
    optional: NATURE_OPTIONAL,
    lists: NATURE_LISTS,
  },
}

/** Flatten a copy record to [fieldPath, string] pairs, including list entries. */
function* stringsOf(record) {
  for (const [field, value] of Object.entries(record)) {
    if (typeof value === 'string') {
      yield [field, value]
      continue
    }
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (typeof value[index] === 'string') yield [`${field}[${index}]`, value[index]]
      }
    }
  }
}

/** Every string of a copy record as one array of [fieldPath, string] pairs. */
const allStrings = (record) => [...stringsOf(record)]

/** Runs of two or more consecutive ASCII letters — an untranslated Latin word. */
function latinRuns(str) {
  return str.match(/[A-Za-z]{2,}/g) ?? []
}

describe('content coverage', () => {
  test('datasets hold exactly 18 landmarks and 16 nature sites, with unique slugs', () => {
    assert.equal(landmarks.length, 18, 'landmark count changed')
    assert.equal(natureSites.length, 16, 'nature site count changed')
    for (const { kind, records } of Object.values(DATASETS)) {
      const slugs = records.map((record) => record.slug)
      assert.equal(new Set(slugs).size, slugs.length, `${kind} slugs are not unique`)
      for (const slug of slugs) {
        assert.equal(typeof slug, 'string')
        assert.ok(slug.trim() !== '', `${kind} has a blank slug`)
      }
    }
  })

  test('each locale dictionary has one entry per dataset record', () => {
    for (const dataset of Object.values(DATASETS)) {
      for (const [locale, dict] of Object.entries(dataset.locales)) {
        assert.equal(
          Object.keys(dict).length,
          dataset.slugs.length,
          `${dataset.kind}/${locale} has ${Object.keys(dict).length} records, dataset has ${dataset.slugs.length}`
        )
      }
    }
  })

  test('LOCALIZED_*_SLUGS match the dataset slugs (used for routes and the sitemap)', () => {
    assert.deepEqual(contentMod.LOCALIZED_LANDMARK_SLUGS, [...DATASETS.landmark.slugs].sort())
    assert.deepEqual(contentMod.LOCALIZED_NATURE_SLUGS, [...DATASETS.nature.slugs].sort())
  })
})

describe('slug parity: landmarks', () => {
  const dataset = DATASETS.landmark

  test('every dataset slug has copy in en, fr and ar', () => {
    const missing = []
    for (const [locale, dict] of Object.entries(dataset.locales)) {
      for (const slug of dataset.slugs) {
        if (!dict[slug]) missing.push(`${locale} is missing copy for "${slug}"`)
      }
    }
    assert.deepEqual(missing, [])
    assert.equal(dataset.slugs.length, 18)
  })

  test('no locale carries a slug that is not in the dataset', () => {
    const known = new Set(dataset.slugs)
    const extras = []
    for (const [locale, dict] of Object.entries(dataset.locales)) {
      for (const slug of Object.keys(dict)) {
        if (!known.has(slug)) extras.push(`${locale} has copy for "${slug}", which is not in the dataset`)
      }
    }
    assert.deepEqual(extras, [])
  })
})

describe('slug parity: nature', () => {
  const dataset = DATASETS.nature

  test('every dataset slug has copy in en, fr and ar', () => {
    const missing = []
    for (const [locale, dict] of Object.entries(dataset.locales)) {
      for (const slug of dataset.slugs) {
        if (!dict[slug]) missing.push(`${locale} is missing copy for "${slug}"`)
      }
    }
    assert.deepEqual(missing, [])
    assert.equal(dataset.slugs.length, 16)
  })

  test('no locale carries a slug that is not in the dataset', () => {
    const known = new Set(dataset.slugs)
    const extras = []
    for (const [locale, dict] of Object.entries(dataset.locales)) {
      for (const slug of Object.keys(dict)) {
        if (!known.has(slug)) extras.push(`${locale} has copy for "${slug}", which is not in the dataset`)
      }
    }
    assert.deepEqual(extras, [])
  })
})

describe('required fields', () => {
  for (const dataset of Object.values(DATASETS)) {
    test(`${dataset.kind}: ${dataset.required.join(', ')} are non-empty strings in every locale`, () => {
      const problems = []
      let checked = 0
      for (const [locale, dict] of Object.entries(dataset.locales)) {
        for (const slug of dataset.slugs) {
          const copy = dict[slug]
          if (!copy) continue
          for (const field of dataset.required) {
            checked++
            const value = copy[field]
            if (typeof value !== 'string') {
              problems.push(`${slug}/${locale}.${field} is ${value === undefined ? 'missing' : typeof value}`)
            } else if (value.trim() === '') {
              problems.push(`${slug}/${locale}.${field} is empty or whitespace-only`)
            }
          }
        }
      }
      assert.deepEqual(problems, [])
      assert.ok(checked > 0, 'no records were checked')
    })
  }

  test('every list field is a non-empty array in every locale', () => {
    const problems = []
    let total = 0
    for (const dataset of Object.values(DATASETS)) {
      for (const [locale, dict] of Object.entries(dataset.locales)) {
        for (const slug of dataset.slugs) {
          for (const field of dataset.lists) {
            const entries = dict[slug]?.[field]
            if (!Array.isArray(entries)) {
              problems.push(`${dataset.kind}/${slug}/${locale} ${field} is not an array`)
              continue
            }
            if (entries.length === 0) {
              problems.push(`${dataset.kind}/${slug}/${locale} ${field} is empty`)
            }
            total += entries.length
          }
        }
      }
    }
    assert.deepEqual(problems, [])
    assert.ok(total > 0, 'no list fields were checked')
  })
})

describe('list parity with English', () => {
  for (const dataset of Object.values(DATASETS)) {
    test(`${dataset.kind}: ${dataset.lists.join(', ')} keep the English length in fr and ar, entry by entry`, () => {
      const problems = []
      let compared = 0
      for (const locale of ['fr', 'ar']) {
        for (const slug of dataset.slugs) {
          const en = dataset.locales.en[slug]
          const copy = dataset.locales[locale][slug]
          if (!en || !copy) continue
          for (const field of dataset.lists) {
            const expected = en[field]
            const actual = copy[field]
            if (!Array.isArray(actual)) {
              problems.push(`${slug}/${locale}.${field} is not an array`)
              continue
            }
            if (actual.length !== expected.length) {
              problems.push(`${slug}/${locale}.${field} has ${actual.length} entries, English has ${expected.length}`)
              continue
            }
            expected.forEach((entry, index) => {
              compared++
              if (typeof actual[index] !== 'string') {
                problems.push(`${slug}/${locale}.${field}[${index}] is ${typeof actual[index]}`)
              }
            })
          }
        }
      }
      assert.deepEqual(problems, [])
      assert.ok(compared > 0, 'no list entries were compared')
    })
  }
})

describe('no empty entries', () => {
  test('no locale has an empty or whitespace-only array entry', () => {
    const problems = []
    let checked = 0
    for (const dataset of Object.values(DATASETS)) {
      for (const [locale, dict] of Object.entries(dataset.locales)) {
        for (const slug of dataset.slugs) {
          for (const field of dataset.lists) {
            const entries = dict[slug]?.[field]
            if (!Array.isArray(entries)) continue
            entries.forEach((entry, index) => {
              checked++
              if (typeof entry !== 'string') {
                problems.push(`${dataset.kind}/${slug}/${locale} ${field}[${index}] is ${typeof entry}`)
              } else if (entry.trim() === '') {
                problems.push(`${dataset.kind}/${slug}/${locale} ${field}[${index}] is empty or whitespace-only`)
              }
            })
          }
        }
      }
    }
    assert.deepEqual(problems, [])
    assert.ok(checked > 0, 'no list entries were checked')
  })
})

describe('optional fields', () => {
  for (const dataset of Object.values(DATASETS)) {
    test(`${dataset.kind}: ${dataset.optional.join(', ')} exist in fr and ar exactly when English has them`, () => {
      const problems = []
      let present = 0
      for (const slug of dataset.slugs) {
        const en = dataset.locales.en[slug]
        if (!en) continue
        for (const locale of ['fr', 'ar']) {
          const copy = dataset.locales[locale][slug]
          if (!copy) continue
          for (const field of dataset.optional) {
            const inEn = typeof en[field] === 'string'
            const inLocale = typeof copy[field] === 'string'
            if (inEn && !inLocale) {
              problems.push(`${slug}/${locale} is missing optional field "${field}" that English has`)
            }
            if (!inEn && inLocale) {
              problems.push(`${slug}/${locale} invented optional field "${field}" that English does not have`)
            }
            if (inLocale) {
              present++
              if (copy[field].trim() === '') problems.push(`${slug}/${locale}.${field} is empty`)
            }
          }
        }
      }
      assert.deepEqual(problems, [])
      assert.ok(present > 0, 'no optional fields were checked')
    })
  }

  test('records contain exactly the known fields — no invented or misspelled keys', () => {
    const problems = []
    for (const dataset of Object.values(DATASETS)) {
      const allowed = new Set([...dataset.required, ...dataset.optional, ...dataset.lists])
      for (const [locale, dict] of Object.entries(dataset.locales)) {
        for (const [slug, copy] of Object.entries(dict)) {
          for (const field of Object.keys(copy)) {
            if (!allowed.has(field)) {
              problems.push(`${dataset.kind}/${slug}/${locale} has unexpected field "${field}"`)
            }
          }
          for (const field of dataset.required) {
            if (!(field in copy)) problems.push(`${dataset.kind}/${slug}/${locale} lacks field "${field}"`)
          }
          for (const field of dataset.lists) {
            if (!(field in copy)) problems.push(`${dataset.kind}/${slug}/${locale} lacks field "${field}"`)
          }
        }
      }
    }
    assert.deepEqual(problems, [])
  })
})

describe('translation', () => {
  test('french descriptions are never byte-identical to English', () => {
    const identical = []
    for (const dataset of Object.values(DATASETS)) {
      for (const slug of dataset.slugs) {
        const en = dataset.locales.en[slug]?.description
        const fr = dataset.locales.fr[slug]?.description
        if (typeof en === 'string' && en === fr) identical.push(`${dataset.kind}/${slug}`)
      }
    }
    assert.deepEqual(identical, [])
  })

  test('arabic descriptions are never byte-identical to English', () => {
    const identical = []
    for (const dataset of Object.values(DATASETS)) {
      for (const slug of dataset.slugs) {
        const en = dataset.locales.en[slug]?.description
        const ar = dataset.locales.ar[slug]?.description
        if (typeof en === 'string' && en === ar) identical.push(`${dataset.kind}/${slug}`)
      }
    }
    assert.deepEqual(identical, [])
  })

  test('french list entries are translated apart from documented international terms', () => {
    const identical = []
    for (const dataset of Object.values(DATASETS)) {
      for (const slug of dataset.slugs) {
        const en = dataset.locales.en[slug]
        const fr = dataset.locales.fr[slug]
        if (!en || !fr) continue
        for (const field of dataset.lists) {
          const enEntries = Array.isArray(en[field]) ? en[field] : []
          enEntries.forEach((entry, index) => {
            const value = fr[field]?.[index]
            if (value === entry && !FR_IDENTICAL_ALLOWED.has(String(entry).trim())) {
              identical.push(`${dataset.kind}/${slug} fr.${field}[${index}] = ${JSON.stringify(entry)}`)
            }
          })
        }
      }
    }
    assert.deepEqual(identical, [])
  })

  test('arabic prose contains no embedded latin words', () => {
    // Corruption guard: a partially translated string (or a transliterated name
    // pasted in) shows up as a run of ASCII letters inside Arabic prose. Unlike
    // scripts/check-content.mjs this test allows no romanised exceptions, so
    // Arabic copy must stay fully in script.
    const problems = []
    let checked = 0
    for (const dataset of Object.values(DATASETS)) {
      for (const [slug, copy] of Object.entries(dataset.locales.ar)) {
        for (const [field, value] of allStrings(copy)) {
          checked++
          const runs = latinRuns(value)
          if (runs.length > 0) {
            problems.push(`${dataset.kind}/${slug} ar.${field} contains ${JSON.stringify(runs)}`)
          }
        }
      }
    }
    assert.deepEqual(problems, [])
    assert.ok(checked > 0, 'no Arabic strings were checked')
  })
})

describe('RTL sanity', () => {
  test('every non-empty Arabic string contains at least one Arabic letter (U+0600–U+06FF)', () => {
    const problems = []
    let checked = 0
    for (const dataset of Object.values(DATASETS)) {
      for (const [slug, copy] of Object.entries(dataset.locales.ar)) {
        for (const [field, value] of allStrings(copy)) {
          if (value.trim() === '') continue
          checked++
          if (!hasArabicLetter(value)) {
            problems.push(`${dataset.kind}/${slug} ar.${field} has no Arabic letter: ${JSON.stringify(value)}`)
          }
        }
      }
    }
    assert.deepEqual(problems, [])
    assert.ok(checked > 0, 'no Arabic strings were checked')
  })
})

describe('resolveContentKey (the content.* key convention used by src/i18n/features.ts)', () => {
  /** Only plain string fields resolve; list fields are covered separately below. */
  function* stringFieldsOf(record) {
    for (const [field, value] of Object.entries(record)) {
      if (typeof value === 'string') yield [field, value]
    }
  }

  for (const dataset of Object.values(DATASETS)) {
    test(`${dataset.kind}: every string field resolves to the exact locale dictionary value`, () => {
      const problems = []
      let resolved = 0
      for (const locale of LOCALES) {
        for (const slug of dataset.slugs) {
          const copy = dataset.locales[locale][slug]
          if (!copy) continue
          for (const [field, value] of stringFieldsOf(copy)) {
            const key = `content.${dataset.kind}.${slug}.${field}`
            const actual = resolveContentKey(locale, key)
            if (actual !== value) {
              problems.push(`${key} -> ${JSON.stringify(actual)}, expected ${JSON.stringify(value)}`)
            } else {
              resolved++
            }
          }
        }
      }
      assert.deepEqual(problems, [])
      assert.ok(resolved > 0, 'no keys were resolved')
    })
  }

  test('name and description — the keys the app builds — resolve for every record', () => {
    for (const dataset of Object.values(DATASETS)) {
      for (const locale of LOCALES) {
        for (const slug of dataset.slugs) {
          const copy = dataset.locales[locale][slug]
          const nameKey = `content.${dataset.kind}.${slug}.name`
          const descriptionKey = `content.${dataset.kind}.${slug}.description`
          assert.equal(resolveContentKey(locale, nameKey), copy.name, nameKey)
          assert.equal(resolveContentKey(locale, descriptionKey), copy.description, descriptionKey)
        }
      }
    }
  })

  test('list fields and absent optional fields do not resolve', () => {
    for (const dataset of Object.values(DATASETS)) {
      for (const locale of LOCALES) {
        for (const slug of dataset.slugs) {
          const copy = dataset.locales[locale][slug]
          for (const field of dataset.lists) {
            assert.equal(
              resolveContentKey(locale, `content.${dataset.kind}.${slug}.${field}`),
              undefined,
              `list field ${field} of ${slug} should not resolve to a string`
            )
          }
          for (const field of dataset.optional) {
            if (typeof copy[field] !== 'string') {
              assert.equal(
                resolveContentKey(locale, `content.${dataset.kind}.${slug}.${field}`),
                undefined,
                `absent optional field ${field} of ${slug} should not resolve`
              )
            }
          }
        }
      }
    }
  })

  test('unknown slugs, unknown kinds and malformed keys return undefined', () => {
    const badKeys = [
      'content.landmark.not-a-slug.name',
      'content.nature.not-a-slug.description',
      'content.unknownkind.amazon.name',
      'content.landmark.amazon',
      'content.nature.amazon',
      'site.home',
      '',
    ]
    for (const locale of LOCALES) {
      for (const key of badKeys) {
        assert.equal(resolveContentKey(locale, key), undefined, `${key} (${locale}) should not resolve`)
      }
    }
    // Sanity: the same shape with a real slug does resolve.
    assert.equal(
      resolveContentKey('fr', 'content.landmark.everest.name'),
      DATASETS.landmark.locales.fr.everest.name
    )
  })

  test('landmarkCopy() and natureCopy() expose the same copy as the dictionaries', () => {
    for (const locale of LOCALES) {
      for (const slug of DATASETS.landmark.slugs) {
        assert.deepEqual(landmarkCopy(locale, slug), DATASETS.landmark.locales[locale][slug], `${slug}/${locale}`)
      }
      for (const slug of DATASETS.nature.slugs) {
        assert.deepEqual(natureCopy(locale, slug), DATASETS.nature.locales[locale][slug], `${slug}/${locale}`)
      }
      assert.equal(landmarkCopy(locale, 'not-a-slug'), undefined)
      assert.equal(landmarkCopy(locale, undefined), undefined)
      assert.equal(natureCopy(locale, 'not-a-slug'), undefined)
      assert.equal(natureCopy(locale, undefined), undefined)
    }
  })
})