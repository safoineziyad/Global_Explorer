import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const readJson = (rel) => JSON.parse(read(rel))
const exists = (rel) => fs.existsSync(path.join(root, rel))

/**
 * Root-absolute URLs in the manifest and index.html are served from `public/`,
 * so they resolve there rather than at the repo root. Remote URLs are skipped.
 */
function assetPath(url) {
  if (/^(?:https?:)?\/\//i.test(url)) return null
  return path.join('public', url.replace(/^\//, ''))
}

const assetExists = (url) => {
  const rel = assetPath(url)
  return rel !== null && exists(rel)
}

const manifest = readJson('public/site.webmanifest')
const html = read('index.html')
const css = read('src/index.css')

/** Width/height straight out of the PNG IHDR chunk (after sig + length + type). */
function pngSize(file) {
  const buf = fs.readFileSync(path.join(root, file))
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  assert.ok(buf.subarray(0, 8).equals(signature), `${file} is not a PNG`)
  assert.equal(buf.toString('latin1', 12, 16), 'IHDR', `${file} has no IHDR chunk`)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

test('web manifest declares the fields installability requires', () => {
  assert.equal(manifest.id, '/')
  assert.equal(manifest.name, 'Global Explorer')
  assert.ok(manifest.short_name && manifest.short_name.length > 0)
  assert.equal(manifest.start_url, '/')
  assert.equal(manifest.scope, '/')
  assert.equal(manifest.display, 'standalone')
  assert.ok(manifest.description && manifest.description.length > 0)
})

test('manifest colours match the palette in src/index.css', () => {
  const bg = /--ge-bg:\s*(#[0-9a-f]{6})/i.exec(css)
  assert.ok(bg, '--ge-bg not found in src/index.css')
  assert.equal(manifest.background_color, bg[1].toLowerCase())
  assert.equal(manifest.theme_color, bg[1].toLowerCase())
})

test('manifest ships a 192 and a 512 PNG plus a maskable variant', () => {
  const pngs = manifest.icons.filter((icon) => icon.type === 'image/png')
  const sizes = pngs.map((icon) => icon.sizes)
  assert.ok(sizes.includes('192x192'), `no 192x192 PNG in ${sizes.join(', ')}`)
  assert.ok(sizes.includes('512x512'), `no 512x512 PNG in ${sizes.join(', ')}`)
  const maskable = pngs.filter((icon) => String(icon.purpose).includes('maskable'))
  assert.ok(maskable.length >= 2, 'expected 192 and 512 maskable icons')
})

test('every manifest icon exists on disk at its declared size', () => {
  for (const icon of manifest.icons) {
    const rel = assetPath(icon.src)
    assert.ok(rel !== null, `icon src must be local, got ${icon.src}`)
    assert.ok(exists(rel), `missing icon file: ${rel}`)
    if (icon.type !== 'image/png') continue
    const [w, h] = icon.sizes.split('x')
    const { width, height } = pngSize(rel)
    assert.equal(width, Number(w), `${rel} is ${width}px wide, manifest says ${w}`)
    assert.equal(height, Number(h), `${rel} is ${height}px tall, manifest says ${h}`)
  }
})

test('manifest shortcuts point at real client-side routes', () => {
  const app = read('src/App.tsx')
  for (const shortcut of manifest.shortcuts ?? []) {
    assert.ok(
      app.includes(`path="${shortcut.url}"`),
      `shortcut ${shortcut.url} has no matching route in App.tsx`,
    )
  }
})

test('manifest and install assets are referenced from index.html', () => {
  assert.match(html, /<link rel="manifest" href="\/site\.webmanifest"/)
  assert.match(html, /<meta name="theme-color" content="#0b111c"/)
  assert.match(html, /<link rel="apple-touch-icon"/)
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes"/)
  assert.match(html, /<meta name="apple-mobile-web-app-status-bar-style"/)
  assert.match(html, /<meta property="og:image"/)
  // Every referenced icon path must actually exist.
  for (const match of html.matchAll(/(?:href|content)="(\/[a-z0-9.-]+\.(?:png|svg|ico|webmanifest))"/gi)) {
    assert.ok(assetExists(match[1]), `index.html references missing ${match[1]}`)
  }
})

test('index.html stays free of inline scripts (CSP script-src is self only)', () => {
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/gi)]
  assert.equal(inline.length, 0, 'inline <script> would be blocked by the CSP')
})

test('service worker precaches the shell and both datasets', () => {
  const sw = read('public/sw.js')
  // A placeholder that the build rewrites, so every deploy produces a worker
  // the browser recognises as changed and re-precaches from.
  assert.match(sw, /const VERSION = 'build'/)
  assert.match(sw, /'\/index\.html'/)
  assert.match(sw, /'\/data\/countries\.json'/)
  assert.match(sw, /'\/data\/countries-110m\.json'/)
  assert.ok(exists('public/data/countries.json'))
  assert.ok(exists('public/data/countries-110m.json'))
  // The worker must not auto-activate, or a deploy would swap assets mid-session.
  assert.ok(!/install[\s\S]{0,200}skipWaiting\(\)/.test(sw), 'skipWaiting must wait for a SKIP_WAITING message')
})

test('the build emits a complete precache manifest for every route chunk', () => {
  const config = read('vite.config.ts')
  assert.match(config, /ge-pwa-precache-manifest/, 'vite.config.ts must register the plugin')
  assert.match(config, /apply:\s*'build'/, 'the plugin must not run in dev')
  assert.match(config, /sw-manifest\.json/)
  assert.match(config, /closeBundle/, 'must run after Vite copies public/ into dist')
  assert.match(config, /createHash\('sha256'\)/, 'the worker version must derive from the build')

  const sw = read('public/sw.js')
  // Without the full manifest an unvisited lazy chunk cannot be served offline,
  // and a failed dynamic import leaves Suspense hanging on a blank page.
  assert.match(sw, /fetch\('\/sw-manifest\.json'/)
  assert.match(sw, /await cacheAll\(urls\)/)
})

test('every cache lookup ignores Vary, or CORS subresources fall back to the network', () => {
  const sw = read('public/sw.js')

  // The proxy adds `Vary: Origin` to everything. The precached copy was stored
  // from a plain fetch, which sends no Origin header, while dist/index.html
  // marks the entry script and stylesheet `crossorigin`, so those requests do
  // send one and never match. Every offline load rendered a blank page with
  // 502s for exactly those two assets.
  assert.match(sw, /const MATCH = \{ ignoreVary: true \}/, 'MATCH must set ignoreVary')
  assert.match(sw, /crossorigin/, 'the comment must name the trigger')

  const mismatches = sw
    .split('\n')
    .filter((line) => /^\s*(?:\/\/|\*|\/\*)/.test(line) === false)
    .filter((line) => /\.match\(/.test(line) && !/ignoreVary|MATCH\)/.test(line))
  assert.deepStrictEqual(mismatches, [], 'cache.match must always use MATCH')
})

test('service worker leaves cross-origin API traffic network-only', () => {
  const sw = read('public/sw.js')
  const guard = sw.indexOf('url.origin !== self.location.origin')
  assert.ok(guard > -1, 'cross-origin requests must be left to the network')
  assert.ok(sw.indexOf('handleNavigate') < sw.indexOf('url.origin !== self.location.origin') + 400)
})

test('navigations fall back to the cached shell on a 5xx, not just a dead socket', () => {
  const sw = read('public/sw.js')
  // `fetch` resolves on a 5xx instead of rejecting, so an outage handled only in
  // the catch branch would render a raw proxy/host error page to the user.
  assert.match(sw, /response\.status >= 500/, 'no 5xx branch in the navigation handler')
  const branch = sw.slice(sw.indexOf('response.status >= 500'), sw.indexOf('response.status >= 500') + 200)
  assert.match(branch, /cachedShell/, 'the 5xx branch must serve the cached shell')
})

/** The five host configs that must all agree on CSP and worker caching. */
const HOST_CONFIGS = [
  'netlify.toml',
  'vercel.json',
  'public/_headers',
  'public/.htaccess',
  'public/staticwebapp.config.json',
]

test('every host config allows the manifest and the worker', () => {
  for (const file of HOST_CONFIGS) {
    const contents = read(file)
    assert.match(contents, /manifest-src 'self'/, `${file} is missing manifest-src 'self'`)
    assert.match(contents, /worker-src 'self'/, `${file} is missing worker-src 'self'`)
  }
})

test('every host config serves sw.js and the manifest uncached', () => {
  for (const file of HOST_CONFIGS) {
    const lines = read(file).split(/\r?\n/)
    const index = lines.findIndex((line) => /sw\.js/.test(line))
    assert.ok(index > -1, `${file} has no Cache-Control rule for sw.js`)
    const rule = lines.slice(index, index + 8).join('\n')
    assert.match(rule, /no-cache/, `${file} must not let sw.js be cached`)

    const manifestIndex = lines.findIndex((line) => /site\.webmanifest/.test(line))
    assert.ok(manifestIndex > -1, `${file} has no Cache-Control rule for site.webmanifest`)
    assert.match(
      lines.slice(manifestIndex, manifestIndex + 8).join('\n'),
      /no-cache/,
      `${file} must not let site.webmanifest be cached`,
    )
  }
})

test('the Apache immutable-asset rule is overridden for sw.js', () => {
  const lines = read('public/.htaccess').split(/\r?\n/)
  const immutable = lines.findIndex((line) => /FilesMatch/.test(line))
  const override = lines.findIndex((line) => /<Files "sw\.js">/.test(line))
  assert.ok(immutable > -1, 'expected the FilesMatch immutable rule')
  assert.ok(override > -1, 'expected a <Files "sw.js"> override')
  // mod_headers applies the last match, so the override must come second.
  assert.ok(override > immutable, 'the sw.js override must follow the FilesMatch rule')
})

test('the install prompt reads copy from the pwa i18n namespace', () => {
  const component = read('src/components/PwaPrompt.tsx')
  const used = [...component.matchAll(/t\('(pwa\.[a-zA-Z]+)'\)/g)].map((m) => m[1])
  assert.ok(used.length >= 4, 'expected several pwa.* lookups')
  for (const locale of ['en', 'fr', 'ar']) {
    const dictionary = read(`src/i18n/${locale}.ts`)
    for (const key of new Set(used)) {
      assert.ok(
        dictionary.includes(`"${key.split('.')[1]}":`),
        `${locale}.ts is missing ${key}`,
      )
    }
  }
})

// ---------------------------------------------------------------------------
// Capacitor wrapper (native Android shell)
// ---------------------------------------------------------------------------

const hasAndroidProject = exists('android/app/src/main/res')

test('capacitor config points at the real build output', () => {
  const config = read('capacitor.config.ts')
  assert.match(config, /webDir:\s*'dist'/, 'webDir must be the Vite output directory')
  assert.match(config, /appId:\s*'com\.globalexplorer\.app'/)
  // A plain-http origin would break localStorage and geolocation in the WebView.
  assert.match(config, /androidScheme:\s*'https'/)
  const pkg = readJson('package.json')
  assert.ok(pkg.dependencies['@capacitor/core'], '@capacitor/core must be a dependency')
  assert.ok(pkg.dependencies['@capacitor/android'], '@capacitor/android must be a dependency')
  assert.ok(pkg.devDependencies['@capacitor/cli'], '@capacitor/cli must be a devDependency')
})

test('the app name is identical in the manifest, the native shell and the i18n bundle', () => {
  const config = read('capacitor.config.ts')
  const nativeName = /appName:\s*'([^']+)'/.exec(config)
  assert.ok(nativeName, 'capacitor appName not found')
  assert.equal(manifest.name, nativeName[1], 'manifest name and native appName disagree')
  const english = read('src/i18n/en.ts')
  const i18nName = /"name":\s*"([^"]+)"/.exec(english)
  assert.equal(manifest.name, i18nName[1], 'manifest name and app.name disagree')
})

