#!/usr/bin/env node
/**
 * build-atlas.mjs
 *
 * Builds public/data/countries-110m.json from Natural Earth 110m admin-0
 * countries. Output shape:
 *
 *   {
 *     width: 1000,
 *     height: 500,
 *     source: "<geojson url>",
 *     shapes: [
 *       { cca3, name, d, rings: [ "<delta-encoded>", ... ], label: [lon, lat] },
 *       ...
 *     ]
 *   }
 *
 * - `d`      : Robinson-projected SVG path, simplified in pixel space (0.35 px).
 * - `rings`  : delta-encoded lon/lat rings (Q=10, base-36 deltas, comma joined)
 *              simplified in geographic space (0.25 deg).
 * - `label`  : sphere centroid of the largest ring, guaranteed to fall inside it.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const OUTPUT_ATLAS = path.join(rootDir, 'public', 'data', 'countries-110m.json');
const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

// If the network is unavailable, fall back to a previously recovered atlas.
const RECOVERY_CANDIDATES = [
  path.join(rootDir, 'scripts', 'recovery', 'countries-110m.atlas.json'),
  path.join(rootDir, 'recovery', 'countries-110m.atlas.json'),
  path.join(rootDir, 'countries-110m.atlas.json'),
];

const WIDTH = 1000;
const HEIGHT = 500;

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// `--globe-tolerance=<deg>` overrides the geographic (rings) tolerance.
let GEO_SIMPLIFY_TOLERANCE = 0.25; // degrees, for `rings`
const PIXEL_SIMPLIFY_TOLERANCE = 0.35; // pixels, for `d`

function readGlobeTolerance(argv) {
  const idx = argv.findIndex((a) => a === '--globe-tolerance' || a.startsWith('--globe-tolerance='));
  if (idx === -1) return;
  const raw = argv[idx].includes('=')
    ? argv[idx].slice('--globe-tolerance='.length)
    : argv[idx + 1];
  const value = Number(raw);
  if (Number.isFinite(value) && value > 0) {
    GEO_SIMPLIFY_TOLERANCE = value;
    console.log(`Using globe (rings) simplification tolerance: ${value} deg`);
  } else {
    console.warn(`Ignoring invalid --globe-tolerance value: ${raw}`);
  }
}

const QUANT = 10; // degrees -> integer quantisation factor
const BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz';

/* ------------------------------------------------------------------ */
/* Robinson projection                                                 */
/* ------------------------------------------------------------------ */

// Standard Robinson coefficient tables, one entry per 5 degrees of
// latitude from the equator (index 0) to the pole (index 18).
const ROBINSON_X = [
  1.0, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962,
  0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322,
];
const ROBINSON_Y = [
  0.0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571,
  0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1.0,
];

/**
 * Project a lon/lat coordinate with Robinson into pixel space.
 * @returns {[number, number]} [x, y]
 */
function robinsonProject(lon, lat) {
  // Normalise longitude to [-180, 180].
  let l = ((lon + 180) % 360) - 180;
  if (l < -180) l += 360;

  const clampedLat = Math.max(-90, Math.min(90, lat));
  const absLat = Math.abs(clampedLat);
  const index = Math.min(Math.floor(absLat / 5), 17);
  const t = (absLat - index * 5) / 5;

  const xCoef = ROBINSON_X[index] + (ROBINSON_X[index + 1] - ROBINSON_X[index]) * t;
  const yCoef = ROBINSON_Y[index] + (ROBINSON_Y[index + 1] - ROBINSON_Y[index]) * t;

  const lambda = l * DEG2RAD;
  const xNorm = xCoef * lambda; // in [-pi * xCoef, pi * xCoef]
  const yNorm = clampedLat < 0 ? -yCoef : yCoef; // in [-1, 1]

  const x = WIDTH / 2 + (xNorm / (2 * Math.PI)) * WIDTH;
  const y = HEIGHT / 2 - (yNorm / 2) * HEIGHT;
  return [x, y];
}

/* ------------------------------------------------------------------ */
/* Geometric helpers                                                   */
/* ------------------------------------------------------------------ */

/** Squared distance from p to segment ab. */
function distToSegmentSq(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) {
    const ex = p[0] - a[0];
    const ey = p[1] - a[1];
    return ex * ex + ey * ey;
  }
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  const cx = a[0] + t * dx;
  const cy = a[1] + t * dy;
  const ex = p[0] - cx;
  const ey = p[1] - cy;
  return ex * ex + ey * ey;
}

