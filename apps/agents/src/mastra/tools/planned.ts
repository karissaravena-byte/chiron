import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { PILOT, chironDb, checkSendAllowed, getDraftWithApprovals } from '@precast/shared/server';

/**
 * Interfaces for the functions in docs/AGENT_SPEC.md that aren't built yet (Stage 3: stubs and
 * interfaces only). Each has its real input/output contract so the seams are fixed now; the
 * bodies say "not built yet" and never pretend. NONE of these is in CHIRON_TOOLS: the model
 * can't call a tool that doesn't work. Add each to `agents/chiron.ts` when it is built and tested.
 */

const notBuilt = (what: string) => ({ ok: false as const, reason: `${what} isn't built yet.` });
const result = z.object({ ok: z.boolean(), reason: z.string().optional() });

/** F9: a yes/no fact someone reported. Never the content of a form or a BI result. */
export const recordStepFactTool = createTool({
  id: 'record_step_fact',
  description:
    'Record that a step happened, e.g. "BI processed" or "Form A submitted". Yes/no facts only.',
  inputSchema: z.object({
    onboardingId: z.string().uuid(),
    fact: z.enum([
      'bi-processed',
      'it-account-confirmed',
      'email-activated',
      'form-a-submitted',
      'form-b-submitted',
    ]),
    reportedBy: z.enum(['karissa', 'mikki', 'margie']),
  }),
  outputSchema: result,
  execute: async () => notBuilt('Recording step facts'),
});

/**
 * F13: send an approved draft through Gmail as chiron@917ventures.com. Takes an id only, so the
 * model can't change the content. The gate is real today; the Gmail module isn't connected, so
 * it stops at the floor: Karissa sends it herself.
 */
export const sendApprovedDraftTool = createTool({
  id: 'send_approved_draft',
  description:
    'Send one approved draft. Fails unless Karissa or Mikki approved this exact version.',
  inputSchema: z.object({ draftId: z.string().uuid() }),
  outputSchema: z.object({ sent: z.boolean(), reason: z.string() }),
  execute: async ({ draftId }) => {
    const found = await getDraftWithApprovals(await chironDb(), draftId);
    if (!found) return { sent: false, reason: 'That draft does not exist.' };
    const gate = checkSendAllowed(found.draft, found.approvals, PILOT);
    if (!gate.ok) return { sent: false, reason: gate.reason };
    // TODO(F13, F16, F37): kind timing, then Gmail via resolveSubscribedServer as chiron@, then send_log.
    return { sent: false, reason: "Gmail isn't connected yet, so Karissa sends this one herself." };
  },
});

/** F19: propose the first three weeks. Slot placement is code, not the model. */
export const proposeScheduleTool = createTool({
  id: 'propose_schedule',
  description: "Propose a new hire's goals conversation, 1:1s, NHO and welcome lunch.",
  inputSchema: z.object({ onboardingId: z.string().uuid() }),
  outputSchema: result,
  execute: async () => notBuilt('Schedule proposals'),
});

/** F21–F23: the Monday/Thursday tracking run. */
export const runTrackingTool = createTool({
  id: 'run_tracking',
  description: 'Find overdue and soon-due steps and draft kind reminders for approval.',
  inputSchema: z.object({ runDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  outputSchema: result,
  execute: async () => notBuilt('Tracking runs'),
});

/** F24: propose holidays from the Official Gazette and PCO, for Karissa to confirm. */
export const proposeHolidaysTool = createTool({
  id: 'propose_holidays',
  description: 'Propose upcoming Philippine holidays with source links. Karissa confirms them.',
  inputSchema: z.object({ year: z.number().int().min(2026).max(2100) }),
  outputSchema: result,
  execute: async () => notBuilt('The holiday check'),
});

/**
 * F28/F33: tell Argus about an open role. The schema IS the rule: role, team, level and the
 * date it opens, nothing else (DATA_MODEL invariant 5). `.strict()` rejects any extra field.
 */
export const openRoleNoticeSchema = z
  .object({
    positionKey: z.string().min(1),
    role: z.string().min(1),
    team: z.string().min(1),
    level: z.string().optional(),
    opensOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

export const notifyArgusOpenRoleTool = createTool({
  id: 'notify_argus_open_role',
  description: 'Tell Argus a role needs filling: role, team, level and date only.',
  inputSchema: openRoleNoticeSchema,
  outputSchema: result,
  execute: async () => notBuilt('Telling Argus about open roles'),
});
