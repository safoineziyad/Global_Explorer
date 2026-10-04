# Cross-Workstream Change Requests

Use this file when you need a change in a file owned by another workstream.
Format:

```
## REQ-<n> — <requester W#> -> <owner W#>
- File(s):
- Change needed:
- Reason:
- Status: OPEN | DONE
```

## REQ-1 — W5 -> W9
- File(s): `src/pages/Country.tsx`
- Change needed: Distinguish a fetch/network failure from an unknown `cca3`. Keep the `Status` union but add `'error'`; in the `fetchCountry` `.catch()` set `status = 'error'`, and keep `'missing'` only when the lookup resolves to `null`. Render the error state with `errors.restCountriesFailed` + a Retry button (re-run the effect); keep `errors.countryNotFound` for the unknown-code state. W5's `ErrorBoundary` only catches thrown render errors, so this data-layer distinction must live in Country.tsx.
- Reason: `audit-country-error-vs-missing` (MED) — API failure and unknown country are currently indistinguishable.
- Status: OPEN

## REQ-2 — W5 -> W3
- File(s): `src/pages/Index.tsx` (W3) / `src/App.tsx` (W5)
- Change needed: Confirm the canonical crawl directory path (`/index`, `/directory`, or both as aliases). W5 will import `src/pages/Index.tsx` and register the route(s) once the file exists.
- Reason: deliverable requires App.tsx to register the W3 directory route; the exact path is ambiguous in the brief.
- Status: OPEN

## REQ-3 — W5 -> W4
- File(s): `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` (W4) / `src/App.tsx` (W5)
- Change needed: Confirm the exact module filenames (`Privacy.tsx` / `Terms.tsx`) and default exports so W5 can register `/privacy` and `/terms`. W5 will add them once the files exist.
- Reason: deliverable requires App.tsx to register the legal routes.
- Status: OPEN

## REQ-4 — W5 -> W10
- File(s): `src/i18n/{en,fr,ar}.ts` and `scripts/check-i18n.mjs`
- Change needed: Add localized `maintenance.title` and `maintenance.message` keys and update the expected locale key count.
- Reason: W5 maintenance route localization.
- Status: DONE — added to all locales; total baseline is 220 keys after dead-key removal.

## REQ-5 — W10 -> W9
- File(s): `src/data/explorerFeatures.ts`
- Change needed: Remove the unused `radiusForMode` export; no references exist in `src/`.
- Reason: W10 dead-code cleanup; this file is owned by W9, so W10 is requesting rather than editing it.
- Status: OPEN

## REQ-6 — W10 -> W5
- File(s): `src/pages/Maintenance.tsx`
- Change needed: Update the component comment that says W10 translations have not landed; W10 added `maintenance.title` and `maintenance.message` to all three locale files.
- Reason: Keep comments consistent with the completed W5 locale request; W5 owns this file.
- Status: OPEN
