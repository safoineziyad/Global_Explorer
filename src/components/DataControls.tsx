import { useCallback, useState } from 'react'
import { useT } from '../i18n'

/**
 * Data & privacy controls.
 *
 * Lets a visitor review and erase the small amount of data Global Explorer
 * keeps in the browser (all keys under the `global-explorer:` prefix) and also
 * export a copy. Geolocation is disclosed here as required: coordinates are
 * never written to storage — they live in memory for the current session only.
 *
 * Owned by W4. Mounted inside the Privacy page (anchor `#data-controls`).
 * New strings are requested from W10; English fallbacks keep it readable until
 * then.
 */

const STORAGE_PREFIX = 'global-explorer:'

type Status = 'idle' | 'cleared' | 'copied' | 'copyUnavailable'

function collectStoredKeys(): string[] {
  if (typeof window === 'undefined') return []
  const keys: string[] = []
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key && key.startsWith(STORAGE_PREFIX)) keys.push(key)
    }
  } catch {
    // Storage can be unavailable (private mode / disabled); nothing to list.
  }
  return keys
}

function readStoredData(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  const data: Record<string, unknown> = {}
  for (const key of collectStoredKeys()) {
    const raw = window.localStorage.getItem(key)
    try {
      data[key] = raw === null ? null : JSON.parse(raw)
    } catch {
      data[key] = raw
    }
  }
  return data
}

function clearStoredData(): void {
  if (typeof window === 'undefined') return
  for (const key of collectStoredKeys()) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Best effort.
    }
  }
}

export default function DataControls({ id = 'data-controls' }: { id?: string }) {
  const t = useT()
  const tx = (key: string, fallback: string): string => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const [confirming, setConfirming] = useState(false)
  const [status, setStatus] = useState<Status>('idle')

  const handleClear = useCallback(() => {
    clearStoredData()
    setConfirming(false)
    setStatus('cleared')
  }, [])

  const handleExport = useCallback(async () => {
    const text = JSON.stringify(readStoredData(), null, 2)
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setStatus('copied')
        return
      }
    } catch {
      // Fall through to the unavailable message.
    }
    setStatus('copyUnavailable')
  }, [])

  const statusMessage =
    status === 'cleared'
      ? tx('legal.dataControls.cleared', 'Local data cleared.')
      : status === 'copied'
        ? tx('legal.dataControls.copied', 'A copy of your local data was copied to the clipboard.')
        : status === 'copyUnavailable'
          ? tx(
              'legal.dataControls.copyUnavailable',
              'Clipboard access is unavailable in this browser.'
            )
          : ''

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      style={{
        border: '1px solid #2c3e56',
        borderRadius: 10,
        background: '#0f1724',
        padding: '1.1rem 1.25rem',
        margin: '1.5rem 0',
      }}
    >
      <h2 id={`${id}-heading`} style={{ margin: '0 0 0.5rem', color: '#eef4ff', fontSize: '1.15rem' }}>
        {tx('legal.dataControls.title', 'Data & privacy controls')}
      </h2>
      <p style={{ margin: '0 0 1rem', color: '#9fb3cc', lineHeight: 1.6 }}>
        {tx(
          'legal.dataControls.description',
          'Global Explorer stores a small amount of data in your browser. You can review and clear it here.'
        )}
      </p>

      <h3 style={{ margin: '0 0 0.5rem', color: '#dbeafe', fontSize: '0.95rem' }}>
        {tx('legal.dataControls.stored.title', 'What is stored locally')}
      </h3>
      <ul style={{ margin: '0 0 1rem', paddingInlineStart: '1.25rem', color: '#9fb3cc', lineHeight: 1.6, fontSize: '0.9rem' }}>
        <li>{tx('legal.dataControls.stored.locale', 'Language preference')}</li>
        <li>
          {tx(
            'legal.dataControls.stored.explorer',
            'Explorer preferences (mode, radius, year, layer toggles)'
          )}
        </li>
        <li>{tx('legal.dataControls.stored.visited', 'Recently visited places')}</li>
        <li>{tx('legal.dataControls.stored.geo', 'Location — not stored')}</li>
      </ul>

      <p
        style={{
          margin: '0 0 1rem',
          padding: '0.6rem 0.75rem',
          borderInlineStart: '3px solid #e0c04f',
          background: '#121b28',
          color: '#dbeafe',
          fontSize: '0.85rem',
          lineHeight: 1.55,
        }}
      >
        {tx(
          'legal.dataControls.geoNote',
          'Your location is requested only when you explicitly click “Use my location”. The coordinates are held in memory for the current session and are never saved to storage or sent to a server.'
        )}
      </p>

      {confirming ? (
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <p role="alert" style={{ margin: 0, color: '#f0c0c0', fontWeight: 600 }}>
            {tx(
              'legal.dataControls.confirm',
              'Clear all locally stored preferences? This cannot be undone.'
            )}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #a33',
                background: '#3a1a1a',
                color: '#ffd9d9',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {tx('legal.dataControls.confirmYes', 'Yes, clear local data')}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #2c3e56',
                background: '#16212f',
                color: '#eef4ff',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {tx('legal.dataControls.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => {
              setStatus('idle')
              setConfirming(true)
            }}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #a33',
              background: '#3a1a1a',
              color: '#ffd9d9',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {tx('legal.dataControls.clear', 'Clear local data')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #2c3e56',
              background: '#16212f',
              color: '#eef4ff',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {tx('legal.dataControls.export', 'Copy my data as JSON')}
          </button>
        </div>
      )}

      <p aria-live="polite" style={{ margin: '0.75rem 0 0', minHeight: '1.2em', color: '#9fe0a8', fontSize: '0.85rem' }}>
        {statusMessage}
      </p>

      <p style={{ margin: '0.75rem 0 0', color: '#8fa3bd', fontSize: '0.8rem', lineHeight: 1.5 }}>
        {tx(
          'legal.dataControls.note',
          'Clearing local data only affects this browser. Nothing is stored on a server, because Global Explorer has none.'
        )}
      </p>
    </section>
  )
}
