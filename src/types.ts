export type AtlasShape = {
  cca3: string
  name: string
  d: string // Robinson SVG path, always non-empty
  rings?: string[] // lon/lat, delta-encoded - required for globe fill
  label?: [number, number] // preferred label anchor [lon, lat]
  centroid?: [number, number]
  /** Draw/hit-test priority from Natural Earth; higher = larger. */
  rank?: number
}

export type Atlas = {
  width: number
  height: number
  source: string
  shapes: AtlasShape[]
}