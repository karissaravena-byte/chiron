import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { ChironDb } from './client.js';
import {
  approval,
  draft,
  holiday,
  onboarding,
  sendLog,
  step,
  talent,
  type StepStatusDb,
} from './schema.js';
import type { HireDetails, OnboardingPrep, StepStatus } from '../onboarding.js';
import { assertNoSensitive } from '../sensitive.js';
import {
  PILOT,
  blanksIn,
  checkSendAllowed,
  draftContentHash,
  type ApproverRole,
} from '../chiron-rules.js';

/**
 * The tracker's reads and writes. Every write checks for sensitive data first and throws
 * `SensitiveDataError` rather than storing it (DATA_MODEL invariant 1). Nothing here deletes a
 * row (invariant 10).
 */

const STEP_STATUS: Record<StepStatus, StepStatusDb> = {
  Pending: 'pending',
  'N/A': 'n-a',
  'To confirm': 'to-confirm',
};

const today = () => new Date().toISOString().slice(0, 10);

export class ChironActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChironActionError';
  }
}

// ── Writes from the agent ────────────────────────────────────────────────────

/**
 * C1/C2 (AGENT_SPEC F8): save a prepared hire as Talent + Onboarding + Steps + Drafts, all or
 * nothing. Idempotent per `argusRef`: a hire already in the tracker is returned, not duplicated.
 */
export async function saveOnboardingPrep(
  db: ChironDb,
  input: {
    hire: HireDetails;
    prep: OnboardingPrep;
    source: 'argus-handoff' | 'entered-by-karissa' | 'test-hire';
    argusRef?: string;
  },
): Promise<{ onboardingId: string; alreadyPrepared: boolean }> {
  const { hire, prep, source, argusRef } = input;
  assertNoSensitive({ hire, drafts: prep.drafts, flags: prep.flags, verify: prep.summary.verify });

  if (argusRef) {
    const existing = await db
      .select({ onboardingId: onboarding.id })
      .from(talent)
      .innerJoin(onboarding, eq(onboarding.talentId, talent.id))
      .where(eq(talent.argusRef, argusRef))
      .limit(1);
    if (existing[0]) return { onboardingId: existing[0].onboardingId, alreadyPrepared: true };
  }

  return db.transaction(async (tx) => {
    const [t] = await tx
      .insert(talent)
      .values({
        lastName: hire.lastName ?? null,
        firstName: hire.firstName ?? null,
        middleName: hire.middleName ?? null,
        nickname: hire.nickname ?? null,
        talentType: hire.talentType ?? null,
        level: hire.level ?? null,
        position: hire.position ?? null,
        groupName: hire.group ?? null,
        costCenter: hire.costCenter ?? null,
        managerName: hire.manager ?? null,
        startDate:
          hire.startDate && /^\d{4}-\d{2}-\d{2}$/.test(hire.startDate) ? hire.startDate : null,
        personalEmail: hire.personalEmail ?? null,
        mobile: hire.mobile ?? null,
        source,
        argusRef: argusRef ?? null,
      })
      .returning({ id: talent.id });

    const [o] = await tx
      .insert(onboarding)
      .values({
        talentId: t!.id,
        hireConfirmedOn: hire.hireConfirmedOn ?? today(),
        checklistVersion: 1,
        prepNotes: { missing: prep.missing, flags: prep.flags, verify: prep.summary.verify },
      })
      .returning({ id: onboarding.id });

    const draftedKeys = new Set(prep.drafts.map((d) => d.stepKey));
    if (prep.checklist.length) {
      await tx.insert(step).values(
        prep.checklist.map((s, i) => ({
          runKind: 'onboarding' as const,
          runId: o!.id,
          stepKey: s.id,
          label: s.label,
          stage: s.stage,
          detail: s.detail,
          status: draftedKeys.has(s.id) ? ('drafted' as const) : STEP_STATUS[s.status],
          dueOn: prep.drafts.find((d) => d.stepKey === s.id)?.dueIso ?? null,
          sortOrder: i,
        })),
      );
    }

    if (prep.drafts.length) {
      await tx.insert(draft).values(
        prep.drafts.map((d) => ({
          runKind: 'onboarding' as const,
          runId: o!.id,
          stepKey: d.stepKey,
          channel: 'email' as const,
          title: d.title,
          templateKey: d.id,
          templateVersion: 1,
          toAddress: d.to,
          realRecipient: d.realRecipient,
          subject: d.subject,
          body: d.body,
          blanks: d.blanks,
          dueOn: d.dueIso ?? null,
        })),
      );
    }
    return { onboardingId: o!.id, alreadyPrepared: false };
  });
}

