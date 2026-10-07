import { useEffect, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useT, useDirection } from '../i18n'
import { findLandmark, WONDER_LIST_META } from '../data/landmarks'
import type { RecordConfidence } from '../data/sources'
import { findFallbackCountry } from '../data/countries'
import PlaceExtras from '../components/PlaceExtras'
import { useExplorer } from '../state/explorer'
import { useFeaturesT } from '../i18n/features'
import { useLandmarkCopy } from '../i18n/content'

/**
 * Provenance keys that already exist in the feature dictionaries. The
 * confidence labels in src/data/sources.ts point at `source.confidence.*`,
 * which nothing translates, so the record.* keys are used here instead.
 */
const CONFIDENCE_KEY: Record<RecordConfidence, string> = {
  verified: 'record.confidenceVerified',
  attested: 'record.confidenceAttested',
  disputed: 'record.confidenceDisputed',
}

const STATUS_KEY: Record<'extant' | 'lost', string> = {
  extant: 'record.statusExtant',
  lost: 'record.statusLost',
}

const badgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '0.15rem 0.55rem',
  borderRadius: 6,
  border: '1px solid #2c3e56',
  background: '#172233',
  color: '#b9c9dd',
  fontSize: '0.8rem',
  lineHeight: 1.6,
}

const noteStyle: CSSProperties = {
  marginTop: '1.5rem',
  marginBottom: 0,
  padding: '0.75rem 1rem',
  borderRadius: 6,
  background: '#172233',
  border: '1px solid #2c3e56',
  color: '#b9c9dd',
}

export default function Landmark() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const t = useT()
  const dir = useDirection()
  const featureT = useFeaturesT()
  const { addVisited } = useExplorer()
  const landmark = findLandmark(slug)
  // All user-visible prose is localized. The English text in the data file is
  // the reference wording only, so it is never rendered; a missing copy entry
  // is treated the same as a missing record.
  const copy = useLandmarkCopy(slug)

  useEffect(() => {
    if (!slug) return
    addVisited('landmark:' + slug)
  }, [slug, addVisited])

  if (!landmark || !copy) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>{t('errors.landmarkNotFound')}</h1>
          <button type="button" onClick={() => navigate('/world')}>
            <Arrow dir={dir} /> {t('errors.backHome')}
          </button>
        </div>
      </div>
    )
  }

  const country = findFallbackCountry(landmark.country)
  const listIds = landmark.wonderLists ?? []
  const listLabels = listIds.map((id) => featureT(WONDER_LIST_META[id].labelKey))
  const listNotes = listIds.map((id) => featureT(WONDER_LIST_META[id].noteKey))
  const statusLabel = landmark.status ? featureT(STATUS_KEY[landmark.status]) : null
  const confidenceLabel = landmark.confidence ? featureT(CONFIDENCE_KEY[landmark.confidence]) : null
  // "Best time to visit" is only ever shown for places that still stand.
  const showBestTime = Boolean(copy.bestTime) && landmark.status !== 'lost'
  const metaParts = [
    copy.type,
    country?.name.common ?? landmark.country,
    landmark.unesco ? featureT('record.unesco') : featureT('record.notUnesco'),
    ...listLabels,
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0b111c' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <button type="button" onClick={() => navigate('/landmarks')} style={{ marginBottom: '1.5rem' }}>
          <Arrow dir={dir} /> {t('common.back')}
          <span style={{ color: '#8fa3bd' }}> · {featureT('site.landmarks')}</span>
        </button>

        <h1 style={{ margin: 0, fontSize: '2rem' }}>{copy.name}</h1>
        <p style={{ color: '#8fa3bd', marginTop: '0.4rem' }}>{metaParts.join(' · ')}</p>

        {statusLabel || confidenceLabel ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {statusLabel ? <span style={badgeStyle}>{statusLabel}</span> : null}
            {confidenceLabel ? <span style={badgeStyle}>{confidenceLabel}</span> : null}
          </div>
        ) : null}

        <p style={{ marginTop: '1.25rem', lineHeight: 1.7 }}>{copy.description}</p>

        {listNotes.map((note) => (
          <p key={note} style={noteStyle}>
            {note}
          </p>
        ))}

        <dl style={{ marginTop: '1.5rem' }}>
          <Row label={t('landmark.location')} value={`${landmark.location.lat.toFixed(4)}, ${landmark.location.lng.toFixed(4)}`} />
          <Row label={featureT('record.built')} value={copy.built} />
          {copy.height ? <Row label={featureT('record.height')} value={copy.height} /> : null}
          <Row label={featureT('record.period')} value={copy.period} />
          {showBestTime && copy.bestTime ? (
            <Row label={featureT('record.bestTime')} value={copy.bestTime} />
          ) : null}
        </dl>

        {copy.facts.length > 0 ? (
          <section style={{ marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>{featureT('record.facts')}</h2>
            <ul style={{ color: '#c7d5e8', lineHeight: 1.7 }}>
              {copy.facts.map((fact, index) => (
                <li key={`${index}:${fact}`}>{fact}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {landmark.sources && landmark.sources.length > 0 ? (
          <section style={{ marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>{featureT('record.sources')}</h2>
            <ul style={{ color: '#c7d5e8', lineHeight: 1.7 }}>
              {landmark.sources.map((source) => (
                <li key={`${source.url}|${source.label}`}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.label}
                  </a>
                  <span style={{ color: '#8fa3bd' }}>
                    {' · '}
                    {featureT('record.sourcesChecked')} {source.checked}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* PlaceExtras resolves its history panels by the English place name, so
            it keeps the data name rather than the localized one. */}
        <PlaceExtras placeName={landmark.name} lat={landmark.location.lat} lng={landmark.location.lng} />
      </div>
    </div>
  )
}

/** Back chevron that points to the inline start in both writing directions. */
function Arrow({ dir }: { dir: 'ltr' | 'rtl' }) {
  return (
    <span aria-hidden style={{ display: 'inline-block', transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }}>
      ←
    </span>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #1f2c3f' }}>
      <dt style={{ color: '#8fa3bd' }}>{label}</dt>
      <dd style={{ margin: 0, textAlign: 'end', color: '#eef4ff' }}>{value}</dd>
    </div>
  )
}