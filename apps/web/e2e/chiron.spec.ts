import { expect, test } from '@playwright/test';
import { freshAccount, signIn, signUp } from './session';

/**
 * Chiron's screens end to end, against the running app, its tracker and the live agent.
 * The approver flow needs an account on CHIRON_APPROVERS: set E2E_APPROVER_EMAIL and
 * E2E_APPROVER_PASSWORD (locally, the preview test account) or that test is skipped.
 */

test.describe('Chiron screens (CH-E2E-1)', () => {
  test('a signed-in non-approver sees the queue, the menu and test hires, and cannot approve', async ({
    page,
  }) => {
    const { email, password } = freshAccount();
    await signUp(page, email, password);

    await expect(page.getByRole('heading', { level: 1, name: 'Waiting for you' })).toBeVisible();
    await expect(page.getByText('Pilot mode is on')).toBeVisible();

    await page.goto('/onboarding');
    await expect(page.getByRole('heading', { level: 1, name: 'Onboarding' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Try a test hire' })).toBeVisible();

    await page.goto('/settings');
    await expect(page.getByText(/Not an approver/)).toBeVisible();

    const res = await page.request.post('/api/drafts/00000000-0000-0000-0000-000000000000', {
      data: { action: 'approve' },
    });
    expect(res.status()).toBe(403);
  });

  test('an approver takes a project-based test hire from handoff to sent', async ({ page }) => {
    const email = process.env.E2E_APPROVER_EMAIL;
    const password = process.env.E2E_APPROVER_PASSWORD;
    test.skip(!email || !password, 'Set E2E_APPROVER_EMAIL and E2E_APPROVER_PASSWORD to run this');
    test.setTimeout(120_000);
    await signIn(page, email!, password!);

    await page.goto('/onboarding');
    await page.getByText('Project-based, starting on a Monday').click();
    await expect(page.getByRole('checkbox', { name: 'Migs Bautista' })).toBeChecked();
    await page.getByRole('button', { name: 'Send handoff to Chiron' }).click();
    await expect(page).toHaveURL(/\/onboarding\/[0-9a-f-]{36}/, { timeout: 90_000 });

    // ON-1 + ON-4, as stored in the tracker.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Miguel Ocampo Bautista');
    await expect(page.getByText(/is a Monday/).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Background investigation request/ })).toHaveCount(
      0,
    );

    const href = await page.getByRole('link', { name: '917V email request' }).getAttribute('href');
    await page.goto(href!);
    await expect(page.getByText('zmiguel.bautista@917ventures.com')).toBeVisible();
    await expect(page.getByText(/Real recipient: IT/)).toBeVisible();

    const status = page.getByText(/Needs your approval|Approved: send it yourself|^Sent$/).first();
    const state = await status.textContent();
    if (state?.includes('Needs your approval')) {
      await page.getByRole('button', { name: 'Approve' }).click();
      await expect(page.getByText('Approved. Send it yourself for now')).toBeVisible();
    }
    if (!state?.match(/^Sent$/)) {
      await page.getByRole('button', { name: 'Mark as sent' }).click();
    }
    await expect(page.getByText('This draft is closed.')).toBeVisible();
  });

  test('every screen fits a phone in dark mode, with no sideways scrolling', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'dark',
    });
    const page = await context.newPage();
    const { email, password } = freshAccount();
    await signUp(page, email, password);
    for (const path of ['/', '/onboarding', '/holidays', '/playbook', '/settings']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
});
