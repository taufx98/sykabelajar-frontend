# Sykabelajar Frontend v4.4 — Production Polish

Frontend Blogger SPA untuk sykabelajar.id yang tetap mengikuti RPD v4.1:

- Blogger = application shell + CMS/SEO
- Supabase = Auth + PostgreSQL + RLS + RPC source of truth
- Cloudinary = media layer
- Edge Functions = secret/privileged operations
- GitHub + GitHub Actions + jsDelivr = versioned frontend build pipeline

## Fokus v4.4

- Auth bootstrap menunggu session recovery sebelum route pertama dirender.
- `/p/app.html` menjadi route `/` ketika tidak ada `?route=`.
- Legacy `?tab=` alias dipetakan ke route canonical.
- Admin dan Organizer menggunakan query tab yang canonical: `?route=/admin&tab=users`.
- State transition hanya menawarkan target valid dari state saat ini.
- Profile UI diperhalus, termasuk avatar, tanggal lahir, sekolah autocomplete, dan light mode.
- Competition forms memakai `datetime-local` yang lebih nyaman untuk tanggal + jam.
- Home hero statistics dan promo slides tetap membaca Supabase.
- Registration memakai RPC `register_for_competition`.
- Leaderboard tetap menunjukkan desain Top 50 sambil read model final diaktifkan.
- Empty/error/loading state dibuat eksplisit; tidak ada blank page untuk error aplikasi.

## Deployment

Blogger theme tetap menggunakan stable loader / manifest pipeline. Setelah source di-push ke `main`, GitHub Actions membangun asset fingerprint dan memperbarui `dist/manifest.json`.

Tidak ada secret server-side di frontend.
