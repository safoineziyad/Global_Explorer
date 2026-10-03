import { useState } from 'react'
import { dnaFor, impactChainFor } from '../data/timeTravel'
import { useFeaturesT } from '../i18n/features'
import { cardStyle } from './panels/panelStyles'

/**
 * Additive "PLACE DNA" section: GEOGRAPHY / HISTORY / CULTURE feeding into
 * GLOBAL IMPACT, with a chain of impact (e.g. the Marrakech example).
 */
export default function PlaceDNA({ placeName }: { placeName: string }) {
  const t = useFeaturesT()
  const [open, setOpen] = useState(false)
  const dna = dnaFor(placeName)
  const chain = impactChainFor(placeName)

  const columns: { emoji: string; label: string; value: string; color: string }[] = [
    { emoji: '🏔️', label: t('dna.geography'), value: dna.geography, color: '#4fae6b' },
    { emoji: '📜', label: t('dna.history'), value: dna.history, color: '#4f8fd6' },
    { emoji: '🎭', label: t('dna.culture'), value: dna.culture, color: '#e0913f' },
  ]

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.15rem', letterSpacing: '0.06em', margin: '0 0 0.75rem' }}>
        🧬 {t('dna.title')}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 8,
        }}
      >
        {columns.map((column) => (
          <div key={column.label} style={{ ...cardStyle, borderTop: `3px solid ${column.color}` }}>
            <div style={{ fontSize: '0.72rem', color: column.color, letterSpacing: '0.08em' }}>
              {column.emoji} {column.label}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#eef4ff', marginTop: 4 }}>{column.value}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', color: '#5aa0ff', margin: '0.5rem 0', fontSize: '1.1rem' }} aria-hidden="true">
        ↓
      </div>

      <div style={{ ...cardStyle, textAlign: 'center', borderColor: '#3b82f6' }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: '#dbeafe' }}>
          🌍 {t('dna.impact')}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#c7d5e8', marginTop: 4 }}>
          {chain[0]?.label} → {chain[chain.length - 1]?.label}
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          style={{
            marginTop: 8,
            padding: '0.35rem 0.7rem',
            borderRadius: 6,
            border: '1px solid #3b82f6',
            background: '#1d3a63',
            color: '#eef4ff',
            cursor: 'pointer',
            fontSize: '0.78rem',
          }}
        >
          🔗 {t('timeTravel.impactButton')}
        </button>
      </div>

      {open ? (
        <ol
          style={{
            listStyle: 'none',
            margin: '0.75rem 0 0',
            padding: 0,
            display: 'grid',
            gap: 6,
          }}
        >
          {chain.map((link, index) => (
            <li key={`${link.label}-${index}`} style={{ ...cardStyle, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem' }} aria-hidden="true">
                {link.emoji}
              </span>
              <span style={{ fontSize: '0.82rem' }}>{link.label}</span>
              {link.link ? (
                <span style={{ marginInlineStart: 'auto', color: '#8fa3bd', fontSize: '0.72rem' }}>
                  → {link.link}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}
