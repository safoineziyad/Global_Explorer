import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import en from './en'
import fr from './fr'
import ar from './ar'

export type Locale = 'en' | 'fr' | 'ar'
export type Direction = 'ltr' | 'rtl'

export type TranslationValue = string | { [key: string]: TranslationValue }
export type Dictionary = { [key: string]: TranslationValue }
export type TranslationParams = Record<string, string | number>
export type Translate = (key: string, params?: TranslationParams) => string

export const LOCALES: Locale[] = ['en', 'fr', 'ar']
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
}
export const RTL_LOCALES: Locale[] = ['ar']
export const LOCALE_STORAGE_KEY = 'global-explorer:locale'

const DICTIONARIES: Record<Locale, Dictionary> = {
  en: en as unknown as Dictionary,
  fr: fr as unknown as Dictionary,
  ar: ar as unknown as Dictionary,
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value)
}

export function dirFor(locale: Locale): Direction {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr'
}

/** Resolve the initial locale from storage, then the browser, falling back to English. */
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Storage may be unavailable (private mode); ignore.
  }
  const candidates = [
    typeof navigator !== 'undefined' ? navigator.language : '',
    ...(typeof navigator !== 'undefined' && navigator.languages ? navigator.languages : []),
  ]
  for (const candidate of candidates) {
    if (!candidate) continue
    const base = candidate.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return 'en'
}

function lookup(dictionary: Dictionary, key: string): string | undefined {
  const parts = key.split('.')
  let node: TranslationValue | undefined = dictionary
  for (const part of parts) {
    if (!node || typeof node !== 'object' || !(part in node)) return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

/** Translate a dotted key, falling back to English and finally the raw key. */
export function translate(locale: Locale, key: string, params?: TranslationParams): string {
  const value = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES.en, key) ?? key
  return interpolate(value, params)
}

export type I18nContextValue = {
  locale: Locale
  dir: Direction
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: Translate
}

const I18nContext = createContext<I18nContextValue | null>(null)

export type I18nProviderProps = {
  children?: ReactNode
  initialLocale?: Locale
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? detectLocale())

  // Keep <html> in sync with the active locale so RTL languages render correctly.
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale
    document.documentElement.dir = dirFor(locale)
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      // Persistence is best effort.
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    if (isLocale(next)) setLocaleState(next)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => {
      const index = LOCALES.indexOf(current)
      return LOCALES[(index + 1) % LOCALES.length]
    })
  }, [])

  const t = useCallback<Translate>(
    (key, params) => translate(locale, key, params),
    [locale]
  )

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir: dirFor(locale), setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t]
  )

  return createElement(I18nContext.Provider, { value }, children)
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

/** Primary hook for components: returns the `t(key, params?)` function. */
export function useT(): Translate {
  return useI18n().t
}

export function useLocale(): Locale {
  return useI18n().locale
}

export function useDirection(): Direction {
  return useI18n().dir
}

export default I18nContext
