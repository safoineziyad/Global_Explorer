// Localized access to curated landmark and nature copy.
//
// The English reference text lives in src/data/{landmarks,nature}.ts. The
// per-locale prose lives in content.{en,fr,ar}.ts, which scripts/check-content.mjs
// keeps in lockstep with the data. This module joins the two.
//
// There is deliberately no English-fallback-to-data path in the UI: if a locale
// is missing copy, that is a build failure (check-content), not something to
// paper over at runtime.

import { useMemo } from 'react'
import { useI18n, type Locale } from './index'
import { landmarksEn, natureEn, type LandmarkCopy, type NatureCopy } from './content.en'
import { landmarksFr } from './content.fr'
import { natureFr } from './content.fr'
import { landmarksAr } from './content.ar'
import { natureAr } from './content.ar'

const LANDMARK_COPY: Record<Locale, Record<string, LandmarkCopy>> = {
  en: landmarksEn,
  fr: landmarksFr,
  ar: landmarksAr,
}

const NATURE_COPY: Record<Locale, Record<string, NatureCopy>> = {
  en: natureEn,
  fr: natureFr,
  ar: natureAr,
}

/** Localized landmark copy, or `undefined` if the slug is unknown. */
export function landmarkCopy(locale: Locale, slug: string | undefined): LandmarkCopy | undefined {
  if (!slug) return undefined
  return LANDMARK_COPY[locale]?.[slug]
}

/** Localized nature copy, or `undefined` if the slug is unknown. */
export function natureCopy(locale: Locale, slug: string | undefined): NatureCopy | undefined {
  if (!slug) return undefined
  return NATURE_COPY[locale]?.[slug]
}

export function useLandmarkCopy(slug: string | undefined): LandmarkCopy | undefined {
  const { locale } = useI18n()
  return useMemo(() => landmarkCopy(locale, slug), [locale, slug])
}

export function useNatureCopy(slug: string | undefined): NatureCopy | undefined {
  const { locale } = useI18n()
  return useMemo(() => natureCopy(locale, slug), [locale, slug])
}

/**
 * Resolve a localized string for a `content.*` key produced by
 * data/explorerFeatures.ts (nearby discoveries). Returns `undefined` when the
 * key is not a known content key, so callers can decide how to degrade.
 */
export function useContentKey(): (key: string) => string | undefined {
  const { locale } = useI18n()
  return useMemo(
    () => (key: string) => resolveContentKey(locale, key),
    [locale]
  )
}

/** Non-hook form of `useContentKey`. */
export function resolveContentKey(locale: Locale, key: string): string | undefined {
  const parts = key.split('.')
  if (parts[0] !== 'content' || parts.length < 4) return undefined
  const [, kind, slug, ...rest] = parts
  if (kind === 'landmark') {
    const record = LANDMARK_COPY[locale]?.[slug]
    if (!record) return undefined
    return pickField(record, rest.join('.'))
  }
  if (kind === 'nature') {
    const record = NATURE_COPY[locale]?.[slug]
    if (!record) return undefined
    return pickField(record, rest.join('.'))
  }
  return undefined
}

function pickField(record: Record<string, unknown>, field: string): string | undefined {
  const value = record[field]
  return typeof value === 'string' ? value : undefined
}

/** Slugs that have copy in every locale. Kept for tests and route generation. */
export const LOCALIZED_LANDMARK_SLUGS = Object.keys(landmarksEn).sort()
export const LOCALIZED_NATURE_SLUGS = Object.keys(natureEn).sort()

export type { LandmarkCopy, NatureCopy }
