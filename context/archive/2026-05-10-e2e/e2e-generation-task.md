# E2E Test Generation Task

## Context

Risk #1 (donor discovery/detail flow) has been protected with `tests/e2e/seed.spec.ts`.

Now generate a second E2E test for **Risk #2** from `context/foundation/test-plan.md`:

- **Risk:** Need priority order is incorrect, causing donations to low-priority items while urgent needs wait.
- **What would prove protection:** Returned needs always render in business urgency order for donor view.

## Requirements

1. **Use seed.spec.ts as your model** for locator strategy, state-waiting patterns, and test structure.
2. **Follow .github/e2e-rules.md and the five anti-patterns** from /10x-e2e skill.
3. **Test name must reference Risk #2** (urgency ordering).
4. **Assertion must fail if the risk materializes** (if needs appear out of order, test must fail).
5. **Test must be independent** — full setup, action, assertion, cleanup in one test.
6. **Use getByRole only** — no CSS selectors, XPath, or DOM structure.
7. **Wait for state, not time** — no `waitForTimeout()`.

## Scope

Generate ONE test file: `tests/e2e/needs-ordering.spec.ts`

The test does NOT need to seed the database with specific shelter/needs records — assume a real data source exists (either test DB fixture or mocked API response).

## Next Steps

1. Generate the test
2. Run seed.spec.ts first to verify it passes (no app issues)
3. Submit generated test for review against the five anti-patterns
