import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LOCALE_LABELS, LOCALES, useI18n, type Locale } from '../i18n'
import { useFeaturesT } from '../i18n/features'
import Footer from './Footer'

const NAV_ITEMS = [
  { to: '/', label: 'site.home', end: true },
  { to: '/directory', label: 'site.countries' },
  { to: '/landmarks', label: 'site.landmarks' },
  { to: '/nature', label: 'site.nature' },
  { to: '/time-travel', label: 'site.timeTravel' },
]

export default function Layout() {
  const { locale, setLocale } = useI18n()
  const t = useFeaturesT()
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    const pageName = path === '/'
      ? 'Home'
      : path.split('/').filter(Boolean).map((part) => part.replace(/-/g, ' ')).join(' · ')
    const title = `${pageName} | Global Explorer`
    const description = 'Explore country profiles, landmarks, natural places and historical stories with Global Explorer.'
    document.title = title
    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, key)
        document.head.append(element)
      }
      element.content = content
    }
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary')
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  }, [location.pathname])

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">{t('site.skip')}</a>
      <header className="site-header">
        <NavLink className="site-brand" to="/" aria-label="Global Explorer home">
          <span aria-hidden="true">🌍</span> Global Explorer
        </NavLink>
        <nav className="site-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `site-nav-link${isActive ? ' is-active' : ''}`}
            >
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
        <label className="language-picker">
          <span className="visually-hidden">{t('site.language')}</span>
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            aria-label={t('site.language')}
          >
            {LOCALES.map((code) => (
              <option key={code} value={code}>{LOCALE_LABELS[code]}</option>
            ))}
          </select>
        </label>
      </header>
      <div id="main-content" tabIndex={-1}>
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
