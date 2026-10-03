# P0 — Build & Config Integrity + Repo Hygiene — EVIDENCE

Date: 2026-10-03
Agent: P0 (serial, blocking prerequisite)
Status: **PASS — all four gates green.**

## What changed

| # | Change | Files |
|---|---|---|
| 1 | Deleted stale compiled config | removed `vite.config.js`, `vite.config.d.ts` |
| 2 | Stop `tsc -b` emitting into repo root | `tsconfig.node.json` (`outDir` + `tsBuildInfoFile` → `node_modules/.tmp`), `tsconfig.json` (`tsBuildInfoFile` → `node_modules/.tmp`) |
| 3 | Repo hygiene | added `.gitignore` (node_modules, dist, *.tsbuildinfo, generated config, .env*, coverage, playwright) |
| 4 | Editor/runtime pinning | added `.editorconfig`, `.nvmrc` (24), `engines.node >= 23.6.0` in `package.json` |
| 5 | Dependency alignment | `@types/node` `^26.6.4` → `^24.0.0` (runtime is v24) |
| 6 | Single port source of truth | port 3000 + `strictPort` only in `vite.config.ts` (`server` + `preview`); scripts are bare `vite` / `vite preview` |
| 7 | Env template | added `.env.example` (`VITE_REST_COUNTRIES_KEY`, `SITE_URL`, `SITE`, deploy checklist) |
| 8 | Lint wiring placeholder | `package.json` `lint` script (no-op until W12) |
| 9 | Deleted stray caches | removed `tsconfig.tsbuildinfo`, `tsconfig.node.tsbuildinfo` from root |
| 10 | Agent scaffolding | added `docs/agents/{LOCKS,REQUESTS,DECISIONS,BACKLOG}.md` |

## Commands & raw results

### Toolchain
```
node -v   -> v24.18.0
npm -v    -> 11.16.0
git --version -> git version 2.55.0.windows.2
```

### Dependency sync
```
npm install --no-audit --no-fund
-> changed 2 packages in 3s
npm ls @types/node typescript vite --depth=0
-> @types/node@24.19.1
-> typescript@5.6.3
-> vite@6.4.3
```
> Observation for W12: this npm enforces an `allow-scripts` policy and warns that
> `esbuild@0.25.12` install scripts are "not yet covered". A fresh `npm ci` on a
> clean machine may need `npm approve-scripts` (or an allowlist) for esbuild's
> platform binary. The current build works because the binary is already present.

### Gate 1 — `npx tsc -b --force`
```
(no output)
tsc exit: 0
```

### Gate 2 — `npm run check`
```
i18n check passed: en, fr, ar each have identical key sets (379 keys)
  en: src\i18n\en.ts
  fr: src\i18n\fr.ts
  ar: src\i18n\ar.ts
CSS quality check passed
check exit: 0
```

### Gate 3 — `npm test`
```
✔ atlas: 177 unique drawable shapes (1.0745ms)
✔ countries: 250 unique records with core fields (0.7425ms)
✔ coverage: only CYN/KOS/SOL are atlas-only (0.6423ms)
✔ robinsonProject is finite across the grid and matches atlas anchors (0.6428ms)
✔ generateNearby stays inside the radius (0.8595ms)
✔ every explorer mode maps to a positive radius (0.1128ms)
✔ sitemap includes /time-travel and every route (0.1249ms)
tests 7 | pass 7 | fail 0
test exit: 0
```

### Gate 4 — `npm run build`
```
vite v6.4.3 building for production...
✓ 73 modules transformed.
dist/index.html                  0.40 kB │ gzip:   0.27 kB
dist/assets/index-f7IFhmkU.css   0.34 kB │ gzip:   0.25 kB
dist/assets/index-CJwae6rs.js  325.30 kB │ gzip: 104.22 kB
✓ built in 926ms
build exit: 0
```

### Root pollution check (before AND after build)
```
Get-ChildItem -Force | where { vite.config.js | vite.config.d.ts | *.tsbuildinfo }
-> (empty)          # nothing regenerated in the repo root
node_modules/.tmp
-> tsconfig-node/
-> tsconfig-node.tsbuildinfo
-> tsconfig.tsbuildinfo
```

## Part G regression check at Phase 0

| Part G claim | Result |
|---|---|
| `npx tsc -b --force` passes (strict) | ✅ exit 0 |
| `npm run check` passes (i18n parity 379×3 + CSS) | ✅ |
| `npm test` passes | ✅ 7/7 |
| `npm run build` succeeds, zero warnings | ✅ |
| Bundle size vs baseline (JS 325.30 kB / 104.22 kB gzip, CSS sub-1 kB) | ✅ identical hashes/sizes |
| Runtime deps minimal | ✅ unchanged (react, react-dom, react-router-dom) |

## Gate

Phase 0 is **merged** (see git log) and the build is green. Cleared to release the
12 parallel worker agents.
