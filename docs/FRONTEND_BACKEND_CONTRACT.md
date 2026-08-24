# Frontend ↔ Supabase Contract v4.4

## Auth
- Supabase Auth session = source of truth.
- `getSession()` harus selesai sebelum initial route render.
- `INITIAL_SESSION` dengan null tidak dianggap logout.
- Hanya `SIGNED_OUT` yang membersihkan user state.

## Profile
`profiles` dipakai untuk:
- full_name
- username
- grade
- birth_date
- institution
- school_id
- guardian_name
- bio
- avatar_url + Cloudinary metadata

## Competition
Public read: `competitions` + `competition_levels` + `registration_rules` + `competition_rewards`.
Admin/Organizer mutation mengikuti RLS dan `transition_competition()`.

## Registration
Frontend memakai `register_for_competition()`; duplicate/eligibility/time-window final tetap ditentukan backend.

## Control Plane
Admin:
Users, Competitions, Questions, Twibbon, Results, Certificates, Orders, Moderation, Plans, Settings, Audit.

Organizer:
Competitions, Participants, Questions, Grading, Results, Awards, Certificates, Twibbon, Notifications, Plan & Usage.

## Media
Cloudinary client config untuk avatar/profile. Asset sensitif/private wajib memakai signed flow dari Edge Function.
