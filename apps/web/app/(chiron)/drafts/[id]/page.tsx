import { notFound } from 'next/navigation';
import { chironDb, getDraftPage } from '@precast/shared/server';
import { approverRole, requireUser } from '../../../lib/session';
import { DraftReview } from './DraftReview';

const UUID = /^[0-9a-f-]{36}$/i;

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireUser();
  const page = await getDraftPage(await chironDb(), id);
  if (!page) notFound();
  const d = page.draft;

  return (
    <DraftReview
      draft={{
        id: d.id,
        title: d.title,
        status: d.status,
        toAddress: d.toAddress,
        realRecipient: d.realRecipient,
        subject: d.subject,
        body: d.body,
        blanks: d.blanks,
        dueOn: d.dueOn,
        version: d.version,
        editedByKarissa: d.editedByKarissa,
      }}
      talent={page.talent ? { name: page.talent.name, onboardingId: page.onboardingId! } : null}
      approval={
        page.latestApproval
          ? {
              decision: page.latestApproval.decision,
              role: page.latestApproval.approverRole,
              at: page.latestApproval.decidedAt.toISOString(),
              current: page.approvalIsCurrent,
            }
          : null
      }
      canAct={approverRole(user.email) !== null}
    />
  );
}
