# Test Plan

> Phased test rollout for this project. Strategy is frozen at the top
> (§1-§5); cookbook patterns at the bottom (§6) fill in as phases ship.
> Read before writing any new test.
>
> Refresh: re-run `/10x-test-plan --refresh` when stale (see §8).
>
> Last updated: 2026-06-01

## 1. Strategy

Tests follow three non-negotiable principles for this project:

1. **Cost × signal.** The cheapest test that gives a real signal for the risk wins. Do not promote to e2e only because it feels safer.
2. **User concerns are first-class evidence.** Risks from the interview carry the same weight as PRD or roadmap lines.
3. **Risks are scenarios, not code locations.** This plan states what can fail and why that is likely. It does not claim which line owns the failure. Per-phase research provides anchors.

Hot-spot scope used for likelihood weighting: `src/`, `supabase/migrations/`, `scripts/`.

## 2. Risk Map

Top failure scenarios, ordered by risk = impact × likelihood.

| #   | Risk (failure scenario)                                                                             | Impact | Likelihood | Source (evidence — not anchor)                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Donor cannot reach shelter discovery/detail flow, so help intent is lost at the first click.        | High   | High       | PRD FR-007/FR-008/US-01, roadmap S-03 done, interview Q1, hot-spot dir `src/app` (21 churn events/30d)                                       |
| 2   | Need priority order is incorrect, causing donations to low-priority items while urgent needs wait.  | High   | Medium     | PRD Business Logic ordering rule, roadmap S-03 done, archive donor-discovery-flow, hot-spot dir `src/app`                                    |
| 3   | One shelter can mutate another shelter's needs (authorization/IDOR regression).                     | High   | High       | PRD Access Control + NFR isolation, archive needs-management-panel + auth-scaffold, interview Q4, hot-spot dir `src/db` (6 churn events/30d) |
| 4   | Auth/session break logs coordinators out or bypasses dashboard guard unexpectedly.                  | High   | Medium     | PRD FR-001/FR-002/FR-003, archive auth-scaffold + shelter-registration-and-login, hot-spot dir `src/lib` (16 churn events/30d)               |
| 5   | Data change/migration damages shelter or needs records after deploy.                                | High   | Medium     | interview Q2, roadmap F-01 done, archive data-layer-foundation, hot-spot scope includes `supabase/migrations/`                               |
| 6   | Untrusted input in needs fields creates broken or unsafe stored data that later breaks donor pages. | Medium | Medium     | PRD FR-004 input fields, PRD public donor access, interview Q3, hot-spot dirs `src/app` + `src/db`                                           |

### Risk Response Guidance

| Risk | What would prove protection                                                                                | Must challenge                                       | Context `/10x-research` must ground                                       | Likely cheapest layer         | Anti-pattern to avoid                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| #1   | Anonymous donor can search city, open shelter, and view needs successfully.                                | "Public pages are stable because no auth is needed." | request path + rendering mode + empty/error states                        | integration                   | only happy-path assertions                                             |
| #2   | Returned needs always render in business urgency order for donor view.                                     | "Stored values naturally appear in desired order."   | ordering source of truth + transformation boundary                        | unit + integration            | asserting copied implementation order logic without independent oracle |
| #3   | Cross-shelter write attempts are rejected or no-op with no foreign side effects.                           | "Session exists, therefore ownership is enforced."   | ownership boundary + session-to-shelter mapping + write path checks       | integration                   | over-mocking auth boundary                                             |
| #4   | Valid session reaches dashboard; invalid/expired session is redirected and cannot access protected routes. | "Cookie presence means valid session."               | token validation behavior + middleware guard semantics                    | integration + focused e2e     | testing only successful login path                                     |
| #5   | Migration path preserves read/write behavior and key records across schema changes.                        | "Migration ran without SQL error, so data is safe."  | migration ordering + rollback/verification checks + seed fixture behavior | integration + migration smoke | treating migration success exit code as sufficient proof               |
| #6   | Invalid or malicious input is rejected/sanitized server-side and does not corrupt public rendering.        | "Client form constraints are enough validation."     | server validation boundary + persistence shape + public rendering impact  | integration                   | relying on browser-only validation                                     |

## 3. Phased Rollout

