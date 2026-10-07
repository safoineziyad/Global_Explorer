import { useMemo } from 'react'
import useAtlas from '../../hooks/useAtlas'
import { CATEGORY_BY_ID, countsWithin, generateNearby } from '../../data/explorerFeatures'
import { useFeaturesT } from '../../i18n/features'
import { LOCATION_PRESETS, useExplorer } from '../../state/explorer'
import MiniMap from '../MiniMap'
import { actionStyle, cardStyle, chipStyle, subtleTextStyle } from './panelStyles'

/**
 * Counter ids are derived from the data layer so they can never drift from
 * `countsWithin`'s return shape. A category we have no dataset for is typed as
 * `null` there on purpose — see the render below.
 */
type CounterId = keyof ReturnType<typeof countsWithin>
type CounterCount = ReturnType<typeof countsWithin>[CounterId]

const COUNTERS: { id: CounterId; emoji: string; key: string; color: string }[] = [
  { id: 'landmarks', emoji: '🏛️', key: 'myLocation.count.landmarks', color: '#e0913f' },
  { id: 'events', emoji: '📜', key: 'myLocation.count.events', color: '#4f8fd6' },
  { id: 'dishes', emoji: '🍽️', key: 'myLocation.count.dishes', color: '#a86fd6' },
  { id: 'nature', emoji: '🌿', key: 'myLocation.count.nature', color: '#4fae6b' },
]

/**
 * Muted "we have no dataset here" styling: smaller and greyer than a real count,
 * so it cannot be misread as a small number.
 */
const noDataValueStyle = {
  display: 'block',
  color: '#8fa3bd',
  fontSize: '0.82rem',
  fontWeight: 600,
  marginBlockStart: 6,
} as const

/**
 * Additive "You Are Here" panel. Keeps the existing blue location dot concept
 * and adds a discovery-radius circle plus 1 km counters for landmarks,
 * historical events, dishes and nature.
 *
 * Honesty rules baked in here:
 * - counters come only from the curated, cited landmark / nature dataset, and a
 *   low number means "not in our dataset", not "nothing exists there";
 * - `dishes` has no dataset at all, so it renders as "No data", never as 0.
 */
export default function MyLocationPanel() {
  const { atlas } = useAtlas()
  const t = useFeaturesT()
  const {
    point,
    locationSource,
    geoStatus,
    requestLocation,
    setManualPoint,
    radiusKm,
    setRadiusKm,
  } = useExplorer()

  const discoveries = useMemo(() => generateNearby(point, radiusKm), [point, radiusKm])
  // The counters describe the same window the map circle shows. Counting a
  // hardcoded 1 km while the slider says 50 km would read as "there is nothing
  // here" when the truth is "we only looked 1 km out".
  const counts = useMemo(
    () => countsWithin(discoveries, Math.round(radiusKm * 1000)),
    [discoveries, radiusKm]
  )

  const statusText =
    geoStatus === 'locating'
      ? t('myLocation.locating')
      : geoStatus === 'denied' || geoStatus === 'unsupported'
        ? t('myLocation.denied')
        : locationSource === 'gps'
          ? t('myLocation.granted')
          : ''

  return (
    <section>
      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{t('myLocation.title')}</h3>
      <p style={{ margin: '0 0 0.75rem', ...subtleTextStyle }}>{t('myLocation.subtitle')}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={() => requestLocation(true)} style={actionStyle}>
          📍 {t('myLocation.useLocation')}
        </button>
      </div>
      <p style={{ ...subtleTextStyle, margin: '-0.25rem 0 0.75rem' }}>
        {t('myLocation.disclosure')}
      </p>

      {statusText ? (
        <div style={{ fontSize: '0.72rem', color: '#8fa3bd', marginBottom: 8 }}>{statusText}</div>
      ) : null}

      <div style={{ fontSize: '0.75rem', color: '#9fb3cc', marginBottom: 4 }}>
        {t('myLocation.manual')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {LOCATION_PRESETS.slice(0, 6).map((preset) => (
          <button key={preset.id} type="button" onClick={() => setManualPoint(preset)} style={chipStyle}>
            <span aria-hidden="true">{preset.emoji}</span>
            {preset.name}
          </button>
        ))}
      </div>

      <label style={{ display: 'block', fontSize: '0.78rem', color: '#9fb3cc' }}>
        {t('myLocation.radius')} — {t('myLocation.within', { km: radiusKm })}
        <input
          type="range"
          min={1}
          max={50}
          value={radiusKm}
          onChange={(event) => setRadiusKm(Number(event.target.value))}
          style={{ width: '100%', marginTop: 4 }}
        />
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 6,
          margin: '0.75rem 0',
        }}
      >
        {COUNTERS.map((counter) => {
          // `number` = that many curated records within COUNTER_RADIUS_M.
          // `null` = we have no dataset for this category; never print it as 0,
          // because that would claim "there are none near you", which is a claim
          // a small curated dataset cannot make.
          const value: CounterCount = counts[counter.id]
          return (
            <div key={counter.id} style={cardStyle}>
              <div style={{ fontSize: '1.1rem' }} aria-hidden="true">
                {counter.emoji}
              </div>
              <div style={{ color: counter.color }}>
                {typeof value === 'number' ? (
                  <span style={{ display: 'block', fontSize: '1.3rem', fontWeight: 700 }}>
                    {value}
                  </span>
                ) : (
                  <span style={noDataValueStyle}>{t('nearby.counterNoData')}</span>
                )}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#8fa3bd' }}>{t(counter.key)}</div>
            </div>
          )
        })}
      </div>

      <p style={{ ...subtleTextStyle, fontSize: '0.7rem', margin: '-0.25rem 0 0.25rem' }}>
        {t('myLocation.within', { km: radiusKm })}
      </p>

      <p style={{ ...subtleTextStyle, fontSize: '0.7rem', margin: '0 0 0.75rem' }}>
        {t('myLocation.counterNote')}
      </p>

      {discoveries.length === 0 ? (
        <p style={{ ...subtleTextStyle, fontSize: '0.72rem', margin: '0 0 0.75rem' }}>
          {t('nearby.emptyTitle')}
        </p>
      ) : null}

      <MiniMap
        atlas={atlas}
        anchor={point}
        radiusKm={radiusKm}
        points={discoveries.slice(0, 24).map((d) => ({
          id: d.id,
          lat: d.lat,
          lng: d.lng,
          color: CATEGORY_BY_ID[d.category]?.color ?? '#e0c04f',
          emoji: CATEGORY_BY_ID[d.category]?.emoji,
          label: t(d.nameKey),
        }))}
        height={220}
        ariaLabel={t('myLocation.title')}
      />

      <p style={{ color: '#7288a5', fontSize: '0.72rem', margin: '0.5rem 0 0' }}>
        {t('myLocation.keepDot')}
      </p>
    </section>
  )
}