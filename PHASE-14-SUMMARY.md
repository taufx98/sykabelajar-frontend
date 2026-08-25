# Phase 14 Summary — Authentication Bridge

Phase 14 adds a V2 authentication adapter without replacing the existing
Sykabelajar login, registration, logout, Supabase client, or session listener.

- V2 reads the established legacy session and profile first.
- V2 login, registration, and logout delegate to `SYKA_AUTH_SERVICE`.
- A direct Supabase session/profile read is only a fallback when the legacy
  state is not yet available.
- No public credentials, RLS rules, role assignments, or legacy auth screens
  are changed.

This is intentionally an integration layer, not an authentication rewrite.
