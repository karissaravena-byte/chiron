import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Sign-in needs a database and a secret. CI's test server has neither, by design, so specs that
 * sign in skip there; health says which (`signIn`), and only a missing piece skips, not `starting`.
 */
export async function skipUnlessSignInWorks(request: APIRequestContext) {
  const { signIn } = (await (await request.get('/api/health')).json()) as { signIn?: string };
  test.skip(
    signIn !== 'ready' && signIn !== 'starting',
    `Sign-in can't work on this server (${signIn}), so there is no account to test with`,
  );
}

/**
 * Real sign-in for browser tests. Chiron's screens check the session on the server, so a stubbed
 * client session isn't enough: these create (or reuse) an account through the sign-in page.
 */
export async function signUp(page: Page, email: string, password: string, name = 'E2E Tester') {
  await page.goto('/sign-in');
  await page.getByRole('button', { name: 'Create an account instead' }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** A throwaway, never-approver account for this run. */
export function freshAccount() {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { email: `e2e-${id}@chiron.test`, password: `e2e-pass-${id}` };
}
