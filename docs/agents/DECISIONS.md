# Decisions Log

Every ambiguous audit finding is implemented with the safest interpretation and
recorded here.

## P0 decisions

- **D0-1 — Initialize a git repository.**
  The working folder was not a git repo, but the remediation program requires
  small, revertable commits and lock-on-commit. Safest interpretation: `git init`
  and import the existing tree as a baseline commit, with `.gitignore` written
  first so `node_modules/` and `dist/` are never staged.

- **D0-2 — Runtime floor = Node >= 23.6.**
  `tests/audit.test.mjs` imports `.ts` files directly and relies on Node's native
  type stripping (default from Node 23.6). Rather than add a `tsx`/`vitest`
  dependency in Phase 0, we pin the floor via `engines.node` and `.nvmrc` (24)
  and document it. Revisit if Node 18/20 support is required (W12 may swap in a
  TS-aware runner).
  _Alternative considered:_ add `tsx`/`vitest` dev dep. Deferred to avoid a new
  dependency before the approval workflow is in place.

- **D0-3 — TypeScript build info / emitted config go to `node_modules/.tmp`.**
  `tsconfig.node.json` previously had `composite: true` with no output dir, so
  `tsc -b` emitted `vite.config.js` + `.d.ts` next to the source and Vite then
  loaded the stale `.js` instead of the `.ts`. Fix: point `outDir` and
  `tsBuildInfoFile` at `node_modules/.tmp`, and add a `tsBuildInfoFile` to the
  root `tsconfig.json` so no `.tsbuildinfo` lands in the repo root. The generated
  `vite.config.js` / `vite.config.d.ts` are deleted and now git-ignored.

- **D0-4 — Single source of truth for the dev/preview port.**
  Port `3000` + `strictPort` now live only in `vite.config.ts` (`server` and
  `preview`). `package.json` scripts are bare `vite` / `vite preview`; the
  duplicated `--port 3000` CLI flag is removed.

- **D0-5 — `@types/node` pinned to `^24` to match the runtime (v24.18.0).**
  It was `^26` (future major) against a v24 runtime. A fresh `npm ci` will now
  install matching types. (If the local install could not be refreshed offline,
  the currently installed v26 types may still be present; the pin is what CI and
  fresh clones use.)

- **D0-6 — `lint` script is a no-op placeholder.**
  It prints a note and exits 0 so `npm run lint` is wired but non-blocking until
  W12 adds ESLint + Prettier and real rules.

- **D0-7 — `.env.example` includes `SITE_URL`.**
  W2 will make the production build require `SITE_URL` for absolute
  sitemap/robots/canonical URLs. Phase 0 documents it but does not yet enforce it
  (the build must stay green in Phase 0).

- **D0-9 — esbuild install-script allowlist stored in `package.json` `allowScripts`.**
  This npm (11.16.0) gates install scripts behind an `allow-scripts` policy. The
  canonical, committed storage is the `package.json` root field
  `"allowScripts": { "esbuild@0.25.12": true }` (verified: `npm approve-scripts esbuild`
  writes exactly this, and `allow-scripts-pin=true` pins the exact version).
  We deliberately did **not** use `dangerously-allow-all-scripts` (too broad).
  `.npmrc` was not required. **W2 owns `package.json` and MUST preserve this field.**
  If esbuild is later bumped, re-run `npm approve-scripts esbuild` and commit the new pin.

- **D0-8 — `dist/` and `node_modules/` are NOT deleted from the working tree.**
  Per the rules, `dist/` is only removed from the deliverable/zip after Phase 0
  confirms it regenerates; `node_modules/` stays for local builds. Both are now
  git-ignored.

## Phase 1 orchestration decisions

### W10 — Locale cleanup and shared UI

- The locale cleanup retains `app.name` because the existing Footer uses it,
  retains `nav.globe`/`nav.map` and `a11y.toggleNames` because World uses them,
  and retains `a11y.skipToContent`, the full footer namespace and the full PWA
  namespace for their explicitly reserved consumers. The resulting shared
  locale baseline is 220 keys after adding the two W5 maintenance strings from
  REQ-4.
- `featureTranslate` remains a private helper because `useFeaturesT` calls it;
  only its unused public export was removed. `src/lib/utils.ts` also remains
  because Country and Globe import it. Removal of the W9-owned dead
  `radiusForMode` export was requested in REQ-5 rather than editing that file.

- **D1-0 — Concurrency model: shared working tree, disjoint ownership, retrying commits.**
  12 workers share one working tree (a pre-populated `node_modules` avoids 12×
  installs). Each worker edits ONLY its owned files and commits ONLY those files
  (`git add <files>`, never `git add -A`, never reset/checkout/stash/amend/force).
  If `git add`/`commit` hits `.git/index.lock`, wait 2s and retry up to 5×.
  To avoid 12-way write conflicts, `docs/agents/LOCKS.md` is maintained by the
  orchestrator, and each worker records its claims + evidence in its own
  `docs/agents/W#-EVIDENCE.md`. `DECISIONS.md` / `REQUESTS.md` are shared-append
  files: append one short block per edit and retry on failure.

- **D1-1 — File-ownership arbitration (resolves overlaps in the master prompt).**
  - `src/components/Globe.tsx` → **W8** (W6 submits a11y requests; W6 builds the
    off-screen accessible directory as a separate component).
  - `src/components/MiniMap.tsx` → **W8** (W6 submits a11y; W9 submits zoom).
  - `src/components/WorldMap.tsx` → **W6** (W8 submits perf requests).
  - `src/components/TimeSlider.tsx` → **W7** (W6 submits a11y).
  - `src/components/ExplorerLauncher.tsx` → **W6** (W7 mobile + W9 chip-label
    changes go through REQUESTS.md).
  - `src/components/ExplorerModeSelector.tsx` → **W9** (relabel/mode semantics).
  - `src/components/PlaceExtras.tsx` → **W6** (W9 submits content requests).
  - `src/components/PlaceDNA.tsx`, `GlobalImpactFlow.tsx` → **W9**.
  - `src/components/panels/*` → **W9** (logic/content/markup; W6 submits a11y
    requests).
  - `src/components/panels/panelStyles.ts` → **W7**.
  - `src/index.css` → **W6**; W7 adds media queries in a NEW
    `src/styles/breakpoints.css` and requests the import line.
  - `src/i18n/*` → **W10** (all new strings for W2/W4/W5/W9 go through
    REQUESTS.md; W10 is expected to add them proactively).
  - Everything else as listed in `LOCKS.md` / the master prompt.

- **D1-2 — Scope discipline.** Workers implement CRITICAL/HIGH first, then MEDIUM
  where feasible; LOW / NICE-TO-HAVE items are logged in `BACKLOG.md` (permitted
  by the Definition of Done) rather than risking the regression baseline.
