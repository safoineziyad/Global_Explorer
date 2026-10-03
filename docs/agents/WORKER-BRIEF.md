# Global Explorer — Worker Brief (Phase 1, W1–W12)

This is the shared contract for every parallel worker. Read it fully, then execute
ONLY your `W#` section. The orchestrator owns this file; workers must not edit it.

> Audit-ID note: the merged Parts B/F findings were reconstructed into the stable
> ID register below after context compaction. Use these IDs verbatim in commit
> messages and evidence. If you find an issue not listed, give it a new
> `audit-<area>-<slug>` ID and log it in your evidence + `BACKLOG.md`.

---

## 0. Shared context

- Repo: `C:\Users\Zbook\Desktop\ziyad_Zbook\programming\global-explorer`
- Stack: React 18 + TypeScript + Vite 6 SPA, react-router-dom v7. Windows/PowerShell.
- It **is** a git repo (initialised in P0). Single shared branch `master`.
- `node_modules` is already installed in the shared tree. **Never run `npm install`**;
  if you need a dev/build dependency, propose it via `docs/agents/REQUESTS.md` and the
  orchestrator will approve. **No new runtime dependencies.**
- Dev server: `http://localhost:3000` (Vite binds `::1`; `127.0.0.1` fails).
  Use `npm run dev`; `npm run preview` for the built app.
- `allowScripts` in `package.json` is required for CI (esbuild) — never remove it.
- Never delete `node_modules/` or `dist/`.
- **Typecheck with `npx tsc --noEmit -p tsconfig.json`** (writes nothing). Avoid
  running `tsc -b`/`npm run build` concurrently with another worker: full builds are
  effectively serialised — prefer scoped typecheck, and if a build hits a transient
  write/lock error, wait 3s and retry. Only W2/W5/W10/W12 need full builds.

## 1. Concurrency + lock protocol (D1-0)

- 12 workers share ONE working tree. Edit ONLY files you own (§2). One writer per file.
- Need a change in someone else's file? Append a block to `docs/agents/REQUESTS.md`
  and continue; do not edit their file.
- Record every ambiguity/resolution by appending a `### W# — ...` block to
  `docs/agents/DECISIONS.md`. Shared-append files (`DECISIONS.md`, `REQUESTS.md`,
  `BACKLOG.md`) are edited with one short append at a time; on failure wait 2s and retry.
- If `git add`/`git commit` fails with `.git/index.lock`, wait 2s and retry up to 5×.

## 2. File ownership (authoritative; supersedes the master prompt where they differ)

| Owner | Owned files |
|-------|-------------|
| W1 | `netlify.toml`, `vercel.json`, `public/_redirects`, `public/_headers`, `public/.htaccess`, `public/404.html`, `public/staticwebapp.config.json`, `docs/DEPLOY.md` |
| W2 | `vite.config.ts`, `index.html`, `package.json`, `.env.example`, `public/robots.txt`, `public/sitemap.xml`, `public/site.webmanifest`, `public/favicon*`, `public/og-*`, `scripts/prerender.mjs`, `scripts/build-sitemap.mjs`, `src/entry-server.tsx` |
| W3 | `src/pages/Index.tsx` (new), `src/components/SiteNav.tsx` (new), `src/components/Breadcrumbs.tsx` (new), `scripts/check-routes.mjs` |
| W4 | `src/pages/Privacy.tsx` (new), `src/pages/Terms.tsx` (new), `src/components/Footer.tsx` (new), `src/components/DataControls.tsx` (new) |
| W5 | `src/App.tsx`, `src/main.tsx`, `src/components/ErrorBoundary.tsx` (new), `src/pages/Error500.tsx` (new), `src/pages/Maintenance.tsx` (new), `src/components/OfflineBanner.tsx` (new), `src/hooks/useOnline.ts` (new) |
| W6 | `src/components/Globe.tsx`→no (W8); `WorldMap.tsx`, `Tooltip.tsx`, `ZoomControls.tsx`, `ExplorerLauncher.tsx`, `PlaceExtras.tsx`, `SkipLink.tsx` (new), `CountryDirectoryA11y.tsx` (new), `src/index.css` |
| W7 | `src/pages/World.tsx`, `src/components/TimeTravelLayer.tsx`, `NearMeLayer.tsx`, `TimeSlider.tsx`, `panels/panelStyles.ts`, `src/styles/breakpoints.css` (new) |
| W8 | `src/components/Globe.tsx`, `MiniMap.tsx`, `src/hooks/useAtlas.ts`, `src/services/*`, `src/lib/*` |
| W9 | `src/pages/Country.tsx`, `Landmark.tsx`, `Nature.tsx`, `TimeTravel.tsx`, `NotFound.tsx`, `src/components/panels/*` (except `panelStyles.ts`), `PlaceDNA.tsx`, `GlobalImpactFlow.tsx`, `ExplorerModeSelector.tsx`, `src/data/landmarks.ts`, `nature.ts`, `timeTravel.ts`, `explorerFeatures.ts`, `public/images/**` |
| W10 | `src/i18n/*`, `src/components/Button.tsx`, `Toggle.tsx`, `README.md` |
| W11 | `src/data/countries.ts`, `public/data/countries.json`, `public/data/countries-110m.json`, `scripts/build-countries.mjs`, `scripts/build-geo.mjs` |
| W12 | `tests/**`, `.github/workflows/**`, `.gitignore` (test artifacts only), `package.json` scripts → via request to W2 for the `test:e2e`/`lint` lines |
| shared | `docs/agents/{W#-EVIDENCE.md}` own; `DECISIONS.md` / `REQUESTS.md` / `BACKLOG.md` append-only |

