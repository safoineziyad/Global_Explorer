import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useFeaturesT } from '../i18n/features'
import { useExplorer, type ExplorerPanelId } from '../state/explorer'
import { useI18n } from '../i18n'
import ExplorerModeSelector from './ExplorerModeSelector'
import MyLocationPanel from './panels/MyLocationPanel'
import ExploreAroundMePanel from './panels/ExploreAroundMePanel'
import TimeMachinePanel from './panels/TimeMachinePanel'
import GeographicDiscoveryPanel from './panels/GeographicDiscoveryPanel'
import AiExplorerPanel from './panels/AiExplorerPanel'
import ExplorerXpPanel from './panels/ExplorerXpPanel'

type Tab = { id: ExplorerPanelId; emoji: string; key: string }

const TABS: Tab[] = [
  { id: 'location', emoji: '📍', key: 'myLocation.title' },
  { id: 'around', emoji: '🧭', key: 'exploreAround.title' },
  { id: 'machine', emoji: '⏳', key: 'timeMachine.title' },
  { id: 'geodiscovery', emoji: '🔎', key: 'geoDiscovery.title' },
  { id: 'ai', emoji: '✨', key: 'ai.title' },
  { id: 'xp', emoji: '⭐', key: 'xp.title' },
]

/**
 * Additive global "Explorer" launcher. Rendered once next to the router so it
 * is available on every existing page without modifying those pages.
 */