/**
 * Iterative Douglas-Peucker simplification. Points are [x, y] pairs.
 * `closed` keeps the ring closed (first/last may coincide).
 */
function douglasPeucker(points, epsilon) {
  if (points.length <= 2 || epsilon <= 0) return points.slice();

  const epsSq = epsilon * epsilon;
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop();
    if (last <= first + 1) continue;

    let maxDistSq = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = distToSegmentSq(points[i], points[first], points[last]);
      if (d > maxDistSq) {
        maxDistSq = d;
        index = i;
      }
    }

    if (maxDistSq > epsSq && index !== -1) {
      keep[index] = true;
      stack.push([first, index]);
      stack.push([index, last]);
    }
  }

  const out = [];
  for (let i = 0; i < points.length; i++) {
    if (keep[i]) out.push(points[i]);
  }
  return out;
}

/**
 * Simplify a lon/lat ring. The ring is temporarily unwrapped so that
 * Douglas-Peucker measures true distances, then longitudes are wrapped
 * back into [-180, 180] for storage.
 */
function simplifyLonLatRing(ring, epsilonDeg) {
  if (ring.length <= 2) return ring.map((p) => [wrapLon(p[0]), p[1]]);
  const unwrapped = unwrapRing(ring);
  const simplified = douglasPeucker(unwrapped, epsilonDeg);
  return simplified.map((p) => [wrapLon(p[0]), p[1]]);
}

/** Wrap a longitude into [-180, 180). */
function wrapLon(lon) {
  let l = ((lon + 180) % 360) - 180;
  if (l < -180) l += 360;
  return l;
}

/** Unwrap longitudes so consecutive points differ by less than 180 deg. */
function unwrapRing(ring) {
  const out = [];
  let prevLon = null;
  for (const p of ring) {
    let lon = p[0];
    if (prevLon !== null) {
      while (lon - prevLon > 180) lon -= 360;
      while (lon - prevLon < -180) lon += 360;
    }
    out.push([lon, p[1]]);
    prevLon = lon;
  }
  return out;
}

/** Longitude span of a ring, in [0, 360). */
function ringSpan(ring) {
  if (ring.length < 2) return 0;
  let min = Infinity;
  let max = -Infinity;
  for (const p of ring) {
    if (p[0] < min) min = p[0];
    if (p[0] > max) max = p[0];
  }
  return max - min;
}

/**
 * Normalise a ring for delta encoding.
 * - span >= 350    : Antarctica guard, single copy only.
 * - span in (180, 350): duplicate with +/- 360 shifts.
 * - otherwise      : single copy.
 * @returns {number[][][]} array of rings
 */
function normaliseRing(ring) {
  const base = ring.map((p) => [p[0], p[1]]);
  const span = ringSpan(base);
  if (span >= 350) return [base];
  if (span > 180 && span < 350) {
    const plus = base.map((p) => [p[0] + 360, p[1]]);
    const minus = base.map((p) => [p[0] - 360, p[1]]);
    return [base, plus, minus];
  }
  return [base];
}

/* ------------------------------------------------------------------ */
/* Sphere centroid + point-in-ring                                     */
/* ------------------------------------------------------------------ */

function sphereCentroid(ring) {
  if (!ring || ring.length === 0) return [0, 0];
  if (ring.length < 3) return [ring[0][0], ring[0][1]];

  let cx = 0;
  let cy = 0;
  let cz = 0;
  let area = 0;

  for (let i = 0; i < ring.length; i++) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % ring.length];
    const lat1 = p1[1] * DEG2RAD;
    const lon1 = p1[0] * DEG2RAD;
    const lat2 = p2[1] * DEG2RAD;
    const lon2 = p2[0] * DEG2RAD;

    const x1 = Math.cos(lat1) * Math.cos(lon1);
    const y1 = Math.cos(lat1) * Math.sin(lon1);
    const z1 = Math.sin(lat1);
    const x2 = Math.cos(lat2) * Math.cos(lon2);
    const y2 = Math.cos(lat2) * Math.sin(lon2);
    const z2 = Math.sin(lat2);

    const nx = y1 * z2 - z1 * y2;
    const ny = z1 * x2 - x1 * z2;
    const nz = x1 * y2 - y1 * x2;

    cx += nx;
    cy += ny;
    cz += nz;
    area += Math.hypot(nx, ny, nz) / 2;
  }

  const len = Math.hypot(cx, cy, cz);
  if (len < 1e-12 || area < 1e-12) {
    // Fall back to a plain average.
    let sx = 0;
    let sy = 0;
    for (const p of ring) {
      sx += p[0];
      sy += p[1];
    }
    return [sx / ring.length, sy / ring.length];
  }

  cx /= len;
  cy /= len;
  cz /= len;

  const lat = Math.asin(Math.max(-1, Math.min(1, cz))) * RAD2DEG;
  let lon = Math.atan2(cy, cx) * RAD2DEG;
  return [lon, lat];
}

