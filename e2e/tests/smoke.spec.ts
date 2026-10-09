import { expect, test } from '@playwright/test';

/**
 * Smoke: the workspace loads, with real data behind it.
 */
test.describe('rep workspace smoke', () => {
  test('the queue loads with exactly one primary action on the top lead', async ({ page }) => {
    await page.goto('/queue');
    await expect(page.getByRole('heading', { level: 1, name: 'Call queue' })).toBeVisible();

    // DEV_PLAN wt-05 acceptance criterion: one screen, one next action.
    await expect(page.getByRole('link', { name: 'Open and call' })).toHaveCount(1);
  });

  test('Devora is never described as an agency', async ({ page }) => {
    await page.goto('/queue');
    // DEV_PLAN.company_rules: Devora is a PR firm, enforced in the rendered page
    // because this is what a prospect would eventually see.
    await expect(page.locator('body')).not.toContainText(/agenc(y|ies)/i);
  });
});
