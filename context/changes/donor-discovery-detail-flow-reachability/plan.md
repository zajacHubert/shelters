# Donor Discovery and Detail Reachability Protection Plan

## Overview

Add a focused integration-test safety net for the anonymous donor flow so regressions are detected early without changing production behavior in this phase. The plan protects risk #1 from the test plan: donor cannot reach discovery/detail flow when runtime dependencies or route contracts drift.

## Current State Analysis

The donor flow is implemented and publicly reachable through App Router pages, and middleware currently protects only dashboard routes. Reachability failures are most likely to come from runtime/data dependencies (missing Supabase env vars, DB query errors, missing shelter rows) rather than auth redirects.

### Key Discoveries:

- `src/middleware.ts:25` limits redirects to `/dashboard/:path*`, so donor routes are not auth-gated.
- `src/db/client.ts:18` throws when Supabase env vars are missing, which can fail donor page rendering.
- `src/db/queries/shelters.ts:15` and `src/db/queries/needs.ts:20` throw on query errors, so dependency failures currently fail-fast.
- `src/app/shelters/[id]/page.tsx:35` intentionally calls `notFound()` when shelter record is missing.
- `.github/workflows/ci.yml` currently runs lint/build/unit checks only and has no donor-route-specific integration signal.

## Desired End State

The repository has deterministic integration tests that protect anonymous donor reachability and current failure contracts: city search route, shelter detail route, unknown shelter 404 behavior, and explicit fail-fast behavior for runtime dependency failures. CI runs this donor suite as advisory first (non-blocking) to establish signal and stabilize before tightening gates.

### Verification

- New donor integration suite passes locally and in CI advisory mode.
- Tests assert current production contract (public access, 404 for missing shelter, fail-fast for dependency errors) with no runtime behavior changes.
- Plan outputs can be promoted to required gate in a follow-up change after stabilization.

## What We're NOT Doing

- No UX fallback redesign for DB/env failures in this phase.
- No migration of donor pages to a different data-access architecture.
- No broad e2e browser matrix rollout in this phase.
- No changes to auth/session middleware behavior.
- No strict required CI gate yet (advisory only by user decision).

## Implementation Approach

Use a tests-first approach with integration-level assertions around anonymous route contracts. Introduce a minimal test harness that can validate donor route behavior and dependency-failure contracts reproducibly, then wire the suite into CI in advisory mode. Keep production code changes limited to test seams only when necessary and preserve current runtime semantics.

## Critical Implementation Details

The tests in this change intentionally protect the **current contract** (including fail-fast on infra failures) rather than introducing graceful recovery. This keeps scope tight and avoids mixing behavior change with risk-protection rollout. Any UX-hardening for outages should be a separate follow-up change after this safety net is in place.

## Phase 1: Donor Integration Test Harness

### Overview

Create a repeatable integration harness for donor-route testing, including deterministic data setup strategy and reusable assertions for anonymous reachability contracts.

### Changes Required:

#### 1. Add donor integration test directory and shared helpers

**File**: `tests/integration/donor-flow/support/harness.ts`

**Intent**: Provide reusable setup utilities for donor flow integration tests so each test does not duplicate environment/bootstrap logic.

**Contract**: Expose helper APIs for test context creation, optional fixture seeding adapter, and standardized result assertions for HTTP status + response body markers.

#### 2. Add donor fixtures contract

**File**: `tests/integration/donor-flow/support/fixtures.ts`

**Intent**: Define canonical fixture inputs for city-filter and shelter-detail scenarios used by all donor integration tests.

**Contract**: Export deterministic fixture descriptors for: valid city with shelters, unknown city empty results, valid shelter id, unknown shelter id.

#### 3. Add integration test run documentation

**File**: `context/changes/donor-discovery-detail-flow-reachability/README-testing.md`

**Intent**: Document local prerequisites and exact command path for running donor integration tests.

**Contract**: Include single-suite run command, expected env vars, and known failure diagnostics.

### Success Criteria:

#### Automated Verification:

- Donor harness compiles under `bun test` runtime.
- `bun test tests/integration/donor-flow --bail` discovers and executes scaffold tests.
- `npm run lint` passes after harness additions.

#### Manual Verification:

- A developer can run only donor integration tests using documented commands.
- Harness logs/error output are clear enough to distinguish fixture/setup failures from app regressions.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Reachability and Failure-Contract Integration Tests

### Overview

Implement integration tests that protect anonymous donor discovery/detail flow and current failure contracts without changing runtime behavior.

### Changes Required:

#### 1. Add anonymous discovery route reachability tests

**File**: `tests/integration/donor-flow/discovery-route.integration.test.ts`

**Intent**: Protect donor entry path behavior around city search and result rendering contract.

**Contract**: Assert behavior for: no-city prompt state, known-city results state, unknown-city empty state; all without auth/session dependency.

#### 2. Add shelter detail route contract tests

**File**: `tests/integration/donor-flow/shelter-detail.integration.test.ts`

**Intent**: Protect shelter detail reachability and expected outcomes for valid and invalid shelter identifiers.

**Contract**: Assert: valid shelter returns detail content and needs markers; unknown shelter produces 404 contract.

#### 3. Add dependency failure contract tests

**File**: `tests/integration/donor-flow/dependency-failure.integration.test.ts`

