/*
 * sw.js - Global Explorer service worker.
 *
 * Hand-written on purpose: a workbox/vite-plugin-pwa dependency would break the
 * reproducible `npm ci` gate documented in docs/agents/P0-EVIDENCE.md, and this
 * app only needs three caching strategies. See docs/PWA.md.
 *
 * Contract with src/lib/pwa.ts:
 *   - install: precache the shell, the two data files and the built entry assets
 *   - activate: drop caches from older versions, take control of open clients
 *   - message:  { type: 'SKIP_WAITING' } activates a waiting worker on demand
 */

/**
 * Build id. The literal 'build' here is a placeholder that
 * `ge-pwa-precache-manifest` (vite.config.ts) replaces in `dist/sw.js` with a
 * hash of the emitted asset manifest. It must change on every deploy or the
 * browser sees a byte-identical worker, never installs the update, and never
 * precaches the new shell. The hashed value also gives each build its own
 * cache, so `activate` below drops the previous one.
 */
const VERSION = 'build';
const CACHE = `global-explorer-${VERSION}`;

/** Served on install so the app works offline from the very first visit. */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/data/countries.json',
  '/data/countries-110m.json',
];

/** Identifies the app shell so a host 404 page is never cached as the shell. */
const SHELL_MARKER = 'id="root"';

const SHELL_URL = '/index.html';

/**
 * Options for every `cache.match()` in this file.
 *
 * `ignoreVary` is load-bearing, not a nicety. Proxies in front of this app add
 * `Vary: Origin` to everything they serve, and Cache Storage honours `Vary` by
 * comparing the *stored* request's headers against the incoming one. The
 * precached copy is stored from a plain `fetch()`, which sends no `Origin`
 * header; `dist/index.html` declares `crossorigin` on its entry script and
 * stylesheet, making those CORS-mode requests that do send `Origin`. Every
 * match therefore missed, `cacheFirst` fell through to the network, and an
 * offline load rendered a blank page with two 502s for the entry assets.
 *
 * Navigations send no `Origin`, which is why the shell itself kept working and
 * hid the bug. Nothing cached here varies on `Origin` — they are same-origin,
 * content-hashed files and the bundled datasets — so skipping the comparison is
 * correct.
 */
const MATCH = { ignoreVary: true };

// ---------------------------------------------------------------------------
// Install / activate
// ---------------------------------------------------------------------------

/**
 * Cache each URL independently: a single 404 must not abort the whole install,
 * which `cache.addAll` would do.
 */
async function cacheAll(urls) {
  const cache = await caches.open(CACHE);
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, { cache: 'reload' });
      if (!response || !response.ok) throw new Error(`not ok: ${url}`);
      await cache.put(url, response);
    }),
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > 0) console.warn(`[sw] ${failed}/${urls.length} URLs could not be precached`);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await cacheAll(PRECACHE_URLS);
      await cacheBuildAssets();
    })(),
  );
});

/**
 * Precache every content-hashed build chunk listed in `dist/sw-manifest.json`
 * (emitted by the `ge-pwa-precache-manifest` plugin in vite.config.ts).
 *
 * Caching the *complete* bundle up front matters: an unvisited route chunk
 * that is only fetched at runtime cannot be served offline, and a lazy import
 * that fails leaves Suspense hanging and the page blank.
 *
 * Falls back to scraping the entry assets out of the built shell when the
 * manifest is unavailable, so an older deploy still installs cleanly.
 */
async function cacheBuildAssets() {
  try {
    const response = await fetch('/sw-manifest.json', { cache: 'reload' });
    if (!response.ok) throw new Error(`sw-manifest.json: ${response.status}`);
    const urls = await response.json();
    if (Array.isArray(urls) && urls.length > 0) {
      await cacheAll(urls);
      return;
    }
  } catch {
    // Older deploy without the manifest; the shell scrape below still works.
  }
  await cacheEntryAssets();
}

/**
 * Fallback path: Vite's content-hashed entry bundle is discoverable from the
 * built shell, but lazy route chunks are not.
 */
async function cacheEntryAssets() {
  try {
    const response = await fetch(SHELL_URL, { cache: 'reload' });
    const html = await response.text();
    const found = html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g);
    const urls = Array.from(found, (match) => match[1]);
    if (urls.length > 0) await cacheAll(urls);
  } catch (error) {
    // Non-fatal: the runtime cache will pick these up on first load.
    console.warn('[sw] could not pre-cache entry assets', error);
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith('global-explorer-') && key !== CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Fetch strategies
// ---------------------------------------------------------------------------

/** True when a response really is the app shell rather than a host error page. */
async function isShell(response) {
  if (!response || !response.ok) return false;
  if (!(response.headers.get('content-type') || '').includes('text/html')) return false;
  try {
    return (await response.clone().text()).includes(SHELL_MARKER);
  } catch {
    return false;
  }
}

/** The precached app shell, or null when it was never stored. */
async function cachedShell() {
  const cache = await caches.open(CACHE);
  return (await cache.match(SHELL_URL, MATCH)) ?? (await cache.match('/', MATCH)) ?? null;
}

function offlineResponse() {
  return new Response('<h1>Offline</h1>', {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Network-first with a cached-shell fallback. Every host in this repo rewrites
 * unknown paths to the shell, so an offline deep link such as /country/DEU must
 * resolve to the cached shell and let react-router take over.
 *
 * The fallback also covers 5xx. `fetch` only rejects on a transport failure, so
 * a 502/503 from a host, proxy or CDN arrives as a perfectly normal response;
 * without this branch the installed app would show a raw error page during an
 * outage instead of the cached shell.
 */
async function handleNavigate(request) {
  try {
    const response = await fetch(request);
    if (response.status >= 500) {
      const shell = await cachedShell();
      return shell ?? response;
    }
    // Keep the offline copy fresh, but never poison it with a host 404 page.
    if (await isShell(response)) {
      const cache = await caches.open(CACHE);
      await cache.put(SHELL_URL, response.clone());
    }
    return response;
  } catch {
    const shell = await cachedShell();
    return shell ?? offlineResponse();
  }
}

/** Cache-first, used for content-hashed build output and static assets. */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, MATCH);
  if (hit) return hit;
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    // Offline and nothing cached: a plain network error is the honest answer.
    return Response.error();
  }
}

/** Stale-while-revalidate, used for the bundled country/atlas datasets. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, MATCH);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return hit || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cross-origin (notably restcountries.com) stays network-only so the
  // existing bundled-JSON fallback in src/services keeps working untouched.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith('/data/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Icons, the web manifest and anything else same-origin.
  event.respondWith(cacheFirst(request));
});