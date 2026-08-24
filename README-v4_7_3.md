# Sykabelajar v4.7.3

Question Builder reliability and frontend logic hardening.

## Question type switching
- Keeps common fields (competition, prompt, points, order, required) when changing type.
- Serializes the current type-specific panel before switching.
- Rebuilds the type panel from a controlled draft state so stale DOM never leaks across types.
- Multiple choice: exactly one correct option.
- Multiple checkbox: one or more correct options.
- True/False: fixed Benar/Salah options.
- Short answer: accepted answers with duplicate filtering.
- Essay: manual grading rubric.
- File upload: format, size, required flag.
- Live participant preview.
- Validation remains in the modal and blocks unsafe submissions.

## General hardening
- Verified every `window.SYKA_UTILS.*` call has an exported utility.
- Verified every `svc().*` control-plane call has an exported service contract.
- Existing auth/session and Blogger loader remain unchanged.
- Supabase remains the source of truth.
