import { useMemo, useState } from 'react'
import useAtlas from '../hooks/useAtlas'
import { placesActiveInYear, snapshotFor } from '../data/timeTravel'
import { useFeaturesT } from '../i18n/features'
import MiniMap from './MiniMap'
import PlaceDNA from './PlaceDNA'
import GlobalImpactFlow from './GlobalImpactFlow'
import { cardStyle } from './panels/panelStyles'

type Props = {
  placeName: string
  lat: number
  lng: number
}

type Tab = 'time' | 'dna' | 'impact'

const YEARS = [1100, 1400, 1700, 2026]

/**
 * Additive place-page section that bundles Time Travel, Place DNA and Global
 * Impact into a single tabbed panel driven by the shared historical data.
 */
export default function PlaceExtras({ placeName, lat, lng }: Props) {
  const t = useFeaturesT()
  const { atlas } = useAtlas()
  const [tab, setTab] = useState<Tab>('time')
  const [year, setYear] = useState(2026)

  const snapshot = useMemo(() => snapshotFor(placeName, year), [placeName, year])

  const points = useMemo(
    () =>
      placesActiveInYear(year).map((p) => ({
        id: p.slug,
        lat: p.lat,
        lng: p.lng,
        color: '#e0c04f',
        emoji: '🏛️',
        label: p.name,
      })),
    [year]
  )

  const cards: { emoji: string; label: string; value: string }[] = [
    { emoji: '🏛️', label: t('timeMachine.existed'), value: snapshot.existed },
    { emoji: '📜', label: t('timeMachine.happened'), value: snapshot.happened },
    { emoji: '🌍', label: t('timeMachine.changed'), value: snapshot.changed },
    { emoji: '🔗', label: t('timeMachine.connected'), value: snapshot.connected.join(' · ') },
    { emoji: '🌐', label: t('timeMachine.influence'), value: snapshot.influence },
  ]

  const tabs: { id: Tab; label: string }[] = [
    { id: 'time', label: t('timeTravel.tab') },
    { id: 'dna', label: t('timeTravel.dna') },
    { id: 'impact', label: t('timeTravel.impact') },
  ]

  return (
    <section style={{ marginTop: '2rem' }}>
      <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1rem' }}>
        {tabs.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              style={{
                padding: '0.4rem 0.8rem',
                border: `1px solid ${active ? '#3b82f6' : '#2c3e56'}`,
                background: active ? '#1d3a63' : '#16212f',
                color: active ? '#eef4ff' : '#8fa3bd',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: active ? 600 : 400,
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'time' ? (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem' }}>
            {YEARS.map((value) => {
              const active = year === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setYear(value)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    border: `1px solid ${active ? '#e0c04f' : '#2c3e56'}`,
                    background: active ? '#3a3320' : '#16212f',
                    color: active ? '#f5e6a8' : '#8fa3bd',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  {value}
                </button>
              )
            })}
          </div>

          <h3 style={{ margin: '0 0 0.6rem', fontSize: '1rem' }}>
            {t('timeTravel.historical', { name: placeName })}
          </h3>

          <MiniMap
            atlas={atlas}
            anchor={{ lat, lng }}
            points={points}
            height={240}
            ariaLabel={t('timeTravel.historical', { name: placeName })}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 8,
              marginTop: '0.75rem',
            }}
          >
            {cards.map((card) => (
              <div key={card.label} style={cardStyle}>
                <div style={{ fontSize: '1.1rem' }} aria-hidden="true">
                  {card.emoji}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8fa3bd', letterSpacing: '0.04em' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#eef4ff', marginTop: 4 }}>{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'dna' ? <PlaceDNA placeName={placeName} /> : null}

      {tab === 'impact' ? <GlobalImpactFlow placeName={placeName} /> : null}
    </section>
  )
}
