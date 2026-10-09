import { expect, test } from '@playwright/test';

/**
 * The P0 smoke test (DEV_PLAN P0-T4).
 *
 * It proves the whole local stack starts from a clean clone and that the web
 * app renders the pipeline vocabulary it imports from @devora/contracts, which
 * is the one cross-package dependency P0 exists to establish.
 */
test.describe('P0 foundation smoke', () => {
  test('the workspace loads and renders the pipeline from the contracts package', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Devora Sales Engine' }),
    ).toBeVisible();

    // First and last pipeline stage, proving the enum came through end to end.
    const pipeline = page.getByRole('region', { name: 'Pipeline' });
    await expect(
      pipeline.getByRole('listitem').filter({ hasText: 'sourced' }).first(),
    ).toBeVisible();
    await expect(pipeline.getByRole('listitem').filter({ hasText: 'won' }).first()).toBeVisible();
  });

  test('Devora is never described as an agency', async ({ page }) => {
    await page.goto('/');
    // DEV_PLAN.company_rules: Devora is a PR firm. Enforced in copy, and here
    // in the rendered page, because this is what a prospect would see.
    await expect(page.locator('body')).not.toContainText(/agenc(y|ies)/i);
    await expect(page.locator('body')).toContainText('PR firm');
  });
});
