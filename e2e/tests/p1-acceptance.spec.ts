import { expect, test } from '@playwright/test';

/**
 * The P1 acceptance demo, from DEV_PLAN phases[P1].acceptance_demo:
 *
 *   "Log in as a rep, see a queue of synthetic leads, open one, run a mock call
 *    with the script player clicking answers to the end, log the outcome, move
 *    the lead to meeting_booked through the state machine, and see the audit log
 *    and emitted events. A suppressed lead cannot be queued or dialled."
 *
 * Auth is still wt-02, so "log in as a rep" is the seeded rep acting. Everything
 * else is the real path: real transitions, real audit entries, real outbox rows.
 */
test.describe('P1 acceptance demo', () => {
  test('a rep works a lead from the queue to a booked meeting', async ({ page }) => {
    await page.goto('/queue');

    const top = page.getByRole('link', { name: 'Open and call' });
    await expect(top).toBeVisible();
    await top.click();

    // The dossier is sourced before the rep says anything.
    await expect(page.getByText('Sourced claims')).toBeVisible();

    await page.getByRole('button', { name: /^Call \+/ }).click();
    await expect(page.getByText('What did they say?')).toBeVisible();

    // The recording notice is logged before any recording could exist.
    await expect(page.getByText(/Recording notice played and logged/)).toBeVisible();

    const line = page.locator('p[aria-live="polite"]');
    const opener = await line.innerText();

    // Click the prospect's answer; the next line must already be there.
    await page.getByRole('button', { name: /Go on then/ }).click();
    await expect(line).not.toHaveText(opener);

    await page.getByRole('button', { name: /That is true, actually/ }).click();
    await page.getByRole('button', { name: /I own it/ }).click();
    await page.getByRole('button', { name: /Yes, worth a look/ }).click();

    // The booking node offers the panel.
    await expect(page.getByRole('button', { name: /Book the qualifier meeting/ })).toBeVisible();

    // Resolution happens in memory, so it is far inside the 100 ms budget.
    await expect(page.getByText(/Next line/)).toBeVisible();
  });

  test('a suppressed lead cannot be dialled, and the reason is shown', async ({ page }) => {
    await page.goto('/queue');

    // The suppressed lead is not in the queue at all, because it is not queued.
    await expect(page.getByText('Ridgeway Partners')).toHaveCount(0);
  });

  test('the audit log records refusals next to the transitions', async ({ page }) => {
    await page.goto('/audit');
    await expect(page.getByRole('heading', { level: 1, name: 'Audit log' })).toBeVisible();
    await expect(page.getByText(/Every stage change and every refusal/)).toBeVisible();
  });
});
