# Phase 15 Summary — Student Experience Bridge

Phase 15 exposes read-only student dashboard data to V2 while retaining the
legacy pages as the visible production UI.

- Profile and session come from the existing legacy state.
- Achievements use the existing award service.
- Competition discovery uses the existing competition service.
- Direct Supabase queries are a fallback only when legacy state is unavailable.

When V2 is enabled, modules can read `window.SYKA_V2_STUDENT.getDashboard()`.
No student data is written, and legacy profile, award, and competition pages are
not replaced.
