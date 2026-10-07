#!/usr/bin/env node
/**
 * build-icons.mjs
 *
 * Generates every app icon, favicon and social card from code so the asset set
 * can never drift from the palette declared in `src/index.css`.
 *
 * Deliberately dependency-free: PNG encoding uses Node's built-in `zlib`, and
 * the glyphs below are a hand-rolled 5x7 bitmap font. This keeps `npm ci`
 * reproducible (see docs/agents/P0-EVIDENCE.md) and avoids an image toolchain.
 *
 * Palette (mirrors the --ge-* custom properties in src/index.css):
 *   bg      #0b111c   --ge-bg
 *   raised  #16212f   --ge-surface-raised
 *   accent  #5aa0ff   --ge-accent
 *   text    #eef4ff   --ge-text
 *
 * Run: npm run icons
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const PALETTE = {
  bg: [0x0b, 0x11, 0x1c],
  raised: [0x16, 0x21, 0x2f],
  accent: [0x5a, 0xa0, 0xff],
  text: [0xee, 0xf4, 0xff],
};

/** Supersampling factor per axis. 4x4 samples is plenty for these shapes. */
const SS = 4;

// ---------------------------------------------------------------------------
// PNG encoding
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Encode an RGBA byte array (w*h*4) as a PNG buffer. */
function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (None)
    for (let i = 0; i < stride; i++) raw[y * (stride + 1) + 1 + i] = rgba[y * stride + i];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: truecolour with alpha
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Tiny rasterizer
// ---------------------------------------------------------------------------

function createCanvas(w, h) {
  return { w, h, data: new Uint8Array(w * h * 4) };
}

/** Paint every pixel where `test(x, y)` is true, in supersampled pixel space. */
function draw(canvas, test, color) {
  const [r, g, b] = color;
  for (let y = 0; y < canvas.h; y++) {
    for (let x = 0; x < canvas.w; x++) {
      if (!test(x + 0.5, y + 0.5)) continue;
      const i = (y * canvas.w + x) * 4;
      canvas.data[i] = r;
      canvas.data[i + 1] = g;
      canvas.data[i + 2] = b;
      canvas.data[i + 3] = 255;
    }
  }
}

/**
 * Box-filter the supersampled canvas down to 1/SS size. Alpha is averaged in
 * premultiplied space so rounded corners do not pick up dark fringes.
 */
function resolve(canvas) {
  const w = canvas.w / SS;
  const h = canvas.h / SS;
  const out = new Uint8Array(w * h * 4);
  const samples = SS * SS;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * canvas.w + (x * SS + sx)) * 4;
          const alpha = canvas.data[i + 3] / 255;
          if (alpha === 0) continue;
          r += canvas.data[i] * alpha;
          g += canvas.data[i + 1] * alpha;
          b += canvas.data[i + 2] * alpha;
          a += alpha;
        }
      }
      const o = (y * w + x) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
      out[o + 3] = Math.round((255 * a) / samples);
    }
  }
  return { w, h, data: out };
}

// ---------------------------------------------------------------------------
// Shapes (all in supersampled pixel space)
// ---------------------------------------------------------------------------

/** Signed-distance test for a rounded rectangle centred in the canvas. */
function roundedRect(w, h, radius) {
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(radius, hw, hh);
  return (x, y) => {
    const qx = Math.abs(x - hw) - (hw - r);
    const qy = Math.abs(y - hh) - (hh - r);
    const outside =
      Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    return outside <= 0;
  };
}

/**
 * The app mark: a globe outline with one meridian, the equator and two latitude
 * chords. Kept deliberately sparse so it stays legible at 16px.
 */
function globe(cx, cy, radius, stroke) {
  const meridianA = radius * 0.46;
  const latitudes = [0.5, -0.5];
  return (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy);
    if (d > radius) return false;
    if (Math.abs(d - radius) <= stroke) return true;
    // Vertical meridian: an ellipse ring squashed horizontally.
    const q = Math.hypot(dx / meridianA, dy / radius);
    if (Math.abs(q - 1) * meridianA <= stroke * 0.8) return true;
    // Equator.
    if (Math.abs(dy) <= stroke * 0.8) return true;
    // Latitude chords (already clipped by the `d > radius` guard above).
    for (const f of latitudes) {
      if (Math.abs(dy - f * radius) <= stroke * 0.7) return true;
    }
    return false;
  };
}

/** Axis-aligned solid bar, used for the social card's accent rules. */
function bar(x0, y0, w, h) {
  return (x, y) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h;
}

// ---------------------------------------------------------------------------
// 5x7 bitmap font (A-Z and space) for the social card wordmark
// ---------------------------------------------------------------------------

