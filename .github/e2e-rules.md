# E2E Testing Rules (Playwright)

These rules constrain E2E test generation to produce stable, maintainable tests by default.

## Core Rules

- **Use `getByRole`, `getByLabel`, `getByText` as primary locators.** Fall back to `getByTestId` only when accessibility attributes are ambiguous.
- **Never use CSS selectors, XPath, or DOM structure for locating elements.** These break on layout refactors even when the user flow doesn't change.
- **Each test must be independently runnable.** No shared state between tests; Playwright runs tests in parallel and in random order.
- **Never use `page.waitForTimeout()`.** Wait for specific conditions instead:
  - `expect(locator).toBeVisible()`
  - `page.waitForURL('**/path')`
  - `page.waitForResponse('**/api/endpoint')`

  Web-first assertions auto-retry until the condition is met. Hardcoded waits pass locally, flake in CI.

- **Assert the business outcome, not implementation details.** Reframe assertions around user-facing risk from `context/foundation/test-plan.md`.

- **Use unique identifiers for test data** (e.g., timestamp suffix `Date.now()`) to avoid collisions in parallel runs. Clean up in afterEach or as part of test teardown.

- **Use `storageState` for authentication.** Never log in through the UI in individual tests — cache the auth state once and load it in each test.

## Test Naming Convention

Name tests after the **risk they protect**, not the code path:

❌ Bad:

```typescript
test('test 1', ...)
test('creates deck', ...)
```

✅ Good:

```typescript
test('donor can reach shelter discovery and detail flow', ...)
test('created deck persists after page reload', ...)
```

The risk name ties directly to an entry in `context/foundation/test-plan.md`.

## When to Use E2E vs. Unit/Integration

- **E2E:** Test crosses multiple system boundaries (routing, auth, API, database, UI rendering).
- **Unit/Integration:** Isolated logic or a single boundary. Much cheaper, faster.

If a risk can be tested at the unit or integration layer, start there. E2E is a supplement for risks that exist only in the full browser flow.

## Reference

- [Seed Test Pattern](../../.github/skills/10x-e2e/references/seed-test-pattern.md) — Example of a well-structured E2E test.
- [Five Agent E2E Anti-Patterns](../../.github/skills/10x-e2e/references/e2e-anti-patterns.md) — Common failures to catch in review.
- [E2E Quality Rules (authoritative)](../../.github/skills/10x-e2e/references/e2e-quality-rules.md) — Source of truth from Playwright Best Practices.
