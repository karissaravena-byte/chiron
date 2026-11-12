# DATA_MODEL: what Chiron keeps track of

**Last updated:** 2026-11-10 · **Store:** Postgres (the project database), tables in schema
`chiron_app`; sign-in in `chiron_auth`, agent memory in `chiron_agents`. Sources: [PRD.md](PRD.md)
and the PoC Karissa approved on 2026-11-10.

> **Status: approved by Karissa on 2026-11-11**, with all five recommendations in §6 accepted.

---

## 0. In plain words

Chiron keeps **one record per Talent**. Each onboarding or offboarding has a **list of steps**
(the tracker), and each step can have **drafts**. A draft goes out only after an **approval**
from Karissa (or Mikki), and every send is written to a **send log**. Chiron also keeps
**holidays** Karissa has confirmed, the **open roles** it has told Argus about (so it never sends
one twice), and its **playbook**: the checklists, templates and contact list it works from.

Some things have **no place to be stored at all**: government IDs, bank details, pay, health
information, Form A/B answers, BI results, reasons for leaving, and any rating of a person.
There is no column for them. Text fields are checked on every write, and a write containing one
is refused.

---

## 1. Entities

Phase tags: **P1** onboarding, **P2** offboarding, **P3** manpower. P1 tables are built first;
P2/P3 tables are listed so the model doesn't need reshaping later.

### Talent (P1)

The person being onboarded or offboarded. Personal contact details are kept only while needed
(see §6, call 2).

| Field                                 | Type              | Notes                                                     |
| ------------------------------------- | ----------------- | --------------------------------------------------------- |
| `id`                                  | uuid (PK)         |                                                           |
| `lastName`, `firstName`, `middleName` | text              | Exactly as Argus or Karissa gave them                     |
| `nickname`                            | text              | What drafts call them                                     |
| `talentType`                          | enum              | `employee` \| `consultant` \| `project-based` \| `intern` |
| `level`                               | text, null        | Employees and Consultants only                            |
| `position`, `groupName`, `costCenter` | text              | Owned by Mikki                                            |
| `managerName`                         | text              | Hiring manager or IS                                      |
| `startDate`                           | date              | Never changed by Chiron, only flagged                     |
| `lastDay`                             | date, null        | Set from Margie's confirmation (P2)                       |
| `personalEmail`, `mobile`             | text, null        | Cleared when onboarding completes (§6, call 2)            |
| `contactClearedAt`                    | timestamptz, null | When the two fields above were cleared                    |
| `companyEmail`                        | text, null        | Only from Karissa's confirmation                          |
| `companyEmailGivenBy`                 | enum, null        | `karissa`. Required when `companyEmail` is set            |
| `employeeId`                          | text, null        | Only from Karissa or Margie                               |
| `employeeIdGivenBy`                   | enum, null        | `karissa` \| `margie`. Required when `employeeId` is set  |
| `source`                              | enum              | `argus-handoff` \| `entered-by-karissa`                   |
| `argusRef`                            | text, null        | Argus's id for the hire, to match later messages          |
| `createdAt`, `updatedAt`              | timestamptz       |                                                           |

### Onboarding (P1)

One onboarding for one Talent, from Argus's handoff to Karissa's sign-off.

| Field                                          | Type                    | Notes                                      |
| ---------------------------------------------- | ----------------------- | ------------------------------------------ |
| `id`                                           | uuid (PK)               |                                            |
| `talentId`                                     | uuid (FK)               | → Talent                                   |
| `hireConfirmedOn`                              | date                    | Deadlines count from here                  |
| `checklistVersion`                             | int                     | Which playbook checklist it was built from |
| `checklistConfirmedAt`, `checklistConfirmedBy` | timestamptz, user, null | Gate G4                                    |
| `status`                                       | enum                    | `open` \| `complete`                       |
| `completedAt`, `completedBy`                   | timestamptz, user, null | Only Karissa marks complete                |
| `createdAt`                                    | timestamptz             |                                            |

### Step (P1, reused in P2)

One row of the tracker: one checklist step for one onboarding (or one clearance step for one
offboarding).

