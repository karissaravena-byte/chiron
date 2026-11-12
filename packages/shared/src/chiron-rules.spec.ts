import { describe, expect, it } from 'vitest';
import {
  PILOT,
  approverRoleFor,
  blanksIn,
  checkSendAllowed,
  draftContentHash,
  nextSendWindow,
  parseApprovers,
  type GateApproval,
  type GateDraft,
} from './chiron-rules.js';

const draft: GateDraft = {
  status: 'approved',
  toAddress: PILOT.recipient,
  realRecipient: 'ABSI',
  subject: 'Background investigation request: Andrea Santos Dela Cruz',
  body: 'Hi ABSI team, …',
};
const approved = (over: Partial<GateApproval> = {}): GateApproval => ({
  decision: 'approved',
  approverRole: 'karissa',
  contentHash: draftContentHash(draft),
  decidedAt: new Date('2026-11-11T02:00:00Z'),
  ...over,
});

describe('send gate (CH-GUARD-2, CH-GUARD-3)', () => {
  it('allows an approved, unchanged draft addressed to Karissa during the pilot', () => {
    const d = checkSendAllowed(draft, [approved()]);
    expect(d).toMatchObject({ ok: true, pilotRedirected: true });
  });

  it('refuses with no approval at all', () => {
    expect(checkSendAllowed(draft, []).ok).toBe(false);
  });

  it('refuses a draft that is not in approved status', () => {
    expect(checkSendAllowed({ ...draft, status: 'draft' }, [approved()]).ok).toBe(false);
  });

  it('refuses when the draft changed after approval', () => {
    const edited = { ...draft, body: draft.body + ' Edited.' };
    const d = checkSendAllowed(edited, [approved()]);
    expect(d).toEqual({ ok: false, reason: expect.stringMatching(/changed after/) });
  });

  it('refuses when the latest decision is a rejection', () => {
    const d = checkSendAllowed(draft, [
      approved(),
      approved({ decision: 'rejected', decidedAt: new Date('2026-11-11T03:00:00Z') }),
    ]);
    expect(d.ok).toBe(false);
  });

  it('refuses an approval from anyone but Karissa or Mikki', () => {
    expect(checkSendAllowed(draft, [approved({ approverRole: 'margie' })]).ok).toBe(false);
  });

  it('refuses a draft that still has a [blank] in it', () => {
    const blank = { ...draft, body: 'Fill out Form A: [Form A link]' };
    const d = checkSendAllowed(blank, [approved({ contentHash: draftContentHash(blank) })]);
    expect(d).toEqual({ ok: false, reason: 'Fill the blanks first: Form A link.' });
  });

  it('refuses a real vendor address while the pilot is on', () => {
    const vendor = { ...draft, toAddress: 'requests@absi.example' };
    const d = checkSendAllowed(vendor, [approved({ contentHash: draftContentHash(vendor) })]);
    expect(d).toEqual({ ok: false, reason: expect.stringMatching(/Pilot mode/) });
  });
});

describe('approvers (D-009)', () => {
  const list = parseApprovers(
    'karissa:Karissa@917.example, mikki:mikki@917.example, boss:x@y.z, bad',
  );
  it('maps known roles case-insensitively and drops anything else', () => {
    expect(approverRoleFor('karissa@917.example', list)).toBe('karissa');
    expect(approverRoleFor('MIKKI@917.example', list)).toBe('mikki');
    expect(approverRoleFor('x@y.z', list)).toBeNull();
    expect(list.size).toBe(2);
  });
});

describe('blanksIn', () => {
  it('lists remaining [blanks] once each', () => {
    expect(blanksIn('Form A: [Form A link]\nID: [Employee ID]\nAgain [Form A link]')).toEqual([
      'Form A link',
      'Employee ID',
    ]);
  });
});

describe('kind timing (D-014): Mon–Fri 9:00–18:00 Manila', () => {
  const at = (iso: string) => new Date(iso);
  it('sends now inside working hours', () => {
    // Wed Nov 11, 2026, 10:00 Manila = 02:00 UTC
    expect(nextSendWindow(at('2026-11-11T02:00:00Z')).toISOString()).toBe(
      '2026-11-11T02:00:00.000Z',
    );
  });
  it('waits for 9:00 the next morning after hours', () => {
    // Wed 19:00 Manila → Thu 9:00 Manila (01:00 UTC)
    expect(nextSendWindow(at('2026-11-11T11:00:00Z')).toISOString()).toBe(
      '2026-11-12T01:00:00.000Z',
    );
  });
  it('waits until 9:00 the same day when early', () => {
    // Thu 07:00 Manila → Thu 9:00
    expect(nextSendWindow(at('2026-11-11T23:00:00Z')).toISOString()).toBe(
      '2026-11-12T01:00:00.000Z',
    );
  });
  it('skips the weekend and confirmed holidays', () => {
    // Fri Nov 27, 19:00 Manila → Mon Nov 30 is Bonifacio Day (if confirmed) → Tue Dec 1, 9:00
    const out = nextSendWindow(at('2026-11-27T11:00:00Z'), new Set(['2026-11-30']));
    expect(out.toISOString()).toBe('2026-12-01T01:00:00.000Z');
  });
});
