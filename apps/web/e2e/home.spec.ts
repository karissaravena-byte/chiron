import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  // E2E-009 (updated for Chiron): every screen needs sign-in. Signed out, the home page sends
  // you to sign in rather than showing anyone's drafts.
  test('signed out, it sends you to sign in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('exposes the health API route directly, with sign-in readiness', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(['ok', 'degraded']).toContain(body.status);
    expect(typeof body.signIn).toBe('string');
  });

  // E2E-010: what every response carries.
  test('sends the security headers and no framework banner', async ({ request }) => {
    const res = await request.get('/sign-in');
    const headers = res.headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-powered-by']).toBeUndefined();
  });
});

/**
 * Error boundaries. Without these files Next serves its own default pages —
 * unstyled, off-theme, and in production reduced to "Application error: a
 * client-side exception has occurred", which tells a user nothing.
 *
 * Only the 404 is asserted end to end: forcing a render-time throw to exercise
 * error.tsx would mean shipping a route that exists solely to crash, which is a
 * worse trade than leaving that boundary covered by typecheck and review.
 */
test.describe('error boundaries', () => {
  test('an unknown route renders the app 404, not the Next default', async ({ page }) => {
    const res = await page.goto('/definitely-not-a-real-route');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    await expect(page.getByRole('link', { name: /home page/i })).toBeVisible();
  });
});