**Overrides:** `Globe.tsx` and `MiniMap.tsx` → W8. `TimeSlider.tsx` → W7.
`panels/*` → W9 (W6 submits a11y requests). `ExplorerLauncher.tsx` → W6.
`index.css` → W6; W7's media queries go in `src/styles/breakpoints.css` and need one
import line added to `index.css` via REQUESTS.md.

## 3. Commit + evidence rules

- Stage ONLY your files: `git add <explicit paths>`. **Never** `git add -A`, `git reset`,
  `git checkout`, `git stash`, `git commit --amend`, or force-push.
- One logical fix per commit:
  `[W#] <area>: <what changed> (fixes <audit-id>[, <audit-id>])`
- Every worker writes `docs/agents/W#-EVIDENCE.md` containing raw command output
  (build/test/curl) and PASS/FAIL per assigned audit ID.

## 4. Regression baseline — PART G (must never regress)

1. `npx tsc -b --force` clean. 2. `npm run check` passes (i18n parity + CSS).
3. `npm test` passes. 4. `npm run build` exits 0 with zero warnings.
5. 253/253 country codes render; 23/23 content pages render.
6. 0 console errors; 0 `NaN`; **0 React Router future-flag warnings** (must be removed).
7. Minimal runtime deps: `react`, `react-dom`, `react-router-dom` only.
8. No `dangerouslySetInnerHTML` / `eval` / `innerHTML` / `document.write`.
9. No analytics by default; geolocation only on explicit click, never persisted/transmitted.
10. No source maps shipped. 11. No TODO/FIXME/stray console/commented-out code.
12. Single render-blocking CSS sub-1 kB; entry script is a deferred ES module.

**If a fix would regress any Part G item: STOP that workstream and immediately append
an escalation block to `docs/agents/DECISIONS.md`.** Do not ship a regression.

## 5. Scope discipline (D1-2)

Implement CRITICAL + HIGH first, then MEDIUM where feasible. Log LOW / NICE-TO-HAVE
in `docs/agents/BACKLOG.md` instead of risking the baseline.

---

## Reconstructed audit-ID register (Parts B & F)

### W1 — Hosting / delivery / security
- `audit-spa-fallback` (HIGH): no SPA deep-link fallback for static hosts; `/country/DEU` 404s on a plain static host.
- `audit-deploy-config` (HIGH): no host config (redirects/caching/compression/HTTPS).
- `audit-security-headers` (MED): no CSP/HSTS/X-Content-Type-Options/Referrer-Policy/Permissions-Policy.
- `audit-deploy-docs` (LOW): no deployment documentation.

### W2 — Build / prerender / SEO
- `audit-prerender` (CRITICAL): SPA only; crawlers/social need JS to see content.
- `audit-sitemap-relative` (HIGH): `public/sitemap.xml` + `robots.txt` use relative URLs.
- `audit-index-meta` (CRITICAL): one static `index.html`; no per-route title/description/OG/Twitter/canonical.
- `audit-site-url` (HIGH): `SITE_URL` documented but not enforced; build must fail if missing in prod.
- `audit-favicon-manifest` (MED): no favicon set / web manifest / theme-color.
- `audit-structured-data` (MED): no JSON-LD; no `lastmod`.
- `audit-sitemap-invalid-codes` (MED): sitemap includes `SOL`/`KOS`/`CYN` pseudo-codes.

