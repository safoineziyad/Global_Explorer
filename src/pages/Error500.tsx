import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'

/** Explicit 500 route for links/testing; the ErrorBoundary handles real crashes. */
export default function Error500() {
  const navigate = useNavigate()
  const t = useT()

  const reload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

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
          🛠️
        </p>
        <h1 style={{ margin: '0.5rem 0' }}>{t('errors.server')}</h1>
        <p style={{ color: '#8fa3bd', marginBottom: '1.5rem' }}>{t('errors.generic')}</p>
        <button type="button" onClick={reload} style={{ marginInlineEnd: '0.75rem' }}>
          {t('pwa.reload')}
        </button>
        <button type="button" onClick={() => navigate('/world')}>
          ← {t('errors.backHome')}
        </button>
      </div>
    </div>
  )
}
