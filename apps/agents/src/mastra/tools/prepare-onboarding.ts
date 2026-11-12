import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { SensitiveDataError, handoffSchema, handoffSource } from '@precast/shared';
import { chironDb, saveOnboardingPrep } from '@precast/shared/server';
import { prepareOnboarding } from '../onboarding/prepare';
import { setPendingOnboardingPrep } from '../lib/request-context';

/**
 * C1 + C2 (AGENT_SPEC F1–F8): check a confirmed hire's details, pick the checklist for their
 * type, draft the first requests, and save it all to the tracker in one transaction. The full
 * result goes to the screen as a data part on the reply (middleware/onboarding-prep.ts); the
 * model only gets the short version it needs to summarize.
 */
export const prepareOnboardingTool = createTool({
  id: 'prepare_onboarding',
  description:
    'Prepare onboarding for a confirmed hire: check required details, pick the checklist for their ' +
    'talent type, flag start-date issues, draft the BI request, welcome email and IT email request ' +
    '(all addressed to Karissa while the pilot is on), and save it to the tracker. Call once per ' +
    'hire. Pass each detail exactly as given; leave out any detail that was not given.',
  inputSchema: handoffSchema,
  outputSchema: z.object({
    saved: z.boolean(),
    alreadyPrepared: z.boolean(),
    talent: z.string(),
    talentType: z.string(),
    drafted: z.array(z.string()),
    verify: z.array(z.string()),
    blank: z.array(z.string()),
    open: z.array(z.string()),
    problem: z.string().optional(),
  }),
  execute: async ({ handoffRef, ...hire }) => {
    const prep = prepareOnboarding(hire);
    const short = {
      talent: prep.talent.name,
      talentType: prep.talent.typeLabel,
      drafted: prep.summary.drafted,
      verify: prep.summary.verify,
      blank: prep.summary.blank,
      open: prep.summary.open,
    };
    try {
      const db = await chironDb();
      const saved = await saveOnboardingPrep(db, {
        hire,
        prep,
        source: handoffSource(handoffRef),
        argusRef: handoffRef,
      });
      prep.onboardingId = saved.onboardingId;
      prep.alreadyPrepared = saved.alreadyPrepared;
      setPendingOnboardingPrep(prep);
      return { saved: true, alreadyPrepared: saved.alreadyPrepared, ...short };
    } catch (err) {
      const problem =
        err instanceof SensitiveDataError
          ? err.message
          : "The tracker couldn't be reached, so nothing was saved. Try again in a minute.";
      return { saved: false, alreadyPrepared: false, ...short, problem };
    }
  },
});
