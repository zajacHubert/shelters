# Donor Discovery Flow Implementation Plan

## Overview

S-03 delivers the public donor path: city-filtered shelter discovery, shelter detail view with needs sorted by urgency, and one-click Allegro link without login. It reuses existing DB helpers from F-01 and data already managed in S-02.

## Current State Analysis

- `src/app/page.tsx` is a placeholder (`ShelterNeeds`).
- `src/db/queries/shelters.ts` already has `getSheltersByCity` and `getShelterById`.
- `src/db/queries/needs.ts` already returns urgency-sorted needs via `getNeedsByShelter`.
- Coordinator dashboard CRUD exists from S-02, so donor data source is ready.
- No public routes for donors exist yet.

## Desired End State

- Donor can open `/`, enter city, and see shelters in that city without logging in.
- Donor can open `/shelters/[id]` and see needs sorted by urgency.
- Each need with `allegro_link` shows `Kup na Allegro ->` opening in a new tab.
- Anonymous flow works end-to-end and does not depend on auth session.
- `npx tsc --project tsconfig.app.json --noEmit` passes.
- `npm run lint` passes.
- FR-007, FR-008, FR-009 are satisfied.

## What We're NOT Doing

- No donor accounts or personalization.
- No map view.
- No advanced search (only city filter).
- No in-app checkout or payment flow.
- No observability stack beyond existing platform logs.

## Implementation Approach

Two phases:

1. Discovery page (`/`) with city filter and shelter list.
2. Shelter detail page (`/shelters/[id]`) with urgency-ordered needs and Allegro CTA.

## Critical Implementation Details

- City filtering uses normalized lowercase value in query (`city.toLowerCase()`) to match existing DB writes.
- Public pages must stay accessible without session checks.
- External Allegro links use `target="_blank"` with `rel="noopener noreferrer"`.
- If a shelter has zero needs, detail page still renders an explicit empty state.

---

## Phase 1: City-based shelter discovery page

### Overview

Replace placeholder home page with donor search UI that reads `searchParams.city` and lists shelters for that city.

### Changes Required

#### 1. Update `src/app/page.tsx`

- Convert to async Server Component.
- Read `searchParams.city` and trim input.
- Render GET form with city field.
- Query shelters only when city is present.
- Render shelter links to `/shelters/[id]`.
- Render clear empty states:
  - no city provided,
  - city provided but no results.

### Success Criteria

#### Automated Verification

- `npx tsc --project tsconfig.app.json --noEmit` passes
- `npm run lint` passes

#### Manual Verification

- `/` loads without login and shows city search form.
- Submitting city with known shelters shows at least one result and link.
- Submitting unknown city shows "Brak schronisk w tym mieście".

---

## Phase 2: Public shelter detail with needs and Allegro link

### Overview

Add shelter detail route with sorted needs and CTA links.

### Changes Required

#### 1. Create `src/app/shelters/[id]/page.tsx`

- Fetch shelter by id; if missing, render `notFound()`.
- Fetch shelter needs via `getNeedsByShelter`.
- Render shelter header (name, city).
- Render list of needs with urgency badge, quantity, and optional Allegro link.
- Show explicit no-needs message when list is empty.

#### 2. Optional small styles update in `src/app/globals.css`

- Add tiny utility classes only if needed for readable cards/badges and consistency.

### Success Criteria

#### Automated Verification

- `npx tsc --project tsconfig.app.json --noEmit` passes
- `npm run lint` passes

#### Manual Verification

- Clicking shelter from `/` opens `/shelters/[id]` and displays needs.
- Needs order is `pilne -> potrzebne -> mile_widziane`.
- `Kup na Allegro ->` appears only when link is present and opens new tab.
- Route works anonymously (no redirects to login).

---

## References

- Roadmap: `context/foundation/roadmap.md` (S-03)
- PRD: `context/foundation/prd.md` (FR-007, FR-008, FR-009)
- Data helpers: `src/db/queries/shelters.ts`, `src/db/queries/needs.ts`

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: City-based shelter discovery page

#### Automated

- [x] 1.1 `npx tsc --project tsconfig.app.json --noEmit` passes — 6965020
- [x] 1.2 `npm run lint` passes — 6965020

#### Manual

- [x] 1.3 `/` shows city search form without login — 6965020
- [x] 1.4 Known city returns shelters with links — 6965020
- [x] 1.5 Unknown city shows empty-state message — 6965020

### Phase 2: Public shelter detail with needs and Allegro link

#### Automated

- [x] 2.1 `npx tsc --project tsconfig.app.json --noEmit` passes — 6965020
- [x] 2.2 `npm run lint` passes — 6965020

#### Manual

- [x] 2.3 Shelter detail renders needs for selected shelter — 6965020
- [x] 2.4 Needs are ordered `pilne -> potrzebne -> mile_widziane` — 6965020
- [x] 2.5 Allegro CTA appears only for rows with link and opens new tab — 6965020
- [x] 2.6 Public donor flow works without login redirects — 6965020
