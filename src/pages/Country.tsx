import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useAtlas from '../hooks/useAtlas'
import { useT } from '../i18n'
import { fetchCountry } from '../services/restCountries'
import { findShapeByCca3 } from '../services/atlas'
import { flagEmoji, formatArea, formatList, formatNumber } from '../lib/utils'
import type { CountryRecord } from '../data/countries'
import PlaceExtras from '../components/PlaceExtras'
import { useExplorer } from '../state/explorer'

type Status = 'loading' | 'ready' | 'missing'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid #1f2c3f',
      }}
    >
      <dt style={{ color: '#8fa3bd' }}>{label}</dt>
      <dd style={{ margin: 0, textAlign: 'right', color: '#eef4ff' }}>{value}</dd>
    </div>
  )
}

export default function Country() {
  const { cca3 } = useParams<{ cca3: string }>()
  const navigate = useNavigate()
  const t = useT()
  const { atlas } = useAtlas()
  const { addVisited } = useExplorer()

  const code = cca3 ? cca3.toUpperCase() : ''
  const shape = useMemo(() => findShapeByCca3(atlas, code), [atlas, code])

  const [record, setRecord] = useState<CountryRecord | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!code) {
      setStatus('missing')
      return
    }
    let cancelled = false
    const controller = new AbortController()
    setStatus('loading')
    setRecord(null)

    fetchCountry(code, { signal: controller.signal })
      .then((result) => {
        if (cancelled) return
        if (result) {
          setRecord(result)
          setStatus('ready')
        } else {
          setStatus('missing')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('missing')
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [code])

  useEffect(() => {
    if (cca3) addVisited('country:' + cca3)
  }, [cca3, addVisited])

  // Merge the atlas record as a last-resort fallback so the page still renders.
  const country: CountryRecord | null =
    record ??
    (shape
      ? {
          cca3: shape.cca3,
          name: { common: shape.name, official: shape.name },
        }
      : null)

  const placeName = record?.name?.common ?? shape?.name ?? cca3 ?? 'This place'
  const anchor = record?.latlng
    ? { lat: record.latlng[0], lng: record.latlng[1] }
    : shape?.label
      ? { lat: shape.label[1], lng: shape.label[0] }
      : { lat: 0, lng: 0 }

  if (status === 'missing' && !country) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>{t('errors.countryNotFound')}</h1>
          <p style={{ color: '#8fa3bd' }}>{t('errors.notFoundMessage')}</p>
          <button type="button" onClick={() => navigate('/world')}>
            ← {t('errors.backHome')}
          </button>
        </div>
      </div>
    )
  }

  if (!country) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#8fa3bd' }}>
        {t('common.loading')}
      </div>
    )
  }

  const capital = country.capital ?? []
  const languages = country.languages ? Object.values(country.languages) : []
  const currencies = country.currencies
    ? Object.entries(country.currencies).map(([currencyCode, value]) =>
        value?.name ? `${value.name} (${value.symbol ?? currencyCode})` : currencyCode
      )
    : []
  const hasDetail = Boolean(
    capital.length || country.population !== undefined || country.area !== undefined
  )
  const isAntarctica = code === 'ATA'
  const flag = country.flags?.svg ?? country.flags?.png
  const density =
    country.population !== undefined && country.area ? country.population / country.area : null

  return (
    <div style={{ minHeight: '100vh', background: '#0b111c' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <button type="button" onClick={() => navigate('/world')} style={{ marginBottom: '1.5rem' }}>
          ← {t('common.back')}
        </button>

        <header style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {flag ? (
            <img
              src={flag}
              alt={country.flags?.alt ?? `${t('country.flag')}: ${country.name.common}`}
              width={120}
              style={{ borderRadius: 6, border: '1px solid #1f2c3f', background: '#0f1724' }}
            />
          ) : (
            <span style={{ fontSize: '3rem' }} aria-hidden>
              {flagEmoji(country.cca2)}
            </span>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>{country.name.common}</h1>
            {country.name.official && country.name.official !== country.name.common ? (
              <p style={{ margin: '0.25rem 0 0', color: '#8fa3bd' }}>{country.name.official}</p>
            ) : null}
            {country.region ? (
              <p style={{ margin: '0.5rem 0 0', color: '#b9c9dd' }}>
                {country.region}
                {country.subregion && country.subregion !== country.region
                  ? ` · ${country.subregion}`
                  : ''}
              </p>
            ) : null}
          </div>
        </header>

        {isAntarctica || !hasDetail ? (
          <p
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 6,
              background: '#172233',
              border: '1px solid #2c3e56',
              color: '#b9c9dd',
            }}
          >
            {t('country.noData')}
          </p>
        ) : null}

        <dl style={{ marginTop: '1.5rem' }}>
          {capital.length > 0 ? <InfoRow label={t('country.capital')} value={formatList(capital)} /> : null}
          {country.population !== undefined ? (
            <InfoRow label={t('country.population')} value={formatNumber(country.population)} />
          ) : null}
          {country.area !== undefined ? (
            <InfoRow label={t('country.area')} value={formatArea(country.area)} />
          ) : null}
          {density !== null ? (
            <InfoRow label={t('country.density')} value={`${formatNumber(Math.round(density))} / km²`} />
          ) : null}
          {languages.length > 0 ? (
            <InfoRow label={t('country.languages')} value={formatList(languages)} />
          ) : null}
          {currencies.length > 0 ? (
            <InfoRow label={t('country.currencies')} value={formatList(currencies)} />
          ) : null}
          {country.timezones && country.timezones.length > 0 ? (
            <InfoRow label={t('country.timezones')} value={formatList(country.timezones.slice(0, 4))} />
          ) : null}
          {country.borders && country.borders.length > 0 ? (
            <InfoRow label={t('country.borders')} value={country.borders.join(', ')} />
          ) : null}
          {country.startOfWeek ? (
            <InfoRow label={t('country.startOfWeek')} value={country.startOfWeek} />
          ) : null}
          {country.independent !== undefined ? (
            <InfoRow
              label={t('country.independent')}
              value={country.independent ? t('common.yes') : t('common.no')}
            />
          ) : null}
          {country.unMember !== undefined ? (
            <InfoRow
              label={t('country.unMember')}
              value={country.unMember ? t('common.yes') : t('common.no')}
            />
          ) : null}
          {country.landlocked !== undefined ? (
            <InfoRow
              label={t('country.landlocked')}
              value={country.landlocked ? t('common.yes') : t('common.no')}
            />
          ) : null}
          {country.tld && country.tld.length > 0 ? (
            <InfoRow label={t('country.tld')} value={formatList(country.tld)} />
          ) : null}
          <InfoRow label="ISO 3166-1" value={country.cca3} />
        </dl>

        {country.maps ? (
          <p style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            {country.maps.googleMaps ? (
              <a href={country.maps.googleMaps} target="_blank" rel="noreferrer">
                {t('country.googleMaps')}
              </a>
            ) : null}
            {country.maps.openStreetMaps ? (
              <a href={country.maps.openStreetMaps} target="_blank" rel="noreferrer">
                {t('country.openStreetMaps')}
              </a>
            ) : null}
          </p>
        ) : null}

        <PlaceExtras placeName={placeName} lat={anchor.lat} lng={anchor.lng} />
      </div>
    </div>
  )
}
