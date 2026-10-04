import { useT } from '../i18n'
import { useOnline } from '../hooks/useOnline'

/**
 * Fixed, non-blocking banner shown while the browser reports no network.
 * The page keeps rendering its cached/bundled data; the banner only informs.
 */
export default function OfflineBanner() {
  const online = useOnline()
  const t = useT()

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        padding: '0.5rem 1rem',
        background: '#7a3b12',
        color: '#ffe8d6',
        borderBottom: '1px solid #b45a1e',
        textAlign: 'center',
        fontSize: '0.9rem',
      }}
    >
      <span aria-hidden>⚠️ </span>
      {t('errors.offline')}
    </div>
  )
}