| Field            | Type              | Notes                                                                                                             |
| ---------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `id`             | uuid (PK)         |                                                                                                                   |
| `runKind`        | enum              | `onboarding` \| `offboarding`                                                                                     |
| `runId`          | uuid              | → Onboarding or Offboarding                                                                                       |
| `stepKey`        | text              | From the checklist, e.g. `bi-request`, `form-a`, `form-b`                                                         |
| `stage`          | text              | e.g. "First requests"                                                                                             |
| `status`         | enum              | `pending` \| `drafted` \| `awaiting-approval` \| `sent` \| `waiting-on-others` \| `done` \| `n-a` \| `to-confirm` |
| `owner`          | text              | Who acts next: Karissa, Mikki, IT, ABSI, iCare…                                                                   |
| `dueOn`          | date, null        | Working days, holidays excluded                                                                                   |
| `doneAt`         | timestamptz, null |                                                                                                                   |
| `lastReminderAt` | timestamptz, null | So Monday/Thursday runs don't repeat a reminder                                                                   |
| `note`           | text, null        | Short, status-only; checked like every text field                                                                 |

`form-a` and `form-b` are steps like any other: **done** means "submitted", nothing more.
`bi-request` is done when Mikki says "BI processed", never with the result.

### Draft (P1)

Anything Chiron writes for someone to read: an email, a reminder, a Slack update, an invite.

| Field                            | Type        | Notes                                                               |
| -------------------------------- | ----------- | ------------------------------------------------------------------- |
| `id`                             | uuid (PK)   |                                                                     |
| `runKind`, `runId`, `stepKey`    |             | What it belongs to; `runKind` also allows `manpower` and `tracking` |
| `channel`                        | enum        | `email` \| `calendar-invite` \| `slack`                             |
| `templateKey`, `templateVersion` | text, int   | Which playbook template produced it                                 |
| `toAddress`                      | text        | Where it actually goes. Under the pilot lock, always Karissa        |
| `realRecipient`                  | text        | Who it is really for, shown in brackets during the pilot            |
| `subject`, `body`                | text        |                                                                     |
| `blanks`                         | text[]      | Fields left for Karissa to fill                                     |
| `status`                         | enum        | `draft` \| `approved` \| `sent` \| `discarded` \| `superseded`      |
| `version`                        | int         | Bumped on every edit                                                |
| `createdAt`, `updatedAt`         | timestamptz |                                                                     |

### Approval (P1)

Karissa's (or Mikki's) yes or no on one exact version of a draft or action.

| Field            | Type            | Notes                                                                             |
| ---------------- | --------------- | --------------------------------------------------------------------------------- |
| `id`             | uuid (PK)       |                                                                                   |
| `draftId`        | uuid (FK), null | → Draft; null for a masterlist write (P2)                                         |
| `subjectRef`     | text            | What was approved, when it isn't a draft (e.g. `masterlist:resigning:<talentId>`) |
| `approverUserId` | text (FK)       | → sign-in user                                                                    |
| `approverRole`   | enum            | `karissa` \| `mikki`                                                              |
| `decision`       | enum            | `approved` \| `rejected`                                                          |
| `contentHash`    | text            | SHA-256 of recipient + subject + body at the moment of approval                   |
| `decidedAt`      | timestamptz     |                                                                                   |

### Send log (P1)

Every outbound action, sent or failed. Nothing leaves Chiron without a row here.

| Field             | Type        | Notes                                                                                      |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `id`              | uuid (PK)   |                                                                                            |
| `kind`            | enum        | `email` \| `calendar-invite` \| `slack-message` \| `argus-open-role` \| `masterlist-write` |
| `draftId`         | uuid, null  |                                                                                            |
| `approvalId`      | uuid, null  | Null **only** for `argus-open-role`                                                        |
| `target`          | text        | Recipient, shown as a label, never with sensitive data                                     |
| `pilotRedirected` | boolean     | True when the pilot lock sent it to Karissa instead                                        |
| `payloadHash`     | text        | Must equal the approval's `contentHash`                                                    |
| `status`          | enum        | `sent` \| `failed`                                                                         |
| `error`           | text, null  | Redacted                                                                                   |
| `at`              | timestamptz |                                                                                            |

### Schedule proposal (P1, step C5)

One proposed slot: a 1:1, the goals conversation, NHO or the welcome lunch.