**Intent**: Lock current fail-fast behavior for missing env vars and query-layer failures so regressions are visible.

**Contract**: Assert explicit failure outcomes when Supabase env vars are absent and when donor query operations error; no graceful fallback expected in this phase.

### Success Criteria:

#### Automated Verification:

- `bun test tests/integration/donor-flow/discovery-route.integration.test.ts` passes.
- `bun test tests/integration/donor-flow/shelter-detail.integration.test.ts` passes.
- `bun test tests/integration/donor-flow/dependency-failure.integration.test.ts` passes.
- `bun test tests/integration/donor-flow --bail` passes as a suite.
- `npm run lint` passes.

#### Manual Verification:

- Manual spot-check confirms donor home and detail flow still work anonymously in local run.
- Manual spot-check confirms unknown shelter id still returns 404 behavior.
- Manual validation confirms no production UX behavior changed for dependency failures.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Advisory CI Signal and Cookbook Backfill

### Overview

Wire donor integration suite into CI as advisory (non-blocking), then backfill cookbook notes in the foundation test plan via the phase completion process.

### Changes Required:

#### 1. Add donor integration advisory step in CI

**File**: `.github/workflows/ci.yml`

**Intent**: Run donor integration suite on pull requests for visibility while avoiding hard-blocking during stabilization.

**Contract**: Add a dedicated donor integration job or step with non-blocking behavior (`continue-on-error: true` at job or step level) and explicit artifact/log output.

#### 2. Add test command shortcut for donor suite

**File**: `package.json`

**Intent**: Provide a stable command alias for donor integration suite execution in local and CI contexts.

**Contract**: Add script entry for donor integration suite (for example `test:donor-reachability`) pointing to the exact suite path.

#### 3. Backfill cookbook notes after phase implementation

**File**: `context/foundation/test-plan.md`

**Intent**: Update section 6 placeholders with actual donor integration pattern learned from this rollout phase.

**Contract**: Replace relevant `TBD` entries with concrete file locations and command conventions produced by this phase.

### Success Criteria:

#### Automated Verification:

- CI includes donor integration execution path in PR workflows.
- Advisory donor integration run appears in CI logs without blocking merge on failure.
- `npm run test:donor-reachability` executes donor suite locally.
- `npm run lint` and `npm run build` remain green.

#### Manual Verification:

- CI UI clearly shows donor integration result as signal.
- Team can identify failing donor integration assertions from logs without ambiguity.
- Cookbook entries in `test-plan.md` reflect shipped pattern accurately.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- No new pure unit tests are required for this change's primary objective.

### Integration Tests:

- Route-level anonymous reachability for discovery and detail donor paths.
- Contract-level outcomes for unknown shelter and dependency failure scenarios.

### Manual Testing Steps:

1. Start local app with valid env and verify donor home city search path manually.
2. Open a valid shelter detail page and confirm content renders anonymously.
3. Verify unknown shelter id behavior remains 404.
4. Run donor integration suite and confirm expected pass/fail diagnostics.

## Performance Considerations

- Donor integration suite should remain scoped and fast; keep fixtures minimal.
- Avoid adding broad browser automation in this phase to preserve quick feedback loops.

## Migration Notes

- No data migration required.
- No runtime behavior contract migration in this phase.

## References

- Related research: `context/changes/donor-discovery-detail-flow-reachability/research.md`
- Risk source: `context/foundation/test-plan.md`
- Current donor pages: `src/app/page.tsx`, `src/app/shelters/[id]/page.tsx`
- Middleware scope: `src/middleware.ts`
- Query/env failure surfaces: `src/db/client.ts`, `src/db/queries/shelters.ts`, `src/db/queries/needs.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Donor Integration Test Harness

#### Automated

- [x] 1.1 Donor harness compiles under bun test runtime
- [x] 1.2 Donor scaffold suite is discoverable and executable
- [x] 1.3 Lint passes after harness additions

#### Manual

- [ ] 1.4 Donor integration tests are runnable from documented commands
- [ ] 1.5 Harness diagnostics clearly distinguish setup vs app failures

### Phase 2: Reachability and Failure-Contract Integration Tests

#### Automated

- [x] 2.1 Discovery route integration test file passes
- [x] 2.2 Shelter detail route integration test file passes
- [x] 2.3 Dependency failure integration test file passes
- [x] 2.4 Full donor integration suite passes
- [x] 2.5 Lint passes with donor integration assertions

#### Manual

- [ ] 2.6 Anonymous donor discovery and detail flow still work locally
- [ ] 2.7 Unknown shelter id still returns 404 contract
- [ ] 2.8 No production UX behavior changed for dependency failures

### Phase 3: Advisory CI Signal and Cookbook Backfill

#### Automated

- [ ] 3.1 CI includes donor integration advisory execution path
- [ ] 3.2 Advisory donor run reports without blocking merge
- [ ] 3.3 test:donor-reachability command executes donor suite locally
- [ ] 3.4 Lint and build remain green after CI/script updates

#### Manual

- [ ] 3.5 CI UI clearly exposes donor integration signal
- [ ] 3.6 Failure logs are actionable for donor route regressions
- [ ] 3.7 Cookbook entries in test-plan reflect shipped donor pattern
