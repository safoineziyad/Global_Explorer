# W10 — i18n cleanup, shared UI and documentation — Evidence

Date: 2026-10-03
Status: **PASS for W10-owned files; cross-owner requests REQ-5 and REQ-6 remain open.**

## Changes and audit status

| Audit ID | Result | Evidence |
|---|---|---|
| `audit-dead-i18n-keys` | PASS for the identified dead blocks | Removed dead locale sections (`actions`, `map`, `search`, `filters`, `theme`, `meta`, `units`, `about`, `time`) and unused fields from `app`, `nav`, and `a11y`; locale size is 220 keys, down from 379 (159 fewer). |
| `audit-i18n-parity` | PASS | `scripts/check-i18n.mjs` expects 220 keys; `npm run check` passes for en/fr/ar. |
| `audit-readme` | PASS for commands/tooling/layout updated here | README now documents Node >=23.6, `npm ci`, `npm test`, the actual test runner, locale key count and lint placeholder. `npm run check`, `npm test`, and `npm run build` were run successfully. |
| `audit-button-a11y` | PASS | `Button.tsx` and `Toggle.tsx` had no importers; both unused components were deleted. |

## Related cleanup

- Removed unused `timeTravel.overview` and `timeTravel.ancient` entries from all feature dictionaries.
- Made `featureTranslate` private rather than removing the helper: `useFeaturesT` still calls it.
- Added localized `maintenance.title` and `maintenance.message` keys for W5's REQ-4; this brings the pruned locale count from 218 to 220. REQ-4 is marked DONE in `REQUESTS.md`.
- Retained `app.name`, `nav.globe`, `nav.map`, `a11y.toggleNames`, and reserved `a11y.skipToContent`; retained all `footer` and `pwa` keys per the workstream contract.
- Kept `src/lib/utils.ts`: Country and Globe import it, so it is not dead code. The unused `radiusForMode` export is in a W9-owned file; removal was requested in REQ-5. REQ-6 asks W5 to update the now-stale comment in `Maintenance.tsx`.
- React Router future flags were already present in `src/main.tsx`: `v7_startTransition` and `v7_relativeSplatPath`.
- The stale ESLint directive in `scripts/check-i18n.mjs` remains pending W12, which has not added ESLint yet.

## Raw verification output

### `npm run check`

```text
> global-explorer@0.0.0 check
> node scripts/check-i18n.mjs && node scripts/check-css.mjs

i18n check passed: en, fr, ar each have identical key sets (220 keys)
  en: src\i18n\en.ts
  fr: src\i18n\fr.ts
  ar: src\i18n\ar.ts
CSS quality check passed
```

### `npx tsc -b --force`

```text
(no output)
exit: 0
```

### `npm test`

```text
✔ atlas: 177 unique drawable shapes
✔ countries: 250 unique records with core fields
✔ coverage: only CYN/KOS/SOL are atlas-only
✔ robinsonProject is finite across the grid and matches atlas anchors
✔ generateNearby stays inside the radius
✔ every explorer mode maps to a positive radius
✔ sitemap includes /time-travel and every route
tests 7 | pass 7 | fail 0
exit: 0
```

### `npm run build`

```text
vite v6.4.3 building for production...
✓ 78 modules transformed.
dist/index.html                   0.40 kB │ gzip:   0.27 kB
dist/assets/index-9_uUIicL.css    0.77 kB │ gzip:   0.47 kB
dist/assets/index-Cj6OhufD.js   317.07 kB │ gzip: 102.28 kB
✓ built in 748ms
exit: 0
```

### Targeted reference checks

```text
rg "379 keys|218 keys|timeTravel\.overview|timeTravel\.ancient|Button\.tsx|Toggle\.tsx" README.md scripts src
-> No matches found

rg "from './Button'|from '../components/Button'|from './Toggle'|from '../components/Toggle'" src
-> No matches found
```