| Field                | Type        | Notes                                                                      |
| -------------------- | ----------- | -------------------------------------------------------------------------- |
| `id`                 | uuid (PK)   |                                                                            |
| `onboardingId`       | uuid (FK)   |                                                                            |
| `kind`               | enum        | `goals` \| `one-on-one` \| `mancom-one-on-one` \| `nho` \| `welcome-lunch` |
| `withContactKey`     | text        | From the 1:1 contact list                                                  |
| `startsAt`, `endsAt` | timestamptz |                                                                            |
| `status`             | enum        | `proposed` \| `manager-approved` \| `invited` \| `declined`                |

Only busy blocks are ever read from calendars; no event details are stored.

### Holiday (P1)

| Field                        | Type                    | Notes                                   |
| ---------------------------- | ----------------------- | --------------------------------------- |
| `date`                       | date (PK)               |                                         |
| `name`                       | text                    |                                         |
| `sourceUrl`                  | text                    | Official Gazette or PCO page            |
| `status`                     | enum                    | `proposed` \| `confirmed` \| `rejected` |
| `proposedAt`                 | timestamptz             |                                         |
| `confirmedBy`, `confirmedAt` | user, timestamptz, null | Only Karissa confirms                   |

### Away (P1)

Who is on leave, so no reminder or invite goes to them.

| Field        | Type      | Notes                         |
| ------------ | --------- | ----------------------------- |
| `id`         | uuid (PK) |                               |
| `personKey`  | text      | Contact-list key or Talent id |
| `from`, `to` | date      |                               |
| `enteredBy`  | user      |                               |

No reason is stored.

### Scheduled run (P1)

| Field          | Type        | Notes                                              |
| -------------- | ----------- | -------------------------------------------------- |
| `id`           | uuid (PK)   |                                                    |
| `kind`         | enum        | `tracking` \| `holiday-check` \| `manpower-report` |
| `scheduledFor` | date        |                                                    |
| `outcome`      | enum        | `ran` \| `skipped-holiday` \| `failed`             |
| `ranAt`        | timestamptz |                                                    |

### Playbook entry (P1)

The checklists, templates and contact list Chiron works from, versioned so Karissa can change
them without a code change and every change can be undone (§6, call 3).

| Field       | Type        | Notes                                                                |
| ----------- | ----------- | -------------------------------------------------------------------- |
| `id`        | uuid (PK)   |                                                                      |
| `kind`      | enum        | `checklist` \| `template` \| `clearance-checklist` \| `contact-list` |
| `key`       | text        | e.g. `checklist-by-type`, `welcome-email-employee`                   |
| `version`   | int         |                                                                      |
| `content`   | jsonb       |                                                                      |
| `active`    | boolean     | One active version per `(kind, key)`                                 |
| `changedBy` | user        |                                                                      |
| `reason`    | text        | e.g. "Learning loop: added Day 1 tour line"                          |
| `createdAt` | timestamptz |                                                                      |

Chiron may **propose** a new version (learning loop); only Karissa's approval activates it.
Chiron can never change the `contact-list`.

### Offboarding (P2)

| Field                        | Type                    | Notes                                              |
| ---------------------------- | ----------------------- | -------------------------------------------------- |
| `id`                         | uuid (PK)               |                                                    |
| `talentId`                   | uuid (FK)               |                                                    |
| `lastDay`                    | date                    | From Margie                                        |
| `confirmedByMargieAt`        | timestamptz             | Required. Nothing starts without it                |
| `confirmationSource`         | enum                    | `chat` \| `tracker` \| `email` (PRD open question) |
| `argusNotifiedAt`            | timestamptz, null       | Step O2                                            |
| `status`                     | enum                    | `open` \| `complete`                               |
| `completedAt`, `completedBy` | timestamptz, user, null | Gate G11, Karissa only                             |

**No reason-for-leaving field**, and no exit interview answers.

### Open-role notice (P2, P3)

Every open role Chiron has told Argus about: after a resignation (O2) or from the monthly check
(MP3). It carries the four fields the PRD allows and nothing else.

| Field                   | Type      | Notes                                        |
| ----------------------- | --------- | -------------------------------------------- |
| `id`                    | uuid (PK) |                                              |
| `positionKey`           | text      | The position's id in the Manpower Masterlist |
| `role`, `team`, `level` | text      |                                              |
| `opensOn`               | date      | Last day, or the date the position opens     |
| `source`                | enum      | `resignation` \| `monthly-check`             |
| `sendLogId`             | uuid (FK) |                                              |

