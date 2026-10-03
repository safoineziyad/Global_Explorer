import { EXPLORER_MODES, MODE_RADIUS_KM, type ExplorerModeId } from '../data/explorerFeatures'
import { useFeaturesT } from '../i18n/features'
import { useExplorer } from '../state/explorer'

/**
 * Additive explorer-mode selector: 🚶 Walk · 🚗 Road · ✈️ World · 🚁 Drone ·
 * 🛰️ Satellite · ⏳ History. Selecting a mode changes behaviour: it sets the
 * discovery radius, and choosing `history` additionally turns the Time Travel
 * layer on. Mode is stored in the explorer context so other panels react.
 */
export default function ExplorerModeSelector() {
  const { mode, setMode, setRadiusKm, setTimeTravelOn } = useExplorer()
  const t = useFeaturesT()

  const selectMode = (id: ExplorerModeId) => {
    setMode(id)
    setRadiusKm(MODE_RADIUS_KM[id] ?? 1)
    if (id === 'history') setTimeTravelOn(true)
  }

  return (
    <div>
      <div style={{ fontSize: '0.78rem', color: '#8fa3bd', marginBottom: 6 }}>
        {t('explorer.mode')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {EXPLORER_MODES.map((option) => {
          const active = option.id === mode
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => selectMode(option.id)}
              aria-pressed={active}
              title={t(option.labelKey)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '0.35rem 0.6rem',
                borderRadius: 999,
                border: `1px solid ${active ? '#5aa0ff' : '#2c3e56'}`,
                background: active ? '#243d5c' : '#16212f',
                color: active ? '#eaf2ff' : '#9fb3cc',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: active ? 600 : 400,
              }}
            >
              <span aria-hidden="true">{option.emoji}</span>
              {t(option.labelKey)}
            </button>
          )
        })}
      </div>
      <p style={{ color: '#7288a5', fontSize: '0.72rem', margin: '0.5rem 0 0' }}>
        {t('explorer.modes.hint')}
      </p>
    </div>
  )
}
