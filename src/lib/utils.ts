/** Join truthy class names. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Format a number with thousands separators, returning an em dash for nullish input. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(undefined).format(value)
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatArea(km2: number | null | undefined): string {
  if (km2 === null || km2 === undefined || !Number.isFinite(km2) || km2 <= 0) return '—'
  return `${formatNumber(Math.round(km2))} km²`
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Small stable hash — useful for deterministic colours. */
export function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** Shared country feature flags lookup (minimal). */
export function hasFlagEmoji(cca2: string | undefined): boolean {
  return typeof cca2 === 'string' && /^[A-Za-z]{2}$/.test(cca2)
}

/** Convert a 2-letter country code to its flag emoji. */
export function flagEmoji(cca2: string | undefined): string {
  if (!hasFlagEmoji(cca2)) return '🏳️'
  const code = cca2!.toUpperCase()
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}

/** Format an array of values as a readable list. */
export function formatList(values: string[] | null | undefined): string {
  if (!values || values.length === 0) return '—'
  if (values.length === 1) return values[0]
  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`
}
