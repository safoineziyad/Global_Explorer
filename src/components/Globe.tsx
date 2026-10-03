import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Atlas } from '../types'
import { clamp } from '../lib/utils'
import { lonLatToVector3 } from '../lib/robinson'
import { globeCountries, type GlobeCountry } from '../services/atlas'
import ZoomControls from './ZoomControls'

type Vec3 = [number, number, number]

export type GlobeMarker = {
  id: string
  name: string
  lon: number
  lat: number
  emoji: string
  href?: string
}

type PreparedShape = {
  cca3: string
  name: string
  /** Preferred label anchor on the sphere. */
  label: Vec3 | null
  /** Rings of lon/lat pre-converted to unit vectors. */
  rings: Vec3[][]
  /** Rough complexity, used to prioritise labels and hit-testing. */
  weight: number
}

type Hovered = {
  cca3: string
  name: string
}

type BBox = { minX: number; minY: number; maxX: number; maxY: number }

type GlobeProps = {
  /** Pre-decoded countries (preferred). */
  countries?: GlobeCountry[]
  /** Raw atlas, used as a fallback when `countries` is not supplied. */
  atlas?: Atlas | null
  /** Emoji pins drawn on the near hemisphere (skipped in low-power mode). */
  markers?: GlobeMarker[]
  onCountryClick?: (cca3: string) => void
  onMarkerClick?: (marker: GlobeMarker) => void
  onHoverChange?: (shape: Hovered | null) => void
  showNames?: boolean
  selectedCca3?: string | null
  lowPower?: boolean
  autoSpin?: boolean
  reduceMotion?: boolean
  /** Shown when the atlas loaded but carries no drawable land. */
  emptyHint?: string
}

export const DEFAULT_VIEW_LNG = -20
export const DEFAULT_VIEW_LAT = 18

const CLICK_DRAG_THRESHOLD = 4
const MIN_ZOOM = 1
const MAX_ZOOM = 8

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI
const TWO_PI = Math.PI * 2

/* ------------------------------------------------------------------ */
/* Small vector helpers (unit sphere, y-up convention)                 */
/* ------------------------------------------------------------------ */

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2])
  if (len < 1e-12) return [0, 0, 1]
  return [v[0] / len, v[1] / len, v[2] / len]
}

function clampLat(lat: number): number {
  return clamp(lat, -85, 85)
}

function normalizeLon(lon: number): number {
  let value = ((lon + 180) % 360) - 180
  if (value < -180) value += 360
  return value
}

/**
 * Orthonormal camera basis for an orthographic projection.
 * `east`/`north` span the tangent plane, `forward` points from the globe
 * centre toward the viewer. Projected depth (`dot(p, forward)`) is genuinely
 * signed, which is what makes back-face culling possible.
 */
function computeBasis(lon: number, lat: number): { east: Vec3; north: Vec3; forward: Vec3 } {
  const forward = lonLatToVector3(lon, lat)
  const up: Vec3 = [0, 1, 0]
  let east = cross(forward, up)
  if (Math.hypot(east[0], east[1], east[2]) < 1e-9) {
    east = cross(forward, [0, 0, 1])
  }
  east = normalize(east)
  const north = normalize(cross(east, forward))
  return { east, north, forward }
}

/**
 * Spherical centroid (lon/lat) of a planar lon/lat ring.
 *
 * The area-vector sum flips sign with ring winding. Atlas rings are wound so
 * the raw sum points *away* from the country (returning its antipode), which
 * would make the label guard reject every valid atlas anchor. Accumulate the
 * vertex mean as well and orient the area vector toward it, so the result is
 * winding-independent.
 */
