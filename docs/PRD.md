# Chiron on AgentBase — PRD

Nov 10, 2026 · @Karissa

## Summary

Chiron is 917V's People Ops agent. It prepares every onboarding, offboarding and monthly manpower step for Karissa to approve, so no step is missed and no position stays open unnoticed. Today Chiron runs as a Claude Project with instructions and template files. This rebuild moves it onto AgentBase as a hosted agent, built from the Precast scaffold, so its rules are enforced in code and it can hand off to Argus, the hiring agent.

The rebuild covers one Talent lifecycle in three phases:

1. **Onboarding** (Phase 1): from Argus's handoff of a confirmed hire to the end of their first 3 weeks.
2. **Offboarding** (Phase 2): once Margie confirms a resignation, Chiron tells Argus the role to fill and prepares clearance through to the last day.
3. **Monthly manpower tracking** (Phase 3): Chiron checks the Manpower Masterlist each month and sends unfilled positions back to Argus.

Argus hires, Chiron onboards, Chiron offboards, and manpower tracking feeds open positions back to Argus. The whole loop uses "Talent" for new hires and employees.

Phase 1 details come from Chiron instructions v1.4 (Oct 29, 2026), "Checklist by type", the request templates, the two welcome emails and the "1:1 contact list". Phases 1 and 2 follow the steps in the unified People Ops flowchart (Argus v3 → Chiron → Themis). Phase 3 is less defined; open points are listed at the end.

## Problem and goals

Onboarding a single Talent takes up to 7 vendor and team requests across BI, IT, HMO, payroll, tools, IDs and calendars, each with its own timing and recipient rules by talent type. Karissa spends that time chasing paperwork instead of welcoming people. Offboarding and headcount have no tracked workflow yet, so an open position can go unnoticed until someone asks.

Goals:

- Every listed step for a Talent's type is drafted on time, and no step outside that list is added.
- Nothing reaches a Talent, colleague or vendor without Karissa's (or Mikki's) approval.
- Every confirmed resignation reaches Argus the same working day, and clearance is complete by the last day.
- Every month, every open or soon-to-open position is visible to Karissa and Argus.

Success measures (targets to confirm with Karissa):

| Measure                                                                 | Target          |
| ----------------------------------------------------------------------- | --------------- |
| Onboarding drafts produced within their deadline                        | 100%            |
| Steps missed or added against "Checklist by type"                       | 0               |
| Drafts sent without approval                                            | 0               |
| Sensitive fields filled by Chiron                                       | 0               |
| Resignations handed to Argus within 1 working day                       | 100%            |
| Monthly manpower report delivered by the first working day of the month | 12 of 12 months |

## Users and approvers

Karissa owns Chiron and approves everything it drafts; Mikki approves when Karissa is unavailable.

| Who                   | Role with Chiron                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Karissa               | Owner and primary user. Starts each flow, confirms the checklist, approves every send.                                                     |
| Mikki                 | Head of Recruitment and Argus's owner. Backup approver for Chiron. Owns start dates, position, group and cost center. Receives BI results. |
| Margie                | Confirms resignations and last days. Provides Employee IDs with Karissa. Runs NHO.                                                         |
| Rase                  | Confirms with Karissa when the pilot is complete.                                                                                          |
| Argus                 | Hiring agent on AgentBase, owned by Mikki. Receives open roles from Chiron (O2 and MP3).                                                   |
| Vendors and teams     | ABSI, IT (Globe ISDP), iCare, Jescha, Jam and Jerlyn, Sweet Dynamics. Receive drafts only after approval.                                  |
| Hiring manager and IS | Approves the 1:1, NHO and lunch schedule, and the Talent's clearance (turnover of work).                                                   |

Decisions that stay with humans. Chiron prepares options and asks; it never decides:

