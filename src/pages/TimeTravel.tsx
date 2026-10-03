import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAtlas from '../hooks/useAtlas'
import MiniMap from '../components/MiniMap'
import TimeSlider from '../components/TimeSlider'
import { TIMELINE_YEARS, placesActiveInYear } from '../data/timeTravel'
import { useFeaturesT } from '../i18n/features'
import { useT } from '../i18n'
import { useExplorer } from '../state/explorer'
import { cardStyle } from '../components/panels/panelStyles'

const MAP_POINT_COLOR = '#e0c04f'
const MAP_POINT_EMOJI = '🏛️'

export default function TimeTravel() {
  const navigate = useNavigate()
  const t = useFeaturesT()
  const tBase = useT()
  const { atlas, loading, error } = useAtlas()
  const { year, setYear } = useExplorer()
  const [query, setQuery] = useState('')

  const active = useMemo(() => placesActiveInYear(year), [year])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return active
    return active.filter((p) => p.name.toLowerCase().includes(needle))
  }, [active, query])

  return (
    <div style={{ minHeight: '100vh', background: '#0b111c' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1.25rem 4rem' }}>
        <button
          type="button"
          onClick={() => navigate('/world')}
          style={{
            marginBottom: '1.25rem',
            padding: '0.4rem 0.7rem',
            border: '1px solid #2c3e56',
            background: '#16212f',
            color: '#eef4ff',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          ← {tBase('common.back')}
        </button>

        <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '0.08em' }}>
          ⏳ {t('timeTravel.title')}
        </h1>
        <p style={{ color: '#8fa3bd', marginTop: '0.5rem' }}>{t('timeTravel.subtitle')}</p>

        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            maxWidth: 360,
          }}
        >
          <label htmlFor="time-travel-search" style={{ color: '#8fa3bd', fontSize: '0.8rem' }}>
            {t('timeTravel.search')}
          </label>
          <input
            id="time-travel-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('timeTravel.search')}
            style={{
              padding: '0.5rem 0.6rem',
              border: '1px solid #2c3e56',
              background: '#101a2b',
              color: '#eef4ff',
              borderRadius: 6,
              fontSize: '0.9rem',
            }}
          />
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <MiniMap
            atlas={atlas}
            points={filtered.map((p) => ({
              id: p.slug,
              lat: p.lat,
              lng: p.lng,
              color: MAP_POINT_COLOR,
              emoji: MAP_POINT_EMOJI,
              label: p.name,
            }))}
            height={380}
            ariaLabel={t('timeTravel.tab')}
            onPointClick={(id) => {
              const p = filtered.find((x) => x.slug === id)
              if (p) navigate('/country/' + p.cca3)
            }}
          />
          {loading ? (
            <p style={{ color: '#8fa3bd', fontSize: '0.8rem' }}>{tBase('globe.loading')}</p>
          ) : null}
          {error ? (
            <p style={{ color: '#f8b4b4', fontSize: '0.8rem' }}>{tBase('errors.atlasFailed')}</p>
          ) : null}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <div
            style={{
              color: '#8fa3bd',
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
            }}
          >
            {t('timeTravel.cursor')}
          </div>
          <TimeSlider
            min={1100}
            max={2026}
            value={year}
            onChange={setYear}
            marks={TIMELINE_YEARS.map((y) => ({ year: y, label: String(y) }))}
            ariaLabel={t('timeTravel.timeline')}
          />
        </div>

        <p style={{ marginTop: '1rem', color: '#c7d5e8' }}>
          {t('timeTravel.active', { count: filtered.length, year })}
        </p>

        {filtered.length === 0 ? (
          <p style={{ color: '#8fa3bd' }}>{t('timeTravel.noResults')}</p>
        ) : (
          <div
            style={{
              marginTop: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {filtered.map((p) => (
              <div key={p.slug} style={cardStyle}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: '#8fa3bd', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                  {p.founded}
                </div>
                <p style={{ color: '#c7d5e8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {p.dna.history}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/country/' + p.cca3)}
                  style={{
                    padding: '0.35rem 0.6rem',
                    border: '1px solid #3b82f6',
                    background: '#1d3a63',
                    color: '#eef4ff',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  {t('timeTravel.openPlace')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
