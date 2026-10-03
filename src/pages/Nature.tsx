import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useT } from '../i18n'
import PlaceExtras from '../components/PlaceExtras'
import { useExplorer } from '../state/explorer'
import { findNatureSite } from '../data/nature'
import { findFallbackCountry } from '../data/countries'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #1f2c3f' }}>
      <dt style={{ color: '#8fa3bd' }}>{label}</dt>
      <dd style={{ margin: 0, textAlign: 'right', color: '#eef4ff' }}>{value}</dd>
    </div>
  )
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
      <ul style={{ color: '#c7d5e8', lineHeight: 1.7 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export default function Nature() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const t = useT()
  const { addVisited } = useExplorer()
  useEffect(() => {
    if (slug) addVisited('nature:' + slug)
  }, [slug, addVisited])
  const site = findNatureSite(slug)

  if (!site) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>{t('errors.natureNotFound')}</h1>
          <button type="button" onClick={() => navigate('/world')}>
            ← {t('errors.backHome')}
          </button>
        </div>
      </div>
    )
  }

  const country = findFallbackCountry(site.country)

  return (
    <div style={{ minHeight: '100vh', background: '#0b111c' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <button type="button" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
          ← {t('common.back')}
        </button>

        <h1 style={{ margin: 0, fontSize: '2rem' }}>{site.name}</h1>
        <p style={{ color: '#8fa3bd', marginTop: '0.4rem' }}>
          {site.type} · {country?.name.common ?? site.country}
        </p>

        <p style={{ marginTop: '1.25rem', lineHeight: 1.7 }}>{site.description}</p>

        <dl style={{ marginTop: '1.5rem' }}>
          <Row label={t('nature.location')} value={`${site.location.lat.toFixed(4)}, ${site.location.lng.toFixed(4)}`} />
          {site.area ? <Row label={t('nature.area')} value={site.area} /> : null}
          {site.established ? <Row label={t('nature.established')} value={site.established} /> : null}
          <Row label={t('nature.climate')} value={site.climate} />
          <Row label={t('nature.bestTime')} value={site.bestTime} />
        </dl>

        <BulletList title={t('nature.wildlife')} items={site.wildlife} />
        <BulletList title={t('nature.activities')} items={site.activities} />
        <BulletList title={t('nature.facts')} items={site.facts} />

        <PlaceExtras placeName={site.name} lat={site.location.lat} lng={site.location.lng} />
      </div>
    </div>
  )
}