| Decision                                                        | Owner                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Whether any email, request, reminder, invite or handoff is sent | Karissa (Mikki if unavailable)                                            |
| Talent type, level, and extra items for an intern               | Karissa, with Mikki or the hiring manager                                 |
| 1:1 order, final times, extra 1:1s                              | Hiring manager approves the schedule; Karissa approves sending (G8)       |
| When onboarding or offboarding counts as complete               | Karissa                                                                   |
| Confirming a resignation and the last day                       | Margie                                                                    |
| Clearance approval (turnover of work)                           | Hiring manager                                                            |
| Start date, position, group, cost center                        | Mikki                                                                     |
| Action after a BI concern                                       | Mikki                                                                     |
| Employee ID                                                     | Karissa or Margie                                                         |
| Account creation and credentials                                | IT                                                                        |
| Base pay and payroll details                                    | Outside Chiron's work                                                     |
| Whether a position is backfilled, frozen or removed             | Mikki, at Argus's requisition gate (inferred from the flowchart; confirm) |

## Scope

Phase 1 ships first and must match today's Chiron before Phases 2 and 3 start.

| Phase                | In scope                                                                                                                                                              | Gate to start                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1. Onboarding        | Every step in "Checklist by type" for Employee, Consultant, Project-based and Intern; tracker; Monday and Thursday tracking runs; Monday Slack update; holiday checks | Scaffold PoC reviewed by Karissa                                      |
| 2. Offboarding       | Margie-confirmed resignation, Argus notice (O2), clearance and exit interview drafts, tracking to the last day, masterlist status (O1, O5), learning loop             | Phase 1 pilot signed off by Karissa and Rase; clearance steps defined |
| 3. Manpower tracking | Monthly check of the Manpower Masterlist; open roles sent to Argus (MP3); report to Karissa and Mikki                                                                 | Masterlist access approved; open-position rules defined               |

Out of scope for all phases:

- Sending anything without approval, creating accounts, or delivering credentials.
- Opening Form A or Form B responses, BI results, pay, government IDs, bank or health details.
- Hiring itself, which belongs to Argus.
- Judging, rating or comparing Talent, including reasons for leaving.
- Workday access.

## Phase 1: Onboarding

Onboarding starts when Argus hands Chiron a confirmed hire, and runs through steps C1–C6 with Karissa's gates G4–G8 and a hiring manager gate on the schedule. Step IDs match the unified People Ops flowchart. Chiron drafts only the steps "Checklist by type" lists for the Talent's type and level; the checklist and templates are data files Karissa can update without a code change.

The flow:

1. **Trigger · Argus → Chiron handoff.** Once Mikki confirms the hire (role, start date, talent type), Argus sends the new hire's details to Chiron. During the pilot, Karissa can also enter a test hire herself.
2. **C1 · Encode and inform.** Chiron checks for every required detail, records the hire and asks Karissa and Mikki to confirm. For anything missing, it drafts a note to Mikki. It never guesses.
3. **G4 · Karissa confirms the checklist:** talent type, level and steps.
4. **C2 · Draft BI, welcome and email requests.** Chiron adds the Talent to the tracker with every step Pending or N/A.
5. **G5 · Karissa approves and sends.**
6. **Vendors act.** ABSI runs the BI and Globe ISDP creates the 917V email. Mikki receives the BI result. She tells Chiron only that BI is processed, never the result, either directly or by ticking "BI processed" in the tracker.
7. **C3 · Draft the email activation reminder.** Once IT confirms the account exists, Chiron drafts an email asking the Talent to activate their 917V email with the login IT sent them, and to confirm once done. It never contains a password or login. The step stays Pending until the Talent confirms activation.
8. **G6 · Karissa approves and sends** the activation reminder.
9. **Talent activates their email and submits Form A.** It is an online form; Chiron never sees it. Karissa tells Chiron "Form A submitted".
10. **C4 · Draft HMO, Workday, TOW, kit and ID requests, plus the Welcome Poster.** Sensitive fields stay blank.
11. **G7 · Karissa fills the blanks and sends** the requests and the Welcome Poster.
12. **Teams and vendors act.** IT, iCare, Jescha, Jerlyn and Jam, and Sweet Dynamics handle accounts, HMO, Workday, kit, TOW and ID.
13. **C5 · Propose 1:1s, NHO and the welcome lunch.** Chiron uses free/busy only and sends the proposed schedule to the hiring manager.
14. **Hiring manager gate · approve the schedule.** If they ask for changes, Chiron re-proposes.
15. **G8 · Karissa approves and sends the invites,** after the hiring manager approves.
16. **C6 · Track on Mondays and Thursdays.** Chiron drafts reminders and the Monday update.
17. **Learning loop.** As in Phase 2: review the run, propose a fix, Karissa approves, Chiron updates its playbook.

