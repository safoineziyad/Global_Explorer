import { useT } from '../i18n'

/**
 * Static maintenance route. Kept dependency-free so hosts can redirect to it
 * (or feature-flag it) without loading the rest of the app.
 */
export default function Maintenance() {
  const t = useT()

  // W10 owns the dictionaries; fall back to English copy until the keys land
  // (translate() echoes the key when a string is missing).
  const title = t('maintenance.title')
  const message = t('maintenance.message')
  const safeTitle = title === 'maintenance.title' ? 'Under maintenance' : title
  const safeMessage =
    message === 'maintenance.message'
      ? 'We are doing a quick bit of maintenance. Please check back shortly.'
      : message

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0b111c',
        color: '#eef4ff',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <p style={{ fontSize: '3rem', margin: 0 }} aria-hidden>
          🚧
        </p>
        <h1 style={{ margin: '0.5rem 0' }}>{safeTitle}</h1>
        <p style={{ color: '#8fa3bd', marginBottom: '1.5rem' }}>{safeMessage}</p>
        <a href="/" style={{ color: '#7cc0ff' }}>
          {t('errors.backHome')}
        </a>
      </div>
    </div>
  )
}
