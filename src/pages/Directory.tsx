import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CountryRecord } from '../data/countries'
import { landmarks } from '../data/landmarks'
import type { WonderListId } from '../data/landmarks'
import { natureSites } from '../data/nature'
import {
  getCountryApiError,
  getCountries,
  isRemoteCountryApiConfigured,
} from '../services/restCountries'
import { useFeaturesT } from '../i18n/features'

type DirectoryKind = 'countries' | 'landmarks' | 'nature'

export default function Directory({ kind }: { kind: DirectoryKind }) {
  const t = useFeaturesT()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [wonderFilter, setWonderFilter] = useState<'all' | WonderListId>('all')
  const [countries, setCountries] = useState<CountryRecord[]>([])
  const [countryError, setCountryError] = useState(false)
  const [countryLoading, setCountryLoading] = useState(false)
  const [apiError, setApiError] = useState(false)

  const loadCountries = useCallback((forceRefresh = false) => {
    setCountryLoading(true)
    setCountryError(false)
    void getCountries({ forceRefresh }).then((records) => {
      setCountries(records)
      setApiError(Boolean(getCountryApiError()))
      setCountryError(false)
    }).catch((error: unknown) => {
      console.error('[Directory] Country data could not be loaded.', error)
      setCountryError(true)
    }).finally(() => {
      setCountryLoading(false)
    })
  }, [])

  useEffect(() => {
    setQuery('')
    setFilter('all')
    setWonderFilter('all')
  }, [kind, loadCountries])

  useEffect(() => {
    if (kind !== 'countries') return
    loadCountries()
  }, [kind, loadCountries])

  const title = t(kind === 'countries' ? 'site.countries' : kind === 'landmarks' ? 'site.landmarks' : 'site.nature')
  const titleLower = title.toLocaleLowerCase()
  const needle = query.trim().toLocaleLowerCase()
  const filters = kind === 'countries'
    ? [...new Set(countries.map((item) => item.region).filter((value): value is string => Boolean(value)))]
    : kind === 'landmarks'
      ? [...new Set(landmarks.map((item) => item.type))]
      : [...new Set(natureSites.map((item) => item.type))]
  const countryResults = useMemo(() => countries.filter((item) => {
    const values = [item.name.common, item.name.official, item.cca3, ...(item.capital ?? [])]
    return (filter === 'all' || item.region === filter) &&
      values.some((value) => value?.toLocaleLowerCase().includes(needle))
  }), [countries, filter, needle])
  const landmarkResults = useMemo(() => landmarks.filter((item) =>
    (filter === 'all' || item.type === filter) &&
    (wonderFilter === 'all' || item.wonderLists?.includes(wonderFilter)) &&
    [item.name, item.country, item.type].some((value) => value.toLocaleLowerCase().includes(needle))
  ), [filter, needle, wonderFilter])
  const natureResults = useMemo(() => natureSites.filter((item) =>
    (filter === 'all' || item.type === filter) &&
    (wonderFilter === 'all' || (wonderFilter === 'natural-highlights' && item.wonderLists?.includes('natural-highlights'))) &&
    [item.name, item.country, item.type].some((value) => value.toLocaleLowerCase().includes(needle))
  ), [filter, needle, wonderFilter])

  return (
    <main className="catalog-page">
      <header className="catalog-heading">
        <p className="eyebrow">{t('catalog.eyebrow')}</p>
        <h1>{title}</h1>
        <p>{t('catalog.intro')}</p>
      </header>
      <div className="catalog-search">
        <label htmlFor="catalog-search">{t('catalog.searchLabel', { title: titleLower })}</label>
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('catalog.searchPlaceholder', {
            title: titleLower,
            extra: kind === 'countries' ? t('catalog.countrySearchExtra') : '',
          })}
        />
        <span className="catalog-count" aria-live="polite">
          {t('catalog.results', {
            count: kind === 'countries' ? countryResults.length : kind === 'landmarks' ? landmarkResults.length : natureResults.length,
          })}
        </span>
      </div>
      <div className="catalog-filter">
        <label htmlFor="catalog-filter">{t(kind === 'countries' ? 'catalog.filterRegion' : 'catalog.filterType')}</label>
        <select id="catalog-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">{t('catalog.all')}</option>
          {filters.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
      {kind !== 'countries' ? (
        <div className="catalog-filter">
          <label htmlFor="wonder-filter">{t('site.wonderFilter')}</label>
          <select
            id="wonder-filter"
            value={wonderFilter}
            onChange={(event) => setWonderFilter(event.target.value as 'all' | WonderListId)}
          >
            <option value="all">{t('catalog.allLists')}</option>
            {kind === 'landmarks' ? (
              <>
                    <option value="new-seven">{t('site.newSeven')}</option>
                    <option value="ancient-seven">{t('site.ancientWonders')}</option>
                    <option value="natural-highlights">{t('site.naturalHighlights')}</option>
              </>
                ) : <option value="natural-highlights">{t('site.naturalHighlights')}</option>}
          </select>
        </div>
      ) : null}
      {kind === 'landmarks' && wonderFilter === 'ancient-seven' ? (
        <p className="catalog-note" role="status">{t('site.ancientCoverage')}</p>
      ) : null}

      {kind === 'countries' ? (
        countryError ? (
          <div role="alert">
            <p>{t('catalog.loadError')}</p>
            <button type="button" onClick={() => loadCountries(true)}>{t('catalog.retry')}</button>
          </div>
        ) : countryLoading && countries.length === 0 ? <p role="status">{t('catalog.loading')}</p> :
          <div className="catalog-grid">
              {countryResults.map((country) => (
                <Link className="catalog-card" key={country.cca3} to={`/country/${country.cca3}`}>
                  <span className="catalog-card-meta">{country.cca3} · {country.region}</span>
                  <h2>{country.name.common}</h2>
                  <p>{country.capital?.length
                    ? t('catalog.capital', { capital: country.capital.join(', ') })
                    : t('catalog.capitalUnavailable')}</p>
                </Link>
              ))}
            </div>
      ) : kind === 'landmarks' ? (
        <div className="catalog-grid">
          {landmarkResults.map((item) => (
            <Link className="catalog-card" key={item.slug} to={`/landmark/${item.slug}`}>
              <span className="catalog-card-meta">{item.type}{item.unesco ? ' · UNESCO' : ''}</span>
              <h2>{item.name}</h2><p>{item.period}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="catalog-grid">
          {natureResults.map((item) => (
            <Link className="catalog-card" key={item.slug} to={`/nature/${item.slug}`}>
              <span className="catalog-card-meta">{item.type}</span>
              <h2>{item.name}</h2><p>{item.area ?? item.climate}</p>
            </Link>
          ))}
        </div>
      )}
      {kind === 'countries' && apiError ? (
        <div className="catalog-note" role="status">
          <p>{isRemoteCountryApiConfigured()
            ? t('catalog.liveFailure')
            : t('catalog.liveDisabled')}</p>
          {isRemoteCountryApiConfigured() ? (
            <button type="button" onClick={() => loadCountries(true)} disabled={countryLoading}>
              {countryLoading ? t('catalog.retrying') : t('catalog.retryLive')}
            </button>
          ) : null}
        </div>
      ) : null}
      {((kind === 'countries' && countries.length > 0 && countryResults.length === 0) ||
        (kind === 'landmarks' && landmarkResults.length === 0) ||
        (kind === 'nature' && natureResults.length === 0)) ? (
          <p className="catalog-empty">{t('catalog.noMatch', { query })}</p>
        ) : null}
    </main>
  )
}
