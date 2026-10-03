import useAtlas from '../hooks/useAtlas'
import { TIMELINE_YEARS, placesActiveInYear } from '../data/timeTravel'
import { useExplorer } from '../state/explorer'
import { useFeaturesT } from '../i18n/features'
import MiniMap from './MiniMap'
import TimeSlider from './TimeSlider'

/**
 * Additive, opt-in time-travel overlay. Renders nothing unless the user turns
 * on the Time Travel layer from the Explorer launcher.
 */
export default function TimeTravelLayer() {
  const t = useFeaturesT()
  const { atlas } = useAtlas()
  const { timeTravelOn, year, setYear } = useExplorer()

  if (!timeTravelOn) return null

  const active = placesActiveInYear(year)

  return (
    <div
      style={{
        position: 'absolute',
        insetInlineStart: 16,
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
        ⏳ {t('explorer.layer.timeTravel')} — {year}
      </div>
      <MiniMap
        atlas={atlas}
        points={active.map((p) => ({
          id: p.slug,
          lat: p.lat,
          lng: p.lng,
          color: '#e0c04f',
          emoji: '🏛️',
          label: p.name,
        }))}
        height={140}
        ariaLabel={t('timeTravel.title')}
      />
      <TimeSlider
        min={1100}
        max={2026}
        value={year}
        onChange={setYear}
        marks={TIMELINE_YEARS.map((y) => ({ year: y, label: String(y) }))}
        ariaLabel={t('timeTravel.timeline')}
      />
    </div>
  )
}
