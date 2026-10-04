import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateNearby } from '../../data/explorerFeatures'
import { useFeaturesT } from '../../i18n/features'
import { useExplorer } from '../../state/explorer'
import { cardStyle, primaryActionStyle, actionStyle, subtleTextStyle } from './panelStyles'

/**
 * Demonstration suggestions are generated locally, not by an AI service.
 */
export default function AiExplorerPanel() {
  const t = useFeaturesT()
  const navigate = useNavigate()
  const { point, locationSource } = useExplorer()
  const [index, setIndex] = useState<number | null>(null)

  const discoveries = useMemo(() => generateNearby(point, 3), [point])
  const suggestion = index === null ? null : discoveries[index % discoveries.length]

  return (
    <section>
      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{t('ai.title')}</h3>
      <p style={{ margin: '0 0 0.75rem', ...subtleTextStyle }}>{t('explorer.mockNote')}</p>

      <button
        type="button"
        style={primaryActionStyle}
        onClick={() => setIndex((value) => (value === null ? 0 : value + 1))}
      >
        ✨ {suggestion ? t('ai.again') : t('ai.button')}
      </button>

      {locationSource === 'fallback' ? (
        <p style={{ color: '#8fa3bd', fontSize: '0.72rem', marginTop: 6 }}>{t('ai.noLocation')}</p>
      ) : null}

      {suggestion ? (
        <div style={{ ...cardStyle, marginTop: 10 }}>
          <div style={{ fontSize: '0.72rem', color: '#e0c04f', letterSpacing: '0.06em' }}>
            {t('ai.hidden')}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, margin: '0.2rem 0' }}>
            {suggestion.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#c7d5e8' }}>
            {t('ai.distance', { m: suggestion.distanceM })}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#8fa3bd', marginTop: 4 }}>
            {suggestion.story}
          </div>
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              style={actionStyle}
              onClick={() => {
                if (suggestion) {
                  const params = new URLSearchParams({
                    lat: String(suggestion.lat),
                    lng: String(suggestion.lng),
                  })
                  navigate(`/world?${params.toString()}`)
                }
              }}
            >
              🧭 {t('ai.explore')}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