What applies to each talent type. The flowchart shows the full Employee path; the shorter paths come from "Checklist by type":

| Step                                         | Employee                                                  | Consultant         | Project-based                               | Intern                                        | Flowchart step |
| -------------------------------------------- | --------------------------------------------------------- | ------------------ | ------------------------------------------- | --------------------------------------------- | -------------- |
| BI request to ABSI                           | Yes                                                       | Yes                | No                                          | No                                            | C2             |
| Welcome email                                | Employee version with form link                           | Same as Employee   | Project-based version, no Code of Conduct   | Employee version, employee-only lines removed | C2             |
| 917V email request to IT                     | firstname.lastname                                        | firstname.lastname | zfirstname.lastname                         | zfirstname.lastname                           | C2             |
| Email activation reminder                    | Yes                                                       | Yes                | To confirm                                  | To confirm                                    | C3             |
| Tools, TOW and Welcome Kit to Jam and Jerlyn | Laptop, SU and phone, Welcome Kit                         | Same as Employee   | MSI laptop and Jam's Day 1 tour, sent at C2 | Welcome Kit, sent at C2                       | C4             |
| HMO request to iCare                         | Yes                                                       | Yes                | No                                          | No                                            | C4             |
| Workday and payroll to Jescha                | FTE                                                       | CONSULTANT         | No                                          | No                                            | C4             |
| Company ID to Sweet Dynamics                 | Yes, once Employee ID given and photo and signature ready | Same as Employee   | No                                          | No                                            | C4             |
| Welcome Poster                               | Yes                                                       | Yes                | To confirm                                  | To confirm                                    | C4             |
| Goals conversation and team 1:1s             | Yes, plus ManCom if High                                  | Same as Employee   | No                                          | No                                            | C5             |
| NHO with Margie, Day 1 9:00–10:00 AM         | Yes                                                       | Yes                | No                                          | No                                            | C5             |
| Welcome lunch                                | Yes                                                       | No                 | No                                          | No                                            | C5             |
| Form B tracked                               | Yes                                                       | Yes                | No                                          | No                                            | C6             |

Rules that carry over from Chiron v1.4:

1. Required details: name split into last, first and middle, nickname, personal email, mobile, start date, position, group, cost center, manager or IS, talent type, and level for Employees and Consultants.
2. 1:1s are 30-minute slots within the first 3 weeks, at most two a day, nothing before 10:00 AM on Day 1, and the goals conversation in week 1.
3. Chiron flags, without changing, any project-based start date not on a Tuesday, Wednesday or Friday, and any start date on a holiday.
4. Every output ends with: What I drafted · What Karissa must verify · What I left blank · What's still open.
5. During the pilot every draft is addressed to karissa.ravena@917ventures.com, with the real recipient noted in brackets.

## Phase 2: Offboarding

Once Margie confirms a resignation and last day, Chiron logs it, tells Argus the role to fill right away, and prepares clearance through to the last day for Karissa to approve. Step IDs (O1–O5, G9–G11) match the unified People Ops flowchart (Argus v3 → Chiron → Themis).

The flow:

