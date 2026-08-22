# Sykabelajar v4.7.4 — Question Builder Type-State Fix

## Fixed
- Changing question type now preserves a separate draft state for each type.
- Switching Essay -> Multiple Choice immediately restores a valid Multiple Choice option table.
- Switching Multiple Choice -> Essay -> Multiple Choice restores the previous Multiple Choice options instead of leaving an empty panel.
- True/False always reconstructs Benar/Salah safely.
- Multiple Choice enforces exactly one correct option; Multiple Checkbox requires at least one.
- Type-specific settings no longer leak across question types.
- Existing question data remains editable without losing unrelated common fields.

## Installation
Replace the repository contents with this package, commit, then let GitHub Actions rebuild the fingerprinted assets.
