# Agent File Locks

**Rule:** one writer per file at a time. An agent MUST add a row here before editing
a file, and MUST mark it released when its commit lands. If a file is locked by
another workstream, submit a request in `REQUESTS.md` instead of editing.

Status values: `LOCKED` | `RELEASED`.

| File / Glob | Owner (W#) | Status | Acquired (UTC) | Released (UTC) | Notes |
|---|---|---|---|---|---|
| `vite.config.ts`, `package.json`, `index.html` | W2 | RELEASED | — | — | W1/W12 submit requests |
| `src/App.tsx`, `src/main.tsx` | W5 | RELEASED | — | — | everyone else submits requests |
| `src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/ar.ts` | W10 | RELEASED | — | — | |
| `src/components/Globe.tsx` | W8 | RELEASED | — | — | W6 submits a11y requests |
| `src/pages/World.tsx` | W7 | RELEASED | — | — | W6/W8 submit requests |
| `src/pages/Country.tsx`, `Landmark.tsx`, `Nature.tsx`, `TimeTravel.tsx`, `NotFound.tsx` | W9 | RELEASED | — | — | |
| `src/components/MiniMap.tsx` | W6 (a11y) + W8 (perf) | RELEASED | — | — | coordinate before editing |
| `src/hooks/useAtlas.ts`, `src/services/*`, `src/lib/*` | W8 | RELEASED | — | — | |
| `public/data/countries.json`, `scripts/build-*.mjs`, `src/data/countries.ts` | W11 | RELEASED | — | — | |
| `tests/**`, `.github/**`, `e2e/**` | W12 | RELEASED | — | — | |
| `src/components/Button.tsx`, `Toggle.tsx`, `src/components/ui/*` | W10 | RELEASED | — | — | |

> P0 historically held a global lock on `vite.config.ts`, `tsconfig*.json`,
> `package.json`; those are released to W2 / W12 as of the P0 commit.