/** Ray-casting point-in-polygon for a planar ring. */
function pointInRing(point, ring) {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Compute a label for the largest ring and make sure it lies inside the
 * polygon. If the centroid falls outside a concave shape, fall back to a
 * coarse grid search over the ring's bounding box.
 */
function computeLabel(rings) {
  if (rings.length === 0) return [0, 0];
  // Work on the quantised coordinates, because that is exactly what the
  // consumer decodes from the delta-encoded `rings` strings.
  const quantise = (p) => [
    Math.round(p[0] * QUANT) / QUANT,
    Math.round(p[1] * QUANT) / QUANT,
  ];
  const prepared = rings.map((ring) => ring.map(quantise));
  const largest = prepared.reduce((a, b) => (b.length > a.length ? b : a), prepared[0]);
  let planar = unwrapRing(largest);

  // Re-center wide rings (e.g. Antarctica) so the seam does not confuse
  // the point-in-polygon test.
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const p of planar) {
    if (p[0] < minLon) minLon = p[0];
    if (p[0] > maxLon) maxLon = p[0];
  }
  const shift = -360 * Math.round((minLon + maxLon) / 2 / 360);
  if (shift !== 0) planar = planar.map((p) => [p[0] + shift, p[1]]);

  // Candidate from the sphere centroid, unwrapped to match the planar ring.
  const [cLon, cLat] = sphereCentroid(largest);
  const candidate = [alignLon(cLon, planar[0][0]), cLat];

  if (pointInRing(candidate, planar)) {
    return [normaliseLon(candidate[0]), round6(candidate[1])];
  }

  // Grid fallback: sample the bounding box and choose the inside sample
  // nearest to the centroid candidate.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of planar) {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }

  const N = 48;
  let best = null;
  let bestDistSq = Infinity;
  for (let i = 1; i < N; i++) {
    for (let j = 1; j < N; j++) {
      const x = minX + ((maxX - minX) * i) / N;
      const y = minY + ((maxY - minY) * j) / N;
      const pt = [x, y];
      if (!pointInRing(pt, planar)) continue;
      const dx = x - candidate[0];
      const dy = y - candidate[1];
      const d = dx * dx + dy * dy;
      if (d < bestDistSq) {
        bestDistSq = d;
        best = pt;
      }
    }
  }

  if (best) return [normaliseLon(best[0]), round6(best[1])];
  // Last resort: use the first vertex.
  return [normaliseLon(planar[0][0]), round6(planar[0][1])];
}

function alignLon(lon, referenceLon) {
  let l = lon;
  while (l - referenceLon > 180) l -= 360;
  while (l - referenceLon < -180) l += 360;
  return l;
}

