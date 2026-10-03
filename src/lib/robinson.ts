import type { AtlasShape } from '../types'

// Standard Robinson coefficient tables (one entry per 5 degrees of latitude) —
// identical to scripts/build-atlas.mjs so MiniMap overlays align with atlas paths.
const ROBINSON_X = [
  1.0, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962,
  0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322,
]
const ROBINSON_Y = [
  0.0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571,
  0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1.0,
]

export const DEG2RAD = Math.PI / 180
export const RAD2DEG = 180 / Math.PI

const BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz'

function parseBase36(token: string): number {
  if (!token) return 0
  let sign = 1
  let s = token
  if (s[0] === '-') {
    sign = -1
    s = s.slice(1)
  }
  let value = 0
  for (let i = 0; i < s.length; i++) {
    const digit = BASE36.indexOf(s[i])
    if (digit < 0) continue
    value = value * 36 + digit
  }
  return sign * value
}

/**
 * Decode a delta-encoded ring string (base36, quantised by `q`) into [lon, lat] pairs.
 * Matches `encodeRings` in scripts/build-atlas.mjs.
 */
export function decodeRing(encoded: string, q = 10): [number, number][] {
  if (!encoded) return []
  const tokens = encoded.split(',')
  const points: [number, number][] = []
  let prevX = 0
  let prevY = 0
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    prevX += parseBase36(tokens[i])
    prevY += parseBase36(tokens[i + 1])
    points.push([prevX / q, prevY / q])
  }
  return points
}

/** Decode all rings of a shape into lon/lat rings. */
export function decodeRings(encodedRings: string[] | undefined, q = 10): [number, number][][] {
  if (!encodedRings) return []
  return encodedRings.map((r) => decodeRing(r, q)).filter((r) => r.length > 0)
}

/**
 * Robinson projection to normalised viewport coordinates.
 * Returns pixel coordinates for the given width/height (origin top-left).
 */
export function robinsonProject(
  lonDeg: number,
  latDeg: number,
  width: number,
  height: number
): [number, number] {
  // Normalise longitude to [-180, 180).
  let lon = ((lonDeg + 180) % 360) - 180
  if (lon < -180) lon += 360

  const clampedLat = Math.max(-90, Math.min(90, latDeg))
  const absLat = Math.abs(clampedLat)
  const index = Math.min(Math.floor(absLat / 5), 17)
  const t = (absLat - index * 5) / 5

  const xCoef = ROBINSON_X[index] + (ROBINSON_X[index + 1] - ROBINSON_X[index]) * t
  const yCoef = ROBINSON_Y[index] + (ROBINSON_Y[index + 1] - ROBINSON_Y[index]) * t

  const lambda = lon * DEG2RAD
  const xNorm = xCoef * lambda
  const yNorm = clampedLat < 0 ? -yCoef : yCoef

  const x = width / 2 + (xNorm / (2 * Math.PI)) * width
  const y = height / 2 - (yNorm / 2) * height
  return [x, y]
}

/**
 * Convert lon/lat (degrees) to a unit-sphere cartesian point.
 * lon 0 faces +X, lat 0/90 on the equator/pole.
 * Used by the 3D globe for meshing and labels.
 */
export function lonLatToVector3(
  lonDeg: number,
  latDeg: number,
  radius = 1
): [number, number, number] {
  const lon = lonDeg * DEG2RAD
  const lat = latDeg * DEG2RAD
  const cosLat = Math.cos(lat)
  return [
    radius * cosLat * Math.cos(lon),
    radius * Math.sin(lat),
    radius * cosLat * Math.sin(lon),
  ]
}

/** Inverse of `lonLatToVector3`. */
export function vector3ToLonLat(x: number, y: number, z: number): [number, number] {
  const radius = Math.hypot(x, y, z) || 1
  const lat = Math.asin(y / radius) * RAD2DEG
  const lon = Math.atan2(z, x) * RAD2DEG
  return [lon, lat]
}

/** Build an SVG path string for a projected lon/lat ring. */
export function ringToPath(
  ring: [number, number][],
  width: number,
  height: number
): string {
  if (ring.length === 0) return ''
  return ring
    .map(([lon, lat], i) => {
      const [x, y] = robinsonProject(lon, lat, width, height)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

/** Convenience: label anchor for a shape, falling back to the first ring centroid. */
export function shapeLabel(shape: AtlasShape): [number, number] | null {
  if (shape.label) return shape.label
  const rings = decodeRings(shape.rings)
  if (rings.length === 0) return null
  const largest = rings.reduce((a, b) => (b.length > a.length ? b : a))
  let lon = 0
  let lat = 0
  for (const [x, y] of largest) {
    lon += x
    lat += y
  }
  return [lon / largest.length, lat / largest.length]
}