1. **Trigger.** The Talent files a resignation. Margie confirms the resignation and the last working day. Chiron starts only on Margie's confirmation.
2. **O1 · Log the resignation.** Chiron adds the Talent to the offboarding tracker and flags them as resigning in the Manpower Masterlist.
3. **O2 · Notify Argus.** Chiron sends Argus the role, team, level and last day. This always happens, with no approval gate. It carries those four fields only.
4. **O3 · Draft clearance, reminders and exit interview.** Chiron drafts each clearance request from the clearance checklist for the Talent's type, with sensitive fields left blank.
5. **G9 · Karissa approves and sends** the clearance requests.
6. **Hiring manager gate · approve the clearance.** The hiring manager approves the Talent's turnover of work.
7. **Human-led clearance.** IT closes accounts, iCare ends the HMO, Jescha handles final pay, Jerlyn and Jam collect the ID and TOW, and the People team runs the exit interview.
8. **G10 · Karissa approves and sends** the reminders and the exit interview.
9. **O4 · Track clearance to the last day.** In the Monday and Thursday runs, Chiron drafts kind reminders for anything overdue.
10. **G11 · Karissa marks offboarding complete.**
11. **O5 · Close the record.** Only after Karissa's sign-off, Chiron sets the Talent to separated in the Manpower Masterlist. This reverses the flowchart's order, which put O5 before G11.
12. **Learning loop.** After each run, Chiron reviews overdue steps, Karissa's edits and gaps, and proposes a fix to a checklist or template. Karissa approves it, and Chiron updates its playbook, logged and reversible. The same loop runs after onboarding.

Rules for offboarding:

- The clearance checklist and its templates are data files, like "Checklist by type", so Karissa can change them without a code change.
- Chiron never records the reason for leaving and never sees exit interview answers, final pay amounts or BI results.
- Chiron never contacts the Talent's manager or team about the resignation before Margie confirms it.
- The Argus notice (O2) is the only outbound action without a gate. It is logged like every other send.

Clearance steps from the flowchart. Who each applies to is inferred from what onboarding sets up, and the deadlines are still TBD:

| Clearance step      | Owner          | Applies to                               | Deadline             |
| ------------------- | -------------- | ---------------------------------------- | -------------------- |
| Turnover approved   | Hiring manager | All types (to confirm)                   | TBD, before last day |
| Accounts closed     | IT             | All types                                | TBD                  |
| HMO ended           | iCare          | Employee, Consultant                     | TBD                  |
| Final pay           | Jescha         | Employee, Consultant                     | TBD                  |
| ID and TOW returned | Jerlyn and Jam | ID: Employee, Consultant; TOW: all types | Last day             |
| Exit interview      | People team    | TBD                                      | TBD, before last day |

Project-based hires leave through their vendor, so their clearance likely covers only accounts and the MSI laptop. Karissa to confirm.

## Phase 3: Monthly manpower tracking

On the first working day of each month, Chiron checks the Manpower Masterlist for unfilled positions and sends each one Argus doesn't already have back to Argus (MP3). Resignations reach Argus straight away through O2; the monthly check catches every other gap. The flowchart shows only the MP3 handoff, so the earlier manpower steps below are a proposal to confirm.

The Manpower Masterlist is shared by both phases:

| Who writes  | What                                             | When                              |
| ----------- | ------------------------------------------------ | --------------------------------- |
| Chiron      | Flags the Talent as resigning                    | O1, on Margie's confirmation      |
| Chiron      | Sets the Talent to separated                     | O5, after Karissa signs off (G11) |
| Chiron      | Reads positions and statuses                     | Monthly check                     |
| Owner (TBD) | Everything else: positions, new hires, headcount | Outside Chiron                    |

Functional requirements:

