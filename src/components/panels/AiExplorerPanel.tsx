import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CATEGORY_BY_ID, VERIFIED_PLACES, generateNearby } from '../../data/explorerFeatures'
import { useFeaturesT, type FeatureTranslate } from '../../i18n/features'
import { useExplorer } from '../../state/explorer'
import { cardStyle, primaryActionStyle, actionStyle, subtleTextStyle } from './panelStyles'

/** Fixed search radius for this panel. */
const RADIUS_KM = 3

const MUTED = '#8fa3bd'
const FAINT = '#7288a5'
const BRIGHT = '#eef4ff'

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
 * Nearby records within `RADIUS_KM`, shown one at a time.
 *
 * Provenance: this is a local distance lookup over `VERIFIED_PLACES` — the
 * curated landmark and nature records, each of which carries citations. Nothing
 * is generated here: no AI service, no seeded PRNG, no synthesized names,
 * coordinates or stories. The curated dataset is small and worldwide, so "no
 * record in range" is the common outcome and is reported as a property of the
 * dataset, never as "there is nothing of interest where you are".
 */
export default function AiExplorerPanel() {
  const t = useFeaturesT()
  const navigate = useNavigate()
  const { point, locationSource } = useExplorer()
  const [index, setIndex] = useState<number | null>(null)

  const discoveries = useMemo(() => generateNearby(point, RADIUS_KM), [point])
  const hasResults = discoveries.length > 0
  // Show the nearest verified record straight away. Hiding real, cited records
  // behind a "surprise me" button would imply there is something to reveal,
  // and there is not — the dataset simply has one nearest match here.
  const suggestion = hasResults ? discoveries[(index ?? 0) % discoveries.length] : null
  const categoryMeta = suggestion ? CATEGORY_BY_ID[suggestion.category] : undefined
  // With a single verified record in range there is nothing to cycle through,
  // so the control would be a button that does nothing.
  const canCycle = discoveries.length > 1

  return (
    <section>
      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{t('ai.title')}</h3>

      {/* Provenance: always visible, results or not. */}
      <p style={{ margin: '0 0 0.75rem', ...subtleTextStyle }}>{t('nearby.verifiedOnly')}</p>

      {/* Only offered when there is more than one verified record to cycle. */}
      {canCycle ? (
        <button
          type="button"
          style={primaryActionStyle}
          onClick={() => setIndex((value) => (value ?? 0) + 1)}
        >
          ✨ {t('ai.again')}
        </button>
      ) : null}

      {locationSource === 'fallback' ? (
        <p style={{ color: MUTED, fontSize: '0.72rem', marginBlockStart: 6 }}>
          {t('myLocation.denied')}
        </p>
      ) : null}

      <div aria-live="polite">
        {suggestion ? (
          <div style={{ ...cardStyle, marginBlockStart: 10 }}>
            <div
              style={{
                fontSize: '0.72rem',
                color: categoryMeta?.color ?? '#e0c04f',
                letterSpacing: '0.06em',
              }}
            >
              {categoryMeta ? (
                <>
                  <span aria-hidden="true">{categoryMeta.emoji} </span>
                  {t(categoryMeta.labelKey)}
                </>
              ) : null}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, margin: '0.2rem 0' }}>
              {localized(t, suggestion.nameKey, suggestion.name)}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#c7d5e8' }}>
                {formatDistance(suggestion.distanceM)}
              </span>
              <span style={{ marginInlineStart: 'auto', fontSize: '0.72rem', color: MUTED }}>
                {t('nearby.sourceCount', { count: suggestion.sourceCount })}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: MUTED, lineHeight: 1.45 }}>
              {localized(t, suggestion.storyKey, suggestion.story)}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBlockStart: 8 }}>
              <button
                type="button"
                style={actionStyle}
                onClick={() => {
                  const params = new URLSearchParams({
                    lat: String(suggestion.lat),
                    lng: String(suggestion.lng),
                  })
                  navigate(`/world?${params.toString()}`)
                }}
              >
                🧭 {t('ai.explore')}
              </button>
              <Link
                to={suggestion.href}
                style={{
                  ...actionStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                {t('nearby.viewRecord')}
              </Link>
            </div>
          </div>
        ) : null}

        {/* Honest empty state: the curated dataset has no record in range. */}
        {!hasResults ? (
          <div style={{ ...cardStyle, marginBlockStart: 6, display: 'grid', gap: 4 }}>
            <strong style={{ fontSize: '0.85rem', color: BRIGHT }}>
              {t('nearby.emptyTitle')}
            </strong>
            <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.45, color: MUTED }}>
              {t('nearby.emptyBody', { total: VERIFIED_PLACES.length, km: RADIUS_KM })}
            </p>
            <p style={{ margin: 0, fontSize: '0.7rem', lineHeight: 1.4, color: FAINT }}>
              {t('exploreAround.moving')}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