function normaliseLon(lon) {
  let l = ((lon + 180) % 360) - 180;
  if (l < -180) l += 360;
  return round6(l);
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

/* ------------------------------------------------------------------ */
/* Delta / base-36 encoding                                            */
/* ------------------------------------------------------------------ */

function toBase36(n) {
  let value = Math.trunc(n);
  if (value === 0) return '0';
  const negative = value < 0;
  value = Math.abs(value);
  let out = '';
  while (value > 0) {
    out = BASE36[value % 36] + out;
    value = Math.floor(value / 36);
  }
  return negative ? '-' + out : out;
}

/**
 * Encode rings as comma-joined base-36 deltas.
 * Quantise deg * QUANT (rounded), then delta from the previous point.
 * The very first delta is relative to (0, 0).
 */
function encodeRings(rings) {
  return rings.map((ring) => {
    if (ring.length === 0) return '';
    let prevX = 0;
    let prevY = 0;
    const tokens = [];
    for (const p of ring) {
      const qx = Math.round(p[0] * QUANT);
      const qy = Math.round(p[1] * QUANT);
      tokens.push(toBase36(qx - prevX), toBase36(qy - prevY));
      prevX = qx;
      prevY = qy;
    }
    return tokens.join(',');
  });
}

/* ------------------------------------------------------------------ */
/* Path building                                                       */
/* ------------------------------------------------------------------ */

function ringToPath(ring) {
  // Project, then simplify in pixel space.
  const projected = ring.map((p) => robinsonProject(p[0], p[1]));
  const simplified = douglasPeucker(projected, PIXEL_SIMPLIFY_TOLERANCE);
  if (simplified.length === 0) return '';
  let d = '';
  for (let i = 0; i < simplified.length; i++) {
    const [x, y] = simplified[i];
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
    if (i < simplified.length - 1) d += ' ';
  }
  return d + 'Z';
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

async function fetchJson(url) {
  if (typeof globalThis.fetch === 'function') {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    return res.json();
  }
  const https = await import('https');
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function restoreFromRecovery() {
  for (const src of RECOVERY_CANDIDATES) {
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(OUTPUT_ATLAS), { recursive: true });
      fs.copyFileSync(src, OUTPUT_ATLAS);
      console.warn(`Network unavailable; restored atlas from recovery: ${src}`);
      return true;
    }
  }
  return false;
}

function collectSourceRings(geometry) {
  const rings = [];
  if (!geometry) return rings;
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates || []) rings.push(ring);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates || []) {
      for (const ring of polygon || []) rings.push(ring);
    }
  }
  return rings;
}

function pickCountryCode(props) {
  const candidates = [props.ISO_A3, props.iso_a3, props.ADM0_A3, props.SOV_A3];
  for (const c of candidates) {
    if (c && c !== '-99' && c !== '-099') return String(c).toUpperCase();
  }
  return '';
}

function pickCountryName(props) {
  return (
    props.NAME_EN ||
    props.NAME ||
    props.name ||
    props.ADMIN ||
    props.SOVEREIGNT ||
    'Unknown'
  );
}

async function main() {
  readGlobeTolerance(process.argv.slice(2));
  console.log('Fetching Natural Earth 110m countries...');
  const geojson = await fetchJson(SOURCE_URL);
  const features = Array.isArray(geojson.features) ? geojson.features : [];
  console.log(`Processing ${features.length} features...`);

  const shapes = [];

  for (const feature of features) {
    const props = feature.properties || {};
    const cca3 = pickCountryCode(props);
    const name = pickCountryName(props);
    const sourceRings = collectSourceRings(feature.geometry);
    if (!cca3 || sourceRings.length === 0) continue;

    // --- rings: geographic simplification (0.25 deg) then normalise/encode
    const encoded = [];
    for (const raw of sourceRings) {
      const simplified = simplifyLonLatRing(raw, GEO_SIMPLIFY_TOLERANCE);
      if (simplified.length < 2) continue;
      for (const variant of normaliseRing(simplified)) {
        encoded.push(variant);
      }
    }
    if (encoded.length === 0) continue;

    // --- d: pixel simplification (0.35 px) of every source ring
    const segments = [];
    for (const raw of sourceRings) {
      const seg = ringToPath(raw);
      if (seg) segments.push(seg);
    }
    const d = segments.join(' ');

    // --- label: centroid of the largest encoded ring, guaranteed inside
    const label = computeLabel(encoded);

    shapes.push({
      cca3,
      name,
      d,
      rings: encodeRings(encoded),
      label,
    });
  }

  const atlas = {
    width: WIDTH,
    height: HEIGHT,
    source: SOURCE_URL,
    shapes,
  };

  fs.mkdirSync(path.dirname(OUTPUT_ATLAS), { recursive: true });
  fs.writeFileSync(OUTPUT_ATLAS, JSON.stringify(atlas));

  console.log(`Wrote ${shapes.length} shapes to ${OUTPUT_ATLAS}`);
  if (shapes.length !== 177) {
    console.warn(`Warning: expected 177 shapes, got ${shapes.length}`);
  }
}

main().catch((err) => {
  console.error('Error building atlas:', err);
  if (restoreFromRecovery()) return;
  process.exit(1);
});