| #   | Phase name                    | Goal (one line)                                                                      | Risks covered | Test types                                   | Status      | Change folder |
| --- | ----------------------------- | ------------------------------------------------------------------------------------ | ------------- | -------------------------------------------- | ----------- | ------------- |
| 1   | Critical donor and auth paths | Defend business-critical anonymous donor access and session guard behavior first.    | #1, #4        | integration + focused e2e smoke              | not started | —             |
| 2   | Isolation and data integrity  | Protect cross-shelter isolation and migration/data safety before more feature work.  | #3, #5, #6    | integration + migration smoke                | not started | —             |
| 3   | Ordering and UI confidence    | Lock urgency ordering behavior and selective visual confidence on key donor screens. | #2, #1        | unit + integration + selective visual review | not started | —             |
| 4   | Quality-gates wiring          | Wire and enforce the minimum CI floor for future regressions.                        | cross-cutting | lint/type/test gates                         | not started | —             |

## 4. Stack

| Layer                | Tool                                          | Version               | Notes                                                                       |
| -------------------- | --------------------------------------------- | --------------------- | --------------------------------------------------------------------------- |
| unit + integration   | bun:test                                      | from lockfile/scripts | Existing meaningful suite under `tests/`; currently CLI-heavy.              |
| API/data integration | Supabase test DB + seeded fixtures            | n/a                   | Needed for tenant-isolation and migration checks.                           |
| e2e                  | Playwright-style browser automation           | none yet              | Add in §3 Phase 1 for critical anonymous + auth paths only.                 |
| accessibility        | none yet                                      | n/a                   | Optional after Phase 4 if regressions show a11y risk.                       |
| AI-native (optional) | Multimodal visual review, checked: 2026-06-01 | n/a                   | Use only for 1-3 critical screens; do not replace deterministic assertions. |

**Stack grounding tools (current session):**

- Docs: none - docs MCP not available in current session; checked: 2026-06-01
- Search: none - search MCP not available in current session; checked: 2026-06-01
- Runtime/browser: Playwright/browser tools available - candidate for selective critical-flow verification; checked: 2026-06-01
- Provider/platform: GitHub and terminal tooling available - supports CI gate and rollout ops tracking; checked: 2026-06-01

## 5. Quality Gates

| Gate                        | Where                  | Required?                    | Catches                                        |
| --------------------------- | ---------------------- | ---------------------------- | ---------------------------------------------- |
| lint + typecheck            | local + CI             | required                     | syntax/type drift                              |
| unit + integration          | local + CI             | required after §3 Phase 1    | logic and boundary regressions                 |
| e2e on critical flows       | CI on PR               | required after §3 Phase 1    | broken donor/auth critical paths               |
| post-edit hook              | local agent loop       | recommended after §3 Phase 3 | immediate regression signal during edits       |
| visual diff (deterministic) | CI on PR               | optional after §3 Phase 3    | rendering regressions on donor pages           |
| multimodal visual review    | CI/manual gate         | optional after §3 Phase 3    | layout/content regressions classic checks miss |
| pre-prod smoke              | between merge and prod | optional after §3 Phase 4    | env-specific failures                          |

## 6. Cookbook Patterns

### 6.1 Adding a unit test

- TBD - see §3 Phase 3.

### 6.2 Adding an integration test

- TBD - see §3 Phase 1.

### 6.3 Adding an e2e test

- TBD - see §3 Phase 1.

### 6.4 Adding a test for migration/data change

- TBD - see §3 Phase 2.

### 6.5 Adding a test for urgency ordering behavior

- TBD - see §3 Phase 3.

### 6.6 Per-rollout-phase notes

- TBD - filled after first completed rollout phase.

## 7. What We Deliberately Don't Test

- Static marketing-like visual snapshots by default - low signal and high churn noise. Re-evaluate if brand-critical static pages become conversion-critical. (Source: Phase 2 interview Q5.)

## 8. Freshness Ledger

- Strategy (§1-§5) last reviewed: 2026-06-01
- Stack versions last verified: 2026-06-01
- AI-native tool references last verified: 2026-06-01

Refresh (`/10x-test-plan --refresh`) when:

- a new top-3 risk surfaces from roadmap or archive,
- a recommended tool `checked:` date is older than three months,
- the project stack changes materially,
- §7 no longer matches team priorities.
