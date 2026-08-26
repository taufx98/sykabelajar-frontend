# Sykabelajar V2 UI/UX Bolt-Inspired Patch

File yang berubah:
- `src/core/app.js`
- `src/sykabelajar-v2/runtime/v2-runtime.js`
- `src/sykabelajar-v2/styles/v2-runtime.css`
- `build/build.mjs`

Perubahan:
- Mengaktifkan V2 runtime setelah bootstrap auth existing.
- Dark-first Bolt-inspired landing.
- 3-column desktop shell: sidebar, main, right rail.
- Mobile bottom navigation.
- Dark/light theme.
- Landing, auth, student, organizer, admin, competition shell.
- Tetap memakai Supabase client dan service existing.
- Legacy router tetap sebagai fallback bila V2 tidak tersedia.

Cara pasang:
1. Extract ZIP.
2. Upload hanya empat file dengan path yang sama.
3. Jangan upload `dist/`.
4. Commit ke `main`.
5. Tunggu GitHub Actions selesai.
6. Hard refresh Blogger.

Test lokal:
`node build/build.mjs`
