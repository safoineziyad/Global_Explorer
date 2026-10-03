import { useMemo, useState } from 'react'
import useAtlas from '../../hooks/useAtlas'
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  generateNearby,
  type DiscoveryCategory,
} from '../../data/explorerFeatures'
import { useFeaturesT } from '../../i18n/features'
import { useExplorer } from '../../state/explorer'
import MiniMap from '../MiniMap'
import { actionStyle, cardStyle, chipStyle, subtleTextStyle } from './panelStyles'

type Enabled = Partial<Record<DiscoveryCategory, boolean>>

/**
 * Additive "Explore Around Me" map mode with six category layers:
 * 🟢 Nature · 🔵 History · 🟠 Culture · 🟣 Food · 🔴 Discoveries ·
 * 🟡 Architecture. Results recompute whenever the location changes.
 */
export default function ExploreAroundMePanel() {
  const { atlas } = useAtlas()
  const t = useFeaturesT()
  const { point, radiusKm, requestLocation } = useExplorer()
  const [enabled, setEnabled] = useState<Enabled>({})

  const discoveries = useMemo(
    () => generateNearby(point, radiusKm, enabled),
    [point, radiusKm, enabled]
  )

  const toggle = (id: DiscoveryCategory) => {
    setEnabled((prev) => {
      const active = prev[id] !== false
      return { ...prev, [id]: !active }
    })
  }

  return (
    <section>
      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{t('exploreAround.title')}</h3>
      <p style={{ margin: '0 0 0.75rem', ...subtleTextStyle }}>{t('exploreAround.subtitle')}</p>

      <div style={{ fontSize: '0.78rem', color: '#9fb3cc', marginBottom: 6 }}>
        {t('exploreAround.categories')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {CATEGORIES.map((category) => {
          const active = enabled[category.id] !== false
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(category.id)}
              style={{
                ...chipStyle,
                borderColor: active ? category.color : '#243247',
                color: active ? '#eef4ff' : '#7288a5',
              }}
              title={t(category.labelKey)}
            >
              <span aria-hidden="true">{category.emoji}</span>
              {t(category.labelKey)}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button type="button" style={actionStyle} onClick={() => requestLocation(true)}>
          🔄 {t('exploreAround.update')}
        </button>
      </div>

      <MiniMap
        atlas={atlas}
        anchor={point}
        radiusKm={radiusKm}
        points={discoveries.map((d) => ({
          id: d.id,
          lat: d.lat,
          lng: d.lng,
          color: CATEGORY_BY_ID[d.category]?.color ?? '#e0c04f',
          emoji: CATEGORY_BY_ID[d.category]?.emoji,
          label: d.name,
        }))}
        height={240}
        ariaLabel={t('exploreAround.title')}
      />

      <div style={{ fontSize: '0.78rem', color: '#9fb3cc', margin: '0.75rem 0 0.4rem' }}>
        {t('exploreAround.results', { count: discoveries.length })}
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
        {discoveries.slice(0, 12).map((d) => {
          const meta = CATEGORY_BY_ID[d.category]
          return (
            <li key={d.id} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span aria-hidden="true">{meta?.emoji}</span>
                <strong style={{ fontSize: '0.85rem' }}>{d.name}</strong>
                <span style={{ marginInlineStart: 'auto', fontSize: '0.72rem', color: '#8fa3bd' }}>
                  {d.distanceM >= 1000
                    ? `${(d.distanceM / 1000).toFixed(1)} km`
                    : `${d.distanceM} m`}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8fa3bd' }}>{d.story}</div>
            </li>
          )
        })}
      </ul>

      <p style={{ color: '#7288a5', fontSize: '0.72rem', marginTop: '0.5rem' }}>
        {t('exploreAround.moving')} {t('explorer.mockNote')}
      </p>
    </section>
  )
}
