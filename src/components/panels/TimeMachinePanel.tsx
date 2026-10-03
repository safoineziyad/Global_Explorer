import { useMemo, useState } from 'react'
import { haversineKm } from '../../data/explorerFeatures'
import { ERAS, historicalPlaces, snapshotFor, type EraId } from '../../data/timeTravel'
import { useFeaturesT } from '../../i18n/features'
import { useExplorer } from '../../state/explorer'
import { cardStyle, subtleTextStyle } from './panelStyles'

const ROW_KEYS: { key: keyof ReturnType<typeof snapshotFor>; label: string }[] = [
  { key: 'existed', label: 'timeMachine.existed' },
  { key: 'happened', label: 'timeMachine.happened' },
  { key: 'changed', label: 'timeMachine.changed' },
  { key: 'influence', label: 'timeMachine.influence' },
]

/**
 * Additive "Time Machine" panel. Slides 2026 → 1950 → 1800 → 1200 → Ancient
 * using placeholder historical data.
 */
export default function TimeMachinePanel({ placeName }: { placeName?: string }) {
  const t = useFeaturesT()
  const { point } = useExplorer()
  const [eraId, setEraId] = useState<EraId>('current')

  const nearest = useMemo(() => {
    let best: { name: string; km: number } | null = null
    for (const place of historicalPlaces) {
      const km = haversineKm(point, { lat: place.lat, lng: place.lng })
      if (!best || km < best.km) best = { name: place.name, km }
    }
    return best
  }, [point])

  const name = placeName ?? nearest?.name ?? 'This place'
  const era = ERAS.find((option) => option.id === eraId) ?? ERAS[0]
  const snapshot = useMemo(() => snapshotFor(name, era.year), [name, era.year])

  return (
    <section>
      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{t('timeMachine.title')}</h3>
      <p style={{ margin: '0 0 0.35rem', ...subtleTextStyle }}>{t('timeMachine.subtitle')}</p>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#c7d5e8' }}>
        🏛️ {name}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {ERAS.map((option) => {
          const active = option.id === eraId
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setEraId(option.id)}
              style={{
                padding: '0.3rem 0.55rem',
                borderRadius: 6,
                border: `1px solid ${active ? '#5aa0ff' : '#2c3e56'}`,
                background: active ? '#243d5c' : '#16212f',
                color: active ? '#eaf2ff' : '#9fb3cc',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              {t(option.labelKey)}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {ROW_KEYS.map((row) => (
          <div key={row.key} style={cardStyle}>
            <div style={{ fontSize: '0.72rem', color: '#8fa3bd' }}>{t(row.label)}</div>
            <div style={{ fontSize: '0.82rem', color: '#eef4ff' }}>{snapshot[row.key]}</div>
          </div>
        ))}
        <div style={cardStyle}>
          <div style={{ fontSize: '0.72rem', color: '#8fa3bd' }}>{t('timeMachine.connected')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {snapshot.connected.map((place) => (
              <span key={place} style={{ fontSize: '0.72rem', color: '#c7d5e8', border: '1px solid #243247', borderRadius: 999, padding: '0.1rem 0.45rem' }}>
                {place}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p style={{ color: '#7288a5', fontSize: '0.72rem', marginTop: '0.5rem' }}>
        {t('explorer.mockNote')}
      </p>
    </section>
  )
}
