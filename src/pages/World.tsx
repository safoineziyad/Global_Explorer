import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Globe, { type GlobeMarker } from '../components/Globe'
import WorldMap from '../components/WorldMap'
import Tooltip from '../components/Tooltip'
import TimeTravelLayer from '../components/TimeTravelLayer'
import NearMeLayer from '../components/NearMeLayer'
import useAtlas from '../hooks/useAtlas'
import { globeCountries } from '../services/atlas'
import { landmarks } from '../data/landmarks'
import { natureSites } from '../data/nature'
import { LOCALES, LOCALE_LABELS, useI18n, type Locale } from '../i18n'

type View = 'globe' | 'map'

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

function landmarkEmoji(type: string): string {
  const value = type.toLowerCase()
  if (value.includes('mountain')) return '⛰️'
  if (value.includes('temple') || value.includes('ruin') || value.includes('pyramid')) return '🏛️'
  if (value.includes('monument') || value.includes('statue')) return '🗽'
  if (value.includes('wall') || value.includes('fort')) return '🏯'
  if (value.includes('church') || value.includes('cathedral') || value.includes('basilica')) return '⛪'
  if (value.includes('palace') || value.includes('castle')) return '🏰'
  return '📍'
}

const MARKERS: GlobeMarker[] = [
  ...landmarks.map((landmark) => ({
    id: `landmark:${landmark.slug}`,
    name: landmark.name,
    lon: landmark.location.lng,
    lat: landmark.location.lat,
    emoji: landmarkEmoji(landmark.type),
    href: `/landmark/${landmark.slug}`,
  })),
  ...natureSites.map((site) => ({
    id: `nature:${site.slug}`,
    name: site.name,
    lon: site.location.lng,
    lat: site.location.lat,
    emoji: '🌿',
    href: `/nature/${site.slug}`,
  })),
]

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '0.35rem 0.75rem',
        border: `1px solid ${active ? '#e0a458' : '#2c3e56'}`,
        borderRadius: 6,
        background: active ? '#3a2f1a' : '#16212f',
        color: active ? '#ffd9a0' : '#9fb3cc',
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  )
}

export default function World() {
  const { atlas, loading, error } = useAtlas()
  const { t, locale, setLocale } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [view, setView] = useState<View>('globe')
  const [showNames, setShowNames] = useState(false)
  const [autoSpin, setAutoSpin] = useState(true)
  const [lowPower, setLowPower] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const countries = useMemo(() => globeCountries(atlas), [atlas])
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const focusLat = Number(latParam)
  const focusLng = Number(lngParam)
  const focusPoint = latParam !== null && lngParam !== null &&
    Number.isFinite(focusLat) && Number.isFinite(focusLng) &&
    focusLat >= -90 && focusLat <= 90 && focusLng >= -180 && focusLng <= 180
    ? { lat: focusLat, lng: focusLng }
    : null
  const markers = focusPoint
    ? [...MARKERS, {
        id: 'demo-focus',
        name: 'Demo suggestion location',
        lon: focusPoint.lng,
        lat: focusPoint.lat,
        emoji: '✨',
      }]
    : MARKERS

  const handleCountryClick = (cca3: string) => {
    navigate(`/country/${cca3}`)
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 64px)', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem 1rem',
          background: '#0f1724',
          borderBottom: '1px solid #1f2c3f',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.05rem', letterSpacing: '0.02em' }}>{t('world.title')}</h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8fa3bd' }}>{t('world.subtitle')}</p>
        </div>

        <div
          role="group"
          aria-label={t('common.view')}
          style={{
            display: 'flex',
            marginLeft: 'auto',
            border: '1px solid #2c3e56',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          {(['globe', 'map'] as View[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              style={{
                padding: '0.35rem 0.9rem',
                border: 'none',
                background: view === mode ? '#2f4f78' : '#16212f',
                color: view === mode ? '#ffffff' : '#9fb3cc',
                cursor: 'pointer',
                fontWeight: view === mode ? 600 : 400,
              }}
            >
              {t(mode === 'globe' ? 'nav.globe' : 'nav.map')}
            </button>
          ))}
        </div>

        {/* The names toggle is hidden when the atlas has no drawable land. */}
        {countries.length > 0 ? (
          <Tooltip content={t('a11y.toggleNames')}>
            <ToggleButton
              active={showNames}
              label={`🏷️ ${t('common.names')}`}
              onClick={() => setShowNames((prev) => !prev)}
            />
          </Tooltip>
        ) : null}

        {view === 'globe' ? (
          <>
            <Tooltip content={t('globe.autoSpin')}>
              <ToggleButton
                active={autoSpin && !prefersReducedMotion}
                label={`🔄 ${t('common.autoSpin')}`}
                onClick={() => setAutoSpin((prev) => !prev)}
              />
            </Tooltip>
            <Tooltip content={t('globe.lowPower')}>
              <ToggleButton
                active={lowPower}
                label={`🔋 ${t('common.lowPower')}`}
                onClick={() => setLowPower((prev) => !prev)}
              />
            </Tooltip>
          </>
        ) : null}

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#9fb3cc', fontSize: '0.85rem' }}>
          <select
            aria-label={t('language.select')}
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            style={{ background: '#16212f', color: '#eef4ff', border: '1px solid #2c3e56', borderRadius: 6, padding: '0.35rem' }}
          >
            {LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#8fa3bd' }}>
            {t('globe.loading')}
          </div>
        ) : view === 'globe' ? (
          <Globe
            countries={countries}
            atlas={atlas}
            markers={markers}
            initialCenter={focusPoint ? [focusPoint.lng, focusPoint.lat] : undefined}
            onCountryClick={handleCountryClick}
            onMarkerClick={(marker) => {
              if (marker.href) navigate(marker.href)
            }}
            onHoverChange={(shape) => setHovered(shape?.name ?? null)}
            showNames={showNames}
            lowPower={lowPower}
            autoSpin={focusPoint ? false : autoSpin}
            reduceMotion={prefersReducedMotion}
            emptyHint={t('errors.atlasFailed')}
          />
        ) : error ? (
          <div
            role="alert"
            style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#f0a0a0', padding: '1rem', textAlign: 'center' }}
          >
            {t('errors.atlasFailed')}
          </div>
        ) : (
          <WorldMap atlas={atlas} onCountryClick={handleCountryClick} />
        )}

        <TimeTravelLayer />
        <NearMeLayer />

        {hovered ? (
          <div
            aria-live="polite"
            style={{
              position: 'absolute',
              insetInlineStart: '1rem',
              bottom: '1rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 6,
              background: '#0f1724',
              border: '1px solid #2c3e56',
              color: '#eef4ff',
              fontSize: '0.85rem',
            }}
          >
            {hovered}
          </div>
        ) : null}
      </main>
      <details className="world-country-list">
        <summary>Keyboard-accessible country list</summary>
        <ul>
          {countries.map((country) => (
            <li key={country.cca3}>
              <button type="button" onClick={() => handleCountryClick(country.cca3)}>
                {country.name} ({country.cca3})
              </button>
            </li>
          ))}
        </ul>
        <p>Some small countries and territories may not have a shape in the low-resolution map.</p>
      </details>
    </div>
  )
}