1. **Read (proposed MP1).** Chiron reads only the columns it needs: position, team, talent type, level, status (filled, open, resigning, separated), Talent name, start date and last day. Pay, IDs and personal details are blocked at the tool level.
2. **Find gaps (proposed MP2).** Chiron lists, by team: positions open now, positions opening within 30 days (resigning, or contract ending), and Talent joining within 30 days. It cross-checks against its own trackers and flags mismatches, such as a confirmed hire missing from the masterlist.
3. **MP3 · Send open roles to Argus.** For each unfilled position with no Argus handoff yet, Chiron sends the role, team, level and the date it opens, the same fields as O2. It never sends the same position twice. Like O2, MP3 goes to Argus without an approval gate and is logged.
4. **Report.** Chiron drafts a status-only monthly summary for Karissa and Mikki (Slack group DM), sent after Karissa approves.
5. If the first working day is a holiday, the check moves to the next working day.

Still to define: the masterlist's owner and location, what counts as a position (approved headcount or filled roles), and whether contract end dates for consultants, project-based hires and interns are in it.

## Agents and tools

One agent, "chiron", runs three workflows (onboarding, offboarding, manpower) over shared tools; it talks to Argus over A2A. Every external tool is an optional module, so Chiron works with only a model and gets more capable as tools are connected.

| Tool module                                    | Chiron may                                                                                         | Chiron may never                                          | Without it                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------- |
| Model (AgentBase gateway)                      | Draft, check, summarize                                                                            | —                                                         | Required; nothing runs                 |
| Checklist, templates, contacts (project data)  | Read                                                                                               | Edit the 1:1 contact list                                 | Required; bundled with the agent       |
| Tracker (Postgres, replacing the Google Sheet) | Read and update status; add holidays Karissa confirms                                              | Delete rows; store sensitive data                         | Status kept in chat only               |
| Gmail (chiron@917ventures.com)                 | Create drafts; send after approval                                                                 | Read or delete email                                      | Drafts shown in chat; Karissa sends    |
| Google Calendar                                | Free/busy for others; create invites after approval                                                | See event details; delete events                          | Times proposed in chat                 |
| Slack                                          | Send to Karissa and Mikki after approval                                                           | Read Slack; message anyone else                           | Update shown in chat                   |
| Manpower Masterlist (Phases 2–3)               | Read allowed columns; set resigning (O1) and separated (O5)                                        | Read pay, IDs or personal details; change any other field | Karissa pastes position status         |
| Argus (A2A, Phases 2–3)                        | Receive new hire details (handoff). Send open roles: role, team, level, date (O2 and MP3, no gate) | Send personal details                                     | Handoff drafted for Karissa to forward |
| Official Gazette and PCO pages                 | Search holidays for Karissa to confirm                                                             | Add holidays to the tracker itself                        | Karissa supplies holidays              |
| Workday                                        | —                                                                                                  | Any access                                                | Not used                               |

Approval is built into the tools, not the prompt: every send, invite, Slack message, handoff and masterlist write goes through one approval step that records who approved it and when. A tool call without a recorded approval fails. The exceptions are the two open-role notices to Argus, O2 and MP3, which carry only role, team, level and date and are logged.

## Data rules and guardrails

These are hard requirements: each must be enforced in code and covered by a test, not left to the prompt.

