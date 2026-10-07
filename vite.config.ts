import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'

/**
 * Matched literally inside `public/sw.js` and replaced with the build hash.
 */
const VERSION_PLACEHOLDER = 'build'

/**
 * Keeps the service worker in sync with the build output. Runs at the end of
 * every production build, after Vite has copied `public/`, so `dist/sw.js`
 * already exists. Dev builds never register the worker, so this never runs there.
 *
 * 1. `dist/sw-manifest.json` — every content-hashed file the app ships, which
 *    `public/sw.js` precaches so **all** lazily loaded route chunks work offline
 *    from the first visit. Without it the worker can only find the entry assets
 *    referenced in index.html, and an unvisited route would render blank offline.
 *
 * 2. A build id stamped into `dist/sw.js`. This is the important half: the source
 *    `public/sw.js` never changes between deploys, so without a stamped id the
 *    browser would see a byte-identical worker forever, never install the update,
 *    and never precache the new shell or its new asset names. The stamped id also
 *    changes the cache name, so `activate` drops the previous build's cache
 *    instead of accumulating dead hashed chunks.
 */
function pwaPrecacheManifest(): Plugin {
  const swSource = resolve(__dirname, 'public', 'sw.js')
  const swBuild = resolve(__dirname, 'dist', 'sw.js')

  return {
    name: 'ge-pwa-precache-manifest',
    apply: 'build',
    closeBundle() {
      const assetsDir = resolve(__dirname, 'dist', 'assets')
      const entries = readdirSync(assetsDir)
        .filter((name) => !name.endsWith('.map'))
        .sort()
        .map((name) => `/assets/${name}`)

      writeFileSync(resolve(__dirname, 'dist', 'sw-manifest.json'), `${JSON.stringify(entries)}\n`)

      const template = readFileSync(swSource, 'utf8')
      const placeholder = `const VERSION = '${VERSION_PLACEHOLDER}'`
      if (!template.includes(placeholder)) {
        throw new Error(`public/sw.js must declare ${placeholder}`)
      }
      const id = createHash('sha256').update(JSON.stringify(entries)).digest('hex').slice(0, 12)

      const built = readFileSync(swBuild, 'utf8')
      writeFileSync(swBuild, built.replace(placeholder, `const VERSION = '${id}'`))

      this.info(`sw-manifest.json: ${entries.length} entries, worker version ${id}`)
    },
  }
}

export default defineConfig({
  plugins: [react(), pwaPrecacheManifest()],
  server: {
    port: 3000,
    strictPort: true
  },
  preview: {
    port: 3000,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