// ── Reads for the screens ────────────────────────────────────────────────────

const talentName = (t: {
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
}) => [t.firstName, t.middleName, t.lastName].filter(Boolean).join(' ') || 'Unnamed Talent';

export interface QueueItem {
  draftId: string;
  onboardingId: string;
  talent: string;
  title: string;
  realRecipient: string;
  status: 'draft' | 'approved';
  dueOn: string | null;
  blanks: number;
}

/** Home queue (D-016): drafts that need an approval, or approved ones waiting to be sent. */
export async function listWaitingForYou(
  db: ChironDb,
): Promise<{ drafts: QueueItem[]; holidays: number }> {
  const rows = await db
    .select({ d: draft, t: talent })
    .from(draft)
    .innerJoin(onboarding, and(eq(draft.runKind, 'onboarding'), eq(draft.runId, onboarding.id)))
    .innerJoin(talent, eq(onboarding.talentId, talent.id))
    .where(inArray(draft.status, ['draft', 'approved']))
    .orderBy(sql`${draft.dueOn} asc nulls last`, asc(draft.createdAt));
  const [h] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(holiday)
    .where(eq(holiday.status, 'proposed'));
  return {
    drafts: rows.map(({ d, t }) => ({
      draftId: d.id,
      onboardingId: d.runId,
      talent: t.nickname ? `${talentName(t)} (${t.nickname})` : talentName(t),
      title: d.title,
      realRecipient: d.realRecipient,
      status: d.status as 'draft' | 'approved',
      dueOn: d.dueOn,
      blanks: d.blanks.length,
    })),
    holidays: h?.n ?? 0,
  };
}

export interface OnboardingRow {
  onboardingId: string;
  talent: string;
  talentType: string | null;
  position: string | null;
  startDate: string | null;
  nextStep: string | null;
  waitingForYou: number;
  overdue: number;
  status: 'open' | 'complete';
}

/** Onboarding list (D-018): one row per Talent. */
export async function listOnboardings(db: ChironDb): Promise<OnboardingRow[]> {
  const rows = await db
    .select({ o: onboarding, t: talent })
    .from(onboarding)
    .innerJoin(talent, eq(onboarding.talentId, talent.id))
    .orderBy(sql`${talent.startDate} asc nulls last`);
  if (!rows.length) return [];
  const ids = rows.map((r) => r.o.id);
  const steps = await db
    .select()
    .from(step)
    .where(and(eq(step.runKind, 'onboarding'), inArray(step.runId, ids)))
    .orderBy(asc(step.sortOrder));
  const drafts = await db
    .select({ runId: draft.runId, status: draft.status })
    .from(draft)
    .where(and(eq(draft.runKind, 'onboarding'), inArray(draft.runId, ids)));
  const now = today();
  return rows.map(({ o, t }) => {
    const mine = steps.filter((s) => s.runId === o.id);
    const open = mine.filter((s) => !['done', 'n-a', 'sent'].includes(s.status));
    return {
      onboardingId: o.id,
      talent: t.nickname ? `${talentName(t)} (${t.nickname})` : talentName(t),
      talentType: t.talentType,
      position: t.position,
      startDate: t.startDate,
      nextStep: open[0]?.label ?? null,
      waitingForYou: drafts.filter(
        (d) => d.runId === o.id && ['draft', 'approved'].includes(d.status),
      ).length,
      overdue: open.filter((s) => s.dueOn && s.dueOn < now).length,
      status: o.status,
    };
  });
}

export async function getTalentPage(db: ChironDb, onboardingId: string) {
  const [row] = await db
    .select({ o: onboarding, t: talent })
    .from(onboarding)
    .innerJoin(talent, eq(onboarding.talentId, talent.id))
    .where(eq(onboarding.id, onboardingId));
  if (!row) return null;
  const steps = await db
    .select()
    .from(step)
    .where(and(eq(step.runKind, 'onboarding'), eq(step.runId, onboardingId)))
    .orderBy(asc(step.sortOrder));
  const drafts = await db
    .select()
    .from(draft)
    .where(and(eq(draft.runKind, 'onboarding'), eq(draft.runId, onboardingId)))
    .orderBy(asc(draft.createdAt));
  return { onboarding: row.o, talent: { ...row.t, name: talentName(row.t) }, steps, drafts };
}

