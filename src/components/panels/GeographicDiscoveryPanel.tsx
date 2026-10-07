import { useMemo, useState } from 'react'
import { haversineKm } from '../../data/explorerFeatures'
import {
  historicalPlaces,
  impactChainFor,
  impactFlowFor,
  matchHistoricalPlace,
  snapshotFor,
} from '../../data/timeTravel'
import { useFeaturesT } from '../../i18n/features'
import { useExplorer } from '../../state/explorer'
import { actionStyle, cardStyle, subtleTextStyle } from './panelStyles'

/**
 * Additive "Geographic Discovery" info panel: what was discovered here, how it
 * changed the world, and the resulting chain of impact.
 */
export default function GeographicDiscoveryPanel({ placeName }: { placeName?: string }) {
  const t = useFeaturesT()
  const { point } = useExplorer()
  const [selected, setSelected] = useState<string>('')
  const [showFlow, setShowFlow] = useState(false)

  const nearestName = useMemo(() => {
    let best: { name: string; km: number } | null = null
    for (const place of historicalPlaces) {
      const km = haversineKm(point, { lat: place.lat, lng: place.lng })
      if (!best || km < best.km) best = { name: place.name, km }
    }
    return best?.name ?? 'This place'
  }, [point])

  const name = placeName ?? (selected || nearestName)
  const known = matchHistoricalPlace(name)
  const snapshot = useMemo(() => snapshotFor(name, known ? 1200 : 2026), [name, known])
  const chain = useMemo(() => impactChainFor(name), [name])
  const flow = useMemo(() => impactFlowFor(name), [name])

  return (
    <section>
      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{t('geoDiscovery.title')}</h3>
      <p style={{ margin: '0 0 0.75rem', ...subtleTextStyle }}>
        {t('geoDiscovery.question1')} · {t('geoDiscovery.question2')}
      </p>

      {!placeName ? (
        <label style={{ display: 'block', fontSize: '0.75rem', color: '#9fb3cc', marginBottom: 10 }}>
          {t('timeTravel.search')}
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              background: '#16212f',
              color: '#eef4ff',
              border: '1px solid #2c3e56',
              borderRadius: 6,
              padding: '0.35rem',
            }}
          >
            <option value="">{nearestName}</option>
            {historicalPlaces.map((place) => (
              <option key={place.slug} value={place.name}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div style={{ ...cardStyle, marginBottom: 6 }}>
        <div style={{ fontSize: '0.72rem', color: '#8fa3bd' }}>{t('geoDiscovery.question1')}</div>
        <div style={{ fontSize: '0.85rem', color: '#eef4ff' }}>🔎 {snapshot.happened}</div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 10 }}>
        <div style={{ fontSize: '0.72rem', color: '#8fa3bd' }}>{t('geoDiscovery.question2')}</div>
        <div style={{ fontSize: '0.85rem', color: '#eef4ff' }}>🌍 {snapshot.influence}</div>
      </div>

      <div style={{ fontSize: '0.78rem', color: '#9fb3cc', marginBottom: 6 }}>
        {t('geoDiscovery.chain')}
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {chain.map((link, index) => (
          <li
            key={`${link.label}-${index}`}
            style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: '1.1rem' }} aria-hidden="true">
              {link.emoji}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#eef4ff' }}>{link.label}</span>
            {link.link ? (
              <span style={{ marginInlineStart: 'auto', fontSize: '0.72rem', color: '#8fa3bd' }}>
                → {link.link}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div style={{ marginTop: 10 }}>
        <button
          type="button"
          style={actionStyle}
          aria-expanded={showFlow}
          onClick={() => setShowFlow((value) => !value)}
        >
          🔗 {t('timeTravel.impactButton')}
        </button>
        {showFlow ? (
          <ol
            style={{
              listStyle: 'none',
              margin: '0.6rem 0 0',
              padding: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              alignItems: 'center',
            }}
          >
            {flow.map((step, index) => (
              <li key={`${step}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.72rem', color: '#c7d5e8', border: '1px solid #243247', borderRadius: 999, padding: '0.12rem 0.5rem' }}>
                  {step}
                </span>
                {index < flow.length - 1 ? (
                  <span aria-hidden="true" style={{ color: '#5aa0ff' }}>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <p style={{ color: '#7288a5', fontSize: '0.72rem', marginTop: '0.75rem' }}>
        {t('explorer.mockNote')}
      </p>
    </section>
  )
}
