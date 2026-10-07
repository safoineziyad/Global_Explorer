import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { useOnline } from '../hooks/useOnline'
import { usePwa } from '../hooks/usePwa'
import { applyUpdate, promptInstall } from '../services/pwa'

const INSTALL_DISMISSED_KEY = 'global-explorer:pwa-install-dismissed'
const OFFLINE_ACK_KEY = 'global-explorer:pwa-offline-acknowledged'

/** Height of `OfflineBanner`, so the two stacked bars never overlap. */
const OFFLINE_BANNER_HEIGHT = 44

const OFFLINE_TOAST_MS = 6000

function readFlag(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    // Private mode / storage disabled: treat as not yet acknowledged.
    return false
  }
}

function writeFlag(key: string): void {
  try {
    window.localStorage.setItem(key, '1')
  } catch {
    // Persistence is best effort; the prompt simply reappears next visit.
  }
}

const barStyle: React.CSSProperties = {
  position: 'fixed',
  insetInline: 0,
  zIndex: 1300,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '0.65rem 1rem',
  background: 'var(--ge-surface-raised)',
  color: 'var(--ge-text)',
  borderBottom: '1px solid var(--ge-border)',
  boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
  textAlign: 'center',
}

const textStyle: React.CSSProperties = { fontSize: '0.9rem' }

const actionStyle: React.CSSProperties = {
  padding: '0.45rem 0.9rem',
  borderRadius: 999,
  border: '1px solid var(--ge-accent)',
  background: 'var(--ge-accent)',
  color: '#06121f',
  fontWeight: 600,
  cursor: 'pointer',
}

const quietActionStyle: React.CSSProperties = {
  ...actionStyle,
  background: 'transparent',
  color: 'var(--ge-text)',
  borderColor: 'var(--ge-border)',
}

/**
 * Single install / update surface.
 *
 * Only one message is shown at a time, in priority order: a waiting worker
 * update beats the install prompt, which beats the transient "ready offline"
 * confirmation. All copy comes from the `pwa` i18n namespace.
 */
export default function PwaPrompt() {
  const t = useT()
  const online = useOnline()
  const { canInstall, isIos, isStandalone, updateReady, offlineReady } = usePwa()

  const [dismissed, setDismissed] = useState(() => readFlag(INSTALL_DISMISSED_KEY))
  const [offlineAcked, setOfflineAcked] = useState(() => readFlag(OFFLINE_ACK_KEY))

  // Acknowledge the offline-ready confirmation once, after a short read.
  useEffect(() => {
    if (!offlineReady || offlineAcked) return
    const timer = window.setTimeout(() => {
      writeFlag(OFFLINE_ACK_KEY)
      setOfflineAcked(true)
    }, OFFLINE_TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [offlineReady, offlineAcked])

  const showUpdate = updateReady

  // iOS never fires beforeinstallprompt, so it gets instructions instead of a button.
  const showInstall = !showUpdate && !isStandalone && !dismissed && (canInstall || isIos)

  const showOfflineReady = !showUpdate && !showInstall && offlineReady && !offlineAcked

  if (!showUpdate && !showInstall && !showOfflineReady) return null

  const style: React.CSSProperties = { ...barStyle, top: online ? 0 : OFFLINE_BANNER_HEIGHT }

  const handleDismiss = () => {
    writeFlag(INSTALL_DISMISSED_KEY)
    setDismissed(true)
  }

  return (
    <div style={style} role="status" aria-live="polite">
      {showUpdate ? (
        <>
          <span style={textStyle}>{t('pwa.updateAvailable')}</span>
          <button type="button" style={actionStyle} onClick={applyUpdate}>
            {t('pwa.update')}
          </button>
        </>
      ) : null}

      {showInstall ? (
        <>
          <span style={textStyle}>
            {isIos && !canInstall ? t('pwa.iosInstallHint') : t('pwa.installHint')}
          </span>
          {canInstall ? (
            <button
              type="button"
              style={actionStyle}
              onClick={() => {
                void promptInstall()
              }}
            >
              {t('pwa.install')}
            </button>
          ) : null}
          <button type="button" style={quietActionStyle} onClick={handleDismiss}>
            {t('pwa.dismiss')}
          </button>
        </>
      ) : null}

      {showOfflineReady ? <span style={textStyle}>{t('pwa.offlineReady')}</span> : null}
    </div>
  )
}