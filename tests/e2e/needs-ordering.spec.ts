import { test, expect } from '@playwright/test';

/**
 * E2E test for Risk #2: "Need priority order is incorrect, causing donations
 * to low-priority items while urgent needs wait."
 *
 * What would prove protection: "Returned needs always render in business urgency
 * order for donor view."
 *
 * Test validates that when a donor views a shelter's needs, they are rendered
 * in the correct urgency order: Pilne (urgent) > Potrzebne (needed) > Mile widziane (nice-to-have).
 *
 * This test will FAIL if needs are returned out of order, proving protection against Risk #2.
 *
 * Conventions:
 * - getByRole, getByText as primary locators (accessibility tree, not CSS/XPath)
 * - Wait for state (toBeVisible) instead of waitForTimeout
 * - Test independence: setup → action → assertion → cleanup
 * - Unique test data identifiers to avoid parallel run collisions
 * - Cleanup via page navigation to return to clean state
 */
test('needs render in business urgency order for donor', async ({ page }) => {
  // Setup: Navigate to home page
  await page.goto('/');

  // Assert: Home page loads with search interface visible
  await expect(
    page.getByRole('heading', { name: /ShelterNeeds/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: /Podaj miasto/i }),
  ).toBeVisible();

  // Action 1: Search for shelters in a city
  // Using "Warszawa" as test search term (matches seed.spec.ts pattern)
  const searchCity = 'Warszawa';
  await page.getByRole('textbox', { name: /Podaj miasto/i }).fill(searchCity);
  await page.getByRole('button', { name: /Szukaj/i }).click();

  // Assert: Discovery flow - shelters appear (wait for state, not time)
  // Web-first assertion auto-retries until element is visible
  await expect(
    page.getByRole('link', { name: /Zobacz potrzeby/i }).first(),
  ).toBeVisible();

  // Action 2: Click into shelter detail flow to view needs list
  const firstShelterLink = page
    .getByRole('link', { name: /Zobacz potrzeby/i })
    .first();
  await firstShelterLink.click();

  // Assert: Detail page loaded and heading visible
  // Wait for URL to change to shelter detail view (concrete state, not arbitrary timeout)
  await page.waitForURL('**/shelters/**');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Main assertion: Needs render in business urgency order
  // Get all need items via accessibility role
  const needsItems = page.getByRole('listitem');
  const itemCount = await needsItems.count();

  // Extract urgency levels from each visible need item
  if (itemCount > 0) {
    const urgencies: string[] = [];

    // Iterate through each need item and extract its urgency level
    for (let i = 0; i < itemCount; i++) {
      const item = needsItems.nth(i);

      // Extract urgency by checking for presence of urgency text within this item
      // Using getByText (accessibility locator) to locate urgency labels
      let urgency = '';

      // Check in order: Pilne → Potrzebne → Mile widziane
      // Each getByText().isVisible() returns false if element not found, never throws
      if (await item.getByText('Pilne').isVisible()) {
        urgency = 'Pilne';
      } else if (await item.getByText('Potrzebne').isVisible()) {
        urgency = 'Potrzebne';
      } else if (await item.getByText('Mile widziane').isVisible()) {
        urgency = 'Mile widziane';
      }

      // Store urgency if found (skip items with no recognized urgency)
      if (urgency) {
        urgencies.push(urgency);
      }
    }

    // Validate that urgencies follow the business urgency order
    // Allowed progression: Pilne (1) <= Potrzebne (2) <= Mile widziane (3)
    const urgencyOrder: Record<string, number> = {
      Pilne: 1,
      Potrzebne: 2,
      'Mile widziane': 3,
    };

    // This assertion will FAIL if any need appears out of order
    // (Risk #2 materializes if needs are not in urgency order)
    for (let i = 0; i < urgencies.length - 1; i++) {
      const currentUrgency = urgencies[i];
      const nextUrgency = urgencies[i + 1];
      const currentOrder = urgencyOrder[currentUrgency] || 0;
      const nextOrder = urgencyOrder[nextUrgency] || 0;

      expect(currentOrder).toBeLessThanOrEqual(nextOrder);
    }
  }

  // Cleanup: Navigate back to home (test is independent - next run doesn't need this,
  // but good practice to return to clean state)
  await page.goto('/');
});