export async function getDraftPage(db: ChironDb, draftId: string) {
  const [row] = await db.select().from(draft).where(eq(draft.id, draftId));
  if (!row) return null;
  const page = row.runKind === 'onboarding' ? await getTalentPage(db, row.runId) : null;
  const approvals = await db
    .select()
    .from(approval)
    .where(eq(approval.draftId, draftId))
    .orderBy(desc(approval.decidedAt));
  const currentHash = draftContentHash(row);
  const latest = approvals[0];
  return {
    draft: row,
    talent: page?.talent ?? null,
    onboardingId: row.runKind === 'onboarding' ? row.runId : null,
    latestApproval: latest ?? null,
    approvalIsCurrent:
      !!latest && latest.decision === 'approved' && latest.contentHash === currentHash,
  };
}

/** A draft and every decision on it, for the send gate. */
export async function getDraftWithApprovals(db: ChironDb, draftId: string) {
  const [d] = await db.select().from(draft).where(eq(draft.id, draftId));
  if (!d) return null;
  const approvals = await db.select().from(approval).where(eq(approval.draftId, draftId));
  return { draft: d, approvals };
}

// ── Karissa's actions (from the web app) ─────────────────────────────────────

export interface Actor {
  userId: string;
  role: ApproverRole;
}

async function loadEditable(db: ChironDb, draftId: string) {
  const [d] = await db.select().from(draft).where(eq(draft.id, draftId));
  if (!d) throw new ChironActionError('That draft no longer exists.');
  if (d.status === 'sent' || d.status === 'discarded' || d.status === 'superseded') {
    throw new ChironActionError('This draft is closed and can no longer change.');
  }
  return d;
}

/** D-017: edit in place. Any edit cancels an earlier approval (the hash changes). */
export async function editDraft(
  db: ChironDb,
  draftId: string,
  changes: { subject: string; body: string },
): Promise<void> {
  assertNoSensitive(changes);
  const d = await loadEditable(db, draftId);
  if (d.subject === changes.subject && d.body === changes.body) return;
  await db
    .update(draft)
    .set({
      subject: changes.subject,
      body: changes.body,
      blanks: blanksIn(changes.body),
      status: 'draft',
      version: d.version + 1,
      editedByKarissa: true,
      updatedAt: new Date(),
    })
    .where(eq(draft.id, draftId));
}

/** F11: record an approval of this exact version. */
export async function approveDraft(db: ChironDb, draftId: string, actor: Actor): Promise<void> {
  const d = await loadEditable(db, draftId);
  const blanks = blanksIn(d.body);
  if (blanks.length) {
    throw new ChironActionError(`Fill the blanks first (press Edit): ${blanks.join(', ')}.`);
  }
  await db.transaction(async (tx) => {
    await tx.insert(approval).values({
      draftId,
      approverUserId: actor.userId,
      approverRole: actor.role,
      decision: 'approved',
      contentHash: draftContentHash(d),
    });
    await tx
      .update(draft)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(draft.id, draftId));
  });
}

export async function discardDraft(db: ChironDb, draftId: string, actor: Actor): Promise<void> {
  const d = await loadEditable(db, draftId);
  await db.transaction(async (tx) => {
    await tx.insert(approval).values({
      draftId,
      approverUserId: actor.userId,
      approverRole: actor.role,
      decision: 'rejected',
      contentHash: draftContentHash(d),
    });
    await tx
      .update(draft)
      .set({ status: 'discarded', updatedAt: new Date() })
      .where(eq(draft.id, draftId));
  });
}

/**
 * The floor of F13 (no Gmail connected): Karissa sent the approved draft herself. Runs the same
 * send gate a Chiron send would, then logs it as a manual send and moves the step on.
 */
export async function markSentManually(db: ChironDb, draftId: string, actor: Actor): Promise<void> {
  const [d] = await db.select().from(draft).where(eq(draft.id, draftId));
  if (!d) throw new ChironActionError('That draft no longer exists.');
  const approvals = await db.select().from(approval).where(eq(approval.draftId, draftId));
  const gate = checkSendAllowed(d, approvals, PILOT);
  if (!gate.ok) throw new ChironActionError(gate.reason);
  const latest = [...approvals].sort((a, b) => b.decidedAt.getTime() - a.decidedAt.getTime())[0]!;
  await db.transaction(async (tx) => {
    await tx.insert(sendLog).values({
      kind: 'email',
      via: 'manual',
      draftId,
      approvalId: latest.id,
      target: d.realRecipient,
      pilotRedirected: gate.pilotRedirected,
      payloadHash: gate.payloadHash,
      status: 'sent',
    });
    await tx
      .update(draft)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(draft.id, draftId));
    await tx
      .update(step)
      .set({ status: 'sent' })
      .where(
        and(
          eq(step.runKind, d.runKind as 'onboarding'),
          eq(step.runId, d.runId),
          eq(step.stepKey, d.stepKey),
        ),
      );
  });
  void actor;
}
