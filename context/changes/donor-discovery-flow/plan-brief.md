# Plan Brief — donor-discovery-flow

## Goal

Deliver the anonymous donor MVP flow: city-based shelter discovery and shelter detail with urgency-sorted needs plus Allegro CTA.

## Key Decisions

- Keep donor flow fully public (no auth/session dependency).
- Use existing DB helpers (`getSheltersByCity`, `getShelterById`, `getNeedsByShelter`) instead of new data layer abstractions.
- Use query-param filtering on `/` for city (`searchParams.city`).
- Keep urgency display aligned with existing enum values (`pilne`, `potrzebne`, `mile_widziane`).

## Phase Summary

| Phase | What | Files |
| ----- | ---- | ----- |
| 1 | Public city search page | `src/app/page.tsx` |
| 2 | Shelter detail + needs + Allegro CTA | `src/app/shelters/[id]/page.tsx` (+ optional tiny CSS touch in `src/app/globals.css`) |

## Exit Criteria

- Donor can discover shelters by city and open shelter detail.
- Need list is urgency-sorted.
- Allegro link opens in a new tab when present.
- `tsc` and `lint` pass.
