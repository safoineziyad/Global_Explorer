import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useT } from '../i18n'
import { findLandmark } from '../data/landmarks'
import { findFallbackCountry } from '../data/countries'
import PlaceExtras from '../components/PlaceExtras'
import { useExplorer } from '../state/explorer'
import { useFeaturesT } from '../i18n/features'

export default function Landmark() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const t = useT()
  const featureT = useFeaturesT()
  const { addVisited } = useExplorer()
  const landmark = findLandmark(slug)

  useEffect(() => {
    if (!slug) return
    addVisited('landmark:' + slug)
  }, [slug, addVisited])

  if (!landmark) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>{t('errors.landmarkNotFound')}</h1>
          <button type="button" onClick={() => navigate('/world')}>
            ← {t('errors.backHome')}
          </button>
        </div>
      </div>
    )
  }

  const country = findFallbackCountry(landmark.country)

  return (
    <div style={{ minHeight: '100vh', background: '#0b111c' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <button type="button" onClick={() => navigate('/landmarks')} style={{ marginBottom: '1.5rem' }}>
          ← Back to landmarks
        </button>

        <h1 style={{ margin: 0, fontSize: '2rem' }}>{landmark.name}</h1>
        <p style={{ color: '#8fa3bd', marginTop: '0.4rem' }}>
          {landmark.type} · {country?.name.common ?? landmark.country}
          {landmark.unesco ? ' · UNESCO' : ''}
          {landmark.wonderLists?.length ? ` · ${landmark.wonderLists.map((list) =>
            list === 'new-seven'
              ? featureT('site.newSeven')
              : list === 'ancient-seven'
                ? featureT('site.ancientWonders')
                : featureT('site.naturalHighlights')
          ).join(' · ')}` : ''}
        </p>

        <p style={{ marginTop: '1.25rem', lineHeight: 1.7 }}>{landmark.description}</p>

        <dl style={{ marginTop: '1.5rem' }}>
          <Row label={t('landmark.location')} value={`${landmark.location.lat.toFixed(4)}, ${landmark.location.lng.toFixed(4)}`} />
          <Row label={t('landmark.built')} value={landmark.built} />
          {landmark.height ? <Row label={t('landmark.height')} value={landmark.height} /> : null}
          <Row label={t('landmark.period')} value={landmark.period} />
          {landmark.bestTime ? <Row label={t('landmark.bestTime')} value={landmark.bestTime} /> : null}
        </dl>

        {landmark.facts.length > 0 ? (
          <section style={{ marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>{t('landmark.facts')}</h2>
            <ul style={{ color: '#c7d5e8', lineHeight: 1.7 }}>
              {landmark.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <PlaceExtras placeName={landmark.name} lat={landmark.location.lat} lng={landmark.location.lng} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #1f2c3f' }}>
      <dt style={{ color: '#8fa3bd' }}>{label}</dt>
      <dd style={{ margin: 0, textAlign: 'right', color: '#eef4ff' }}>{value}</dd>
    </div>
  )
}
