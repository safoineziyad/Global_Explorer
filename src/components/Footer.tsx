import { Link } from 'react-router-dom'
import { useT } from '../i18n'

/**
 * Global site footer.
 *
 * - Year is computed at render time (never hard-coded).
 * - Credits/attribution for the country and flag data providers.
 * - Links to Privacy, Terms and the country Directory.
 *
 * Placement/mounting is owned by W5 (App.tsx); new i18n keys are requested
 * from W10. Until W10 lands them, the `tx` helper falls back to English so the
 * footer is always readable.
 */

const ATTRIBUTION = [
  { label: 'Natural Earth', href: 'https://www.naturalearthdata.com/' },
  { label: 'REST Countries', href: 'https://restcountries.com/' },
  { label: 'flagcdn', href: 'https://flagcdn.com/' },
]

const linkStyle = { color: '#9fc6f0', textDecoration: 'none' } as const

export default function Footer() {
  const t = useT()
  const tx = (key: string, fallback: string): string => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: '1px solid #1f2c3f',
        background: '#0b111c',
        color: '#8fa3bd',
        padding: '1.5rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gap: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ maxWidth: 280 }}>
            <p style={{ margin: 0, color: '#eef4ff', fontWeight: 600 }}>
              {t('app.name')}
            </p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', lineHeight: 1.5 }}>
              {tx('footer.tagline', 'An open, privacy-first interactive world atlas.')}
            </p>
          </div>

          <nav aria-label={tx('footer.navigation', 'Footer navigation')}>
            <h2
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.78rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#9fb3cc',
              }}
            >
              {t('common.menu')}
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>
              <li>
                <Link to="/" style={linkStyle}>
                  {t('common.home')}
                </Link>
              </li>
              <li>
                <Link to="/directory" style={linkStyle}>
                  {tx('footer.directory', 'Directory')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" style={linkStyle}>
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" style={linkStyle}>
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy#data-controls" style={linkStyle}>
                  {tx('footer.dataControls', 'Data controls')}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.78rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#9fb3cc',
              }}
            >
              {t('footer.dataSources')}
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>
              {ATTRIBUTION.map((source) => (
                <li key={source.label}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #1f2c3f',
            paddingTop: '0.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
          }}
        >
          <span>© {year} {t('app.name')}</span>
          <span>{t('footer.allRightsReserved')}</span>
        </div>
      </div>
    </footer>
  )
}