function sphericalCentroid(ring: [number, number][]): [number, number] | null {
  if (ring.length === 0) return null
  if (ring.length < 3) return [ring[0][0], ring[0][1]]
  let cx = 0
  let cy = 0
  let cz = 0
  let mx = 0
  let my = 0
  let mz = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const lat1 = a[1] * DEG2RAD
    const lon1 = a[0] * DEG2RAD
    const lat2 = b[1] * DEG2RAD
    const lon2 = b[0] * DEG2RAD
    const x1 = Math.cos(lat1) * Math.cos(lon1)
    const y1 = Math.cos(lat1) * Math.sin(lon1)
    const z1 = Math.sin(lat1)
    const x2 = Math.cos(lat2) * Math.cos(lon2)
    const y2 = Math.cos(lat2) * Math.sin(lon2)
    const z2 = Math.sin(lat2)
    cx += y1 * z2 - z1 * y2
    cy += z1 * x2 - x1 * z2
    cz += x1 * y2 - y1 * x2
    mx += x1
    my += y1
    mz += z1
  }
  let len = Math.hypot(cx, cy, cz)
  if (len < 1e-12) {
    // Degenerate area vector — fall back to the vertex-mean direction.
    const meanLen = Math.hypot(mx, my, mz)
    if (meanLen < 1e-12) return [ring[0][0], ring[0][1]]
    cx = mx
    cy = my
    cz = mz
    len = meanLen
  } else if (cx * mx + cy * my + cz * mz < 0) {
    // Raw normal points away from the ring; flip it onto the country.
    cx = -cx
    cy = -cy
    cz = -cz
  }
  cx /= len
  cy /= len
  cz /= len
  return [Math.atan2(cy, cx) * RAD2DEG, Math.asin(clamp(cz, -1, 1)) * RAD2DEG]
}

/** Great-circle distance between two lon/lat points, in degrees. */
function angularDistance(a: [number, number], b: [number, number]): number {
  const va = lonLatToVector3(a[0], a[1])
  const vb = lonLatToVector3(b[0], b[1])
  return Math.acos(clamp(dot(va, vb), -1, 1)) * RAD2DEG
}

/* ------------------------------------------------------------------ */
/* Drawing helpers                                                     */
/* ------------------------------------------------------------------ */

type Basis = { east: Vec3; north: Vec3; forward: Vec3 }

/** Project a unit vector to screen space; also returns signed depth. */
function project(v: Vec3, basis: Basis, cx: number, cy: number, r: number): [number, number, number] {
  return [cx + dot(v, basis.east) * r, cy - dot(v, basis.north) * r, dot(v, basis.forward)]
}

/**
 * Project a closed ring, clipping against the visible hemisphere.
 * Points behind the horizon are replaced by their intersection with it.
 */
function projectRing(
  ring: Vec3[],
  basis: Basis,
  cx: number,
  cy: number,
  r: number
): [number, number][] {
  const out: [number, number][] = []
  const n = ring.length
  if (n < 2) return out
  for (let i = 0; i < n; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % n]
    const za = dot(a, basis.forward)
    const zb = dot(b, basis.forward)
    if (za >= 0) {
      const p = project(a, basis, cx, cy, r)
      out.push([p[0], p[1]])
    }
    if (za >= 0 !== zb >= 0) {
      const t = za / (za - zb)
      const iv = normalize([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ])
      const p = project(iv, basis, cx, cy, r)
      out.push([p[0], p[1]])
    }
  }
  return out
}

/**
 * Anti-solar point -> night-side terminator. The dark hemisphere is defined
 * by `dot(v, sun) < 0`, i.e. directly by the anti-solar point rather than by
 * ring winding (Natural Earth rings wind inconsistently and would flip the
 * shading).
 */
