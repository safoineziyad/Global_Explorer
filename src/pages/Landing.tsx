import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CountryRecord } from '../data/countries'
import { landmarks } from '../data/landmarks'
import { natureSites } from '../data/nature'
import { loadBundledCountries } from '../services/restCountries'
import { useFeaturesT } from '../i18n/features'

const FEATURED = [
  { title: 'site.countries', text: 'site.countryDescription', to: '/directory', icon: '🌐' },
  { title: 'site.landmarks', text: 'site.landmarkDescription', to: '/landmarks', icon: '🏛️' },
  { title: 'site.nature', text: 'site.natureDescription', to: '/nature', icon: '🌿' },
]

export default function Landing() {
  const t = useFeaturesT()
  const [query, setQuery] = useState('')
  const [countries, setCountries] = useState<CountryRecord[]>([])
  const [countryLoadFailed, setCountryLoadFailed] = useState(false)

  useEffect(() => {
    let active = true
    loadBundledCountries().then((records) => {
      if (active) setCountries(records)
    }).catch(() => {
      if (active) setCountryLoadFailed(true)
    })
    return () => { active = false }
  }, [])

  const matches = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    if (!term) return []
    return [
      ...countries.filter((item) =>
        [item.name.common, item.name.official, item.cca3, ...(item.capital ?? [])]
          .some((value) => value?.toLocaleLowerCase().includes(term))
      ).map((item) => ({ name: item.name.common, type: 'Country', to: `/country/${item.cca3}` })),
      ...landmarks
        .filter((item) => item.name.toLocaleLowerCase().includes(term))
        .map((item) => ({ name: item.name, type: 'Landmark', to: `/landmark/${item.slug}` })),
      ...natureSites
        .filter((item) => item.name.toLocaleLowerCase().includes(term))
        .map((item) => ({ name: item.name, type: 'Nature', to: `/nature/${item.slug}` })),
    ].slice(0, 6)
  }, [countries, query])

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <p className="eyebrow">{t('site.welcomeEyebrow')}</p>
        <h1>{t('site.welcomeTitle')}</h1>
        <p className="landing-intro">{t('site.welcomeIntro')}</p>
        <Link className="primary-link" to="/world">{t('site.startExploring')} <span aria-hidden="true">→</span></Link>
      </section>

      <section className="landing-search" aria-labelledby="landing-search-title">
        <h2 id="landing-search-title">{t('site.searchTitle')}</h2>
        <label className="visually-hidden" htmlFor="landing-search">{t('site.searchPlaceholder')}</label>
        <input
          id="landing-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('site.searchPlaceholder')}
          autoComplete="off"
        />
        {query.trim() ? (
          <ul className="search-results" aria-live="polite">
            {matches.length ? matches.map((item) => (
              <li key={item.to}>
                <Link to={item.to}><span>{item.name}</span><small>{t(item.type === 'Country' ? 'site.searchCountry' : item.type === 'Landmark' ? 'site.searchLandmark' : 'site.searchNature')}</small></Link>
              </li>
            )) : <li className="empty-result">No matching featured places. Try another search.</li>}
          </ul>
        ) : null}
        {countryLoadFailed ? <p role="status">Country suggestions are temporarily unavailable.</p> : null}
      </section>

      <section className="browse-section" aria-labelledby="browse-title">
        <div className="section-heading">
          <div><p className="eyebrow">{t('site.browseEyebrow')}</p><h2 id="browse-title">{t('site.browseTitle')}</h2></div>
          <Link to="/directory">{t('site.browseAllCountries')}</Link>
        </div>
        <div className="browse-cards">
          {FEATURED.map((item) => (
            <Link className="browse-card" key={item.to} to={item.to}>
              <span className="browse-icon" aria-hidden="true">{item.icon}</span>
              <h3>{t(item.title)}</h3>
              <p>{t(item.text)}</p>
              <span className="card-action">{t('site.exploreCollection')}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
