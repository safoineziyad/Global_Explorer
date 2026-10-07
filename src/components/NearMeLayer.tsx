import useAtlas from '../hooks/useAtlas'
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  VERIFIED_PLACES,
  categoryHasData,
  generateNearby,
} from '../data/explorerFeatures'
import { useExplorer } from '../state/explorer'
import { useFeaturesT } from '../i18n/features'
import MiniMap from './MiniMap'

/**
 * Additive "Near Me" overlay. Renders nothing unless the user enables the
 * Near Me layer from the Explorer launcher. Mirrors TimeTravelLayer so the
 * launcher checkbox has a visible, global effect.
 *
 * Honesty rule: `generateNearby` returns only real, cited records looked up in
 * `VERIFIED_PLACES`, and an empty result is the common case. So this overlay
 * never implies that discoveries exist. It draws only what it actually knows —
 * the anchor dot and the radius circle — states plainly when nothing is in
 * range, and marks the categories we have no verified dataset for.
 *
 * Geolocation stays opt-in and session-only: the anchor is read from the
 * explorer state (set by an explicit "use my location" action). Nothing is
 * persisted or transmitted from this component, and it adds no storage or
 * network calls.
 */

/** Overlay palette — same dark design language as the rest of the map UI. */
const BORDER = '#243247'
const TEXT = '#eef4ff'
const ACCENT = '#dbeafe'
const MUTED = '#9fb3cc'
/** Dimmed tone used for categories that cannot produce any result. */
const NO_DATA = '#6b7a90'

export default function NearMeLayer() {
  const t = useFeaturesT()
  const { atlas } = useAtlas()
  const { nearMeOn, point, radiusKm } = useExplorer()

  if (!nearMeOn) return null

  const discoveries = generateNearby(point, radiusKm)
  const found = discoveries.slice(0, 60)
  const points = found.map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    color: CATEGORY_BY_ID[d.category]?.color ?? '#e0c04f',
    emoji: CATEGORY_BY_ID[d.category]?.emoji,
    // Localized record name (content.landmark.<slug>.name / content.nature.<slug>.name).
    label: t(d.nameKey),
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
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: '0.6rem',
        color: TEXT,
      }}
    >
      <div style={{ fontSize: '0.78rem', color: ACCENT, marginBottom: 6 }}>
        📍 {t('explorer.layer.nearMe')} — {t('myLocation.within', { km: radiusKm })}
      </div>
      {/* Anchor dot and radius circle are always accurate, so the map stays. */}
      <MiniMap
        atlas={atlas}
        anchor={point}
        radiusKm={radiusKm}
        points={points}
        height={150}
        ariaLabel={t('explorer.layer.nearMe')}
      />
      {found.length === 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: '0.72rem', color: ACCENT }}>{t('nearby.emptyTitle')}</div>
          <div style={{ fontSize: '0.64rem', color: MUTED, marginTop: 2 }}>
            {t('nearby.emptyBody', { total: VERIFIED_PLACES.length, km: radiusKm })}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {CATEGORIES.map((c) => {
          const hasData = categoryHasData(c.id)
          return (
            <span
              key={c.id}
              title={
                hasData
                  ? undefined
                  : t('nearby.categoryNoDataBody', { category: t(c.labelKey) })
              }
              style={{ fontSize: '0.68rem', color: hasData ? MUTED : NO_DATA }}
            >
              {c.emoji} {t(c.labelKey)}
              {!hasData && (
                <span style={{ fontSize: '0.6rem' }}> · {t('nearby.categoryNoData')}</span>
              )}
            </span>
          )
        })}
      </div>
      <div style={{ fontSize: '0.6rem', color: NO_DATA, marginTop: 6 }}>
        {t('nearby.verifiedOnly')}
      </div>
    </div>
  )
}