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

_(none yet)_

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
