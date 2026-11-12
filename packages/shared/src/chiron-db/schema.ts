import {
  boolean,
  date,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { projectSchema } from '../database.js';

/**
 * Chiron's tracker, Phase 1 tables (docs/DATA_MODEL.md, approved 2026-11-11). Phase 2–3 tables
 * (offboarding, open_role_notice, manpower_report) are added with their phase.
 *
 * There is deliberately no column for government IDs, bank details, pay, health information,
 * form answers, BI results or reasons for leaving (invariant 1). Every write goes through
 * `assertNoSensitive` in the repository first. Keep in step with `migrations.ts`
 * (`chiron-db.spec.ts` checks every column here exists in the SQL).
 */
export const CHIRON_APP_SCHEMA = projectSchema('app');
export const chironApp = pgSchema(CHIRON_APP_SCHEMA);

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const talent = chironApp.table('talent', {
  id: uuid('id').primaryKey().defaultRandom(),
  lastName: text('last_name'),
  firstName: text('first_name'),
  middleName: text('middle_name'),
  nickname: text('nickname'),
  talentType: text('talent_type').$type<'employee' | 'consultant' | 'project-based' | 'intern'>(),
  level: text('level'),
  position: text('position'),
  groupName: text('group_name'),
  costCenter: text('cost_center'),
  managerName: text('manager_name'),
  startDate: date('start_date'),
  lastDay: date('last_day'),
  personalEmail: text('personal_email'),
  mobile: text('mobile'),
  contactClearedAt: timestamp('contact_cleared_at', { withTimezone: true }),
  companyEmail: text('company_email'),
  companyEmailGivenBy: text('company_email_given_by').$type<'karissa'>(),
  employeeId: text('employee_id'),
  employeeIdGivenBy: text('employee_id_given_by').$type<'karissa' | 'margie'>(),
  source: text('source').notNull().$type<'argus-handoff' | 'entered-by-karissa' | 'test-hire'>(),
  argusRef: text('argus_ref').unique(),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const onboarding = chironApp.table('onboarding', {
  id: uuid('id').primaryKey().defaultRandom(),
  talentId: uuid('talent_id')
    .notNull()
    .references(() => talent.id),
  hireConfirmedOn: date('hire_confirmed_on').notNull(),
  checklistVersion: integer('checklist_version').notNull(),
  checklistConfirmedAt: timestamp('checklist_confirmed_at', { withTimezone: true }),
  checklistConfirmedBy: text('checklist_confirmed_by'),
  status: text('status').notNull().default('open').$type<'open' | 'complete'>(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: text('completed_by'),
  /** Snapshot of what Chiron flagged when it prepared the hire: status text only. */
  prepNotes: jsonb('prep_notes')
    .notNull()
    .$type<{ missing: string[]; flags: string[]; verify: string[] }>()
    .default({ missing: [], flags: [], verify: [] }),
  createdAt: createdAt(),
});

export type StepStatusDb =
  | 'pending'
  | 'drafted'
  | 'awaiting-approval'
  | 'sent'
  | 'waiting-on-others'
  | 'done'
  | 'n-a'
  | 'to-confirm';

export const step = chironApp.table(
  'step',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runKind: text('run_kind').notNull().$type<'onboarding' | 'offboarding'>(),
    runId: uuid('run_id').notNull(),
    stepKey: text('step_key').notNull(),
    label: text('label').notNull(),
    stage: text('stage').notNull(),
    detail: text('detail'),
    status: text('status').notNull().$type<StepStatusDb>(),
    owner: text('owner'),
    dueOn: date('due_on'),
    doneAt: timestamp('done_at', { withTimezone: true }),
    lastReminderAt: timestamp('last_reminder_at', { withTimezone: true }),
    note: text('note'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [unique('step_run_key').on(t.runKind, t.runId, t.stepKey)],
);

export type DraftStatus = 'draft' | 'approved' | 'sent' | 'discarded' | 'superseded';

export const draft = chironApp.table('draft', {
  id: uuid('id').primaryKey().defaultRandom(),
  runKind: text('run_kind')
    .notNull()
    .$type<'onboarding' | 'offboarding' | 'manpower' | 'tracking'>(),
  runId: uuid('run_id').notNull(),
  stepKey: text('step_key').notNull(),
  channel: text('channel').notNull().$type<'email' | 'calendar-invite' | 'slack'>(),
  title: text('title').notNull(),
  templateKey: text('template_key').notNull(),
  templateVersion: integer('template_version').notNull(),
  toAddress: text('to_address').notNull(),
  realRecipient: text('real_recipient').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  blanks: text('blanks').array().notNull().default([]),
  dueOn: date('due_on'),
  status: text('status').notNull().default('draft').$type<DraftStatus>(),
  version: integer('version').notNull().default(1),
  editedByKarissa: boolean('edited_by_karissa').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const approval = chironApp.table('approval', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => draft.id),
  subjectRef: text('subject_ref'),
  approverUserId: text('approver_user_id').notNull(),
  approverRole: text('approver_role').notNull().$type<'karissa' | 'mikki'>(),
  decision: text('decision').notNull().$type<'approved' | 'rejected'>(),
  contentHash: text('content_hash').notNull(),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sendLog = chironApp.table('send_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind')
    .notNull()
    .$type<
      'email' | 'calendar-invite' | 'slack-message' | 'argus-open-role' | 'masterlist-write'
    >(),
  via: text('via').notNull().$type<'chiron' | 'manual'>(),
  draftId: uuid('draft_id').references(() => draft.id),
  approvalId: uuid('approval_id').references(() => approval.id),
  target: text('target').notNull(),
  pilotRedirected: boolean('pilot_redirected').notNull(),
  payloadHash: text('payload_hash').notNull(),
  status: text('status').notNull().$type<'sent' | 'failed'>(),
  error: text('error'),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

export const scheduleProposal = chironApp.table('schedule_proposal', {
  id: uuid('id').primaryKey().defaultRandom(),
  onboardingId: uuid('onboarding_id')
    .notNull()
    .references(() => onboarding.id),
  kind: text('kind')
    .notNull()
    .$type<'goals' | 'one-on-one' | 'mancom-one-on-one' | 'nho' | 'welcome-lunch'>(),
  withContactKey: text('with_contact_key'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  calendarChecked: boolean('calendar_checked').notNull().default(false),
  status: text('status')
    .notNull()
    .default('proposed')
    .$type<'proposed' | 'manager-approved' | 'invited' | 'declined'>(),
});

export const holiday = chironApp.table('holiday', {
  date: date('date').primaryKey(),
  name: text('name').notNull(),
  sourceUrl: text('source_url'),
  status: text('status')
    .notNull()
    .default('proposed')
    .$type<'proposed' | 'confirmed' | 'rejected'>(),
  proposedAt: timestamp('proposed_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedBy: text('confirmed_by'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

export const away = chironApp.table('away', {
  id: uuid('id').primaryKey().defaultRandom(),
  personKey: text('person_key').notNull(),
  fromDate: date('from_date').notNull(),
  toDate: date('to_date').notNull(),
  enteredBy: text('entered_by').notNull(),
});

export const scheduledRun = chironApp.table('scheduled_run', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull().$type<'tracking' | 'holiday-check' | 'manpower-report'>(),
  scheduledFor: date('scheduled_for').notNull(),
  outcome: text('outcome').notNull().$type<'ran' | 'skipped-holiday' | 'failed'>(),
  ranAt: timestamp('ran_at', { withTimezone: true }).notNull().defaultNow(),
});

export const playbookEntry = chironApp.table('playbook_entry', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind')
    .notNull()
    .$type<'checklist' | 'template' | 'clearance-checklist' | 'contact-list'>(),
  key: text('key').notNull(),
  version: integer('version').notNull(),
  content: jsonb('content').notNull(),
  active: boolean('active').notNull().default(false),
  changedBy: text('changed_by').notNull(),
  reason: text('reason').notNull(),
  createdAt: createdAt(),
});

export const chironSchema = {
  talent,
  onboarding,
  step,
  draft,
  approval,
  sendLog,
  scheduleProposal,
  holiday,
  away,
  scheduledRun,
  playbookEntry,
};
