# Sykabelajar Frontend v4.7.0 — Production Polish

Baseline frontend for `sykabelajar.id` using Blogger as the application shell, Supabase as source of truth, and Cloudinary for media.

## Included
- Student / Teacher / Organizer account onboarding
- Supabase Auth session recovery + SPA routing
- Profile UX + Cloudinary avatar
- Competition catalog/detail polish + Cloudinary poster upload
- Organizer package selection before workspace control plane
- FREE activation + Premium/Pro manual-transfer proof workflow
- Admin plan builder with checkbox capabilities and organizer plan assignment
- Admin/Organizer control planes
- Store for Student / Teacher / Organizer products, Koin Edu, feature unlocks, digital items, donations
- Manual payment proof uploaded to Cloudinary
- Competition / promo / product / twibbon media upload via Cloudinary; no image URL entry in UI
- Fingerprinted build + GitHub Actions + stable manifest-driven loader

## Repository
GitHub: `taufx98/sykabelajar-frontend`

Replace the repository contents with this package. The workflow in `.github/workflows/build-and-publish.yml` builds fingerprinted assets and publishes `dist/` to `main`.

## Blogger
Keep the currently working stable theme. `App.html` remains:

```html
<div id="sykabelajar-app-page-host" aria-hidden="true"></div>
```

Do not add another loader script.

## Supabase
Run backend migrations 0005 and 0006 in order (0005 only when not already applied).

## Security
- Supabase publishable key may be bundled client-side, but RLS remains mandatory.
- Never put service-role keys, Cloudinary API secrets, payment credentials, or webhook secrets in GitHub/frontend.
- Paid plan/product benefits activate only after server-side/manual payment verification.


## v4.6.3 hotfix
- Admin assignment plan template fixed.
- Admin audit tab restored.
- Utility functions required by control plane restored.
- All source JavaScript syntax checked with `node --check`.


## v4.7.0 UI polish
- Role-aware Profile form with safe birth-date handling.
- Competition detail CTA now follows competition lifecycle.
- Leaderboard empty/podium states polished without fake participant initials.
- Scheduler popovers are positioned above modal scroll containers and no longer clip.


## v4.7 Competition Journey
- Daftar/Juknis/Share primary CTA.
- Local-only twibbon rendering; generated participant image is never uploaded/stored.
- Organizer-owned Cloudinary twibbon template.
- Social-proof URL validation (Instagram/TikTok).
- Manual or plan-gated automatic registration approval.
- Juknis PDF upload and browser viewer.
- Published kisi-kisi before LIVE; questions remain hidden until LIVE.
- Question Builder + CSV/JSON import.
- Fixed Admin role popup and Organizer grading auto-open binding bugs.


## v4.7.0 Competition Journey
- Registration popup with local-only participant twibbon rendering; generated participant images are never uploaded or stored.
- Instagram/TikTok social-proof URL is persisted only with the registration.
- Organizer manual or plan-gated AUTO registration approval with server-side validation.
- Juknis PDF and organizer-published kisi-kisi.
- Organizer question builder; participant question visibility is server-gated to LIVE.
- Upgrade-only organizer plan UX.
- Admin user details and role/status actions are explicit and do not open modals during tab render.
- Notifications use the existing notifications schema contract.
