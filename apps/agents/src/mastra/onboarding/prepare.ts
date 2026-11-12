import { PILOT } from '@precast/shared/server';
import {
  TALENT_TYPE_LABELS,
  type ChecklistStep,
  type Draft,
  type HireDetails,
  type OnboardingPrep,
  type TalentType,
} from '@precast/shared';
import { CHECKLIST_BY_TYPE } from './checklist-by-type';

/**
 * C1 + C2 of onboarding as plain functions: check the details, pick the checklist for the
 * Talent's type, flag what Karissa should see, and render the first drafts under the pilot lock.
 * No model, no network: the same input always gives the same drafts (PRD "Data rules and
 * guardrails": rules enforced in code, not left to the prompt).
 */

export { PILOT };

const COMPANY_DOMAIN = '917ventures.com';
const SIGNATURE = 'Chiron, on behalf of the 917V People Team';

const REQUIRED: Array<{ key: keyof HireDetails; label: string }> = [
  { key: 'lastName', label: 'Last name' },
  { key: 'firstName', label: 'First name' },
  { key: 'middleName', label: 'Middle name' },
  { key: 'nickname', label: 'Nickname' },
  { key: 'personalEmail', label: 'Personal email' },
  { key: 'mobile', label: 'Mobile number' },
  { key: 'startDate', label: 'Start date' },
  { key: 'position', label: 'Position' },
  { key: 'group', label: 'Group' },
  { key: 'costCenter', label: 'Cost center' },
  { key: 'manager', label: 'Manager or IS' },
  { key: 'talentType', label: 'Talent type' },
];

const filled = (v: string | undefined): v is string => typeof v === 'string' && v.trim() !== '';

export function missingDetails(hire: HireDetails): string[] {
  const missing = REQUIRED.filter(({ key }) => !filled(hire[key] as string | undefined)).map(
    ({ label }) => label,
  );
  const needsLevel = hire.talentType === 'employee' || hire.talentType === 'consultant';
  if (needsLevel && !filled(hire.level)) missing.push('Level');
  return missing;
}

// ── Dates (working days are Mon–Fri; holidays join once Karissa's holiday table exists) ──

export function parseIsoDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const isWeekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6;

export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (!isWeekend(d)) left -= 1;
  }
  return d;
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Project-based Talent start on a Tuesday, Wednesday or Friday (PRD rule 3: flag, never change). */
export function isProjectBasedStartDay(d: Date): boolean {
  return [2, 3, 5].includes(d.getUTCDay());
}

// ── Names and addresses ──

function asciiSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/**
 * The 917V address IT is asked to create: firstname.lastname, or zfirstname.lastname for
 * project-based hires and interns. A request only: the real address comes from Karissa's
 * confirmation (guardrail 6).
 */
export function requestedCompanyEmail(hire: HireDetails): string | null {
  if (!filled(hire.firstName) || !filled(hire.lastName) || !hire.talentType) return null;
  const prefix = hire.talentType === 'project-based' || hire.talentType === 'intern' ? 'z' : '';
  return `${prefix}${asciiSlug(hire.firstName)}.${asciiSlug(hire.lastName)}@${COMPANY_DOMAIN}`;
}

// ── Checklist ──

export function checklistFor(talentType: TalentType, level?: string): ChecklistStep[] {
  return CHECKLIST_BY_TYPE.map((rule) => {
    const { status, detail } = rule.byType[talentType];
    const withManCom =
      rule.id === 'goals-and-one-on-ones' &&
      status === 'Pending' &&
      level?.trim().toLowerCase() === 'high'
        ? `${detail}; plus ManCom 1:1s (level High)`
        : detail;
    return { id: rule.id, label: rule.label, stage: rule.stage, status, detail: withManCom };
  });
}

// ── Drafts ──

function addressed(realRecipient: string): Pick<Draft, 'to' | 'realRecipient'> {
  return PILOT.on ? { to: PILOT.recipient, realRecipient } : { to: realRecipient, realRecipient };
}

function blankCollector() {
  const blanks: string[] = [];
  return {
    blanks,
    /** The value, or a visible blank Karissa fills in, recorded once. */
    v(value: string | undefined, label: string): string {
      if (filled(value)) return value.trim();
      const blank = `[${label}]`;
      if (!blanks.includes(label)) blanks.push(label);
      return blank;
    },
    blank(label: string): string {
      if (!blanks.includes(label)) blanks.push(label);
      return `[${label}]`;
    },
  };
}

function fullName(h: HireDetails): string {
  return [h.firstName, h.middleName, h.lastName].filter(filled).join(' ') || 'the new Talent';
}