function nightRegion(
  basis: Basis,
  cx: number,
  cy: number,
  r: number,
  sun: Vec3
): [number, number][] {
  const points: [number, number][] = []
  const alignment = dot(basis.forward, sun)

  if (alignment > 0.999) return []
  if (alignment < -0.999) {
    for (let i = 0; i < 96; i++) {
      const t = (i / 96) * TWO_PI
      const v: Vec3 = [
        basis.east[0] * Math.cos(t) + basis.north[0] * Math.sin(t),
        basis.east[1] * Math.cos(t) + basis.north[1] * Math.sin(t),
        basis.east[2] * Math.cos(t) + basis.north[2] * Math.sin(t),
      ]
      const p = project(v, basis, cx, cy, r)
      points.push([p[0], p[1]])
    }
    return points
  }

  // Terminator circle: the great circle perpendicular to the sun.
  let ta = cross(sun, basis.forward)
  if (Math.hypot(ta[0], ta[1], ta[2]) < 1e-9) ta = cross(sun, [0, 1, 0])
  ta = normalize(ta)
  const tb = normalize(cross(sun, ta))
  for (let i = 0; i < 144; i++) {
    const t = (i / 144) * TWO_PI
    const v: Vec3 = [
      ta[0] * Math.cos(t) + tb[0] * Math.sin(t),
      ta[1] * Math.cos(t) + tb[1] * Math.sin(t),
      ta[2] * Math.cos(t) + tb[2] * Math.sin(t),
    ]
    if (dot(v, basis.forward) > 1e-9) {
      const p = project(v, basis, cx, cy, r)
      points.push([p[0], p[1]])
    }
  }

  // Visible limb, restricted to the anti-solar hemisphere.
  for (let i = 0; i < 144; i++) {
    const t = (i / 144) * TWO_PI
    const v: Vec3 = [
      basis.east[0] * Math.cos(t) + basis.north[0] * Math.sin(t),
      basis.east[1] * Math.cos(t) + basis.north[1] * Math.sin(t),
      basis.east[2] * Math.cos(t) + basis.north[2] * Math.sin(t),
    ]
    if (dot(v, sun) < -1e-9) {
      const p = project(v, basis, cx, cy, r)
      points.push([p[0], p[1]])
    }
  }

  if (points.length < 3) return []

  let mx = 0
  let my = 0
  for (const [x, y] of points) {
    mx += x
    my += y
  }
  mx /= points.length
  my /= points.length
  points.sort((a, b) => Math.atan2(a[1] - my, a[0] - mx) - Math.atan2(b[1] - my, b[0] - mx))
  return points
}

function makeHatchPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const tile = document.createElement('canvas')
  tile.width = 6
  tile.height = 6
  const tctx = tile.getContext('2d')
  if (!tctx) return null
  tctx.strokeStyle = '#0a1220'
  tctx.lineWidth = 1
  tctx.beginPath()
  tctx.moveTo(-2, 8)
  tctx.lineTo(8, -2)
  tctx.moveTo(4, 10)
  tctx.lineTo(10, 4)
  tctx.stroke()
  return ctx.createPattern(tile, 'repeat')
}

function subsolarPoint(date: Date): [number, number] {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1)
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000) + 1
  const declination = -23.44 * Math.cos((TWO_PI / 365) * (dayOfYear + 10))
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60
  let lon = -15 * (utcHours - 12)
  while (lon > 180) lon -= 360
  while (lon < -180) lon += 360
  return [lon, declination]
}

