import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'

export default function NotFound() {
  const navigate = useNavigate()
  const t = useT()

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
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '3rem', margin: 0 }} aria-hidden>
          🌍
        </p>
        <h1 style={{ margin: '0.5rem 0' }}>{t('errors.notFound')}</h1>
        <p style={{ color: '#8fa3bd', marginBottom: '1.5rem' }}>{t('errors.notFoundMessage')}</p>
        <button type="button" onClick={() => navigate('/world')}>
          ← {t('errors.backHome')}
        </button>
      </div>
    </div>
  )
}
