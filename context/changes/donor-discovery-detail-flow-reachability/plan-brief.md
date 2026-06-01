# Donor Discovery and Detail Reachability Protection — Plan Brief

> Full plan: `context/changes/donor-discovery-detail-flow-reachability/plan.md`
> Research: `context/changes/donor-discovery-detail-flow-reachability/research.md`

## What & Why

We are adding a focused safety net for the anonymous donor flow so regressions are detected before users lose access to discovery/detail pages. This directly addresses risk #1 in the test plan by protecting the public route contract and dependency-failure behavior with deterministic integration tests.

## Starting Point

The donor flow already exists in production pages and is intentionally public. Current risk is not auth gating, but runtime/data dependency failures and lack of direct donor-route regression tests.

## Desired End State

There is a repeatable donor integration suite that verifies anonymous discovery and detail reachability, 404 behavior for unknown shelter ids, and current fail-fast contracts for dependency failures. CI runs the suite in advisory mode so teams get immediate signal without hard merge blocking during stabilization.

## Key Decisions Made

| Decision           | Choice                                | Why (1 sentence)                                                                 | Source   |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Scope shape        | Tests-first only                      | Fastest way to reduce top risk without mixing behavior redesign into one change. | Plan     |
| Failure oracle     | Keep current fail-fast + 404 contract | Matches current implementation and avoids speculative assertions.                | Research |
| Minimum test layer | Integration-only                      | Lower setup and maintenance cost while still protecting route contracts.         | Plan     |
| CI rollout mode    | Advisory first                        | Preserves delivery flow while stabilizing new suite signal.                      | Plan     |

## Scope

**In scope:**

- Donor-route integration harness and fixtures
- Discovery/detail reachability assertions for anonymous flow
- Unknown shelter 404 and dependency-failure contract assertions
- Advisory CI execution path for donor suite
- Cookbook backfill in test plan after phase completion

**Out of scope:**

- Production fallback UX redesign for dependency outages
- Broad browser e2e rollout
- Middleware/auth model changes
- Data model or migration changes

## Architecture / Approach

Use a small integration test harness around donor route contracts, then add targeted tests for normal and failure outcomes. Keep production logic unchanged except for minimal test seams if strictly necessary. Add a dedicated CI signal path that runs non-blocking first.

## Phases at a Glance

| Phase                                 | What it delivers                                                          | Key risk                                   |
| ------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| 1. Donor Integration Test Harness     | Reusable setup and fixture layer for donor route tests                    | Harness instability can make tests noisy   |
| 2. Reachability and Failure Contracts | Concrete assertions for anonymous route access and known failure outcomes | Incorrect oracle could lock wrong behavior |
| 3. Advisory CI + Cookbook Backfill    | Non-blocking CI signal and documented testing pattern                     | Signal ignored if advisory path is unclear |

**Prerequisites:** working local app environment, ability to run `bun test`, and current donor routes present in app code.
**Estimated effort:** ~2-3 implementation sessions across 3 phases.

## Open Risks & Assumptions

- Assumes integration tests can be implemented without introducing broad runtime refactors.
- Advisory CI signal may need one follow-up hardening change before becoming required.
- If fixture determinism is weak, phase 1 may need stabilization before phase 2 expansion.

## Success Criteria (Summary)

- Donor integration suite reliably catches regressions in anonymous discovery/detail reachability.
- Current expected failure contracts (404 for unknown shelter, fail-fast dependency behavior) are explicitly protected.
- CI publishes donor test signal on PRs via advisory execution, enabling safe promotion to strict gate later.
