# DESIGN_SYSTEM: Chiron

**Last updated:** 2026-11-11 · Sources: PRD Scaffold #7 ("Calm, plain admin screens"), the PoC
screen Karissa approved on 2026-11-10 ("Right shape, continue"), and
[AGENT_SPEC.md](AGENT_SPEC.md) (approved 2026-11-11).

> **Status: approved by Karissa on 2026-11-11**, with all four calls in §7 accepted.

---

## 1. Principles

1. **Calm, plain admin.** A tool for one careful approver, not a dashboard. Quiet background,
   white (or dark) cards, generous spacing, one primary action per area.
2. **Nothing hidden about what goes out.** Every draft shows who it goes to now, who it is really
   for, what's left blank, and that nothing has been sent. The pilot banner stays visible on every
   screen while pilot mode is on.
3. **Status at a glance, details on demand.** Badges carry status; the full text of a draft is
   one click away, not on every list.
4. **Honest about what's fake or missing.** Test data carries a _Test data_ badge; sample wording
   is labelled; a capability whose connector isn't connected says so in plain words ("Calendars
   not checked") rather than hiding the button.
5. **Words, not system names.** No step IDs, tool names, env vars or "TODO" on screen. Talent are
   named by name or nickname; steps by what they are ("Background investigation request").

## 2. Theme and tokens

- **APC theme: Cappadocia** (deep teal actions, warm yellow accent, earthy secondaries), chosen by
  Karissa on 2026-11-10. In dark mode the primary action turns warm yellow. Switch with
  `pnpm set-theme <name>`; preview all seven at https://apc-design-system.917v.dev.
- **Light and dark follow the device setting.** Both were checked on the PoC screen on
  2026-11-11: text, badges, banners and draft cards are readable in both.
- **Never a literal colour.** Use Astryx/APC semantic roles and Tailwind's mapped utilities.
- **Local deviation:** hover, pressed and selected state layers are made translucent in
  `apps/web/app/globals.css`, because the APC tokens ship them opaque and they hid a hovered
  button's label and a selected card's text (PROGRESS D-003, B-003). Remove it when Precast fixes
  the tokens.
- **Second local deviation:** in dark mode, the muted warning, error and success backgrounds used
  by banners are derived as faint tints, because the APC dark values are full-strength and a
  warning banner read yellow on yellow (D-022, B-010).

## 3. Status language

One vocabulary everywhere: tracker, drafts, runs.

| Status            | Badge   | Meaning to Karissa                                           |
| ----------------- | ------- | ------------------------------------------------------------ |
| Pending           | info    | Chiron hasn't prepared it yet, or is waiting for its trigger |
| Waiting for you   | warning | A draft, holiday or playbook change needs your approval      |
| Sent              | success | Went out (to you, while the pilot is on)                     |
| Waiting on others | neutral | IT, a vendor, the Talent or a manager has the next move      |
| Done              | success | Finished                                                     |
| Overdue           | error   | Past its deadline in working days                            |
| N/A               | neutral | Doesn't apply to this Talent's type                          |
| To confirm        | warning | Not yet decided for this type (PRD open question)            |

Blanks for you to fill appear as warning badges under each draft, named by what goes there
("Employee ID, from Karissa or Margie").

## 4. Screens

Phase 1 screens first; Phase 2–3 screens reuse the same patterns.

