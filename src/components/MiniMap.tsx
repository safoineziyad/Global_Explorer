import { useMemo } from 'react'
import type { Atlas } from '../types'
import { robinsonProject } from '../lib/robinson'

export type MapPoint = {
  id: string
  lat: number
  lng: number
  color: string
  emoji?: string
  label?: string
}

type Props = {
  atlas: Atlas | null
  points?: MapPoint[]
  /** Highlighted centre (e.g. the user's location). */
  anchor?: { lat: number; lng: number } | null
  /** Discovery radius drawn around the anchor, in kilometres. */
  radiusKm?: number
  onPointClick?: (id: string) => void
  height?: number
  ariaLabel?: string
}

const KM_PER_DEG = 111.32

function isDrawable(d: string | undefined): d is string {
  return Boolean(d && d.trim().length > 0 && !/NaN|undefined|Infinity/i.test(d))
}

/**
 * Small additive map: the existing Robinson atlas plus optional overlay points
 * and a discovery circle. Non-destructive — the main maps are untouched.
 */
export default function MiniMap({
  atlas,
  points = [],
  anchor = null,
  radiusKm,
  onPointClick,
  height = 260,
  ariaLabel = 'Map',
}: Props) {
  const width = atlas?.width || 1000
  const mapHeight = atlas?.height || 500

  const shapes = useMemo(
    () =>
      atlas && Array.isArray(atlas.shapes)
        ? atlas.shapes.filter((shape) => isDrawable(shape.d))
        : [],
    [atlas]
  )

  const anchorPx = useMemo(() => {
    if (!anchor) return null
    const xy = robinsonProject(anchor.lng, anchor.lat, width, mapHeight)
    return Number.isFinite(xy[0]) && Number.isFinite(xy[1]) ? xy : null
  }, [anchor, width, mapHeight])

  const radiusPx = radiusKm
    ? (radiusKm / KM_PER_DEG) * (width / 360)
    : 0

  const projected = useMemo(
    () =>
      points
        .map((p) => ({
          p,
          xy: robinsonProject(p.lng, p.lat, width, mapHeight),
        }))
        .filter(({ xy }) => Number.isFinite(xy[0]) && Number.isFinite(xy[1])),
    [points, width, mapHeight]
  )

  const meridians = useMemo(
    () =>
      [-120, -60, 0, 60, 120].filter((lon) =>
        Number.isFinite(robinsonProject(lon, 0, width, mapHeight)[0])
      ),
    [width, mapHeight]
  )
  const parallels = useMemo(
    () =>
      [-60, -30, 0, 30, 60].filter((lat) =>
        Number.isFinite(robinsonProject(0, lat, width, mapHeight)[1])
      ),
    [width, mapHeight]
  )

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${mapHeight}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height, display: 'block', background: '#0c1524', borderRadius: 8 }}
    >
      <rect x={0} y={0} width={width} height={mapHeight} fill="#152743" />

      {/* Graticule */}
      {meridians.map((lon) => {
        const [x] = robinsonProject(lon, 0, width, mapHeight)
        return <line key={`m${lon}`} x1={x} y1={0} x2={x} y2={mapHeight} stroke="#1d3350" strokeWidth={0.5} />
      })}
      {parallels.map((lat) => {
        const [, y] = robinsonProject(0, lat, width, mapHeight)
        return <line key={`p${lat}`} x1={0} y1={y} x2={width} y2={y} stroke="#1d3350" strokeWidth={0.5} />
      })}

      {/* Land */}
      {shapes.map((shape) => (
        <path key={shape.cca3} d={shape.d} fill="#31513f" stroke="#223a2c" strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
      ))}

      {/* Discovery circle */}
      {anchorPx && radiusPx > 0 ? (
        <circle
          cx={anchorPx[0]}
          cy={anchorPx[1]}
          r={radiusPx}
          fill="rgba(90, 160, 255, 0.18)"
          stroke="#5aa0ff"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      ) : null}

      {/* Overlay points */}
      {projected.map(({ p, xy }) => (
        <g
          key={p.id}
          role={onPointClick ? 'button' : undefined}
          tabIndex={onPointClick ? 0 : undefined}
          aria-label={p.label ?? p.id}
          onClick={onPointClick ? () => onPointClick(p.id) : undefined}
          onKeyDown={
            onPointClick
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onPointClick(p.id)
                  }
                }
              : undefined
          }
          style={{ cursor: onPointClick ? 'pointer' : 'default' }}
        >
          <circle cx={xy[0]} cy={xy[1]} r={6} fill={p.color} stroke="#0b111c" strokeWidth={1.2} />
          {p.emoji ? (
            <text x={xy[0]} y={xy[1] + 4} textAnchor="middle" fontSize={8}>
              {p.emoji}
            </text>
          ) : null}
        </g>
      ))}

      {/* Anchor (blue location dot) */}
      {anchorPx ? (
        <g>
          <circle cx={anchorPx[0]} cy={anchorPx[1]} r={9} fill="rgba(90,160,255,0.35)" />
          <circle cx={anchorPx[0]} cy={anchorPx[1]} r={4.5} fill="#3b82f6" stroke="#dbeafe" strokeWidth={1.2} />
        </g>
      ) : null}
    </svg>
  )
}
