# Sykabelajar V2 Complete — Phase 13–17

## Scope

Milestone ini mengaktifkan satu runtime V2 di atas arsitektur existing:

Blogger → loader.js → dist/app.*.js → SYKA_APP.init() → Sykabelajar V2 → Supabase

Legacy frontend tetap tersedia sebagai fallback untuk route yang belum diambil alih V2.

## Phase included

- Phase 13 — Runtime, router activation, build pipeline, loader integration
- Phase 14 — Login, register, session, role-aware access
- Phase 15 — Student dashboard, XP, Edu Coin, achievement, competitions
- Phase 16 — Organizer workspace, competition builder
- Phase 17 — Admin dashboard, feature flag overview, audit overview

## Install

1. Backup repository dan Blogger theme.
2. Extract paket ini ke root `sykabelajar-frontend`.
3. Replace files while preserving the repository paths.
4. Commit to `main`.
5. GitHub Actions menjalankan `node build/build.mjs` dan memperbarui `dist/`.
6. Blogger tetap memakai loader/manifest existing.

## Verification

Local build:

```bash
node build/build.mjs
```

Expected release artifacts:

- `dist/loader.js`
- `dist/manifest.json`
- fingerprinted `dist/app.*.min.js`
- fingerprinted `dist/styles.*.min.css`
- `dist/vendor.*.min.js`

## Rollback

Kembalikan commit sebelum milestone ini atau restore Blogger theme backup.