| Screen                     | What it's for                                                                                                                                              | Built from                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Waiting for you** (home) | Everything that needs your yes: drafts, holidays to confirm, proposed playbook changes, schedules the manager approved. Oldest first, with deadline badges | `List` of `Card`s, `Badge`, `EmptyState` ("Nothing waiting for you")               |
| **Onboarding**             | Every Talent being onboarded, with their next step and anything overdue. Picking one opens their page                                                      | `Table` (compact), `Badge`, `StatusDot`                                            |
| **Talent page**            | One Talent's checklist by stage, their drafts, schedule proposals, and the four-part summary. Where you tick "BI processed", "Form A submitted" etc.       | The PoC's right pane, plus `CheckboxInput` for yes/no facts                        |
| **Draft review**           | One draft: To / real recipient / subject / body / blanks, with **Approve**, **Edit** and **Discard**                                                       | `Card`, `TextArea` in edit mode, `Banner` when an edit cancels an earlier approval |
| **Holidays**               | Proposed holidays with source links; Confirm or Reject                                                                                                     | `Table`, `Link`, `Button`                                                          |
| **Playbook**               | Current checklists, templates and contact list; Chiron's proposed changes with what changed and why                                                        | `Collapsible`, `CodeBlock`-style diff, `Button`                                    |
| **Settings**               | Pilot mode (with who confirmed turning it off), approvers, which connectors are connected                                                                  | `Switch` (disabled until both confirmations), `MetadataList`                       |
| _Offboarding_ (P2)         | Like Onboarding, for clearances to the last day                                                                                                            | same patterns                                                                      |
| _Manpower_ (P3)            | The monthly report: open, opening and joining, by team; what went to Argus                                                                                 | `Table`, `Badge`                                                                   |

**Navigation:** a left side menu on desktop (Waiting for you · Onboarding · Holidays · Playbook ·
Settings; later Offboarding and Manpower), collapsing to a menu button on phones (§7, call 1).

**Test hires** stay available, clearly badged, until Argus is connected, as a "Try a test hire"
action on the Onboarding screen rather than the main list.

## 5. Interaction rules

- **Approve means this exact version.** Editing an approved draft shows "Your edit cancels the
  earlier approval" and needs a fresh Approve (AGENT_SPEC D-008).
- **Approve never means "send now" outside working hours.** The confirmation says when it will go
  ("Sends tomorrow at 9:00 AM, the next working hour") (D-014).
- **Destructive actions are reversible or confirmed.** Discarding a draft keeps it in history;
  turning pilot mode off needs both Karissa's and Rase's confirmation.
- **Sensitive input gets a fixed, kind reply**, never an echo: "That looked like private
  information, so I didn't read it. Please delete that message from this chat."
- **Long waits show progress.** Anything Chiron takes more than a second on shows a spinner with
  what it's doing ("Checking the details and drafting…").
- **Phones:** after an action, scroll to its result. Seen on the PoC: on a phone, Chiron's
  preparation appeared below the hire list, out of view.

## 6. Copy

- Second person to Karissa ("Waiting for you", "What you must verify"); Chiron speaks as "I" in
  its own note.
- Plain verbs: _Approve_, _Edit_, _Discard_, _Confirm_. Never "Execute" or "Submit".
- Dates as "Tue, Dec 1, 2026"; deadlines as "Due Thu, Nov 12"; times in Manila time without a
  zone label, since everyone is in Manila.

## 7. Decisions (approved 2026-11-11: all four as recommended)

| #   | Decision            | Chosen                                                                                    | What it costs                                                                                                  | Revisit if…                                         |
| --- | ------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | **Navigation**      | Left side menu on desktop, menu button on phones                                          | Takes some width from the content on small laptops                                                             | you'd prefer tabs across the top                    |
| 2   | **Home screen**     | "Waiting for you": one queue of everything that needs your approval                       | One more screen than the PoC; Talent pages are one click further away                                          | you'd rather start from the list of Talent          |
| 3   | **Editing drafts**  | Edit in place in the draft review, with a note that the edit cancels any earlier approval | No side-by-side comparison with Chiron's original while you edit (the Playbook screen shows differences later) | you want to see Chiron's original next to your edit |
| 4   | **Onboarding list** | A compact table (one row per Talent: next step, deadline, overdue count)                  | Denser than the calm cards elsewhere                                                                           | you prefer cards like the PoC's hire list           |

## 8. Implementation notes

- Astryx components (`@astryxdesign/core`) for everything; Tailwind for layout and spacing only;
  no hand-written CSS beyond `app/globals.css`.
- Pages under `apps/web/app/` talk to Chiron only through route handlers and `callAgent()`
  (A2A). Approvals are recorded by a web route from the signed-in session (AGENT_SPEC F11).
- Every new screen gets a Playwright check in light and dark, and at phone width.