Unique on `(positionKey, opensOn)`: the same opening is never sent twice (MP-1).

### Manpower report (P3)

| Field     | Type      | Notes                                          |
| --------- | --------- | ---------------------------------------------- |
| `month`   | date (PK) | First day of the month                         |
| `summary` | jsonb     | Status only: counts and position keys per team |
| `draftId` | uuid (FK) | The Slack summary for Karissa and Mikki        |

The **Manpower Masterlist itself is not stored here.** It lives with its owner (still TBD);
Chiron reads the allowed columns and writes two statuses (resigning, separated), each logged.

---

## 2. Relationships

```
Talent 1 ──< Onboarding 1 ──< Step >── Draft ──< Approval
   │              └──< Schedule proposal       └── Send log
   └──< Offboarding 1 ──< Step (clearance)
                    └── Open-role notice ── Send log
Holiday, Away, Scheduled run, Playbook entry, Manpower report: stand alone
Sign-in users (chiron_auth) ── Approval, Holiday.confirmedBy, Playbook entry.changedBy
```

---

## 3. Invariants (each enforced in code and covered by a test)

1. **Nothing sensitive is stored.** There are no columns for government IDs, bank details, pay,
   health information, form answers, BI results or reasons for leaving. Every free-text field
   (`note`, `subject`, `body`, names) passes a detector on write; a match **rejects the write**
   rather than storing a redacted copy. Logs redact the same patterns. (Guardrail 3, GUARD-1)
2. **No send without approval.** A send-log row of any kind except `argus-open-role` must point
   at an `approved` approval whose `contentHash` equals the row's `payloadHash`. Editing a draft
   after approval changes the hash, so the old approval no longer counts. The send tools check
   this first and fail without it. (Guardrail 1, GUARD-2)
3. **Only Karissa or Mikki approve.** `approverRole` is set from an allowlist of sign-in
   accounts, never from what the request says.
4. **Pilot lock.** While pilot mode is on, every email, invite and Slack message goes to Karissa,
   with `pilotRedirected = true`. Pilot mode turns off only with a recorded confirmation from
   both Karissa and Rase. (Guardrail 2, GUARD-3)
5. **Argus gets four fields.** An open-role notice has only role, team, level and date; the
   A2A message is built from this row, so nothing else can travel with it. (O2, MP3)
6. **No guessed IDs or addresses.** `employeeId` and `companyEmail` can be set only together with
   who gave them. (Guardrail 6, ON-5)
7. **Offboarding needs Margie.** An offboarding cannot exist without `confirmedByMargieAt`.
   (OFF-2)
8. **Separated comes last.** The masterlist "separated" write is allowed only when the
   offboarding is `complete` (O5 after G11).
9. **Forms stay closed.** Form A and Form B are steps whose only facts are done or not done.
   (Guardrail 5)
10. **Nothing is hard-deleted** from the tracker, drafts, approvals or send log: statuses change
    instead. The one exception is clearing a Talent's personal email and mobile (§6, call 2).
11. **Only confirmed holidays count** in deadlines and run scheduling.
12. **Kind timing.** Reminders and invites are only sent on working days, within working hours,
    and never to anyone with an `Away` row covering that day. (Guardrail 11)

---

## 4. DDL sketch (key tables)

