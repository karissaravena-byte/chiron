import { NextResponse } from 'next/server';
import { onboardingPrepFromReply } from '@precast/shared';
import { callAgent } from '../../../lib/a2a-client';
import { resolveAgentContext } from '../../../lib/agent-context';
import { getSignedInUser } from '../../../lib/auth';
import { chatTurnLimiter } from '../../../lib/rate-limit';
import { log } from '../../../lib/logger';
import { TEST_HIRES, handoffMessage } from '../../../lib/test-hires';

const CHIRON = 'chiron';

export type HandoffResponse =
  | { ok: true; text: string | null; onboardingId: string; alreadyPrepared: boolean }
  | { ok: false; error: string };

/**
 * POST /api/onboarding/handoff  `{ hireId }`
 *
 * Sends Chiron a test Argus handoff for one of the test hires, over A2A (through `callAgent()`,
 * like every agent call in this app), and returns Chiron's note plus the prep it attached:
 * checklist, flags and drafts. Sign-in required.
 */
export async function POST(request: Request): Promise<NextResponse<HandoffResponse>> {
  const user = await getSignedInUser(request.headers);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign in first.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { hireId?: unknown } | null;
  const hire = TEST_HIRES.find((h) => h.id === body?.hireId);
  if (!hire) {
    return NextResponse.json({ ok: false, error: 'Unknown test hire.' }, { status: 404 });
  }

  const allowed = chatTurnLimiter.take(user.id);
  if (!allowed.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests at once. Wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(allowed.retryAfterSeconds) } },
    );
  }

  const { resourceId, threadId } = resolveAgentContext(user, `onboarding-${hire.id}`);
  // No `onBehalfOf`: Chiron's connectors act as Chiron, never as the signed-in person
  // (AGENT_SPEC rule 5, D-011).
  const reply = await callAgent(CHIRON, handoffMessage(hire), { threadId, resourceId });

  if (!reply.ok) {
    log.error({ status: reply.status, error: reply.error }, 'onboarding handoff failed');
    const status = reply.status >= 400 && reply.status <= 599 ? reply.status : 502;
    return NextResponse.json(
      { ok: false, error: reply.error ?? 'Chiron did not answer.' },
      { status },
    );
  }

  const prep = onboardingPrepFromReply(reply.raw);
  log.info(
    { hireId: hire.id, saved: Boolean(prep?.onboardingId), via: reply.via },
    'onboarding handoff done',
  );
  if (!prep?.onboardingId) {
    return NextResponse.json(
      {
        ok: false,
        error: reply.text ?? "Chiron answered but didn't save anything to the tracker.",
      },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    text: reply.text,
    onboardingId: prep.onboardingId,
    alreadyPrepared: Boolean(prep.alreadyPrepared),
  });
}
