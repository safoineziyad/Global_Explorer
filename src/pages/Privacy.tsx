import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import DataControls from '../components/DataControls'

/**
 * Privacy Policy (audit-privacy, audit-geo-disclosure).
 *
 * Static, client-side policy — no forms, no network calls, no analytics.
 * New strings are requested from W10; English fallbacks keep the page
 * substantive until the translations land.
 */

const LAST_UPDATED = '2026-10-03'

const linkStyle = { color: '#9fc6f0', textDecoration: 'none' } as const
const paragraphStyle = { margin: '0 0 0.85rem', color: '#c7d5e6', lineHeight: 1.7 } as const
const headingStyle = { margin: '1.5rem 0 0.6rem', color: '#eef4ff', fontSize: '1.1rem' } as const

export default function Privacy() {
  const t = useT()
  const tx = (key: string, fallback: string, params?: Record<string, string | number>): string => {
    const value = t(key)
    const template = value === key ? fallback : value
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      params[name] === undefined ? match : String(params[name])
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0b111c',
        color: '#eef4ff',
        padding: '1.5rem 1rem 3rem',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link to="/" style={{ ...linkStyle, fontSize: '0.85rem' }}>
          ← {t('errors.backHome')}
        </Link>

        <h1 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.8rem' }}>
          {tx('legal.privacy.title', 'Privacy Policy')}
        </h1>
        <p style={{ margin: 0, color: '#8fa3bd', fontSize: '0.85rem' }}>
          {tx('legal.privacy.updated', 'Last updated: {date}', { date: LAST_UPDATED })}
        </p>

        <p style={{ ...paragraphStyle, marginTop: '1.25rem' }}>
          {tx(
            'legal.privacy.intro',
            'This page explains what Global Explorer does with your data. The short version: it runs entirely in your browser, has no user accounts and no server of its own, and does not use analytics by default.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.privacy.summary.title', 'Summary')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.privacy.summary.body',
            'Global Explorer is a static, client-side web application. It has no user accounts, no backend that stores anything about you, and no tracking or advertising scripts. The only data it keeps is what your own browser saves locally, described below.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.privacy.collect.title', 'What we collect')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.privacy.collect.body',
            'We do not collect, store, sell or transmit personal data. There are no sign-ups, no tracking cookies and no analytics. We do not build a profile of you and we cannot identify you from your use of the app.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.privacy.analytics.title', 'Analytics')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.privacy.analytics.body',
            'No analytics, telemetry, fingerprinting or crash reporting is enabled by default. The app does not send usage events anywhere. If a future version adds optional measurement, it will be opt-in and this page will say so before it ships.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.privacy.storage.title', 'Local storage')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.privacy.storage.body',
            'Your language choice and explorer preferences — such as mode, discovery radius, year, layer toggles and recently visited places — are saved in your browser’s localStorage under keys that begin with “global-explorer:”. This data stays on your device and is never uploaded. You can review and erase it at any time from the Data & privacy controls below.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.privacy.geolocation.title', 'Geolocation')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.privacy.geolocation.body',
            'The “Near Me” features can use your device location, but only after you explicitly click a button and your browser asks for permission. The coordinates are held in memory for the current session only: they are never written to localStorage, never sent to a server, and never shared with anyone. If you decline, the app simply uses a fixed default location and every feature keeps working.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.privacy.thirdparty.title', 'Third-party requests')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.privacy.thirdparty.body',
            'Some content is loaded directly from third-party content-delivery networks, so your browser will contact these providers:'
          )}
        </p>
        <ul style={{ margin: '0 0 0.85rem', paddingInlineStart: '1.25rem', color: '#c7d5e6', lineHeight: 1.7 }}>
          <li>
            {tx('legal.privacy.thirdparty.flagcdn', 'flagcdn.com — country flag images.')}
          </li>
          <li>
            {tx(
              'legal.privacy.thirdparty.restCountries',
              'REST Countries (restcountries.com) — country facts such as population, capital, languages and currencies.'
            )}
          </li>
          <li>
            {tx(
              'legal.privacy.thirdparty.naturalEarth',
              'Natural Earth — map boundary geometry, bundled with the app rather than fetched at runtime.'
            )}
          </li>
        </ul>
        <p style={paragraphStyle}>
          {tx(
            'legal.privacy.thirdparty.note',
            'As with any web request, those providers may see your IP address and standard request headers. They are not used by this app for advertising or profiling, and we do not share any additional information with them.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.privacy.contact.title', 'Contact')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.privacy.contact.body',
            'Questions, corrections or privacy concerns? Please open an issue in the project repository, or use the contact link in the footer.'
          )}
        </p>

        <h2 style={headingStyle}>{tx('legal.privacy.changes.title', 'Changes to this policy')}</h2>
        <p style={paragraphStyle}>
          {tx(
            'legal.privacy.changes.body',
            'If this policy changes, the “last updated” date at the top of this page will change too. Continued use of the app after an update means you accept the revised policy.'
          )}
        </p>

        <DataControls id="data-controls" />

        <p style={{ marginTop: '1.5rem', color: '#8fa3bd', fontSize: '0.85rem' }}>
          {t('footer.terms')}:{' '}
          <Link to="/terms" style={linkStyle}>
            {tx('legal.terms.title', 'Terms of Use')}
          </Link>
        </p>
      </div>
    </main>
  )
}
