import { a2aWireFromHeader, attachPartToReply } from '@precast/a2ui';
import { onboardingPrepPart, type OnboardingPrep } from '@precast/shared';
import { takePendingOnboardingPrep } from '../lib/request-context';

/**
 * Attaches the onboarding prep `prepare_onboarding` produced this turn to the A2A reply, as one
 * data part (`application/vnd.chiron.onboarding+json`). The screen draws the checklist and drafts
 * from it, so what Karissa reviews is exactly what the code produced, not the model's retelling.
 *
 * Must run INSIDE the auth middleware, which opens the per-request store. Covers `message/send`;
 * a streamed reply is passed through unchanged.
 */

interface PrepContext {
  req: { header: (name: string) => string | undefined; path: string; method: string };
  res: Response;
}

const isA2aExecution = (c: PrepContext) =>
  c.req.method === 'POST' && /^\/api\/a2a\/[^/]+\/?$/.test(c.req.path);

export async function onboardingPrepMiddleware(
  c: PrepContext,
  next: () => Promise<void>,
): Promise<void> {
  if (!isA2aExecution(c)) return next();
  takePendingOnboardingPrep();
  await next();
  const prep = takePendingOnboardingPrep() as OnboardingPrep | undefined;
  if (!prep) return;
  if (!(c.res.headers.get('content-type') ?? '').includes('application/json')) return;

  let payload: unknown;
  try {
    payload = await c.res.clone().json();
  } catch {
    return;
  }
  const wire = a2aWireFromHeader(c.req.header('A2A-Version'));
  if (!attachPartToReply(payload, onboardingPrepPart(prep, wire))) return;

  const headers = new Headers(c.res.headers);
  headers.delete('content-length');
  c.res = new Response(JSON.stringify(payload), { status: c.res.status, headers });
}
