import { createHash } from 'node:crypto';

/**
 * Chiron's send-side rules as pure functions (AGENT_SPEC F11, F12, F13, F16; DATA_MODEL
 * invariants 2–4, 12). Both apps use them: the web app when it records an approval or a manual
 * send, the agents app before any connector send.
 */

// ── Pilot lock (guardrail 2) ──────────────────────────────────────────────────

/**
 * While on, every email, invite and Slack message goes to Karissa. Turning it off needs recorded
 * confirmations from both Karissa and Rase, which isn't built yet, so it is on, full stop.
 */
export const PILOT = { on: true, recipient: 'karissa.ravena@917ventures.com' } as const;

// ── Approvers (D-009) ─────────────────────────────────────────────────────────

export type ApproverRole = 'karissa' | 'mikki';

/**
 * `CHIRON_APPROVERS="karissa:karissa@…,mikki:mikki@…"` → email → role. Anything malformed is
 * ignored, so a typo can only remove an approver, never add one.
 */
export function parseApprovers(raw: string | undefined): Map<string, ApproverRole> {
  const out = new Map<string, ApproverRole>();
  for (const entry of (raw ?? '').split(',')) {
    const [role, email] = entry.split(':').map((s) => s?.trim());
    if ((role === 'karissa' || role === 'mikki') && email && /^[^@\s]+@[^@\s]+$/.test(email)) {
      out.set(email.toLowerCase(), role);
    }
  }
  return out;
}

export function approverRoleFor(
  email: string | undefined | null,
  approvers: Map<string, ApproverRole>,
): ApproverRole | null {
  return email ? (approvers.get(email.toLowerCase()) ?? null) : null;
}

// ── Exact-version approval (D-008) ────────────────────────────────────────────

export interface DraftContent {
  toAddress: string;
  realRecipient: string;
  subject: string;
  body: string;
}

/** SHA-256 of exactly what would go out. Any edit changes it, so an old approval stops counting. */
export function draftContentHash(d: DraftContent): string {
  return createHash('sha256')
    .update(JSON.stringify([d.toAddress, d.realRecipient, d.subject, d.body]))
    .digest('hex');
}

/** The `[…]` blanks still in a draft, in order, de-duplicated. */
export function blanksIn(body: string): string[] {
  return [...new Set([...body.matchAll(/\[([^\]\n]{1,80})\]/g)].map((m) => m[1]!.trim()))];
}

// ── The send gate (GUARD-2, GUARD-3) ──────────────────────────────────────────

export interface GateDraft extends DraftContent {
  status: string;
}

export interface GateApproval {
  decision: 'approved' | 'rejected';
  approverRole: string;
  contentHash: string;
  decidedAt: Date;
}

export type SendDecision =
  | { ok: true; toAddress: string; pilotRedirected: boolean; payloadHash: string }
  | { ok: false; reason: string };

/**
 * May this draft go out now? Needs: the draft approved, its LATEST decision an approval by
 * Karissa or Mikki, that approval's hash matching the draft as it is now, and, while the pilot
 * is on, the address being Karissa's.
 */
export function checkSendAllowed(
  d: GateDraft,
  approvals: GateApproval[],
  pilot: { on: boolean; recipient: string } = PILOT,
): SendDecision {
  if (d.status !== 'approved') return { ok: false, reason: 'This draft has not been approved.' };
  const latest = [...approvals].sort((a, b) => b.decidedAt.getTime() - a.decidedAt.getTime())[0];
  if (!latest || latest.decision !== 'approved') {
    return { ok: false, reason: 'There is no recorded approval for this draft.' };
  }
  if (latest.approverRole !== 'karissa' && latest.approverRole !== 'mikki') {
    return { ok: false, reason: 'Only Karissa or Mikki can approve a send.' };
  }
  const blanks = blanksIn(d.body);
  if (blanks.length) {
    return { ok: false, reason: `Fill the blanks first: ${blanks.join(', ')}.` };
  }
  const payloadHash = draftContentHash(d);
  if (latest.contentHash !== payloadHash) {
    return { ok: false, reason: 'The draft changed after it was approved. Approve it again.' };
  }
  if (pilot.on && d.toAddress.toLowerCase() !== pilot.recipient.toLowerCase()) {
    return { ok: false, reason: 'Pilot mode is on, so this can only go to Karissa.' };
  }
  return { ok: true, toAddress: d.toAddress, pilotRedirected: pilot.on, payloadHash };
}

// ── Kind timing (D-014): Mon–Fri, 9:00–18:00 Manila, no confirmed holidays ────

const MANILA_OFFSET_MS = 8 * 3_600_000; // UTC+8 all year, no daylight saving
const OPEN_HOUR = 9;
const CLOSE_HOUR = 18;

const manilaParts = (d: Date) => {
  const local = new Date(d.getTime() + MANILA_OFFSET_MS);
  return {
    iso: local.toISOString().slice(0, 10),
    day: local.getUTCDay(),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
};

export function isManilaWorkingDay(d: Date, holidays: ReadonlySet<string>): boolean {
  const p = manilaParts(d);
  return p.day !== 0 && p.day !== 6 && !holidays.has(p.iso);
}

/** `now` if it is inside working hours, else the start of the next working window. */
export function nextSendWindow(now: Date, holidays: ReadonlySet<string> = new Set()): Date {
  const p = manilaParts(now);
  if (
    isManilaWorkingDay(now, holidays) &&
    p.minutes >= OPEN_HOUR * 60 &&
    p.minutes < CLOSE_HOUR * 60
  ) {
    return now;
  }
  // Start from today's 9:00 Manila if it's still early, else tomorrow's.
  const startOfDayUtc = Date.parse(`${p.iso}T00:00:00Z`) - MANILA_OFFSET_MS;
  let candidate = new Date(startOfDayUtc + OPEN_HOUR * 3_600_000);
  if (candidate <= now) candidate = new Date(candidate.getTime() + 86_400_000);
  for (let i = 0; i < 30 && !isManilaWorkingDay(candidate, holidays); i++) {
    candidate = new Date(candidate.getTime() + 86_400_000);
  }
  return candidate;
}