function noteToMikki(hire: HireDetails, missing: string[]): Draft {
  const name = fullName(hire);
  return {
    id: 'note-to-mikki',
    stepKey: 'missing-details',
    title: 'Note to Mikki: missing details',
    ...addressed('Mikki, Head of Recruitment'),
    subject: `Missing details for ${name}'s onboarding`,
    body: [
      'Hi Mikki,',
      '',
      `I'm preparing ${name}'s onboarding and I'm missing a few details:`,
      '',
      ...missing.map((m) => `• ${m}`),
      '',
      "Could you send these over when you can? I've drafted everything else and left these blank.",
      '',
      'Thank you,',
      SIGNATURE,
    ].join('\n'),
    blanks: [],
  };
}

function biRequest(hire: HireDetails, due: string | undefined): Draft {
  const b = blankCollector();
  const start = parseIsoDate(hire.startDate);
  const body = [
    'Hi ABSI team,',
    '',
    'We would like to request a background investigation for a new 917V Talent:',
    '',
    `Name: ${b.v(hire.lastName, 'Last name')}, ${b.v(hire.firstName, 'First name')} ${b.v(hire.middleName, 'Middle name')}`,
    `Position: ${b.v(hire.position, 'Position')}`,
    `Group: ${b.v(hire.group, 'Group')}`,
    `Personal email: ${b.v(hire.personalEmail, 'Personal email')}`,
    `Mobile: ${b.v(hire.mobile, 'Mobile number')}`,
    `Start date: ${start ? formatDate(start) : b.blank('Start date')}`,
    '',
    'Please send the result directly to Mikki, our Head of Recruitment.',
    '',
    'Thank you,',
    SIGNATURE,
  ].join('\n');
  return {
    id: 'bi-request',
    stepKey: 'bi-request',
    title: 'Background investigation request',
    ...addressed('ABSI'),
    subject: `Background investigation request: ${fullName(hire)}`,
    body,
    due,
    blanks: b.blanks,
  };
}

function welcomeEmail(
  hire: HireDetails,
  due: string | undefined,
  formADue: string | undefined,
): Draft {
  const b = blankCollector();
  const type = hire.talentType;
  const hi = b.v(filled(hire.nickname) ? hire.nickname : hire.firstName, 'Nickname');
  const start = parseIsoDate(hire.startDate);
  const startText = start ? formatDate(start) : b.blank('Start date');
  const intro = [
    `Hi ${hi},`,
    '',
    `Welcome to 917V! We're so glad you're joining us as ${b.v(hire.position, 'Position')} in ${b.v(hire.group, 'Group')}, starting ${startText}.`,
    '',
  ];
  const close = [
    '',
    'If anything is unclear, just reply to this email.',
    '',
    'See you soon,',
    SIGNATURE,
  ];

  let steps: string[];
  if (type === 'project-based') {
    steps = [
      'A few things before Day 1:',
      '',
      '1. Send us a short intro about yourself: a few lines the team can read before you join.',
      '2. On Day 1, Jam will give you a tour and set you up with your laptop.',
    ];
  } else if (type === 'intern') {
    steps = [
      'A few things before Day 1:',
      '',
      '1. Send us a short intro about yourself: a few lines the team can read before you join.',
      '2. Tell us your shirt size for your Welcome Kit.',
      `3. Read our Code of Conduct and the 917V Code: ${b.blank('Code of Conduct link')}`,
    ];
  } else {
    steps = [
      'A few things before Day 1:',
      '',
      `1. Fill out Form A${formADue ? ` by ${formADue}` : ''}: ${b.blank('Form A link')}`,
      `2. Read our onboarding guide: ${b.blank('Onboarding guide link')}`,
      `3. Read our Code of Conduct and the 917V Code: ${b.blank('Code of Conduct link')}`,
      '4. Send us a short intro about yourself: a few lines the team can read before you join.',
      '5. Tell us your shirt size for your Welcome Kit.',
      '',
      `Your Employee ID: ${b.blank('Employee ID, from Karissa or Margie')}`,
      '',
      'Your first day starts with New Hire Orientation with Margie, 9:00–10:00 AM. The invite will follow.',
    ];
  }

  const version =
    type === 'project-based'
      ? 'project-based version'
      : type === 'intern'
        ? 'intern version'
        : 'employee version';
  return {
    id: 'welcome-email',
    stepKey: 'welcome-email',
    title: `Welcome email (${version})`,
    ...addressed(filled(hire.personalEmail) ? hire.personalEmail : 'the Talent’s personal email'),
    subject: `Welcome to 917V, ${hi}!`,
    body: [...intro, ...steps, ...close].join('\n'),
    due,
    blanks: b.blanks,
  };
}

