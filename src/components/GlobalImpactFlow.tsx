import { useState } from 'react'
import { impactFlowFor } from '../data/timeTravel'
import { useFeaturesT } from '../i18n/features'
import { cardStyle } from './panels/panelStyles'

/** Index-aligned stage labels for the six-step impact flow. */
const STAGES = ['PLACE', 'DISCOVERY / EVENT', 'LOCAL', 'REGIONAL', 'GLOBAL', 'TODAY']

/**
 * Additive "GLOBAL IMPACT" section: shows how a place's story travels from its
 * local origin to global reach, one stage at a time.
 */
export default function GlobalImpactFlow({ placeName }: { placeName: string }) {
  const t = useFeaturesT()
  const [open, setOpen] = useState(false)
  const name = placeName.trim() || 'This place'
  const steps = impactFlowFor(name)

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.15rem', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>
        🌐 {t('dna.impact')}
      </h2>

      <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#c7d5e8' }}>
        {t('timeTravel.impactButton')}
      </p>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        style={{
          padding: '0.35rem 0.7rem',
          borderRadius: 6,
          border: '1px solid #3b82f6',
          background: '#1d3a63',
          color: '#eef4ff',
          cursor: 'pointer',
          fontSize: '0.78rem',
        }}
      >
        {open ? t('timeTravel.close') : t('timeTravel.flowTitle')}
      </button>

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
          {steps.map((step, index) => (
            <li key={`${step}-${index}`} style={cardStyle}>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.08em', color: '#8fa3bd' }}>
                {STAGES[index]}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#eef4ff', marginTop: 4 }}>{step}</div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}