const GLYPHS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

const GLYPH_W = 5;
const GLYPH_H = 7;
const GLYPH_GAP = 1;

function measureText(text, scale) {
  return text.length * (GLYPH_W + GLYPH_GAP) * scale - GLYPH_GAP * scale;
}

function drawText(canvas, text, left, top, scale, color) {
  let cursor = left;
  for (const rawChar of text.toUpperCase()) {
    const glyph = GLYPHS[rawChar];
    if (!glyph) throw new Error(`build-icons: no glyph for "${rawChar}"`);
    for (let gy = 0; gy < GLYPH_H; gy++) {
      for (let gx = 0; gx < GLYPH_W; gx++) {
        if (glyph[gy][gx] !== '#') continue;
        draw(canvas, bar(cursor + gx * scale, top + gy * scale, scale, scale), color);
      }
    }
    cursor += (GLYPH_W + GLYPH_GAP) * scale;
  }
}

// ---------------------------------------------------------------------------
// Icon compositions
// ---------------------------------------------------------------------------

/** Paint the globe mark, in supersampled pixel space, at any position. */
function paintMark(canvas, cx, cy, radius) {
  draw(canvas, globe(cx, cy, radius, radius * 0.175), PALETTE.accent);
}

/**
 * @param {number} size final edge length in px
 * @param {'squircle'|'square'|'maskable'} shape
 */
function renderIcon(size, shape) {
  const s = size * SS;
  const canvas = createCanvas(s, s);

  if (shape === 'squircle') {
    draw(canvas, roundedRect(s, s, s * 0.2237), PALETTE.bg);
  } else {
    draw(canvas, bar(0, 0, s, s), PALETTE.bg);
  }

  // Maskable icons must keep their content inside the centre 80% safe zone.
  const radius = s * (shape === 'maskable' ? 0.24 : 0.3);
  paintMark(canvas, s / 2, s / 2, radius);

  return resolve(canvas);
}

function renderSocialCard() {
  const w = 1200 * SS;
  const h = 630 * SS;
  const canvas = createCanvas(w, h);

  draw(canvas, bar(0, 0, w, h), PALETTE.bg);
  draw(canvas, bar(0, 0, w, 6 * SS), PALETTE.accent);

  // Mark: 200px across, centred horizontally, top edge at y=120.
  const markRadius = 100 * SS;
  paintMark(canvas, w / 2, 120 * SS + markRadius, markRadius);

  const title = 'GLOBAL EXPLORER';
  const scale = 9 * SS;
  drawText(
    canvas,
    title,
    Math.round((w - measureText(title, scale)) / 2),
    400 * SS,
    scale,
    PALETTE.text,
  );

  const ruleW = 160 * SS;
  draw(canvas, bar((w - ruleW) / 2, 495 * SS, ruleW, 6 * SS), PALETTE.accent);

  return resolve(canvas);
}

// ---------------------------------------------------------------------------
// ICO container (PNG-compressed entries, supported by every current browser)
// ---------------------------------------------------------------------------

function encodeIco(images) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(images.length, 4);

  const entries = [];
  const payloads = [];
  let offset = 6 + images.length * 16;

  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // palette size
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    payloads.push(png);
    offset += png.length;
  }

  return Buffer.concat([dir, ...entries, ...payloads]);
}

// ---------------------------------------------------------------------------
// Vector + manifest-friendly SVG source
// ---------------------------------------------------------------------------

