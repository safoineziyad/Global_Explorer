import type { CSSProperties } from 'react'

export type TimeMark = { year: number; label: string }

type Props = {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  marks?: TimeMark[]
  ariaLabel?: string
  style?: CSSProperties
}

/**
 * A draggable horizontal timeline. Implemented with a native range input so it
 * is keyboard- and screen-reader-friendly, then styled to feel like a map
 * time cursor. Additive component — no existing control is changed.
 */
export default function TimeSlider({
  min,
  max,
  value,
  onChange,
  marks = [],
  ariaLabel = 'Timeline',
  style,
}: Props) {
  const span = Math.max(1, max - min)
  const percent = ((value - min) / span) * 100

  return (
    <div style={{ width: '100%', ...style }}>
      <div
        style={{
          position: 'relative',
          height: 34,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: '#1f2c3f',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 0,
            width: `${percent}%`,
            height: 4,
            borderRadius: 2,
            background: '#5aa0ff',
          }}
        />
        {/* Cursor knob */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 6,
            left: `${percent}%`,
            transform: 'translateX(-50%)',
            width: 22,
            height: 22,
            borderRadius: 11,
            border: '2px solid #dbeafe',
            background: '#3b82f6',
            boxShadow: '0 0 0 4px rgba(90,160,255,0.25)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="range"
          aria-label={ariaLabel}
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            margin: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            color: 'transparent',
            cursor: 'ew-resize',
          }}
        />
      </div>

      {marks.length > 0 ? (
        <div style={{ position: 'relative', height: 22, fontSize: '0.72rem', color: '#8fa3bd' }}>
          {marks.map((mark) => {
            const left = ((mark.year - min) / span) * 100
            return (
              <button
                key={mark.year}
                type="button"
                onClick={() => onChange(mark.year)}
                title={mark.label}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  transform: 'translateX(-50%)',
                  background: 'none',
                  border: 'none',
                  color: value === mark.year ? '#dbeafe' : '#8fa3bd',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: value === mark.year ? 700 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {mark.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
