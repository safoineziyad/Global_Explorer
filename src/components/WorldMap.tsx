import { useMemo, useState } from 'react'
import type { Atlas } from '../types'

type Props = {
  atlas: Atlas | null
  onCountryClick?: (cca3: string) => void
  selectedCca3?: string | null
}

/** A usable path must be non-empty and free of NaN/undefined coordinates. */
function isDrawable(d: string | undefined): d is string {
  if (!d) return false
  const trimmed = d.trim()
  if (trimmed.length === 0) return false
  if (/NaN|undefined|Infinity/i.test(trimmed)) return false
  return true
}

export default function WorldMap({ atlas, onCountryClick, selectedCca3 = null }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const shapes = useMemo(
    () =>
      atlas && Array.isArray(atlas.shapes)
        ? atlas.shapes.filter((shape) => isDrawable(shape.d))
        : [],
    [atlas]
  )

  if (!atlas) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: '#8fa3bd' }}>
        Loading atlas…
      </div>
    )
  }

  return (
    <svg
      role="img"
      aria-label="World map"
      viewBox={`0 0 ${atlas.width || 1000} ${atlas.height || 500}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', display: 'block', background: '#0c1524' }}
    >
      <rect x={0} y={0} width={atlas.width || 1000} height={atlas.height || 500} fill="#152743" />

      {shapes.map((shape) => {
        const isActive = shape.cca3 === hovered || shape.cca3 === selectedCca3
        return (
          <path
            key={shape.cca3}
            d={shape.d}
            fill={isActive ? '#e0a458' : '#3f5d4a'}
            stroke={isActive ? '#ffe6bf' : '#24382c'}
            strokeWidth={isActive ? 0.9 : 0.5}
            vectorEffect="non-scaling-stroke"
            tabIndex={0}
            role={onCountryClick ? 'button' : undefined}
            aria-label={shape.name}
            onClick={() => onCountryClick?.(shape.cca3)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onCountryClick?.(shape.cca3)
              }
            }}
            onMouseEnter={() => setHovered(shape.cca3)}
            onMouseLeave={() => setHovered((prev) => (prev === shape.cca3 ? null : prev))}
            onFocus={() => setHovered(shape.cca3)}
            onBlur={() => setHovered((prev) => (prev === shape.cca3 ? null : prev))}
            style={{ cursor: onCountryClick ? 'pointer' : 'default' }}
          />
        )
      })}
    </svg>
  )
}
