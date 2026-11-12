# AGENT_SPEC: Chiron

**Last updated:** 2026-11-11 · Sources: [PRD.md](PRD.md), [DATA_MODEL.md](DATA_MODEL.md)
(approved 2026-11-11), and the PoC Karissa approved on 2026-11-10.

> **Status: approved by Karissa on 2026-11-11**, with all five calls in §5 accepted. Format:
> purpose → abilities → functions. Abilities are what you'd ask Chiron to do; functions are what
> gets built and tested.

---

## 0. At a glance

- **One agent, `chiron`**, running three workflows (onboarding, offboarding, manpower) over
  shared tools. **Argus** is a separate agent owned by Mikki; the two talk over A2A.
- **The floor:** with only the model and Chiron's own database, Chiron still prepares every
  checklist, draft, reminder and schedule proposal on screen. You send them yourself. Each
  connector (Gmail, Calendar, Slack, the Masterlist, Argus) adds reach, never judgement.
- **Rules are code, not prompt.** Checklist choice, deadlines, the pilot lock, approvals, the
  sensitive-data screen and the four fields Argus may receive are all enforced by tools and the
  database. The model reads requests, calls tools, and writes short summaries.

### Build status (2026-11-11)

Built and tested: F1 (test handoff), F2–F7, F8 (tracker), F11 (approvals), F12 (pilot lock in
drafts and the send gate), F13's gate and floor (Karissa sends, then Mark as sent), F16's rule
(not yet wired to a send), F35, F36, F37. Interfaces only (`tools/planned.ts`, not given to the
model): F9, F13's Gmail step, F19, F21, F24, F28. Everything else: not started.

---

## 1. Universal rules (every workflow, every turn)

1. **Never guess.** A missing detail is reported and asked for, never inferred. Employee IDs come
   only from Karissa or Margie; 917V addresses only from Karissa's confirmation.
2. **Nothing leaves without an approval** of that exact version, from Karissa or Mikki. The only
   exceptions are the open-role notices to Argus (O2, MP3), which carry four fields and are
   logged.
3. **Pilot lock.** While the pilot is on, every email, invite and Slack message goes to
   karissa.ravena@917ventures.com, with the real recipient in brackets.
4. **Nothing sensitive is stored, logged or sent to the model.** No government IDs, bank details,
   pay, health information, form answers, BI results or reasons for leaving (DATA_MODEL
   invariant 1).
5. **Chiron acts as itself.** Every connector runs as chiron@917ventures.com. Never on behalf of
   whoever is signed in, never through Karissa's or Rase's accounts.
6. **The model never holds a raw connector.** It sees only Chiron's own tools (§3, F37). A Gmail
   "send" or a Slack "post" is reachable only through a tool that checks the approval first.
7. **Every turn ends with a typed outcome:** _What I drafted · What Karissa must verify · What I
   left blank · What's still open_. Every scheduled run records `ran`, `skipped-holiday` or
   `failed`.
8. **All-or-nothing work.** Preparing a hire, a clearance or a monthly report is one database
   transaction: either the whole set of steps and drafts is saved, or none is.
9. **Budget envelope.** At most 6 tool steps per turn; one model call drafts a summary, never a
   loop of retries. Draft text comes from templates, not from the model.
10. **No judging people.** Chiron tracks tasks. It never rates or compares Talent and never
    records why someone leaves.

---

## 2. Agent · Chiron: People Ops preparer

**Purpose:** Prepare every onboarding, offboarding and monthly manpower step for Karissa to
approve, so no step is missed and no position stays open unnoticed.

### Abilities

