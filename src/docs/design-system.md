# Design System — Duo Bikes (Mini)

Quick reference for tokens, components, and patterns used across the app.

## Tokens (CSS custom properties)
- `--color-primary`: #2563eb — primary brand
- `--color-primary-600`: #1d4ed8 — accent
- `--color-bg`: #ffffff
- `--color-surface`: #f8f8f8
- `--radius-lg`: 12px
- `--shadow-sm` / `--shadow-md` — small/medium shadows

## Components
- `Button` (`src/components/button.tsx`): larger tap target, subtle active scale, default export.
- `Card` (`src/components/card.tsx`): selectable mode, keyboard accessible (Enter/Space), focus ring.
- `Alert` (`src/components/alert.tsx`): role/aria-live, dismissible, fades in.
- `SimpleNav` (`src/components/simple-nav.tsx`): responsive top nav + compact bottom mobile nav, `aria-current` support.
- `Modal` (`src/components/modal.tsx`): reusable dialog with ESC close and basic focus trap.
- `FormField` (`src/components/form-field.tsx`): label, helper text and error display.

## Patterns
- Accessibility: use `aria-current`, `role="alert"` for errors, keyboard activation for interactive cards and buttons, and focus trapping in modals.
- Forms: show helper text below fields and error text in red; apply `.field-error` wrapper to highlight invalid fields.
- Microinteractions: use `.animate-fade-in` for content entrance, `.skeleton` for loading placeholders, and `.toast` for transient messages.

## How to contribute
- Add tokens to `:root` in `src/styles/globals.css`.
- New components should use the `card`, `button`, and `field` styles for consistent spacing and accessibility.

