import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useT } from '../i18n'
import { useNatureCopy } from '../i18n/content'
import PlaceExtras from '../components/PlaceExtras'
import { useExplorer } from '../state/explorer'
import { findNatureSite } from '../data/nature'
import { findFallbackCountry } from '../data/countries'
import { useFeaturesT } from '../i18n/features'
import type { Source } from '../data/sources'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #1f2c3f' }}>
      <dt style={{ color: '#8fa3bd' }}>{label}</dt>
      <dd style={{ margin: 0, textAlign: 'end', color: '#eef4ff' }}>{value}</dd>
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

function SourceList({
  title,
  checkedLabel,
  sources,
}: {
  title: string
  checkedLabel: string
  sources: Source[]
}) {
  if (sources.length === 0) return null
  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
      <ul style={{ color: '#c7d5e8', lineHeight: 1.7 }}>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
            <span style={{ color: '#8fa3bd' }}>
              {' · '}
              {checkedLabel} {source.checked}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Nature() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const t = useT()
  const featureT = useFeaturesT()
  const copy = useNatureCopy(slug)
  const { addVisited } = useExplorer()
  useEffect(() => {
    if (slug) addVisited('nature:' + slug)
  }, [slug, addVisited])
  const site = findNatureSite(slug)

  // No English fallback to the data file: a missing record or missing locale
  // copy is a content bug, not something to paper over with reference text.
  if (!site || !copy) {
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
  const sources = site.sources ?? []

  /* Provenance caveats. `wonderLists: ['natural-highlights']` is a curated
     highlight, so it never gets official wording; only the per-record
     `officialWonderList` flag may claim an official register. */
  const notes: string[] = []
  if (site.officialWonderList) {
    notes.push(featureT('record.officialWonderList'))
  } else if (site.wonderLists?.length) {
    notes.push(featureT('record.curatedWonder'))
  }
  if (site.confidence === 'verified') {
    notes.push(featureT('record.confidenceVerified'))
  } else if (site.confidence === 'attested') {
    notes.push(featureT('record.confidenceAttested'))
  } else if (site.confidence === 'disputed') {
    notes.push(featureT('record.confidenceDisputed'))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b111c' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <button type="button" onClick={() => navigate('/nature')} style={{ marginBottom: '1.5rem' }}>
          ← {t('common.back')} · {featureT('site.nature')}
        </button>

        <h1 style={{ margin: 0, fontSize: '2rem' }}>{copy.name}</h1>
        <p style={{ color: '#8fa3bd', marginTop: '0.4rem' }}>
          {copy.type} · {country?.name.common ?? site.country}
        </p>
        {notes.length > 0 ? (
          <p style={{ color: '#8fa3bd', margin: '0.4rem 0 0' }}>{notes.join(' · ')}</p>
        ) : null}

        <p style={{ marginTop: '1.25rem', lineHeight: 1.7 }}>{copy.description}</p>

        <dl style={{ marginTop: '1.5rem' }}>
          <Row label={t('nature.location')} value={`${site.location.lat.toFixed(4)}, ${site.location.lng.toFixed(4)}`} />
          {copy.area ? <Row label={featureT('record.area')} value={copy.area} /> : null}
          {copy.established ? <Row label={featureT('record.established')} value={copy.established} /> : null}
          <Row label={featureT('record.climate')} value={copy.climate} />
          <Row label={featureT('record.bestTime')} value={copy.bestTime} />
        </dl>

        <BulletList title={featureT('record.wildlife')} items={copy.wildlife} />
        <BulletList title={featureT('record.activities')} items={copy.activities} />
        <BulletList title={featureT('record.facts')} items={copy.facts} />

        <SourceList
          title={featureT('record.sources')}
          checkedLabel={featureT('record.sourcesChecked')}
          sources={sources}
        />

        <PlaceExtras placeName={site.name} lat={site.location.lat} lng={site.location.lng} />
      </div>
    </div>
  )
}
