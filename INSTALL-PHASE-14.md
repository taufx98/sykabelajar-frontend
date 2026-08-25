# Install Phase 14 — V2 Authentication Bridge

This package is an incremental patch on top of Phase 13. Extract it into the
repository root in GitHub and commit the replaced files to `main`.

No Blogger theme change is required. Keep `ENABLE_V2: true` only if the Phase
13 smoke test is still healthy; set it back to `false` to disable V2 safely.

The GitHub workflow rebuilds `dist/v2/` after the commit. Phase 14 does not
create a new login page, change Supabase keys, or change role policies. Its
purpose is to give V2 modules the exact same session, profile, and auth actions
as the existing legacy app.