```sql
create schema if not exists chiron_app;
set search_path to chiron_app;

create type talent_type as enum ('employee', 'consultant', 'project-based', 'intern');
create type send_kind   as enum ('email', 'calendar-invite', 'slack-message',
                                 'argus-open-role', 'masterlist-write');

create table talent (
  id uuid primary key default gen_random_uuid(),
  last_name text not null, first_name text not null, middle_name text,
  nickname text, talent_type talent_type not null, level text,
  position text, group_name text, cost_center text, manager_name text,
  start_date date, last_day date,
  personal_email text, mobile text, contact_cleared_at timestamptz,
  company_email text, company_email_given_by text,
  employee_id text, employee_id_given_by text,
  source text not null, argus_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_email_has_source check (company_email is null or company_email_given_by = 'karissa'),
  constraint employee_id_has_source  check (employee_id  is null or employee_id_given_by in ('karissa', 'margie'))
);

create table approval (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid, subject_ref text,
  approver_user_id text not null,
  approver_role text not null check (approver_role in ('karissa', 'mikki')),
  decision text not null check (decision in ('approved', 'rejected')),
  content_hash text not null,
  decided_at timestamptz not null default now()
);

create table send_log (
  id uuid primary key default gen_random_uuid(),
  kind send_kind not null,
  draft_id uuid, approval_id uuid references approval(id),
  target text not null, pilot_redirected boolean not null,
  payload_hash text not null,
  status text not null check (status in ('sent', 'failed')), error text,
  at timestamptz not null default now(),
  constraint approval_required check (kind = 'argus-open-role' or approval_id is not null)
);

create table open_role_notice (
  id uuid primary key default gen_random_uuid(),
  position_key text not null, role text not null, team text not null, level text,
  opens_on date not null,
  source text not null check (source in ('resignation', 'monthly-check')),
  send_log_id uuid not null references send_log(id),
  unique (position_key, opens_on)
);
```

The database role the agents app uses gets no `DELETE` on these tables (invariant 10). The hash
match in invariant 2 is checked in the send tool, because it compares against the approval row.

---

## 5. Validation

Every boundary validates with zod. The handoff shape the PoC uses (`hireDetailsSchema` in
`packages/shared/src/onboarding.ts`) becomes the Talent input; tools take and return the shapes
above. The Drizzle schema lives in `packages/shared/src/db/` so both apps share it.

---

## 6. Decisions (approved 2026-11-11: all five as recommended)

| #   | Decision                                                                                                               | Chosen        | What it costs                                                                                                          | Revisit if…                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | **Tracker lives in Chiron's database**, replacing the Google Sheet (PRD open question)                                 | Database      | You leave the Sheet behind; others who read it today need the Chiron screen, or a read-only export                     | other people edit the Sheet and you don't want to move them                                  |
| 2   | **Personal email and mobile are cleared when onboarding completes**                                                    | Clear them    | If a late reminder needs to reach the Talent's personal email, Chiron no longer has it; their 917V email works by then | you want Chiron to keep contacting them through personal email after onboarding              |
| 3   | **Playbook (checklists, templates, contact list) is stored in the database, versioned**, seeded from files in the code | Database      | A little more to build: a screen to see and approve changes                                                            | you're happy for every checklist or template change to go through an engineer and a redeploy |
| 4   | **An approval covers one exact version of a draft**; editing it afterwards needs a new approval                        | Exact version | One extra click when you tweak a draft you already approved                                                            | you want approval to cover "this draft, give or take small edits"                            |
| 5   | **Approvers are a fixed list of accounts** (you and Mikki), set in configuration                                       | Fixed list    | Adding a third approver needs a config change                                                                          | approvers will change often                                                                  |

## 6a. Build notes (2026-11-11)

What the first build added or adjusted, all within the approved model:

- **Talent:** name fields and `talentType` are nullable, because a handoff with missing details
  is still saved (ON-3); `source` also allows `test-hire`.
- **Onboarding:** `prepNotes` (jsonb) keeps what Chiron flagged at preparation: missing details,
  flags and what to verify. Status text only, checked like every text field.
- **Step:** `label`, `detail` and `sortOrder` so the tracker shows the checklist as prepared.
- **Draft:** `title` and `editedByKarissa`; `blanks` is recomputed from `[…]` markers on every
  edit.
- **Send log:** `via` (`chiron` | `manual`), because until Gmail is connected Karissa sends
  approved drafts herself and marks them sent; the same send gate runs either way.
- **Rule added (D-019):** nothing is approved or sent while a `[blank]` remains.

## 7. Still open (from the PRD, affects this model)

- How Margie's confirmation reaches Chiron (chat, tracker or email): `confirmationSource`.
- Clearance steps, owners and deadlines per type: the `clearance-checklist` playbook entry.
- Masterlist owner, location and readable columns; what counts as a position: `positionKey`.
- Whether approvals happen in the web app, Slack or both: how `Approval` rows get created.
- Welcome Poster, TOW items per type, and C3 for project-based hires and interns: checklist content.