function globeSvg(size, r) {
  const cx = size / 2;
  const stroke = r * 0.175;
  const latitudes = [0.5, -0.5].map((f) => {
    const y = cx + f * r;
    const half = Math.sqrt(1 - f * f) * r;
    return `    <line x1="${(cx - half).toFixed(2)}" y1="${y.toFixed(2)}" x2="${(cx + half).toFixed(2)}" y2="${y.toFixed(2)}" />`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Global Explorer">
  <g fill="none" stroke="#5aa0ff" stroke-width="${stroke.toFixed(2)}" stroke-linecap="round">
    <circle cx="${cx}" cy="${cx}" r="${r}" />
    <ellipse cx="${cx}" cy="${cx}" rx="${(r * 0.46).toFixed(2)}" ry="${r}" />
    <line x1="${(cx - r).toFixed(2)}" y1="${cx}" x2="${(cx + r).toFixed(2)}" y2="${cx}" />
${latitudes.join('\n')}
  </g>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Android launcher icons (Capacitor)
// ---------------------------------------------------------------------------

const ANDROID_RES = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

/** [density suffix, legacy icon px, adaptive foreground px] */
const ANDROID_DENSITIES = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
];

/** Legacy round icon: the launcher masks this to a circle. */
function renderRoundIcon(size) {
  const s = size * SS;
  const canvas = createCanvas(s, s);
  draw(canvas, (x, y) => Math.hypot(x - s / 2, y - s / 2) <= s / 2 - 0.5, PALETTE.bg);
  paintMark(canvas, s / 2, s / 2, s * 0.3);
  return resolve(canvas);
}

/**
 * Adaptive-icon foreground: transparent, because the background layer supplies
 * the fill. Launchers may crop the outer 18/108 on each side, so the mark is
 * kept inside the inner ~58% to survive every mask shape.
 */
function renderAdaptiveForeground(size) {
  const s = size * SS;
  const canvas = createCanvas(s, s);
  paintMark(canvas, s / 2, s / 2, s * 0.29);
  return resolve(canvas);
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

function emit(label, target, buffer) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buffer);
  const kb = (buffer.length / 1024).toFixed(1);
  console.log(`  ${label.padEnd(28)} ${kb.padStart(7)} KB`);
}

function write(fileName, buffer) {
  emit(fileName, path.join(publicDir, fileName), buffer);
}

/** Brand the Capacitor launcher, skipping cleanly when the platform is absent. */
function writeAndroidLauncherIcons() {
  if (!fs.existsSync(ANDROID_RES)) return;
  console.log('build-icons: generating Android launcher icons into android/');

  for (const [density, legacy, adaptive] of ANDROID_DENSITIES) {
    const dir = path.join(ANDROID_RES, `mipmap-${density}`);
    emit(
      `mipmap-${density}/ic_launcher.png`,
      path.join(dir, 'ic_launcher.png'),
      encodeIcon(legacy, 'squircle'),
    );
    emit(
      `mipmap-${density}/ic_launcher_round.png`,
      path.join(dir, 'ic_launcher_round.png'),
      encodePng(legacy, legacy, renderRoundIcon(legacy).data),
    );
    emit(
      `mipmap-${density}/ic_launcher_foreground.png`,
      path.join(dir, 'ic_launcher_foreground.png'),
      encodePng(adaptive, adaptive, renderAdaptiveForeground(adaptive).data),
    );
  }

  // The adaptive background layer is a flat colour resource.
  emit(
    'values/ic_launcher_background.xml',
    path.join(ANDROID_RES, 'values', 'ic_launcher_background.xml'),
    Buffer.from(
      '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<resources>\n' +
        `    <color name="ic_launcher_background">${rgbHex(PALETTE.bg)}</color>\n` +
        '</resources>\n',
      'utf8',
    ),
  );
}

function rgbHex([r, g, b]) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Render a square icon and encode it straight to a PNG buffer. */
function encodeIcon(size, shape) {
  const image = renderIcon(size, shape);
  return encodePng(image.w, image.h, image.data);
}

function main() {
  console.log('build-icons: generating app icons into public/');

  // Chrome install icons. PNG is required here; SVG is not accepted.
  write('android-chrome-192x192.png', encodeIcon(192, 'squircle'));
  write('android-chrome-512x512.png', encodeIcon(512, 'squircle'));

  // Android adaptive icons: content inside the 80% safe zone, full bleed.
  write('maskable-192x192.png', encodeIcon(192, 'maskable'));
  write('maskable-512x512.png', encodeIcon(512, 'maskable'));

  // iOS home screen icons: opaque squares, iOS applies its own mask.
  write('apple-touch-icon.png', encodeIcon(180, 'square'));
  write('apple-touch-icon-152x152.png', encodeIcon(152, 'square'));
  write('apple-touch-icon-167x167.png', encodeIcon(167, 'square'));
  write('apple-touch-icon-180x180.png', encodeIcon(180, 'square'));

  write('favicon-16x16.png', encodeIcon(16, 'squircle'));
  write('favicon-32x32.png', encodeIcon(32, 'squircle'));
  write('favicon-48x48.png', encodeIcon(48, 'squircle'));

  write(
    'favicon.ico',
    encodeIco([
      { size: 16, png: encodeIcon(16, 'squircle') },
      { size: 32, png: encodeIcon(32, 'squircle') },
      { size: 48, png: encodeIcon(48, 'squircle') },
    ]),
  );

  write('favicon.svg', Buffer.from(globeSvg(512, 154), 'utf8'));

  const card = renderSocialCard();
  write('og-image.png', encodePng(card.w, card.h, card.data));

  writeAndroidLauncherIcons();

  console.log('build-icons: done');
}

main();