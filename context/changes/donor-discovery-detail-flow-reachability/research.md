---
date: '2026-06-01T16:14:40+02:00'
researcher: GitHub Copilot
git_commit: d7a5724c579f4f04d3970e777c7f4912e8e1664c
branch: master
repository: shelters
topic: 'Donor cannot reach shelter discovery/detail flow from test-plan.md'
tags: [research, codebase, donor-flow, nextjs, middleware, supabase]
status: complete
last_updated: '2026-06-01'
last_updated_by: GitHub Copilot
---

# Research: Donor cannot reach shelter discovery/detail flow from test-plan.md

**Date**: 2026-06-01T16:14:40+02:00  
**Researcher**: GitHub Copilot  
**Git Commit**: d7a5724c579f4f04d3970e777c7f4912e8e1664c  
**Branch**: master  
**Repository**: shelters

## Research Question

What can cause the donor to fail reaching discovery and detail flow (home city search and shelter details), and what evidence exists in code and prior decisions?

## Summary

The donor flow is intentionally public and is not blocked by middleware in the current implementation. The most probable real blockers are runtime/data dependencies (missing Supabase env vars, query errors, missing shelter rows), not auth redirects. Historical plans and PRD align with this architecture. The largest current gap is test coverage: there are no direct tests asserting anonymous donor reachability for `/` and `/shelters/[id]`.

## Detailed Findings

### 1. Public route access design is correct (not auth-gated)

- Home and detail donor pages live under public App Router paths and do not invoke session checks: [home page](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/app/page.tsx#L1), [detail page](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/app/shelters/%5Bid%5D/page.tsx#L1).
- Middleware matcher only targets dashboard routes: [middleware matcher](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/middleware.ts#L25). This excludes `/` and `/shelters/[id]` from login redirect behavior.
- Historical implementation explicitly required public donor flow without auth dependency: [archive donor plan, critical implementation details](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/context/archive/2026-05-27-donor-discovery-flow/plan.md#L36).

### 2. Confirmed reachability failure modes in live code

- Missing Supabase env vars throw synchronously in server rendering path and can make donor pages fail hard: [DB client env guard](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/db/client.ts#L18).
- Home page performs DB call whenever city is provided; query errors are thrown and unhandled at page level: [home DB query](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/app/page.tsx#L20), [query throws on error](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/db/queries/shelters.ts#L15).
- Detail page fetches shelter and needs in parallel; if shelter is absent, route intentionally becomes 404: [parallel fetch + notFound](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/app/shelters/%5Bid%5D/page.tsx#L29).
- Needs query also throws on DB errors, which can produce runtime failure instead of graceful fallback: [needs query throw](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/db/queries/needs.ts#L20).

### 3. Donor flow behavior aligns with product contract

- PRD contract requires anonymous access and city-filter discovery path: [PRD FR-007..FR-009 and access model](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/context/foundation/prd.md#L99).
- Roadmap marks S-03 as done and preserves the same anonymous reachability assumptions: [roadmap S-03 outcome](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/context/foundation/roadmap.md#L113).
- Test-plan risk #1 is therefore valid and still active because runtime dependency failures remain possible: [test-plan risk map](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/context/foundation/test-plan.md#L25).

### 4. Coverage gap is real for anonymous donor availability

- Donor flow strings and query usage appear in app code but not in test files from a repository search, indicating no direct regression assertions for these pages: [home city flow strings](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/app/page.tsx#L55), [detail CTA](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/app/shelters/%5Bid%5D/page.tsx#L75).
- Existing test stack is currently CLI-heavy per the test plan itself, which supports this gap assessment: [test stack note](https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/context/foundation/test-plan.md#L61).

## Code References

- https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/app/page.tsx#L1 - Anonymous donor discovery page with city filter and shelter links.
- https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/app/shelters/%5Bid%5D/page.tsx#L1 - Shelter detail route, needs rendering, and 404 behavior.
- https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/middleware.ts#L25 - Route matcher limits auth redirects to dashboard paths.
- https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/db/client.ts#L18 - Hard failure on missing Supabase env vars.
- https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/db/queries/shelters.ts#L8 - City lookup implementation and query-error throw behavior.
- https://github.com/zajacHubert/shelters/blob/d7a5724c579f4f04d3970e777c7f4912e8e1664c/src/db/queries/needs.ts#L12 - Needs fetch and urgency-ordered return with throw-on-error.

## Architecture Insights

- Access segmentation is clean: anonymous donor routes in App Router; protected coordinator area enforced by middleware matcher for dashboard only.
- Reachability risk is mostly operational/runtime, not auth policy drift in current code.
- The route logic uses direct server-side DB reads without fallback adapters, so infra misconfiguration directly affects donor availability.
- `notFound()` on missing shelter ID gives deterministic behavior and is compatible with an explicit “reachable but missing resource” model.

## Historical Context (from prior changes)

- Donor flow was intentionally implemented as fully public and independent from auth: [context/archive/2026-05-27-donor-discovery-flow/plan.md](../../archive/2026-05-27-donor-discovery-flow/plan.md).
- Data layer design accepted throw-on-error query helpers and runtime env dependency for DB client construction: [context/archive/2026-05-26-data-layer-foundation/plan.md](../../archive/2026-05-26-data-layer-foundation/plan.md).
- Current risk prioritization explicitly flags this donor reachability scenario as top risk #1: [context/foundation/test-plan.md](../../foundation/test-plan.md).

## Related Research

- [context/changes/e2e/research.md](../e2e/research.md) - broader testing and CI research showing existing suite concentration outside app donor routes.

## Open Questions

- Should donor pages degrade gracefully (friendly error/empty state) when DB is temporarily unavailable, or is framework error output acceptable for MVP?
- Should city matching include normalization beyond lowercase (for example trimming inconsistent whitespace in persisted data) to reduce false negatives?
- Which minimum integration test set should be mandatory in Phase 1 to assert anonymous flow availability (`/`, city search, valid shelter ID, invalid shelter ID)?
