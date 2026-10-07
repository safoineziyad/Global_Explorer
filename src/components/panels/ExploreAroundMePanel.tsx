import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useAtlas from '../../hooks/useAtlas'
import {
  CATEGORIES,
  CATEGORIES_WITH_DATA,
  CATEGORY_BY_ID,
  VERIFIED_PLACES,
  categoryHasData,
  generateNearby,
  type DiscoveryCategory,
} from '../../data/explorerFeatures'
import { useFeaturesT, type FeatureTranslate } from '../../i18n/features'
import { useExplorer } from '../../state/explorer'
import MiniMap from '../MiniMap'
import { actionStyle, cardStyle, chipStyle, subtleTextStyle } from './panelStyles'

type Enabled = Partial<Record<DiscoveryCategory, boolean>>

const MUTED = '#8fa3bd'
const FAINT = '#7288a5'
const BRIGHT = '#eef4ff'
const LINK = '#7cc0ff'

/** Straight-line distance: metres under 1 km, otherwise one decimal kilometre. */
function formatDistance(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`
}

/**
 * Localized copy for a `content.*` key, falling back to the record's real
 * English reference text if a locale ever lacks it. `useFeaturesT` returns the
 * raw key in that case (see src/i18n/content.ts), and a bare key would be a
 * worse answer than the verified English text already in the dataset.
 */
function localized(t: FeatureTranslate, key: string, fallback: string): string {
  const value = t(key)
  return value === key ? fallback : value
}

/**
 * Additive "Explore Around Me" map mode with six category layers:
 * 🟢 Nature · 🔵 History · 🟠 Culture · 🟣 Food · 🔴 Discoveries ·
 * 🟡 Architecture. Results recompute whenever the location changes.
 *
 * Every result is a real, cited record from `VERIFIED_PLACES`. The curated
 * dataset is small, so "nothing in range" is the common outcome and is stated
 * as such; no place name, coordinate or story is ever synthesized here.
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

  /** The legend always lists all six layers, flagged where data is missing. */
  const layers = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        hasData: categoryHasData(category.id),
      })),
    []
  )

  const toggle = (id: DiscoveryCategory) => {
    setEnabled((prev) => {
      const next: Enabled = { ...prev, [id]: prev[id] === false }
      // Never let the user switch off every layer that has real data: the empty
      // state below states that the curated dataset has nothing in range, and
      // that claim would not hold if the user had filtered everything out.
      const anyDataLayerOn = CATEGORIES_WITH_DATA.some((c) => next[c] !== false)
      return anyDataLayerOn ? next : prev
    })
  }

  const hasResults = discoveries.length > 0

  return (
    <section>
      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{t('exploreAround.title')}</h3>
      <p style={{ margin: '0 0 0.5rem', ...subtleTextStyle }}>{t('exploreAround.subtitle')}</p>

      {/* Provenance: always visible, results or not. */}
      <p
        style={{
          margin: '0 0 0.75rem',
          fontSize: '0.72rem',
          lineHeight: 1.45,
          color: MUTED,
        }}
      >
        <span aria-hidden="true">✅ </span>
        {t('nearby.verifiedOnly')}
      </p>

      <div style={{ fontSize: '0.78rem', color: MUTED, marginBlockEnd: 6 }}>
        {t('exploreAround.categories')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBlockEnd: 10 }}>
        {layers.map(({ category, hasData }) => {
          const label = t(category.labelKey)
          const active = enabled[category.id] !== false
          const note = hasData
            ? label
            : t('nearby.categoryNoDataBody', { category: label })
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              aria-disabled={hasData ? undefined : true}
              aria-label={hasData ? undefined : `${label} — ${t('nearby.categoryNoData')}`}
              title={note}
              onClick={hasData ? () => toggle(category.id) : undefined}
              style={{
                ...chipStyle,
                borderColor: hasData ? (active ? category.color : '#243247') : '#1f2c3f',
                color: hasData ? (active ? BRIGHT : FAINT) : FAINT,
                borderStyle: hasData ? 'solid' : 'dashed',
                cursor: hasData ? 'pointer' : 'not-allowed',
              }}
            >
              <span aria-hidden="true">{category.emoji}</span>
              {label}
              {hasData ? null : (
                <span style={{ fontSize: '0.62rem' }}>⃠ {t('nearby.categoryNoData')}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Why the dashed layers cannot return anything. */}
      {layers.some((layer) => !layer.hasData) ? (
        <ul
          style={{
            listStyle: 'none',
            margin: '0 0 0.75rem',
            padding: 0,
            display: 'grid',
            gap: 3,
            fontSize: '0.7rem',
            lineHeight: 1.4,
            color: FAINT,
          }}
        >
          {layers
            .filter((layer) => !layer.hasData)
            .map(({ category }) => (
              <li key={`nodata-${category.id}`}>
                <span aria-hidden="true">{category.emoji} </span>
                <strong style={{ color: MUTED }}>{t(category.labelKey)}</strong> —{' '}
                {t('nearby.categoryNoData')}.{' '}
                {t('nearby.categoryNoDataBody', { category: t(category.labelKey) })}
              </li>
            ))}
        </ul>
      ) : null}

      <div style={{ display: 'flex', gap: 6, marginBlockEnd: 10 }}>
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
          label: localized(t, d.nameKey, d.name),
        }))}
        height={240}
        ariaLabel={t('exploreAround.title')}
      />

      <div aria-live="polite">
        {hasResults ? (
          <>
            <div style={{ fontSize: '0.78rem', color: MUTED, margin: '0.75rem 0 0.4rem' }}>
              {t('exploreAround.results', { count: discoveries.length })}
            </div>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              {discoveries.map((d) => {
                const meta = CATEGORY_BY_ID[d.category]
                return (
                  <li key={d.id} style={{ ...cardStyle, display: 'grid', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span aria-hidden="true">{meta?.emoji}</span>
                      <Link
                        to={d.href}
                        style={{ color: BRIGHT, fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        {localized(t, d.nameKey, d.name)}
                      </Link>
                      <span
                        style={{
                          marginInlineStart: 'auto',
                          fontSize: '0.72rem',
                          color: MUTED,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDistance(d.distanceM)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: MUTED }}>
                      {localized(t, d.storyKey, d.story)}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'baseline',
                        gap: 8,
                        fontSize: '0.7rem',
                        color: FAINT,
                      }}
                    >
                      {meta ? <span>{t(meta.labelKey)}</span> : null}
                      <span>{d.country}</span>
                      <span>{t('nearby.sourceCount', { count: d.sourceCount })}</span>
                      <Link
                        to={d.href}
                        style={{
                          marginInlineStart: 'auto',
                          color: LINK,
                          textDecoration: 'underline',
                        }}
                      >
                        {t('nearby.viewRecord')}
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          // Honest empty state: our curated dataset is small, so "no verified
          // places in range" says something about the dataset, not about the
          // neighbourhood.
          <div style={{ ...cardStyle, marginBlockStart: '0.75rem', display: 'grid', gap: 4 }}>
            <strong style={{ fontSize: '0.85rem', color: BRIGHT }}>
              {t('nearby.emptyTitle')}
            </strong>
            <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.45, color: MUTED }}>
              {t('nearby.emptyBody', { total: VERIFIED_PLACES.length, km: radiusKm })}
            </p>
          </div>
        )}
      </div>

      <p style={{ color: FAINT, fontSize: '0.72rem', marginBlockStart: '0.5rem' }}>
        {t('exploreAround.moving')}
      </p>
    </section>
  )
}