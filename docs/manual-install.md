# Manual install

## GitHub frontend
1. Backup the current repository.
2. Replace the repository contents with the contents of this folder.
3. Commit the changes.
4. Wait for GitHub Actions `Build and publish frontend assets` to become green.

## Supabase
Run:
- `backend/migrations/0005_monetization_catalog.sql` only if migration 0005 has not already been applied.
- `backend/migrations/0006_onboarding_workspace_commerce.sql` after 0005.

## Blogger
Keep the currently working stable theme/loader. `App.html` remains:

```html
<div id="sykabelajar-app-page-host" aria-hidden="true"></div>
```

## Media
All profile, competition, promo, product, twibbon, and payment-proof images are uploaded with Cloudinary Upload Widget. The UI does not ask users for image URLs.