test('the native shell skips service worker registration', () => {
  const service = read('src/services/pwa.ts')
  assert.match(service, /export function isNativeShell\(\)/)
  const register = service.slice(service.indexOf('export function registerServiceWorker'))
  assert.match(register, /if \(isNativeShell\(\)\) return/, 'the worker must not run inside the native shell')
})

test('Android launcher icons are generated for every density', { skip: !hasAndroidProject }, () => {
  const res = 'android/app/src/main/res'
  for (const [density, legacy, adaptive] of [
    ['mdpi', 48, 108],
    ['hdpi', 72, 162],
    ['xhdpi', 96, 216],
    ['xxhdpi', 144, 324],
    ['xxxhdpi', 192, 432],
  ]) {
    for (const [file, size] of [
      [`${res}/mipmap-${density}/ic_launcher.png`, legacy],
      [`${res}/mipmap-${density}/ic_launcher_round.png`, legacy],
      [`${res}/mipmap-${density}/ic_launcher_foreground.png`, adaptive],
    ]) {
      assert.ok(exists(file), `missing launcher icon: ${file}`)
      const { width, height } = pngSize(file)
      assert.equal(width, size, `${file} should be ${size}px wide`)
      assert.equal(height, size, `${file} should be ${size}px tall`)
    }
  }
})

test('the adaptive icon background matches the site background', { skip: !hasAndroidProject }, () => {
  const background = read('android/app/src/main/res/values/ic_launcher_background.xml')
  const bg = /--ge-bg:\s*(#[0-9a-f]{6})/i.exec(css)
  assert.ok(background.toLowerCase().includes(bg[1].toLowerCase()), 'launcher background drifted from --ge-bg')
})

test('the copied web bundle and generated native config stay out of git', () => {
  const ignore = read('android/.gitignore')
  assert.match(ignore, /app\/src\/main\/assets\/public/, 'dist copy must not be committed')
  assert.match(ignore, /capacitor\.config\.json/)
})