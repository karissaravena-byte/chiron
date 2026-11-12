import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SensitiveDataError } from '@precast/shared';
import {
  ChironActionError,
  approveDraft,
  chironDb,
  discardDraft,
  editDraft,
  markSentManually,
} from '@precast/shared/server';
import { getSignedInUser } from '../../../lib/auth';
import { approverRole } from '../../../lib/session';
import { log } from '../../../lib/logger';

export type DraftActionResponse = { ok: true } | { ok: false; error: string };

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('discard') }),
  z.object({ action: z.literal('mark-sent') }),
  z.object({
    action: z.literal('edit'),
    subject: z.string().trim().min(1).max(300),
    body: z.string().min(1).max(20_000),
  }),
]);

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * POST /api/drafts/:id: Karissa's (or Mikki's) decision on one draft. The approver comes from
 * the signed-in session checked against the approver list (D-009), never from the request. The
 * approval covers this exact version (D-008); a manual send runs the same send gate a Chiron
 * send would.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<DraftActionResponse>> {
  const { id } = await params;
  const user = await getSignedInUser(request.headers);
  if (!user) return NextResponse.json({ ok: false, error: 'Sign in first.' }, { status: 401 });

  const role = approverRole(user.email);
  if (!role) {
    return NextResponse.json(
      { ok: false, error: 'Only Karissa or Mikki can act on drafts.' },
      { status: 403 },
    );
  }
  if (!UUID.test(id))
    return NextResponse.json({ ok: false, error: 'Unknown draft.' }, { status: 404 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'That request was not understood.' },
      { status: 400 },
    );
  }

  const actor = { userId: user.id, role };
  try {
    const db = await chironDb();
    const b = parsed.data;
    if (b.action === 'approve') await approveDraft(db, id, actor);
    else if (b.action === 'discard') await discardDraft(db, id, actor);
    else if (b.action === 'mark-sent') await markSentManually(db, id, actor);
    else await editDraft(db, id, { subject: b.subject, body: b.body });
    log.info({ draftId: id, action: b.action, role }, 'draft action');
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SensitiveDataError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 422 });
    }
    if (err instanceof ChironActionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    log.error({ draftId: id, err: (err as Error).message }, 'draft action failed');
    return NextResponse.json(
      { ok: false, error: "The tracker couldn't save that. Try again in a minute." },
      { status: 500 },
    );
  }
}
