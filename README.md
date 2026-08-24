# Sykabelajar Frontend v4.9.0

Blogger application shell + modular frontend + Supabase + Cloudinary.

This release is a logic-hardening baseline, not just a visual patch.

### Deploy
Replace the root of `taufx98/sykabelajar-frontend` with this repository content. Keep the existing Blogger theme and App.html loader.

GitHub Actions builds fingerprinted assets and publishes `dist/manifest.json`.

### Database
Apply migrations 0005 through 0010 only if they are not already present. For an environment that already has 0001–0009, only apply:

`backend/migrations/0010_assessment_referral_hardening_v4_8.sql`

### Release
Version: 4.9.0

See `docs/v4.8-audit-and-release.md` for the remediation summary and smoke flow.


## v4.9.0 privileged organizer plan controls

Run migration `backend/migrations/0011_privileged_organizer_plan_control.sql` after migrations through 0010.

The Admin "Pengaturan Penyelenggara" control plane uses Supabase Auth step-up reauthentication. Passwords are never stored in the frontend or database. Privileged package/workspace mutations require a recent Auth `auth_time` (15 minutes), admin role, audit reason, and server-side RPC checks.

Plan catalog supports monthly + yearly pricing. Organizer plan orders can request MONTHLY or YEARLY billing; Admin approval activates the subscription with 30-day or 1-year expiry.
