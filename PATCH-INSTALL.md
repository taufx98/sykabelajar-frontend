# SYKABELAJAR V2 — BATCH UI/UX FINAL

Batch ini menggabungkan seluruh perubahan UI/UX yang sebelumnya tersebar menjadi satu paket.

## Cakupan
- Bolt-inspired dark-first design
- Landing hero + leaderboard + featured competitions
- Sidebar + main content + right rail
- Mobile bottom navigation
- Dark/light theme
- Student/Organizer/Admin shell
- Competition card styling
- Loading state
- Hover/focus polish
- Reduced-motion accessibility
- V2 runtime activation
- Build pipeline integration untuk runtime + V2 stylesheet

## File yang diubah
- `src/core/app.js`
- `src/sykabelajar-v2/runtime/v2-runtime.js`
- `src/sykabelajar-v2/styles/v2-runtime.css`
- `build/build.mjs`

## Yang TIDAK diubah
- Supabase schema
- RLS
- Edge Functions
- Cloudinary
- Blogger theme
- Legacy source lain
- `dist/`

## Cara pasang
1. Backup repository.
2. Extract ZIP.
3. Upload hanya file di dalam batch dengan path yang sama.
4. Commit ke `main`.
5. Jangan upload `dist/`.
6. Tunggu GitHub Actions sampai hijau.
7. Hard refresh website Blogger.

## Test lokal
Jalankan dari root repository:
`node build/build.mjs`

Expected:
- `buildMode: source-complete`
- `missingSourceModules: []`
- `dist/manifest.json` terbentuk