function itEmailRequest(hire: HireDetails, due: string | undefined): Draft {
  const b = blankCollector();
  const start = parseIsoDate(hire.startDate);
  const requested = requestedCompanyEmail(hire);
  const body = [
    'Hi IT team,',
    '',
    'Please create a 917V email account for our new Talent:',
    '',
    `Name: ${b.v(hire.firstName, 'First name')} ${b.v(hire.middleName, 'Middle name')} ${b.v(hire.lastName, 'Last name')}`,
    `Requested address: ${requested ?? b.blank('Requested 917V address')}`,
    `Position: ${b.v(hire.position, 'Position')}`,
    `Group: ${b.v(hire.group, 'Group')}`,
    `Cost center: ${b.v(hire.costCenter, 'Cost center')}`,
    `Talent type: ${hire.talentType ? TALENT_TYPE_LABELS[hire.talentType] : b.blank('Talent type')}`,
    `Manager: ${b.v(hire.manager, 'Manager or IS')}`,
    `Start date: ${start ? formatDate(start) : b.blank('Start date')}`,
    '',
    `Please send the login directly to their personal email (${b.v(hire.personalEmail, 'Personal email')}), with a password reset on first login, and let us know once the account exists.`,
    '',
    'Thank you,',
    SIGNATURE,
  ].join('\n');
  return {
    id: 'it-email-request',
    stepKey: 'it-email-request',
    title: '917V email request',
    ...addressed('IT (Globe ISDP)'),
    subject: `917V email account request: ${fullName(hire)}`,
    body,
    due,
    blanks: b.blanks,
  };
}

// ── The whole C1 + C2 pass ──

export function prepareOnboarding(hire: HireDetails, today: Date = new Date()): OnboardingPrep {
  const missing = missingDetails(hire);
  const type = hire.talentType;
  const start = parseIsoDate(hire.startDate);
  const confirmedOn = parseIsoDate(hire.hireConfirmedOn) ?? today;
  const firstRequestsDate = addWorkingDays(confirmedOn, 1);
  const firstRequestsDue = formatDate(firstRequestsDate);
  const formADate = start ? new Date(start.getTime() - 7 * 86_400_000) : null;

  const flags: string[] = [];
  if (filled(hire.startDate) && !start) {
    flags.push(`The start date "${hire.startDate}" isn't a date I can read. Please confirm it.`);
  }
  if (start && type === 'project-based' && !isProjectBasedStartDay(start)) {
    const day = start.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    flags.push(
      `The start date, ${formatDate(start)}, is a ${day}. Project-based hires usually start on a Tuesday, Wednesday or Friday. I haven't changed it.`,
    );
  }
  if (formADate && formADate < today && type !== 'project-based') {
    flags.push(
      `The start date is less than 7 days away, so the Form A deadline (${formatDate(formADate)}) has already passed.`,
    );
  }

  const checklist = type ? checklistFor(type, hire.level) : [];
  const applies = (id: string) => checklist.find((s) => s.id === id)?.status === 'Pending';

  const drafts: Draft[] = [];
  if (missing.length) drafts.push(noteToMikki(hire, missing));
  if (type) {
    if (applies('bi-request')) drafts.push(biRequest(hire, firstRequestsDue));
    drafts.push(
      welcomeEmail(hire, firstRequestsDue, formADate ? formatDate(formADate) : undefined),
    );
    drafts.push(itEmailRequest(hire, firstRequestsDue));
  }

  for (const d of drafts) if (d.due) d.dueIso = isoDate(firstRequestsDate);

  const requested = requestedCompanyEmail(hire);
  const verify = [
    type
      ? `Talent type (${TALENT_TYPE_LABELS[type]}${filled(hire.level) ? `, level ${hire.level}` : ''}) and the checklist`
      : 'Talent type and level',
    ...(requested ? [`The 917V address to request: ${requested}`] : []),
    ...(filled(hire.firstName) && hire.firstName.trim().includes(' ')
      ? ['How a two-word first name should appear in the 917V address']
      : []),
    'Each real recipient’s address. I never fill in addresses myself.',
    'The wording. These are sample templates until your own are loaded.',
  ];

  const blank = [...new Set(drafts.flatMap((d) => d.blanks))];

  const open = [
    ...missing.map((m) => `Missing: ${m}`),
    ...(type ? [] : ["Talent type is missing, so I can't pick the checklist yet."]),
    ...flags,
    ...checklist
      .filter((s) => s.status === 'To confirm')
      .map(
        (s) =>
          `${s.label}: not yet decided for ${type ? TALENT_TYPE_LABELS[type] : 'this type'} hires`,
      ),
    start
      ? `Holiday check isn't connected yet. Please check ${formatDate(start)} isn't a holiday.`
      : "Holiday check isn't connected yet.",
  ];

  return {
    talent: {
      name: fullName(hire),
      nickname: filled(hire.nickname) ? hire.nickname : undefined,
      talentType: type,
      typeLabel: type ? TALENT_TYPE_LABELS[type] : 'Type not given',
      level: filled(hire.level) ? hire.level : undefined,
      position: hire.position,
      group: hire.group,
      startDate: start ? formatDate(start) : undefined,
    },
    missing,
    checklist,
    flags,
    drafts,
    summary: { drafted: drafts.map((d) => d.title), verify, blank, open },
    pilot: { on: PILOT.on, recipient: PILOT.recipient },
    sampleTemplates: true,
  };
}
