import { xpFor } from '../../data/explorerFeatures'
import { useFeaturesT } from '../../i18n/features'
import { useExplorer } from '../../state/explorer'
import { cardStyle, subtleTextStyle } from './panelStyles'

const STATS: { key: keyof ReturnType<typeof xpFor>; emoji: string; label: string }[] = [
  { key: 'countries', emoji: '🌍', label: 'xp.countries' },
  { key: 'landmarks', emoji: '🏛️', label: 'xp.landmarks' },
  { key: 'discoveries', emoji: '🔭', label: 'xp.discoveries' },
  { key: 'cultures', emoji: '🎭', label: 'xp.cultures' },
  { key: 'routes', emoji: '🧭', label: 'xp.routes' },
]

/**
 * Additive "Explorer XP" stats panel. Curiosity-driven profile with a sample
 * level that grows as places are opened during the session.
 */
export default function ExplorerXpPanel() {
  const t = useFeaturesT()
  const { visited } = useExplorer()
  const xp = xpFor(visited.length)
  const progress = ((xp.level % 5) / 5) * 100

  return (
    <section>
      <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem' }}>{t('xp.title')}</h3>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '0.25rem 0.6rem',
          borderRadius: 999,
          border: '1px solid #3b82f6',
          background: '#1d3a63',
          fontWeight: 700,
          letterSpacing: '0.04em',
          fontSize: '0.8rem',
        }}
      >
        ⭐ {t('xp.level', { level: xp.level })}
      </div>

      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: '#1f2c3f',
          margin: '0.6rem 0 0.75rem',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${progress}%`, height: '100%', background: '#5aa0ff' }} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 6,
        }}
      >
        {STATS.map((stat) => (
          <div key={stat.key} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }} aria-hidden="true">
              {stat.emoji}
            </span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{xp[stat.key]}</div>
              <div style={{ fontSize: '0.7rem', color: '#8fa3bd' }}>{t(stat.label)}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ ...subtleTextStyle, marginTop: '0.6rem' }}>{t('xp.light')}</p>
    </section>
  )
}
