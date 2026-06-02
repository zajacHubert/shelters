import { test, expect } from '@playwright/test';

/**
 * Seed test for Risk #1: "Donor cannot reach shelter discovery/detail flow"
 *
 * This test demonstrates the E2E testing conventions for this project:
 * - getByRole as primary locator (accessibility tree, not CSS/XPath)
 * - Wait for state (toBeVisible) instead of waitForTimeout
 * - Test independence: full setup → action → assertion → cleanup in one test
 * - Unique identifiers in test data to avoid collisions in parallel runs
 * - Risk-tied test name from context/foundation/test-plan.md
 */
test('donor can reach shelter discovery and detail flow', async ({ page }) => {
  // Setup: Navigate to home
  await page.goto('/');

  // Assert: Home page loads with search form visible
  await expect(
    page.getByRole('heading', { name: /ShelterNeeds/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: /Podaj miasto/i }),
  ).toBeVisible();

  // Action 1: Search for shelters in a city
  const searchCity = 'Warszawa';
  await page.getByRole('textbox', { name: /Podaj miasto/i }).fill(searchCity);
  await page.getByRole('button', { name: /Szukaj/i }).click();

  // Assert: Discovery flow - shelters appear and are clickable
  // Wait for at least one shelter link to be visible (state, not time)
  await expect(
    page.getByRole('link', { name: /Zobacz potrzeby/i }).first(),
  ).toBeVisible();

  // Action 2: Click into detail flow - open first shelter's needs
  const firstShelterLink = page
    .getByRole('link', { name: /Zobacz potrzeby/i })
    .first();
  const shelterDetailUrl = await firstShelterLink.getAttribute('href');

  await firstShelterLink.click();

  // Assert: Detail flow - page loaded and we're viewing shelter detail
  // Wait for URL to change to shelter detail (concrete state, not arbitrary timeout)
  await page.waitForURL(`**/shelters/**`);

  // Assert: Detail page has shelter name or needs heading visible
  // (specific structure depends on detail page implementation;
  //  this pattern waits for ANY heading to prove the page loaded)
  await expect(page.getByRole('heading').first()).toBeVisible();

  // Cleanup: Navigate back (test is independent - next run doesn't need this, but good practice)
  await page.goto('/');
});
