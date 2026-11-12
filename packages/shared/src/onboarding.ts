import { z } from 'zod';

/**
 * Chiron onboarding: the shapes both apps share. The agent produces an `OnboardingPrep`; the web
 * app reads it from the A2A reply (one data part, `ONBOARDING_PREP_MIME_TYPE`) and draws it.
 * Framework-free so the same helpers serve the Mastra middleware, the web route and tests.
 */

export const TALENT_TYPES = ['employee', 'consultant', 'project-based', 'intern'] as const;
export type TalentType = (typeof TALENT_TYPES)[number];

export const TALENT_TYPE_LABELS: Record<TalentType, string> = {
  employee: 'Employee',
  consultant: 'Consultant',
  'project-based': 'Project-based',
  intern: 'Intern',
};

/**
 * A confirmed hire as Argus hands it over. Every field is optional on purpose: a missing detail
 * is reported back and asked for, never guessed (PRD Phase 1, C1).
 */
export const hireDetailsSchema = z.object({
  lastName: z.string().optional().describe('Last name, exactly as given'),
  firstName: z.string().optional().describe('First name, exactly as given'),
  middleName: z.string().optional().describe('Middle name, exactly as given'),
  nickname: z.string().optional().describe('What they like to be called'),
  personalEmail: z.string().optional().describe('Personal email address'),
  mobile: z.string().optional().describe('Mobile number'),
  startDate: z.string().optional().describe('Start date as YYYY-MM-DD'),
  position: z.string().optional(),
  group: z.string().optional().describe('Team or group they join'),
  costCenter: z.string().optional(),
  manager: z.string().optional().describe('Hiring manager or immediate superior (IS)'),
  talentType: z.enum(TALENT_TYPES).optional(),
  level: z.string().optional().describe('Level, for Employees and Consultants only'),
  hireConfirmedOn: z
    .string()
    .optional()
    .describe('Date Mikki confirmed the hire, YYYY-MM-DD; today if absent'),
});
export type HireDetails = z.infer<typeof hireDetailsSchema>;

/**
 * A handoff = the hire's details plus where it came from. `handoffRef` is Argus's id for the hire
 * (`test:<id>` for a test hire); it makes a repeated handoff return the same tracker record.
 */
export const handoffSchema = hireDetailsSchema.extend({
  handoffRef: z
    .string()
    .optional()
    .describe('The handoff reference exactly as given (e.g. "test:andi-dela-cruz"); omit if none'),
});
export type Handoff = z.infer<typeof handoffSchema>;

export function handoffSource(
  ref: string | undefined,
): 'argus-handoff' | 'entered-by-karissa' | 'test-hire' {
  if (!ref) return 'entered-by-karissa';
  return ref.startsWith('test:') ? 'test-hire' : 'argus-handoff';
}

export type StepStatus = 'Pending' | 'N/A' | 'To confirm';

export interface ChecklistStep {
  id: string;
  label: string;
  stage: string;
  status: StepStatus;
  /** What this step means for this Talent's type. */
  detail: string;
}

export interface Draft {
  id: string;
  title: string;
  /** Who the draft is addressed to now. Under the pilot lock, always Karissa. */
  to: string;
  /** Who it is really for, noted in brackets while the pilot lock is on. */
  realRecipient: string;
  subject: string;
  body: string;
  due?: string;
  /** The same deadline as YYYY-MM-DD, for the tracker. */
  dueIso?: string;
  /** Which checklist step this draft belongs to ('missing-details' for the note to Mikki). */
  stepKey: string;
  blanks: string[];
}

export interface OnboardingPrep {
  talent: {
    name: string;
    nickname?: string;
    talentType?: TalentType;
    typeLabel: string;
    level?: string;
    position?: string;
    group?: string;
    startDate?: string;
  };
  missing: string[];
  checklist: ChecklistStep[];
  flags: string[];
  drafts: Draft[];
  summary: {
    drafted: string[];
    verify: string[];
    blank: string[];
    open: string[];
  };
  pilot: { on: boolean; recipient: string };
  /** The wording is sample text until Karissa's own templates are loaded. */
  sampleTemplates: boolean;
  /** Set once the prep is saved to the tracker. */
  onboardingId?: string;
  /** True when this hire was already in the tracker and nothing new was created. */
  alreadyPrepared?: boolean;
}

export const ONBOARDING_PREP_MIME_TYPE = 'application/vnd.chiron.onboarding+json';

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);

/** One A2A data part carrying the prep, for either wire (0.3 has `kind`, 1.0 has `mediaType`). */
export function onboardingPrepPart(prep: OnboardingPrep, wire: '0.3' | '1.0'): Json {
  const metadata = { mimeType: ONBOARDING_PREP_MIME_TYPE };
  return wire === '1.0'
    ? { data: prep, mediaType: ONBOARDING_PREP_MIME_TYPE, metadata }
    : { kind: 'data', metadata, data: prep };
}

function isPrepPart(part: unknown): part is Json {
  if (!isObject(part)) return false;
  const meta = isObject(part.metadata) ? part.metadata : {};
  return (
    (meta.mimeType === ONBOARDING_PREP_MIME_TYPE || part.mediaType === ONBOARDING_PREP_MIME_TYPE) &&
    isObject(part.data)
  );
}

/** The prep in a JSON-RPC A2A reply (task artifacts, message parts or status message), or null. */
export function onboardingPrepFromReply(payload: unknown): OnboardingPrep | null {
  if (!isObject(payload) || payload.error || !isObject(payload.result)) return null;
  const result = payload.result;
  const r = isObject(result.task)
    ? result.task
    : isObject(result.message)
      ? result.message
      : result;
  const lists: unknown[][] = [];
  for (const a of Array.isArray(r.artifacts) ? r.artifacts : []) {
    if (isObject(a) && Array.isArray(a.parts)) lists.push(a.parts);
  }
  if (Array.isArray(r.parts)) lists.push(r.parts);
  const status = isObject(r.status) ? r.status : null;
  if (status && isObject(status.message) && Array.isArray(status.message.parts)) {
    lists.push(status.message.parts);
  }
  const part = lists.flat().find(isPrepPart);
  return part ? (part.data as unknown as OnboardingPrep) : null;
}