### W3 — Crawlable links / routing
- `audit-crawl-links` (HIGH): listings/nav rely on `onClick`, not `<a href>`; no all-countries directory.
- `audit-breadcrumbs` (MED): no breadcrumbs; back-button behaviour inconsistent.
- `audit-route-check` (MED): no automated route/deep-link integrity check.

### W4 — Legal / footer / data controls
- `audit-privacy` (CRITICAL): no Privacy Policy.
- `audit-terms` (HIGH): no Terms.
- `audit-footer` (MED): no global footer / credits / dynamic year.
- `audit-geo-disclosure` (HIGH): geolocation use not disclosed.
- `audit-data-controls` (MED): no user data reset / export control.

### W5 — Error handling / resilience
- `audit-error-boundary` (HIGH): no React error boundary / 500 page.
- `audit-country-error-vs-missing` (MED): API failure and unknown country are indistinguishable.
- `audit-maintenance` (LOW): no maintenance route.
- `audit-offline` (MED): no offline/network-loss handling.

### W6 — Accessibility
- `audit-globe-a11y` (CRITICAL): canvas globe unusable by keyboard/screen reader.
- `audit-role-img-buttons` (HIGH): `role="img"` on the SVG map hides interactive buttons.
- `audit-dialog-semantics` (HIGH): launcher lacks dialog semantics/focus trap/Escape.
- `audit-focus-visible` (HIGH): interactive elements have no visible focus.
- `audit-aria-tabs` (MED): tab pattern missing roles/arrow keys.
- `audit-color-only` (MED): categories signalled by colour only.
- `audit-contrast` (MED): low-contrast text on some surfaces.
- `audit-skip-link` (MED): no skip-to-content link.
- `audit-panel-a11y` (MED): panels lack names/live regions.

### W7 — Mobile / responsive / RTL / touch
- `audit-mobile-layout` (HIGH): layer stack / launcher unusable < 672px.
- `audit-touch-targets` (HIGH): controls below 44×44 px.
- `audit-no-media-queries` (HIGH): few/no responsive `@media` rules.
- `audit-rtl-logical-props` (HIGH): physical left/right breaks Arabic RTL.
- `audit-hover-only` (MED): readouts only on hover (no touch).
- `audit-time-slider-touch` (MED): time slider not touch-friendly/RTL-aware.

### W8 — Performance
- `audit-atlas-refetch` (HIGH): atlas data fetched per component with no cache.
- `audit-rAF-always-on` (HIGH): globe animation loop always running.
- `audit-code-split` (HIGH): no route-level code splitting (single 325 kB bundle).
- `audit-geometry-dedup` (MED): duplicated geometry / unmerged SVG paths.
- `audit-flag-prefetch` (LOW): flag images not lazy/preconnected.
- `audit-fonts` (LOW): font strategy undefined.

### W9 — Content / truthfulness / imagery / UX copy
- `audit-mock-ai` (HIGH): "AI" panel is rule-based but labelled as AI.
- `audit-fake-xp` (MED): XP/level system presents fake progress.
- `audit-placeholder-visible` (HIGH): visible "Placeholder data" text.
- `audit-content-images` (HIGH): no photos / attribution.
- `audit-content-english-only` (MED): content strings not localised to fr/ar.
- `audit-antarctica` (HIGH): Antarctica/SJM `area:-1` and missing data.
- `audit-chip-labels` (MED): chip labels unclear/duplicated.
- `audit-counters-presets` (MED): counters/preset time models inconsistent.
- `audit-minimap-zoom` (LOW): mini-map not zoomable.

### W10 — i18n / shared UI / docs
- `audit-dead-i18n-keys` (HIGH): ~154 unused keys per locale.
- `audit-i18n-parity` (MED): parity must be maintained by `check-i18n`.
- `audit-readme` (MED): README stale vs actual scripts/deploy.
- `audit-button-a11y` (MED): shared Button/Toggle missing a11y affordances.
- `audit-feature-reset` (LOW): no way to reset explorer features.

### W11 — Data integrity
- `audit-sjm-area` (HIGH): `SJM` has `area: -1`.
- `audit-timezones-missing` (HIGH): timezones missing for all ~250 entities.
- `audit-country-json-stale` (MED): `public/data/countries.json` drift vs source.
- `audit-data-validation` (MED): no validation script/schema.

### W12 — Tooling / CI / tests
- `audit-ci-missing` (HIGH): no CI workflow.
- `audit-e2e-missing` (HIGH): no end-to-end tests.
- `audit-lint-placeholder` (MED): `lint` is a no-op.
- `audit-manifest-tests` (MED): no tests for manifest/icons/data invariants.
- `audit-esm-lint` (LOW): no ESM.config-aware lint.
