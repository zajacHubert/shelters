# E2E Test Review: needs-ordering.spec.ts

**Risk Protected:** Risk #2 — "Need priority order is incorrect"  
**Test Name:** "needs render in business urgency order for donor"

## Conformance Review

### ✅ Seed Test Pattern Alignment

- **Setup → Action → Assertion → Cleanup**: Present (`goto /` → search → click detail → check order → cleanup)
- **Role-based locators**: `getByRole('heading')`, `getByRole('textbox')`, `getByRole('button')`, `getByRole('link')`, `getByRole('listitem')` ✓
- **State waiting**: `toBeVisible()`, `waitForURL('**/shelters/**')`, `isVisible()` ✓
- **Test independence**: Full cycle in one test, navigation cleanup at end ✓
- **Risk-tied name**: Yes, explicitly tied to Risk #2 from test-plan.md ✓

### Conformance with E2E Quality Rules

| Rule                                                    | Status         | Evidence                                            |
| ------------------------------------------------------- | -------------- | --------------------------------------------------- |
| `getByRole` / `getByLabel` / `getByText` primary        | ✅ PASS        | All locators use accessibility tree                 |
| Never CSS/XPath/DOM structure                           | ✅ PASS        | No CSS selectors found                              |
| Test independence                                       | ✅ PASS        | `page.goto('/')` cleanup                            |
| `waitForURL()` / `toBeVisible()` not `waitForTimeout()` | ✅ PASS        | Uses `waitForURL()`, `toBeVisible()`, `isVisible()` |
| Business assertion, not implementation                  | ✅ PASS        | Asserts urgency order, not internal state           |
| Unique identifiers + cleanup                            | ✅ PASS        | Navigation-based cleanup                            |
| Risk materialization control                            | ⚠️ NEEDS CHECK | See anti-patterns below                             |

---

## Anti-Pattern Review (Five Common Failures)

### 1. ❌ Hallucinated Assertion

**Finding:** The assertion logic is brittle.

```typescript
// Current: Collects urgencies in array, then checks order
const urgencies: string[] = [];
for (let i = 0; i < itemCount; i++) {
  const item = needsItems.nth(i);
  if (await item.getByText('Pilne').isVisible()) {
    urgency = 'Pilne';
  } else if ...
  urgencies.push(urgency);
}

// Then: Validates order
for (let i = 0; i < urgencies.length - 1; i++) {
  expect(currentOrder).toBeLessThanOrEqual(nextOrder);
}
```

**Issue:** The test assumes needs are rendered as list items with urgency text inside. Without verifying the actual DOM structure (e.g., the needs heading "Pilne" exists in the shelter detail page), this **will pass even if the page renders nothing**.

**Would the assertion fail if Risk #2 materializes?** Only if the HTML exactly matches the expected structure. If a refactor changes how urgency is rendered (e.g., from text to a `data-urgency` attribute), the test stops catching the failure.

**Fix:** Make the assertion more explicit — verify that a need with "Pilne" label exists AND appears before needs labeled "Potrzebne". Use more robust accessibility queries:

```typescript
// Better: Assert actual ordering by checking visibility sequence
const pilneNeeds = page
  .locator('text=Pilne')
  .filter({ has: page.getByRole('listitem') });
const potrzebeNeeds = page
  .locator('text=Potrzebne')
  .filter({ has: page.getByRole('listitem') });

// Ensure at least one "Pilne" appears before any "Potrzebne"
const firstPilneBox = await pilneNeeds.first().boundingBox();
const firstPotrzebBox = await potrzebeNeeds.first().boundingBox();

expect(firstPilneBox?.y || 9999).toBeLessThan(firstPotrzebBox?.y || 0);
```

### 2. ✅ Brittle Selector

**Status:** PASS — Test uses only `getByRole`, `getByText` (no CSS classes, nth-child, XPath).

### 3. ✅ Shared State Between Tests

**Status:** PASS — Full setup in one test, cleanup with `page.goto('/')`.

### 4. ✅ `waitForTimeout` Instead of State

**Status:** PASS — Uses `toBeVisible()`, `waitForURL()`, `isVisible()`. No hardcoded delays.

### 5. ✅ No Cleanup

**Status:** PASS — Cleanup present: `await page.goto('/')`.

---

## Summary

| Criterion                        | Score          | Notes                                                                                  |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| Follows seed.spec.ts conventions | ✅             | Structure, locators, state-waiting all match                                           |
| Respects .github/e2e-rules.md    | ✅             | Accessibility-first locators, test independence                                        |
| Protects Risk #2                 | ⚠️ CONDITIONAL | Depends on page rendering urgency labels as expected; assertion could be more explicit |
| **Overall**                      | **CAUTION**    | **Test is well-structured but assertions need hardening.**                             |

---

## Recommendations for Next Run

1. **Verify page structure** — Before the main loop, assert that at least one need with "Pilne" urgency exists:

   ```typescript
   await expect(page.getByText('Pilne')).toBeVisible();
   ```

2. **Explicit ordering assertion** — Use bounding boxes or role-based filtering to prove that "Pilne" items appear before "Potrzebne" items on the page (not just in the collected array).

3. **Test with real data** — Run `npm run test:e2e` with a live database fixture to ensure the urgency labels actually appear in the DOM.

4. **Add comments** — Document the expected urgency hierarchy at the top of the test.

---

## Run Instructions

```bash
# Ensure app is running
npm run dev &

# Run seed test (baseline)
npx playwright test tests/e2e/seed.spec.ts

# Run generated test
npx playwright test tests/e2e/needs-ordering.spec.ts

# Review failures and re-prompt agent
```

**Next step:** Once assertions are verified, commit both tests and integrate into CI.