export default function ExplorerLauncher() {
  const t = useFeaturesT()
  const { locale } = useI18n()
  const {
    activePanel,
    openPanel,
    closePanel,
    timeTravelOn,
    setTimeTravelOn,
    nearMeOn,
    setNearMeOn,
  } = useExplorer()
  const [hover, setHover] = useState(false)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const dialogHasFocus = useRef(false)

  const selected: ExplorerPanelId = activePanel ?? 'location'

  useEffect(() => {
    if (!activePanel) {
      dialogHasFocus.current = false
      return
    }
    const panel = dialogRef.current
    const focusable = () => panel?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []
    if (!dialogHasFocus.current) {
      focusable()[0]?.focus()
      dialogHasFocus.current = true
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePanel()
        launcherRef.current?.focus()
      } else if (event.key === 'Tab') {
        const items = Array.from(focusable())
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [activePanel, closePanel])

  return (
    <>
      {/* Floating launcher */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (activePanel ? closePanel() : openPanel('location'))}
        aria-label={activePanel ? t('explorer.close') : t('explorer.open')}
        aria-expanded={Boolean(activePanel)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: 'fixed',
          insetInlineStart: 16,
          bottom: 16,
          zIndex: 60,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '0.6rem 0.9rem',
          borderRadius: 999,
          border: '1px solid #3b82f6',
          background: hover || activePanel ? '#1d3a63' : '#16212f',
          color: '#eef4ff',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
          fontWeight: 600,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>
          🧭
        </span>
        {activePanel ? t('explorer.close') : t('explorer.title')}
      </button>

      {activePanel ? (
        <>
        <button
          className="explorer-backdrop"
          type="button"
          aria-label={t('explorer.close')}
          onClick={() => { closePanel(); launcherRef.current?.focus() }}
        />
        <aside
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="explorer-dialog-title"
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            style={{
              position: 'fixed',
              insetInlineStart: 16,
              bottom: 72,
              zIndex: 61,
              width: 'min(380px, 92vw)',
              maxHeight: '78vh',
              overflowY: 'auto',
              background: '#0f1724',
              border: '1px solid #243247',
              borderRadius: 12,
              padding: '0.9rem',
              boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
              color: '#eef4ff',
            }}
          >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <strong id="explorer-dialog-title" style={{ letterSpacing: '0.04em' }}>🧭 {t('explorer.title')}</strong>
            <button
              type="button"
              onClick={() => { closePanel(); launcherRef.current?.focus() }}
              aria-label={t('explorer.close')}
              style={{
                marginInlineStart: 'auto',
                background: 'none',
                border: 'none',
                color: '#9fb3cc',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              ✕
            </button>
          </div>

          {/* Navigation row (additive; existing pages keep their own headers) */}
          <nav
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 10,
              fontSize: '0.75rem',
            }}
          >
            <button type="button" onClick={() => openPanel('around')} style={navButton}>
              {t('explorer.nav.explore')}
            </button>
            <button type="button" onClick={() => openPanel('geodiscovery')} style={navButton}>
              {t('explorer.nav.discover')}
            </button>
            <button type="button" onClick={() => openPanel('machine')} style={navButton}>
              {t('explorer.nav.routes')}
            </button>
            <button type="button" onClick={() => openPanel('location')} style={navButton}>
              {t('explorer.nav.nearMe')}
            </button>
            <button type="button" onClick={() => openPanel('ai')} style={navButton}>
              {t('explorer.nav.ai')}
            </button>
            <Link to="/time-travel" onClick={closePanel} style={{ ...navButton, textDecoration: 'none' }}>
              ⏳ {t('explorer.nav.timeTravel')}
            </Link>
          </nav>

          <ExplorerModeSelector />

          <div style={{ display: 'grid', gap: 6, margin: '0.6rem 0 0.8rem' }}>
            <label style={layerRow}>
              <input
                type="checkbox"
                checked={timeTravelOn}
                onChange={(event) => setTimeTravelOn(event.target.checked)}
              />
              ⏳ {t('explorer.layer.timeTravel')}
            </label>
            <label style={layerRow}>
              <input
                type="checkbox"
                checked={nearMeOn}
                onChange={(event) => setNearMeOn(event.target.checked)}
              />
              📍 {t('explorer.layer.nearMe')}
            </label>
          </div>

          <div role="tablist" aria-label={t('explorer.title')} style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {TABS.map((tab) => {
              const active = tab.id === selected
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`explorer-tab-${tab.id}`}
                  role="tab"
                  aria-selected={active}
                  aria-controls="explorer-panel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => openPanel(tab.id)}
                  onKeyDown={(event) => {
                    const currentIndex = TABS.findIndex((item) => item.id === tab.id)
                    let nextIndex = currentIndex
                    if (event.key === 'Home') nextIndex = 0
                    else if (event.key === 'End') nextIndex = TABS.length - 1
                    else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                      event.preventDefault()
                      const direction = (event.key === 'ArrowRight' ? 1 : -1) * (locale === 'ar' ? -1 : 1)
                      nextIndex = (currentIndex + direction + TABS.length) % TABS.length
                    } else return
                    event.preventDefault()
                    const nextTab = dialogRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]
                    nextTab?.focus()
                    openPanel(TABS[nextIndex].id)
                  }}
                  style={{
                    padding: '0.3rem 0.5rem',
                    borderRadius: 6,
                    border: `1px solid ${active ? '#5aa0ff' : '#2c3e56'}`,
                    background: active ? '#243d5c' : '#16212f',
                    color: active ? '#eaf2ff' : '#9fb3cc',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  <span aria-hidden="true">{tab.emoji}</span> {t(tab.key)}
                </button>
              )
            })}
          </div>

          <div
            id="explorer-panel"
            role="tabpanel"
            aria-labelledby={`explorer-tab-${selected}`}
            tabIndex={0}
            style={{ borderTop: '1px solid #1f2c3f', paddingTop: 10 }}
          >
            {selected === 'location' ? <MyLocationPanel /> : null}
            {selected === 'around' ? <ExploreAroundMePanel /> : null}
            {selected === 'machine' ? <TimeMachinePanel /> : null}
            {selected === 'geodiscovery' ? <GeographicDiscoveryPanel /> : null}
            {selected === 'ai' ? <AiExplorerPanel /> : null}
            {selected === 'xp' ? <ExplorerXpPanel /> : null}
          </div>

          <p style={{ color: '#7288a5', fontSize: '0.68rem', marginTop: '0.8rem' }}>
            {t('explorer.dataNote')}
          </p>
        </aside>
        </>
      ) : null}
    </>
  )
}

const navButton: CSSProperties = {
  padding: '0.25rem 0.55rem',
  borderRadius: 999,
  border: '1px solid #243247',
  background: '#101a2b',
  color: '#c7d5e8',
  cursor: 'pointer',
  fontSize: '0.75rem',
}

const layerRow: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: '0.78rem',
  color: '#c7d5e8',
}