1. **No send without approval.** Every outbound action needs a recorded approval from Karissa, or Mikki when Karissa is unavailable. The only exceptions are the open-role notices to Argus, O2 and MP3 (role, team, level, date).
2. **Pilot lock.** While pilot mode is on, every draft is addressed to karissa.ravena@917ventures.com only. Pilot mode turns off only when Karissa and Rase confirm.
3. **Sensitive data never stored.** The tracker, logs and database reject government IDs, bank details, pay, health information, form contents and BI results. Logs redact them.
4. **Sensitive input handling.** If such data appears in a chat, Chiron does not repeat or use it and asks Karissa to delete that chat.
5. **Forms stay closed.** Chiron tracks only "Form A submitted" and "Form B submitted" as yes or no.
6. **No guessed IDs or addresses.** Employee IDs come only from Karissa or Margie; 917V emails only from Karissa's confirmation.
7. **Own account only.** Tools run as chiron@917ventures.com. Chiron never uses Karissa's or Rase's email or Drive.
8. **Free/busy only.** Calendar reads return busy blocks, never event details.
9. **Project-based rule.** Project-based Talent never receive the Code of Conduct, 917V Code, Form A or B, or the other employee-only items.
10. **No judging people.** Chiron tracks tasks, never rates or compares Talent, and never records reasons for leaving.
11. **Kind timing.** No reminders or invites outside working hours, on holidays, or to anyone known to be on leave.
12. **Pronouns.** Drafts refer to Talent by name, nickname or "they".
13. **Signature.** Drafts for others sign as Chiron on behalf of the 917V People Team, never as Karissa.
14. **No credentials.** Chiron never creates accounts and never sends, asks for, stores or repeats passwords or logins. IT sends logins directly to the new hire, with a password reset on first login; the C3 activation reminder never contains them.

## Scheduling and deadlines

All deadlines count working days: Monday to Friday, minus public holidays and non-working days that apply in Metro Manila. Holidays live in a tracker table that only Karissa confirms; Chiron proposes them from the Official Gazette and PCO on the first working day of each month and in every Monday run.

Scheduled runs:

| Run               | When                                        | Output                                                             |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| Tracking run      | Monday and Thursday mornings                | Overdue and due-in-3-working-days items, with kind reminder drafts |
| Onboarding update | Monday run only                             | Slack group DM draft to Karissa and Mikki                          |
| Holiday check     | First working day of the month, and Mondays | Proposed holidays with source links                                |
| Manpower report   | First working day of the month              | Open and opening positions, Argus handoff drafts                   |

If a run falls on a holiday, Chiron replies only "Today is a holiday. I'll run the full check on the next working day." and runs then.

Onboarding deadlines (from instructions v1.4):

| Step                                                        | Deadline                           |
| ----------------------------------------------------------- | ---------------------------------- |
| BI request, welcome email, IT email request                 | 1 working day after hire confirmed |
| Form A submitted                                            | 7 days before start date           |
| HMO, Workday and payroll, tools and Welcome Kit, company ID | 2 working days after Form A        |
| 917V email created                                          | 2 working days before start date   |
| NHO invite sent, 1:1s scheduled                             | 3 working days before start date   |
| Goals conversation                                          | Within week 1                      |
| 1:1s, Welcome Kit, welcome lunch done                       | Within 3 weeks of start date       |
| Form B submitted                                            | Within 30 days of start date       |

Offboarding: Argus is notified as soon as Margie confirms the resignation (O2), and clearance is tracked to the last day (O4). Other clearance deadlines are TBD.

## PoC slice and acceptance tests

The first PoC is one screen: a mocked Argus handoff delivers a test hire's details, and Chiron returns the confirmed checklist and the first three drafts (BI, welcome email, IT request), each addressed to Karissa under the pilot lock. No Gmail, Calendar or Slack yet; drafts appear on screen.

Acceptance tests for the PoC and Phase 1:

| ID      | Given                                                  | Then                                                                                                     |
| ------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| SMOKE-1 | A test Employee, level Mid, all details given          | Checklist lists Employee steps; BI, welcome and IT drafts appear; all addressed to Karissa               |
| ON-1    | A test Project-based hire                              | No BI, no Code of Conduct, no form link; email uses zfirstname.lastname                                  |
| ON-2    | A test Intern                                          | Welcome email has no Employee ID, form link, guide or NHO; keeps intro and shirt-size questions          |
| ON-3    | Cost center missing                                    | Missing detail listed, note to Mikki drafted, other drafts continue                                      |
| ON-4    | Project-based start date on a Monday                   | Date unchanged and flagged under What's still open                                                       |
| ON-5    | No Employee ID given                                   | Workday and company ID drafts leave it blank; nothing generated                                          |
| GUARD-1 | A government ID or bank number pasted in chat          | Not repeated, not stored; Karissa asked to delete the chat                                               |
| GUARD-2 | A send attempted with no approval                      | Tool call fails                                                                                          |
| GUARD-3 | Pilot mode on, real vendor address in template         | Draft still addressed to Karissa, real recipient in brackets                                             |
| GUARD-4 | Calendar read for a contact                            | Only busy blocks returned                                                                                |
| OFF-1   | Margie confirms a test resignation                     | Talent flagged resigning in the masterlist; Argus gets role, team, level and last day only, with no gate |
| OFF-2   | A resignation reported but not yet confirmed by Margie | No offboarding step starts; nothing goes to Argus                                                        |
| OFF-3   | Clearance drafts for a test Employee                   | Sensitive fields blank; no reason for leaving recorded; nothing sent before G9                           |
| OFF-4   | A clearance step overdue before the last day           | Kind reminder drafted in the next Monday or Thursday run, for approval                                   |
| MP-1    | Monthly check finds a position already sent through O2 | Not sent to Argus again                                                                                  |

The rest of the Phase 3 tests are written once its open questions are answered.

## Scaffold setup answers

The Precast scaffold asks eight questions; these are the proposed answers, each still to be confirmed in Claude Code.

| #   | Question              | Proposed answer                                                                                                                                 | Basis                           |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | Project name          | `chiron`                                                                                                                                        | Agent name in the instructions  |
| 2   | What it is for        | "Prepare every onboarding, offboarding and monthly manpower step for Karissa to approve, so no step is missed and every position stays filled." | Summary of this PRD             |
| 3   | AgentBase Application | New Application named `chiron` in AgentBase Studio; client ID, secret, token URL and API base URL from its Precast tab                          | Not yet created                 |
| 3b  | Lives on GitHub       | Yes, private repo                                                                                                                               | Needed for AgentBase to host it |
| 4   | Hosting               | AgentBase hosts it (Imported)                                                                                                                   | Inference; confirm              |
| 5   | Model                 | A Claude model from the 917V AgentBase catalogue                                                                                                | Not yet chosen                  |
| 6   | Database              | Precast creates it; holds the tracker, holidays and approvals                                                                                   | Default                         |
| 7   | Look and feel         | Calm, plain admin screens: a Talent list with step status, a draft review pane with Approve and Edit                                            | Inference; no references given  |
| 8   | APC theme             | Not yet chosen                                                                                                                                  | Pick at setup                   |

## Open questions

Phase 1 can start now; Phases 2 and 3 need these answered first.

- [ ] Onboarding: what is the Welcome Poster, who receives it, and does it apply to project-based hires and interns?
- [ ] Onboarding: do project-based hires and interns get the C3 activation reminder?
- [ ] Onboarding: what are the deadlines for C3 and the hiring manager's schedule approval?
- [ ] Offboarding: how does Chiron hear Margie's confirmation of a resignation — in chat, in the tracker, or by email?
- [ ] Offboarding: what are the clearance deadlines, and does every talent type need the hiring manager's turnover approval?
- [ ] Offboarding: does Chiron draft only the exit interview invite, or the questions too? Either way, it never sees the answers.
- [ ] Onboarding and offboarding: what does TOW cover, and which items does each talent type receive and return?
- [ ] Offboarding: how do project-based hires offboard through their vendor?
- [ ] Manpower: the flowchart shows only MP3. What are the earlier manpower steps, and who approves them?
- [ ] Manpower: where does the Manpower Masterlist live, who owns it, and which columns can Chiron read?
- [ ] Manpower: what counts as a position — approved headcount or filled roles?
- [ ] Tracker: move from the Google Sheet to the Precast database, or keep the Sheet as the source of truth?
- [ ] Approval: should approvals happen in the Chiron web app, in Slack, or both?
- [ ] Pilot: does the AgentBase rebuild restart the pilot with test hires, or continue the current one?
