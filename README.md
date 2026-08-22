# Sykabelajar Frontend v4.6.1 — Production Polish

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