function pointInRing(x: number, y: number, ring: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function Globe({
  countries,
  atlas = null,
  markers = [],
  onCountryClick,
  onMarkerClick,
  onHoverChange,
  showNames = false,
  selectedCca3 = null,
  lowPower = false,
  autoSpin = false,
  reduceMotion = false,
  emptyHint,
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const [size, setSize] = useState({ width: 800, height: 600 })
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [centerLon, setCenterLon] = useState(DEFAULT_VIEW_LNG)
  const [centerLat, setCenterLat] = useState(DEFAULT_VIEW_LAT)
  const [hovered, setHovered] = useState<Hovered | null>(null)
  const [hoveredMarker, setHoveredMarker] = useState<GlobeMarker | null>(null)
  const [hoverPoint, setHoverPoint] = useState<[number, number]>([0, 0])
  const [isDragging, setIsDragging] = useState(false)

  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const pointerDownRef = useRef<[number, number]>([0, 0])
  const lastPointerRef = useRef<[number, number]>([0, 0])
  const dirtyRef = useRef(true)
  const screenRingsRef = useRef<Map<string, [number, number][][]>>(new Map())
  const shapeBBoxRef = useRef<Map<string, BBox>>(new Map())
  const markerScreenRef = useRef<Array<{ marker: GlobeMarker; x: number; y: number }>>([])
  const patternRef = useRef<CanvasPattern | null>(null)
  const hoveredRef = useRef<Hovered | null>(null)
  const hoveredMarkerRef = useRef<GlobeMarker | null>(null)

  hoveredRef.current = hovered
  hoveredMarkerRef.current = hoveredMarker

  /* ----------------------------- data ----------------------------- */

  const prepared = useMemo<PreparedShape[]>(() => {
    const source: GlobeCountry[] =
      countries && countries.length > 0 ? countries : globeCountries(atlas)
    return source.map((country) => {
      const largest = country.rings.reduce<[number, number][] | null>(
        (acc, ring) => (acc === null || ring.length > acc.length ? ring : acc),
        null
      )
      const centroid = largest ? sphericalCentroid(largest) : null

      let anchor = country.label ?? null
      if (anchor && centroid && angularDistance(anchor, centroid) > 25) {
        // The supplied anchor disagrees with the geometry — trust the geometry.
        anchor = centroid
      }
      if (!anchor) anchor = centroid

      const label = anchor ? lonLatToVector3(anchor[0], anchor[1]) : null
      const rings = country.rings.map((ring) => ring.map(([lon, lat]) => lonLatToVector3(lon, lat)))
      const weight = rings.reduce((sum, ring) => sum + ring.length, 0)
      return { cca3: country.cca3, name: country.name, label, rings, weight }
    })
  }, [countries, atlas])

  /** Draw order: biggest (most vertices) first, so small countries end on top. */
  const drawOrder = useMemo(
    () => [...prepared].sort((a, b) => b.weight - a.weight),
    [prepared]
  )

  /* ---------------------------- layout ---------------------------- */

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const apply = (width: number, height: number) => {
      setSize({ width: Math.max(1, width), height: Math.max(1, height) })
      dirtyRef.current = true
    }
    apply(el.clientWidth, el.clientHeight)
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) apply(rect.width, rect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /* ----------------------------- wheel ---------------------------- */

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setZoom((prev) => clamp(prev * Math.exp(-event.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM))
      dirtyRef.current = true
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  /* ---------------------------- drawing --------------------------- */

  const render = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = size.width
    const height = size.height
    const dpr = lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    const pixelW = Math.max(1, Math.round(width * dpr))
    const pixelH = Math.max(1, Math.round(height * dpr))
    if (canvas.width !== pixelW) canvas.width = pixelW
    if (canvas.height !== pixelH) canvas.height = pixelH

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const cx = width / 2
    const cy = height / 2
    const baseRadius = Math.min(cx, cy) * 0.92
    const radius = baseRadius * zoom

    const basis = computeBasis(centerLon, clampLat(centerLat))

    // Ocean
    const gradient = ctx.createRadialGradient(
      cx - radius * 0.3,
      cy - radius * 0.35,
      radius * 0.1,
      cx,
      cy,
      radius
    )
    gradient.addColorStop(0, '#1d3350')
    gradient.addColorStop(1, '#0c1524')
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, TWO_PI)
    ctx.fillStyle = gradient
    ctx.fill()

    // Globe rim
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, TWO_PI)
    ctx.strokeStyle = '#2c4a72'
    ctx.lineWidth = 1
    ctx.stroke()

    // Graticule — always drawn, including low-power and missing-atlas.
    ctx.strokeStyle = '#1c2c44'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    for (let lon = -180; lon < 180; lon += 30) {
      let started = false
      for (let lat = -80; lat <= 80; lat += 4) {
        const v = lonLatToVector3(lon, lat)
        if (dot(v, basis.forward) < 0) {
          started = false
          continue
        }
        const p = project(v, basis, cx, cy, radius)
        if (!started) {
          ctx.moveTo(p[0], p[1])
          started = true
        } else {
          ctx.lineTo(p[0], p[1])
        }
      }
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      let started = false
      for (let lon = -180; lon <= 180; lon += 4) {
        const v = lonLatToVector3(lon, lat)
        if (dot(v, basis.forward) < 0) {
          started = false
          continue
        }
        const p = project(v, basis, cx, cy, radius)
        if (!started) {
          ctx.moveTo(p[0], p[1])
          started = true
        } else {
          ctx.lineTo(p[0], p[1])
        }
      }
    }
    ctx.stroke()

    screenRingsRef.current = new Map()
    shapeBBoxRef.current = new Map()

    if (prepared.length > 0) {
      // Land — one batched Path2D for the whole world (2 fills, not 177).
      const batch = new Path2D()
      const ringsByCca3 = screenRingsRef.current
      const bboxByCca3 = shapeBBoxRef.current
      for (const shape of drawOrder) {
        const shapePath: [number, number][][] = []
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const ring of shape.rings) {
          const projected = projectRing(ring, basis, cx, cy, radius)
          if (projected.length < 2) continue
          shapePath.push(projected)
          batch.moveTo(projected[0][0], projected[0][1])
          for (let i = 1; i < projected.length; i++) {
            batch.lineTo(projected[i][0], projected[i][1])
            const [px, py] = projected[i]
            if (px < minX) minX = px
            if (px > maxX) maxX = px
            if (py < minY) minY = py
            if (py > maxY) maxY = py
          }
          batch.closePath()
        }
        if (shapePath.length > 0) {
          ringsByCca3.set(shape.cca3, shapePath)
          bboxByCca3.set(shape.cca3, { minX, minY, maxX, maxY })
        }
      }

      ctx.fillStyle = '#3f5d4a'
      ctx.fill(batch)
      ctx.strokeStyle = '#24382c'
      ctx.lineWidth = 0.6
      ctx.stroke(batch)
    }

    // Night side (terminator + hatch, no opacity used).
    const [sunLon, sunLat] = subsolarPoint(new Date())
    const sun = lonLatToVector3(sunLon, sunLat)
    const night = nightRegion(basis, cx, cy, radius, sun)
    if (night.length >= 3) {
      if (!patternRef.current) patternRef.current = makeHatchPattern(ctx)
      if (patternRef.current) {
        ctx.beginPath()
        ctx.moveTo(night[0][0], night[0][1])
        for (let i = 1; i < night.length; i++) ctx.lineTo(night[i][0], night[i][1])
        ctx.closePath()
        ctx.fillStyle = patternRef.current
        ctx.fill()
      }
    }

    // Highlight the selected / hovered country.
    const highlight = hoveredRef.current?.cca3 ?? selectedCca3
    if (highlight) {
      const ring = screenRingsRef.current.get(highlight)
      if (ring) {
        ctx.beginPath()
        for (const polygon of ring) {
          ctx.moveTo(polygon[0][0], polygon[0][1])
          for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i][0], polygon[i][1])
          ctx.closePath()
        }
        ctx.fillStyle = '#e0a458'
        ctx.fill()
        ctx.strokeStyle = '#ffe6bf'
        ctx.lineWidth = 1.2
        ctx.stroke()
      }
    }

    // Labels — fit rule + logarithmic font law.
    if (showNames && prepared.length > 0) {
      // `base` is the *unzoomed* disc size. Geometry scales with zoom, so the
      // font gets only a logarithmic bump; otherwise the fit test would be
      // scale-invariant and zooming would never earn a small country a name.
      const fontPx = Math.max(8, Math.min(13, baseRadius * 0.044 * (1 + 0.28 * Math.log2(Math.max(1, zoom)))))
      ctx.font = `600 ${fontPx.toFixed(1)}px Inter, system-ui, -apple-system, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineJoin = 'round'
      const occupied: BBox[] = []

      for (const shape of drawOrder) {
        if (!shape.label) continue
        const depth = dot(shape.label, basis.forward)
        if (depth <= 0.3) continue
        const box = shapeBBoxRef.current.get(shape.cca3)
        if (!box) continue

        const boxW = box.maxX - box.minX
        const boxH = box.maxY - box.minY
        const text = shape.name
        const textWidth = ctx.measureText(text).width
        if (!(boxW >= textWidth * 0.95 && boxH >= fontPx * 1.1)) continue

        const anchor = project(shape.label, basis, cx, cy, radius)
        // Clamp the label x into the country's own bbox before drawing.
        const tx = clamp(anchor[0], box.minX, box.maxX)
        const ty = clamp(anchor[1], box.minY, box.maxY)
        const halfW = textWidth / 2
        const halfH = fontPx / 2
        const rect: BBox = { minX: tx - halfW - 2, minY: ty - halfH - 1, maxX: tx + halfW + 2, maxY: ty + halfH + 1 }

        // All four corners must sit inside the disc.
        const corners: Array<[number, number]> = [
          [rect.minX, rect.minY],
          [rect.maxX, rect.minY],
          [rect.minX, rect.maxY],
          [rect.maxX, rect.maxY],
        ]
        let insideDisc = true
        for (const [cornerX, cornerY] of corners) {
          if (Math.hypot(cornerX - cx, cornerY - cy) > radius) {
            insideDisc = false
            break
          }
        }
        if (!insideDisc) continue

        // Greedy, biggest-first: skip anything that overlaps a placed label.
        let collides = false
        for (const r of occupied) {
          if (rect.minX < r.maxX && rect.maxX > r.minX && rect.minY < r.maxY && rect.maxY > r.minY) {
            collides = true
            break
          }
        }
        if (collides) continue
        occupied.push(rect)

        ctx.strokeStyle = '#0b1220'
        ctx.lineWidth = 2.5
        ctx.strokeText(text, tx, ty)
        ctx.fillStyle = '#eef4ff'
        ctx.fillText(text, tx, ty)
      }
    }

    // Markers — emoji pins, skipped in low-power mode.
    markerScreenRef.current = []
    if (!lowPower && markers.length > 0) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const marker of markers) {
        const v = lonLatToVector3(marker.lon, marker.lat)
        const [x, y, z] = project(v, basis, cx, cy, radius)
        if (z <= 0.02) continue
        markerScreenRef.current.push({ marker, x, y })
        ctx.beginPath()
        ctx.arc(x, y, 11, 0, TWO_PI)
        ctx.fillStyle = '#0f1724'
        ctx.fill()
        ctx.strokeStyle = '#e0a458'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.font = '14px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(marker.emoji, x, y + 1)
      }
    }

    // Missing-atlas hint.
    if (prepared.length === 0 && emptyHint) {
      ctx.font = '600 14px Inter, system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#9fb3cc'
      ctx.fillText(emptyHint, cx, cy)
    }
  }

  const renderRef = useRef(render)
  renderRef.current = render

  useEffect(() => {
    dirtyRef.current = true
  }, [atlas, prepared, size, zoom, centerLon, centerLat, showNames, hovered, hoveredMarker, selectedCca3, lowPower, markers])

  /* --------------------------- render loop ------------------------ */

  useEffect(() => {
    let raf = 0
    let last = 0
    const loop = (now: number) => {
      const dt = last ? now - last : 0
      last = now
      // Only marker hover pauses the spin; country hover must not.
      const spinning =
        autoSpin && !reduceMotion && !hoveredMarkerRef.current && !draggingRef.current
      if (spinning) {
        setCenterLon((prev) => normalizeLon(prev + dt * 0.004))
        dirtyRef.current = true
      }
      if (dirtyRef.current) {
        dirtyRef.current = false
        try {
          renderRef.current()
          const canvas = canvasRef.current
          if (canvas) {
            canvas.dataset.frames = String((Number(canvas.dataset.frames) || 0) + 1)
          }
        } catch (err) {
          // A single bad frame must not kill the render loop.
          console.error('[Globe] render failed', err)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [autoSpin, reduceMotion])

  /* --------------------------- interaction ------------------------ */

  const localPoint = (event: ReactPointerEvent): [number, number] => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return [0, 0]
    return [event.clientX - rect.left, event.clientY - rect.top]
  }

  const hitTestMarker = (x: number, y: number): GlobeMarker | null => {
    for (const entry of markerScreenRef.current) {
      if (Math.hypot(entry.x - x, entry.y - y) <= 14) return entry.marker
    }
    return null
  }

  const hitTest = (x: number, y: number): Hovered | null => {
    // Reverse draw order: smallest countries win over large neighbours.
    for (let i = drawOrder.length - 1; i >= 0; i--) {
      const shape = drawOrder[i]
      const polygons = screenRingsRef.current.get(shape.cca3)
      if (!polygons) continue
      for (const polygon of polygons) {
        if (pointInRing(x, y, polygon)) {
          return { cca3: shape.cca3, name: shape.name }
        }
      }
    }
    return null
  }

  const positionTooltip = (x: number, y: number) => {
    const el = tooltipRef.current
    if (!el) return
    el.style.left = `${x}px`
    el.style.top = `${y}px`
  }

  const handlePointerDown = (event: ReactPointerEvent) => {
    if (event.button !== 0) return
    try {
      canvasRef.current?.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is best effort.
    }
    draggingRef.current = true
    setIsDragging(true)
    movedRef.current = false
    pointerDownRef.current = [event.clientX, event.clientY]
    lastPointerRef.current = [event.clientX, event.clientY]
  }

  const handlePointerMove = (event: ReactPointerEvent) => {
    if (draggingRef.current) {
      const dx = event.clientX - lastPointerRef.current[0]
      const dy = event.clientY - lastPointerRef.current[1]
      lastPointerRef.current = [event.clientX, event.clientY]
      if (
        Math.hypot(
          event.clientX - pointerDownRef.current[0],
          event.clientY - pointerDownRef.current[1]
        ) > CLICK_DRAG_THRESHOLD
      ) {
        movedRef.current = true
      }
      setCenterLon((prev) => prev - (dx * 0.25) / zoom)
      setCenterLat((prev) => clampLat(prev + (dy * 0.25) / zoom))
      dirtyRef.current = true
      return
    }

    const [x, y] = localPoint(event)
    const markerHit = hitTestMarker(x, y)
    if (markerHit?.id !== hoveredMarkerRef.current?.id) {
      setHoveredMarker(markerHit)
      dirtyRef.current = true
    }
    if (markerHit) {
      positionTooltip(x, y)
      setHoverPoint([x, y])
      if (hoveredRef.current) {
        setHovered(null)
        onHoverChange?.(null)
      }
      return
    }

    const hit = hitTest(x, y)
    positionTooltip(x, y)
    if (hit?.cca3 !== hoveredRef.current?.cca3) {
      setHovered(hit)
      setHoverPoint([x, y])
      onHoverChange?.(hit)
      dirtyRef.current = true
    }
  }

  const handlePointerUp = (event: ReactPointerEvent) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setIsDragging(false)
    try {
      canvasRef.current?.releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture is best effort.
    }
    if (movedRef.current) return
    const [x, y] = localPoint(event)
    const markerHit = hitTestMarker(x, y)
    if (markerHit) {
      onMarkerClick?.(markerHit)
      return
    }
    if (onCountryClick) {
      const hit = hitTest(x, y)
      if (hit) onCountryClick(hit.cca3)
    }
  }

  const handlePointerLeave = () => {
    if (draggingRef.current) return
    let changed = false
    if (hoveredRef.current) {
      setHovered(null)
      onHoverChange?.(null)
      changed = true
    }
    if (hoveredMarkerRef.current) {
      setHoveredMarker(null)
      changed = true
    }
    if (changed) dirtyRef.current = true
  }

  const zoomIn = () => {
    setZoom((prev) => clamp(prev * 1.35, MIN_ZOOM, MAX_ZOOM))
    dirtyRef.current = true
  }
  const zoomOut = () => {
    setZoom((prev) => clamp(prev / 1.35, MIN_ZOOM, MAX_ZOOM))
    dirtyRef.current = true
  }
  const resetView = () => {
    setZoom(MIN_ZOOM)
    setCenterLon(DEFAULT_VIEW_LNG)
    setCenterLat(DEFAULT_VIEW_LAT)
    dirtyRef.current = true
  }

  const cursor = hovered || hoveredMarker ? 'pointer' : isDragging ? 'grabbing' : 'grab'
  const tooltipLabel = hoveredMarker ? hoveredMarker.name : hovered?.name

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor,
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
      <ZoomControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        canZoomIn={zoom < MAX_ZOOM}
        canZoomOut={zoom > MIN_ZOOM}
      />
      {tooltipLabel ? (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            left: hoverPoint[0],
            top: hoverPoint[1],
            transform: 'translate(-50%, -140%)',
            padding: '3px 8px',
            borderRadius: 6,
            background: '#0f1724',
            border: '1px solid #3a4d66',
            color: '#eef4ff',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {tooltipLabel}
        </div>
      ) : null}
    </div>
  )
}
