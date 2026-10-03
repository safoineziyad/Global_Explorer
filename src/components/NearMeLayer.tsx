import useAtlas from '../hooks/useAtlas'
import { CATEGORIES, CATEGORY_BY_ID, generateNearby } from '../data/explorerFeatures'
import { useExplorer } from '../state/explorer'
import { useFeaturesT } from '../i18n/features'
import MiniMap from './MiniMap'

/**
 * Additive "Near Me" overlay. Renders nothing unless the user enables the
 * Near Me layer from the Explorer launcher. Mirrors TimeTravelLayer so the
 * launcher checkbox has a visible, global effect.
 */
export default function NearMeLayer() {
  const t = useFeaturesT()
  const { atlas } = useAtlas()
  const { nearMeOn, point, radiusKm } = useExplorer()

  if (!nearMeOn) return null

  const discoveries = generateNearby(point, radiusKm)
  const points = discoveries.slice(0, 60).map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    color: CATEGORY_BY_ID[d.category]?.color ?? '#e0c04f',
    emoji: CATEGORY_BY_ID[d.category]?.emoji,
    label: d.name,
  }))

  return (
    <div
      style={{
        position: 'absolute',
        insetInlineEnd: 16,
        top: 16,
        zIndex: 30,
        width: 'min(320px, 82vw)',
        background: 'rgba(15, 23, 36, 0.94)',
        border: '1px solid #243247',
        borderRadius: 10,
        padding: '0.6rem',
        color: '#eef4ff',
      }}
    >
      <div style={{ fontSize: '0.78rem', color: '#dbeafe', marginBottom: 6 }}>
        📍 {t('explorer.layer.nearMe')} — {t('myLocation.within', { km: radiusKm })}
      </div>
      <MiniMap
        atlas={atlas}
        anchor={point}
        radiusKm={radiusKm}
        points={points}
        height={150}
        ariaLabel={t('explorer.layer.nearMe')}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {CATEGORIES.map((c) => (
          <span key={c.id} style={{ fontSize: '0.68rem', color: '#9fb3cc' }}>
            {c.emoji} {t(c.labelKey)}
          </span>
        ))}
      </div>
    </div>
  )
}
