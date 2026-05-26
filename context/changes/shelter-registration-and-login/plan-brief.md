# Plan Brief — shelter-registration-and-login

## Goal

Coordinator can register a shelter and log in to the panel in <5 minutes (PRD guardrail). F-02 built all auth logic; this slice adds CSS utility classes + labels + shelter name on dashboard.

## Key Decisions

- CSS: `@layer components` block in `globals.css` defines `.input`, `.btn-primary`, `.btn-secondary` — existing F-02 forms are already wired to these class names
- Dashboard: add `getShelterById(db, id)` query, show `shelter.name` + `shelter.city`
- Forms: add `<label>` with `htmlFor`/`id` pairs — accessibility + 5-min guardrail

## What's NOT Changing

Server Actions, middleware, session JWT, DB schema, route group layout — all F-02 owned.

## Phase Summary

| Phase | What                 | Files                                                               |
| ----- | -------------------- | ------------------------------------------------------------------- |
| 1     | CSS utilities        | `src/app/globals.css`                                               |
| 2     | DB query + dashboard | `src/db/queries/shelters.ts`, `src/app/dashboard/page.tsx`          |
| 3     | Form labels          | `src/app/(auth)/register/page.tsx`, `src/app/(auth)/login/page.tsx` |
