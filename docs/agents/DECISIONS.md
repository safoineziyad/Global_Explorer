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

- **D0-8 — `dist/` and `node_modules/` are NOT deleted from the working tree.**
  Per the rules, `dist/` is only removed from the deliverable/zip after Phase 0
  confirms it regenerates; `node_modules/` stays for local builds. Both are now
  git-ignored.