| Ability (what you'd ask for)                     | Built from                                  | Phase |
| ------------------------------------------------ | ------------------------------------------- | ----- |
| **Getting a new hire ready**                     | F1 + F2 + F3 + F4 + F5 + F6 + F7 + F8 + F10 | 1     |
| **Keeping onboarding on schedule**               | F8 + F9 + F10 + F16 + F21 + F22 + F23       | 1     |
| **Planning a new hire's first three weeks**      | F14 + F18 + F19 + F20                       | 1     |
| **Sending only what I approved**                 | F11 + F12 + F13 + F14 + F15 + F16 + F17     | 1     |
| **Knowing which days count**                     | F10 + F23 + F24 + F25                       | 1     |
| **Keeping private things private**               | F35 + F36 + F37                             | 1     |
| **Getting better after every run**               | F38 + F39                                   | 1     |
| **Seeing a resignation through to the last day** | F26 + F27 + F28 + F29 + F30                 | 2     |
| **Telling Argus which roles to fill**            | F28 + F33                                   | 2–3   |
| **Spotting open positions every month**          | F31 + F32 + F33 + F34                       | 3     |

### Functions

Tags: **[built]** in code today · **[upgrade]** exists, goes deeper · **[new]** not built yet ·
**[connector]** an optional module, connected through an AgentBase subscription and run as
chiron@917ventures.com · **[policy]** possible, deliberately excluded.

#### Intake and preparation (onboarding C1–C2)

- **F1 · Receive a hire handoff** [built → upgrade]: Argus sends the confirmed hire over A2A as
  the structured fields in `hireDetailsSchema` (name parts, nickname, personal email, mobile,
  start date, position, group, cost center, manager, talent type, level). Today the screen's test
  hires stand in for Argus. _Ladder:_ Karissa enters the hire on Chiron's screen.
- **F2 · Check required details** [built]: pure code (`missingDetails`). Lists every missing
  field, including level for Employees and Consultants.
- **F3 · Draft a note to Mikki for missing details** [built]: lists them; other drafts continue
  with visible blanks (ON-3).
- **F4 · Pick the checklist by type and level** [built → upgrade]: today from
  `checklist-by-type.ts`; next from the versioned playbook entry `checklist-by-type` (DATA_MODEL,
  decision D-007). Marks each step Pending, N/A or To confirm; adds ManCom 1:1s for level High.
- **F5 · Flag start-date issues** [built → upgrade]: project-based start not on a Tue/Wed/Fri
  (built); start on a confirmed holiday (needs F25). Flags only, never changes the date (ON-4).
- **F6 · Render drafts from templates** [built → upgrade]: fills a template's placeholders from
  the hire's details; anything unknown becomes a visible `[blank]`; signs as "Chiron, on behalf
  of the 917V People Team". Today's wording is sample text in code; next it comes from Karissa's
  templates in the playbook. Covers the BI request, both welcome emails, the IT request, C3
  activation reminder, and the C4 HMO, Workday, TOW and kit, ID and Welcome Poster requests.
- **F7 · Propose the 917V address to request** [built]: `firstname.lastname`, or
  `zfirstname.lastname` for project-based hires and interns. A request only; the real address is
  recorded only from Karissa's confirmation.
- **F8 · Save the hire to the tracker** [new]: Talent, Onboarding and one Step per checklist
  item, in Postgres (`chiron_app` schema, Drizzle), in one transaction, with every text field
  checked by F35. _Ladder:_ none needed; the database is part of the project.

#### Keeping onboarding moving (C3, C4, C6)

- **F9 · Record what people report** [new]: yes/no facts only: "BI processed" (from Mikki),
  "IT confirmed the account", "Talent activated their email", "Form A submitted", "Form B
  submitted", "Employee ID is …" (from Karissa or Margie). Each moves a step and can unlock the
  next drafts (C3 after IT confirms; C4 after Form A).
- **F10 · Work out deadlines in working days** [built → upgrade]: Mon–Fri today; minus confirmed
  holidays next. Deadlines from the PRD table (e.g. first requests 1 working day after the hire
  is confirmed; C4 requests 2 working days after Form A).
- **F21 · Monday and Thursday tracking run** [new]: a scheduler calls Chiron over A2A on Monday
  and Thursday mornings (Asia/Manila). It finds steps that are overdue or due within 3 working
  days and drafts kind reminders for approval. Which scheduler is open (§6). _Ladder:_ a "Run
  tracking now" button on the screen.
- **F22 · Monday update draft** [new]: a status-only Slack update for Karissa and Mikki, from the
  tracker. Waits for approval like any send.
- **F23 · Holiday-day reply** [new]: if a run falls on a confirmed holiday, Chiron replies only
  "Today is a holiday. I'll run the full check on the next working day." and runs then.

#### Planning the first three weeks (C5)

- **F18 · Read free/busy** [new][connector]: Google Calendar's free/busy query, which returns
  busy blocks and nothing else. Never lists events or reads their details (GUARD-4). _Ladder:_
  Chiron proposes slots without checking calendars and marks each one "calendar not checked".
- **F19 · Propose the schedule** [new]: code, not the model, places the slots: goals conversation
  in week 1; 30-minute 1:1s within 3 weeks, at most two a day, nothing before 10:00 AM on Day 1;
  NHO with Margie Day 1, 9:00–10:00 AM; welcome lunch for Employees; ManCom 1:1s for level High.
  People come from the 1:1 contact list, which Chiron reads but never edits.
- **F20 · Hiring manager's approval** [new]: the proposal goes to the hiring manager as an
  approved email; Karissa records their answer; on changes, Chiron re-proposes (F19). Invites
  wait for both the manager and Karissa (G8).
- **F14 · Send approved invites** [new][connector]: Google Calendar invites, created only after
  G8, through F37's gate. _Ladder:_ times shown on screen; Karissa sends the invites herself.

#### Sending only what was approved (G5–G11)

- **F11 · Record an approval** [new]: the Approve button in Chiron's web app writes an Approval
  row with the signed-in person's account, checked against the approver allowlist (D-009), and a
  hash of the exact recipient, subject and body (D-008).
- **F12 · Pilot lock** [built → upgrade]: today every draft is addressed to Karissa. Next, the
  send tools enforce it too, and pilot mode turns off only after both Karissa and Rase confirm.
- **F13 · Send an approved email** [new][connector]: Gmail as chiron@917ventures.com. The model
  calls `send_approved_draft(draftId)` with an id only, so it cannot change the content. The tool
  re-checks the approval hash, the pilot lock and kind timing (F16), sends, and writes the send
  log. Without a valid approval it fails (GUARD-2). _Ladder:_ the draft stays on screen; Karissa
  copies and sends it herself and marks the step sent.
- **F15 · Post an approved Slack update** [new][connector]: to the Karissa + Mikki group DM
  only, through the same gate. _Ladder:_ the update is shown on screen.
- **F16 · Kind timing** [new]: no send outside working hours, on a confirmed holiday, or to
  anyone with an Away entry for that day. An approved send that falls outside the window waits
  for the next one (§5, call 5).
- **F17 · Send log** [new]: one row per outbound action, sent or failed, with errors redacted.

#### Knowing which days count

- **F24 · Propose holidays** [new][connector]: on the first working day of each month and in
  every Monday run, fetches the Official Gazette and PCO holiday pages and proposes dates with
  their source links. Only Karissa confirms. _Ladder:_ Karissa enters holidays herself.
- **F25 · Check dates against holidays** [new]: start dates, deadlines and run days use confirmed
  holidays only.

#### Keeping private things private

- **F35 · Sensitive-data detector** [new]: pattern checks for Philippine government IDs (TIN,
  SSS, PhilHealth, Pag-IBIG, UMID, passport), bank and card numbers (with a Luhn check), pay
  amounts next to pay words, and health and BI terms. A match **rejects** a database write and is
  redacted from logs. Honest limit: patterns catch numbers and keywords, not every way a person
  could describe something sensitive in prose. It is tested against a fixed list of samples.
- **F36 · Sensitive-input screen** [new]: runs F35 on every incoming message _before_ the model
  sees it. On a match, the message never reaches the model, memory or logs, and Chiron replies
  with a fixed message asking Karissa to delete that chat (GUARD-1).
- **F37 · Gated connector access** [new]: connectors are reached only from inside Chiron's own
  tools, by addressing one subscribed server directly, as chiron@917ventures.com. The model is
  never given the connector's raw tools. **This replaces a Precast default:** out of the box,
  every subscribed connector tool goes to the model and acts on behalf of whoever is signed in,
  which would bypass rules 2, 5 and 6.

#### Getting better after every run

- **F38 · Review a finished run** [new]: after an onboarding or offboarding is marked complete,
  Chiron lists the steps that ran late, the edits Karissa made to its drafts (differences between
  versions), and any gaps. From these it proposes one change to a checklist or template.
- **F39 · Apply an approved playbook change** [new]: Karissa's approval activates a new playbook
  version, logged and reversible. Chiron can never change the 1:1 contact list.

#### Offboarding (Phase 2)

- **F26 · Start only on Margie's confirmation** [new]: an offboarding cannot exist without
  Margie's confirmation of the resignation and last day (OFF-2). How it arrives is open (§6).
- **F27 · Mark the Talent in the Manpower Masterlist** [new][connector]: "resigning" at O1;
  "separated" at O5, and only after Karissa signs offboarding off (G11). Both writes need
  approval. _Ladder:_ Chiron drafts the change for Karissa to make herself.
- **F28 · Tell Argus about an open role** [new][connector]: over A2A, with role, team, level and
  date only, built from the open-role notice row so nothing else can travel with it. No gate,
  always logged, never sent twice for the same position and date (MP-1). _Ladder:_ Chiron
  drafts the notice for Karissa to forward.
- **F29 · Draft clearance requests, reminders and the exit interview invite** [new]: from the
  clearance checklist playbook entry for the Talent's type; sensitive fields blank; no reason for
  leaving anywhere (OFF-3).
- **F30 · Track clearance to the last day** [new]: part of F21's runs; kind reminders for
  anything overdue (OFF-4).

#### Monthly manpower (Phase 3)

- **F31 · Read the Masterlist's allowed columns** [new][connector]: position, team, talent type,
  level, status, Talent name, start date and last day. The column allowlist is enforced inside
  the tool, so pay, IDs and personal details never come back. _Ladder:_ Karissa pastes position
  statuses.
- **F32 · Find gaps and mismatches** [new]: by team: open now, opening within 30 days, joining
  within 30 days. Cross-checks against Chiron's trackers and flags mismatches, such as a confirmed
  hire missing from the Masterlist.
- **F33 · Send unfilled roles to Argus** [new]: F28 for every gap Argus doesn't already have.
- **F34 · Monthly report** [new]: a status-only summary for Karissa and Mikki on the first
  working day of the month, sent after approval.

#### Deliberately excluded

- **F40 · Workday access** [policy]: none, by PRD scope.
- **F41 · Opening Form A/B answers, BI results, pay, IDs, bank or health details** [policy]:
  Chiron tracks only "submitted" and "processed" as yes or no.
- **F42 · Creating accounts or handling credentials** [policy]: IT creates accounts and sends
  logins directly to the new hire; Chiron never sends, asks for or repeats a password.
- **F43 · Reading anyone's email or Slack, or seeing calendar event details** [policy]: send-only
  Gmail and Slack; free/busy-only Calendar.
- **F44 · Judging people** [policy]: no ratings, comparisons or reasons for leaving.

**Guardrails specific to Chiron** (beyond §1): project-based Talent never receive the Code of
Conduct, 917V Code, Form A/B or other employee-only items; drafts refer to Talent by name,
nickname or "they"; nothing about a resignation reaches the Talent's manager or team before
Margie confirms it.

---

## 3. Seams: what crosses Chiron's boundary

| Direction | With                                   | What crosses                                                              | Check                                            |
| --------- | -------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| In        | Argus (A2A)                            | A confirmed hire, as `hireDetailsSchema` fields                           | zod; F35/F36 screen                              |
| In        | Chiron web app (A2A via `callAgent()`) | Karissa's and Mikki's requests, approvals already recorded by the web app | sign-in; approver allowlist                      |
| In        | Scheduler (A2A)                        | "Run tracking", "Holiday check", "Manpower report"                        | token; run log                                   |
| Out       | Argus (A2A)                            | Open role: role, team, level, date                                        | built from the notice row only                   |
| Out       | Gmail, Calendar, Slack (connectors)    | Approved drafts and invites                                               | F37 gate: approval hash, pilot lock, kind timing |
| Out       | Manpower Masterlist (connector)        | Two statuses: resigning, separated                                        | approval; column allowlist                       |

A new function that changes this table is an architecture change and comes back for review. A new
function that stays inside it is a capability addition.

---

## 4. What runs, and what it needs

| Module                                                | Status        | Needed for                         | Without it                                      |
| ----------------------------------------------------- | ------------- | ---------------------------------- | ----------------------------------------------- |
| Model (AgentBase gateway, `gemini-35-flash-dd840ef8`) | Connected     | Reading requests, summaries        | Nothing runs                                    |
| Database (`chiron_app`)                               | Provisioned   | Tracker, approvals, playbook, logs | Required, always present                        |
| Gmail as chiron@917ventures.com                       | Not connected | F13                                | Karissa sends drafts herself                    |
| Google Calendar as chiron@917ventures.com             | Not connected | F14, F18                           | Times proposed unchecked; Karissa sends invites |
| Slack (Karissa + Mikki group DM)                      | Not connected | F15, F22, F34                      | Updates shown on screen                         |
| Argus (A2A)                                           | Not connected | F1, F28, F33                       | Karissa enters hires and forwards notices       |
| Manpower Masterlist                                   | Location TBD  | F27, F31                           | Karissa makes the change / pastes statuses      |
| Official Gazette and PCO pages                        | Not connected | F24                                | Karissa enters holidays                         |
| Scheduler                                             | TBD (§6)      | F21, F24, F34                      | "Run now" buttons                               |

---

## 5. Decisions (approved 2026-11-11: all five as recommended)

| #   | Decision                                  | Chosen                                                                              | What it costs                                                                                                                                                  | Revisit if…                                              |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | **Where you approve** (PRD open question) | In Chiron's web app first; Slack approvals later                                    | You open Chiron to approve, instead of tapping in Slack                                                                                                        | most of your approving happens on your phone in Slack    |
| 2   | **Whose accounts the connectors use**     | Chiron's own chiron@917ventures.com, never the signed-in person's                   | Someone must connect that account's Gmail, Calendar and Slack in AgentBase; a send Mikki approves still goes out as Chiron (as the PRD's signature rule wants) | you'd rather drafts land in your own Gmail drafts folder |
| 3   | **Chat memory**                           | None: Chiron remembers through the tracker, not chat history                        | It won't recall what you said in an earlier chat; you name the Talent each time                                                                                | you often continue a conversation across days            |
| 4   | **Argus's handoff format**                | The structured field list (the PRD's required details), not free text               | Mikki's Argus must send it that way; a prose handoff gets a note back asking for the fields                                                                    | Argus can only send free text                            |
| 5   | **Approved send outside working hours**   | It waits for the next working window (working hours assumed 9:00 AM–6:00 PM Manila) | An approved email at 7 PM goes out the next morning; you can always send it yourself                                                                           | you want approval to mean "send now", whatever the time  |

## 6. Still open (from the PRD)

- How Margie's confirmation of a resignation reaches Chiron (chat, tracker or email).
- Clearance steps, deadlines, and whether every type needs the manager's turnover approval.
- Whether Chiron drafts only the exit interview invite, or the questions too.
- Welcome Poster: what it is, who gets it, which types; TOW items per type; C3 for project-based
  hires and interns; deadlines for C3 and the manager's schedule approval.
- Masterlist owner, location and readable columns; what counts as a position; earlier manpower
  steps before MP3.
- Which scheduler triggers the Monday/Thursday and monthly runs once Chiron is hosted on
  AgentBase.
- Whether the AgentBase rebuild restarts the pilot with test hires or continues the current one.
