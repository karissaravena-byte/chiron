# PROGRESS.md — Context Memory

> **This file is the ultimate cross-tool context memory.** All coding agents MUST update this file on every meaningful change. If you finish work without updating PROGRESS.md, the work is **not** considered complete.

**Last Updated:** 2026-11-11
**Updated By:** Claude Code (scaffold from PRD + Phase 1 PoC slice)
**Active Branch:** develop

---

## 0. How to Use This File

### 0.1 When to Update

You MUST update PROGRESS.md when you:

- Start or finish a task / subtask listed below.
- Make a code change, however small.
- Make or revise a design decision.
- Add, modify, or remove tests.
- Change environment variables or infrastructure config.
- Discover a blocker, risk, or open question.
- Switch tools between sessions.

### 0.2 How to Update

1. Bump **Last Updated** + **Updated By** at the top.
2. Append an entry to the **Session Log** (top of log = newest).
3. Tick / untick relevant **Task Tracker** checkboxes.
4. Update **Open Decisions**, **Known Blockers**, **Test Coverage** as needed.
5. If you started/finished a phase, update the **Phase Plan**.
6. Keep entries terse. Link to files where helpful.

### 0.3 What Belongs Here vs Elsewhere

- **Here:** state of work, decisions, blockers, what's next, who/what did what.
- **Not here:** architectural rationale (→ [SPEC.md](SPEC.md)), style rules (→ [STYLE_GUIDE.md](STYLE_GUIDE.md)), test definitions (→ [TEST_CASES.md](TEST_CASES.md)).
- **Never here:** secrets, raw tokens, PII.

---

## 1. Project Snapshot

| Field             | Value                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project**       | chiron (917V's People Ops agent)                                                                                                                   |
| **Mission**       | Prepare every onboarding, offboarding and monthly manpower step for Karissa to approve, so no step is missed and no position stays open unnoticed. |
| **Owner**         | Karissa (approver); Mikki is backup approver                                                                                                       |
| **Hosting**       | AgentBase hosts it (Imported); private GitHub repo, not yet pushed                                                                                 |
| **AgentBase app** | Application `chiron` (its own, separate from other projects); subscribed to the model + the database agent only                                    |
| **Model**         | `gemini-35-flash-dd840ef8` (gemini-3.5-flash). PRD asked for Claude; none is in the org catalogue yet (D-001)                                      |
| **Database**      | Provisioned by AgentBase's database agent on 2026-11-10; URL in `.env` only                                                                        |
| **UI**            | Calm, plain admin screens (PRD Scaffold #7, no references); APC theme Cappadocia. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)                         |
| **PRD**           | [PRD.md](PRD.md) · thin spec: [AGENT_SPEC.md](AGENT_SPEC.md)                                                                                       |
| **Stacks**        | pnpm + Turborepo · Mastra (agents) · Next.js + Astryx + Better Auth (web) · zod · Postgres/Redis (remote/managed)                                  |
| **Repo Root**     | <path>                                                                                                                                             |
| **Primary Docs**  | [SPEC.md](SPEC.md), [TECH_STACK.md](TECH_STACK.md), [STYLE_GUIDE.md](STYLE_GUIDE.md)                                                               |

---

## 2. Phase Plan

> Track major phases here. Mark each: Not Started / In Progress / Completed / Blocked

| #   | Phase                   | Status                 | Exit Criteria                                                   |
| --- | ----------------------- | ---------------------- | --------------------------------------------------------------- |
| 0   | Scaffold + PoC slice    | Completed (2026-11-10) | Karissa reviewed the Onboarding screen: "Right shape, continue" |
| 1   | Onboarding (C1–C6)      | Not Started            | Matches today's Chiron; pilot signed off by Karissa and Rase    |
| 2   | Offboarding (O1–O5)     | Not Started            | Phase 1 signed off; clearance steps defined                     |
| 3   | Manpower tracking (MP3) | Not Started            | Masterlist access approved; open-position rules defined         |

---

## 3. Task Tracker (live)

> Mark each task `[ ]`, `[~]` in-progress, `[x]` done, `[!]` blocked.

- [x] Scaffold `chiron` from Precast 0.12.4; Application, model, database, theme confirmed with Karissa
- [x] PoC: mocked Argus handoff → checklist + BI/welcome/IT drafts under the pilot lock, on one screen
- [x] PoC review gate: Karissa approved the shape ("Right shape, continue", 2026-11-10); no changes requested
- [x] Stage 2: DATA_MODEL.md approved (2026-11-11, all five calls as recommended)
- [x] Stage 2: AGENT_SPEC.md approved (2026-11-11, all five calls as recommended)
- [x] Stage 2: DESIGN_SYSTEM.md approved (2026-11-11, all four calls as recommended)
- [x] Lock connectors (F37) and add the sensitive-input screen (F35, F36)
- [x] Tracker: 11 Phase 1 tables in `chiron_app`; handoffs saved (F8)
- [x] Approvals (F11), send gate (F12/F13 floor), kind timing (F16 rule), Mark as sent
- [x] Screens: side menu, Waiting for you, Onboarding table, Talent page, Draft review; Holidays/Playbook/Settings stubs
- [x] Interfaces for unbuilt functions (`tools/planned.ts`, not given to the model)
- [x] Removed placeholder chat UI and its tests; rewrote home e2e; added Chiron e2e
- [ ] Next: Karissa's real checklist, templates, welcome emails and contact list as playbook data (F4, F6, D-007)
- [ ] Next: record step facts (F9), then C3/C4 drafts
- [ ] Before anyone else can reach the app: SSO sign-in instead of open email sign-up (B-007)
- [ ] Remove the unregistered `example-agent` / `summary-agent` once the framework specs that use them as fixtures are ported (D-004)

---

## 4. Open Decisions

| ID    | Decision                                                                                          | Date       | Rationale                                                                                                                                                                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-001 | Model is gemini-3.5-flash, not Claude                                                             | 2026-11-10 | PRD asked for Claude; the org's AgentBase offers none. Karissa chose gemini-3.5-flash (proven in another project). One line in `.env` to change once Claude is onboarded                                                                                        |
| D-002 | Onboarding rules are code, the model only summarizes                                              | 2026-11-10 | PRD guardrails: checklist selection, missing details, flags, pilot lock and draft rendering are deterministic (`apps/agents/src/mastra/onboarding/`). The tool result reaches the screen as an A2A data part, so Karissa reviews exactly what the code produced |
| D-003 | Translucent state layers in `globals.css`                                                         | 2026-11-10 | APC tokens make hover/pressed overlays opaque in all seven themes; Astryx paints them over content, hiding a hovered primary button's label and a selected card's text. Local override derives them from `currentColor`. Remove once fixed upstream (B-003)     |
| D-005 | Tracker moves into Chiron's database (replaces the Google Sheet)                                  | 2026-11-11 | DATA_MODEL §6 call 1, approved by Karissa                                                                                                                                                                                                                       |
| D-006 | Personal email and mobile cleared when onboarding completes                                       | 2026-11-11 | DATA_MODEL §6 call 2, approved by Karissa                                                                                                                                                                                                                       |
| D-007 | Playbook (checklists, templates, contact list) stored versioned in the database, seeded from code | 2026-11-11 | DATA_MODEL §6 call 3, approved by Karissa                                                                                                                                                                                                                       |
| D-008 | An approval covers one exact draft version (content hash)                                         | 2026-11-11 | DATA_MODEL §6 call 4, approved by Karissa                                                                                                                                                                                                                       |
| D-009 | Approvers are a fixed allowlist (Karissa, Mikki) in config                                        | 2026-11-11 | DATA_MODEL §6 call 5, approved by Karissa                                                                                                                                                                                                                       |
| D-010 | Approvals happen in Chiron's web app first; Slack later                                           | 2026-11-11 | AGENT_SPEC §5 call 1, approved by Karissa                                                                                                                                                                                                                       |
| D-011 | Connectors run as chiron@917ventures.com, never on behalf of the signed-in person                 | 2026-11-11 | AGENT_SPEC §5 call 2, approved by Karissa                                                                                                                                                                                                                       |
| D-012 | No chat memory; Chiron remembers through the tracker                                              | 2026-11-11 | AGENT_SPEC §5 call 3, approved by Karissa                                                                                                                                                                                                                       |
| D-013 | Argus handoff is the structured field list, not free text                                         | 2026-11-11 | AGENT_SPEC §5 call 4, approved by Karissa                                                                                                                                                                                                                       |
| D-014 | Approved sends outside 9:00–18:00 Manila wait for the next working window                         | 2026-11-11 | AGENT_SPEC §5 call 5, approved by Karissa                                                                                                                                                                                                                       |
| D-015 | Left side menu; menu button on phones                                                             | 2026-11-11 | DESIGN_SYSTEM §7 call 1, approved by Karissa                                                                                                                                                                                                                    |
| D-016 | Home screen is "Waiting for you" (approval queue)                                                 | 2026-11-11 | DESIGN_SYSTEM §7 call 2, approved by Karissa                                                                                                                                                                                                                    |
| D-017 | Drafts are edited in place; an edit cancels earlier approval                                      | 2026-11-11 | DESIGN_SYSTEM §7 call 3, approved by Karissa                                                                                                                                                                                                                    |
| D-018 | Onboarding list is a compact table                                                                | 2026-11-11 | DESIGN_SYSTEM §7 call 4, approved by Karissa                                                                                                                                                                                                                    |
| D-019 | Nothing is approved or sent with a `[blank]` left in it                                           | 2026-11-11 | Found while testing: a draft with four blanks could be approved. Now refused by approve, the send gate and the Approve button. Enforces PRD G7 ("Karissa fills the blanks")                                                                                     |
| D-020 | `@precast/shared/server` entry for database + send rules                                          | 2026-11-11 | The main entry is imported by client components; `pg` and `node:crypto` must not reach the browser bundle                                                                                                                                                       |
| D-021 | Tracker migrations are embedded SQL, applied on first use                                         | 2026-11-11 | No migrations folder to copy into the Mastra or Next bundles; advisory lock stops the two apps racing                                                                                                                                                           |
| D-022 | Dark-mode muted status colours derived as faint tints in `globals.css`                            | 2026-11-11 | APC dark values for warning/error/success-muted are full-strength; a dark warning banner was yellow on yellow. Banner/FieldStatus only; light mode untouched (B-010)                                                                                            |
| D-004 | Placeholder agents kept on disk, unregistered                                                     | 2026-11-10 | `crew.ts` registers only `chiron`; example/summary agent files stay until hardening so existing specs keep compiling                                                                                                                                            |

---

## 5. Known Blockers

| ID    | Blocker                                                                                                                                                                                             | Impact                                                                             | Workaround                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| B-001 | Remaining `Not Started` rows: CH-ON-5, CH-AGT-1, CH-SHR-1, CH-GUARD-4 (TEST_CASES.md)                                                                                                               | ON-5 and GUARD-4 wait for C4 and Calendar; AGT-1/SHR-1 are covered end to end only | Add isolated unit tests with the next agent change                                          |
| B-002 | Mocks/stand-ins: test hires replace Argus's A2A handoff; draft wording is sample text; no holiday table (start dates only flagged for manual check)                                                 | Drafts aren't Karissa's real wording                                               | Load her templates + checklist as data files; connect Argus over A2A; add the holiday table |
| B-003 | Precast upstream: APC `--color-overlay-hover/pressed` and `--color-tint-hover` are opaque                                                                                                           | Hover/selected states hide content in every Precast project                        | Local override (D-003); fix belongs in Precast's `apc.tokens.json`                          |
| B-004 | No Claude model in the org's AgentBase catalogue                                                                                                                                                    | Runs on gemini-3.5-flash                                                           | Ask the AgentBase admin to onboard one, then change `AGENTBASE_LLM_MODEL`                   |
| B-006 | ~~Precast default hands subscribed connector tools to the model, on behalf of the signed-in person~~ **Resolved 2026-11-11**: `CHIRON_TOOLS` only, no OBO from Chiron's routes, guarded by CH-AGT-2 | —                                                                                  | —                                                                                           |
| B-005 | ~~Example chat e2e specs target the replaced home page~~ **Resolved 2026-11-11**: removed with the chat UI; home spec rewritten                                                                     | —                                                                                  | —                                                                                           |
| B-007 | Sign-in is open email/password: anyone who can reach the app can register any address, including an approver's                                                                                      | Approvals are only as trustworthy as sign-in                                       | Fine on 127.0.0.1. Before hosting: organisation SSO (`OIDC_*`), disable open sign-up        |
| B-008 | Starter e2e `a2a-route.spec.ts` "health route" expects a server with no database, so it fails when reusing the configured local preview                                                             | 1 of 13 e2e tests red locally                                                      | Passes in CI (no database). Leave, or run e2e against a fresh `next dev`                    |
| B-010 | Precast upstream: APC dark-mode `--color-{warning,error,success}-muted` are saturated, so banners are unreadable in dark mode in every theme                                                        | Every Precast project's dark banners                                               | Local override (D-022); fix belongs in Precast's `apc.tokens.json`, with B-003              |
| B-009 | Local `.env` lists `preview@chiron.test` as an approver (stand-in for Karissa, for local testing)                                                                                                   | Must not reach a shared deployment                                                 | Remove from `CHIRON_APPROVERS` before hosting                                               |

---

## 6. Test Coverage

| Area                    | Tests                                                          | Status  |
| ----------------------- | -------------------------------------------------------------- | ------- |
| All Vitest (2026-11-11) | shared 65 · a2ui 34 · web 358 (+1 skipped) · agents 168        | Passing |
| Playwright (2026-11-11) | 13 specs against the live preview: 12 passing, 1 known (B-008) | 12/13   |
| Lint, typecheck, build  | `pnpm lint`, `pnpm verify:poc`, `pnpm build`                   | Passing |
| Web/shared (Vitest)     | `apps/web/test/**` — env schema + fitness guards               | Passing |
| E2E (Playwright)        | `apps/web/e2e/**` — home page                                  | Passing |

---

## 7. Environment State

| Variable               | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `Node`                 | current LTS (`.nvmrc`: `lts/*`)                              |
| `pnpm`                 | 9.15.9                                                       |
| `Ports`                | Agents 46890 · Web 46891 (set by bootstrap; infra is remote) |
| `Precast`              | 0.12.4 (e2e983d)                                             |
| `PRECAST_LOCAL_AGENTS` | 1 (not yet imported into AgentBase)                          |

---

## 8. Session Log

<auto-journal: 2026-11-11 09:49:09 — file edit>

<auto-journal: 2026-11-11 09:48:32 — file edit>

<auto-journal: 2026-11-11 09:48:06 — file edit>

<auto-journal: 2026-11-11 09:47:52 — file edit>

<auto-journal: 2026-11-11 09:46:58 — file edit>

<auto-journal: 2026-11-11 09:46:35 — file edit>

<auto-journal: 2026-11-11 09:45:01 — file edit>

<auto-journal: 2026-11-11 09:44:51 — file edit>

<auto-journal: 2026-11-11 09:44:09 — file edit>

<auto-journal: 2026-11-11 09:43:56 — file edit>

<auto-journal: 2026-11-11 09:41:42 — file edit>

<auto-journal: 2026-11-11 09:38:34 — file edit>

<auto-journal: 2026-11-10 08:52:44 — file edit>

<auto-journal: 2026-11-10 08:50:01 — file edit>

<auto-journal: 2026-11-10 08:49:08 — file edit>

<auto-journal: 2026-11-10 08:48:50 — file edit>

<auto-journal: 2026-11-10 08:48:34 — file edit>
<!-- Newest first. The progress-stamp hook appends <auto-journal> markers here. -->

- **2026-11-11 · Claude Code · Phase 1 foundations built from the approved docs ·** Locked connectors (Chiron sees only `CHIRON_TOOLS`; no on-behalf-of; no memory). Added the sensitive-data detector and inbound screen. Created the tracker (11 tables, `chiron_app`, Drizzle + embedded migrations) and saved handoffs to it (idempotent per handoff ref). Added approvals by exact version, the send gate (pilot lock, blanks, stale approvals), kind-timing rule, Mark as sent. New screens: side menu, Waiting for you, Onboarding table, Talent page, Draft review, plus Holidays/Playbook/Settings stubs. Interfaces for unbuilt tools in `tools/planned.ts`. Removed the placeholder chat UI. Found and fixed: drafts with blanks could be approved (D-019); dark-mode warning banners were unreadable (D-022). **Verified:** lint, typecheck, build, all Vitest, 12/13 Playwright (B-008). Advisory Precast files touched (port by hand on upgrade): `packages/shared/src/{database,env}.ts`, `packages/shared/package.json`, `.env.example`. · `packages/shared/src/{sensitive,chiron-rules,server}.ts`, `packages/shared/src/chiron-db/*`, `apps/agents/src/mastra/{agents/chiron.ts,tools/*,middleware/sensitive-input.ts,chiron-tools.spec.ts,index.ts}`, `apps/web/app/{(chiron)/**,api/drafts/**,lib/{session,chiron-ui,test-hires}.ts}`, `apps/web/e2e/*`, docs

- **2026-11-11 · Claude Code · DESIGN_SYSTEM approved; Stage 2 complete ·** Karissa approved all four design calls (D-015..D-018). All three feed-forward docs approved. Starting the build.

- **2026-11-11 · Claude Code · DESIGN_SYSTEM drafted ·** Checked the PoC screen in dark mode and at phone width (375px, no sideways scroll); both readable. Found: on phones the result appears below the list, out of view. Wrote full DESIGN_SYSTEM.md (principles, status vocabulary, 9 screens, interaction rules, 4 judgment calls). Awaiting Karissa's review.

- **2026-11-11 · Claude Code · AGENT_SPEC approved ·** Karissa approved docs/AGENT_SPEC.md with all five calls as recommended (D-010..D-014). Next: DESIGN_SYSTEM.md.

- **2026-11-11 · Claude Code · AGENT_SPEC drafted ·** Full purpose → abilities → functions spec for `chiron` (10 abilities, F1–F44, seams table, module ladder, 5 judgment calls). Found and logged B-006: the Precast default would give the model raw connector tools acting as the signed-in user. Awaiting Karissa's review.

- **2026-11-11 · Claude Code · DATA_MODEL approved ·** Karissa approved docs/DATA_MODEL.md with all five judgment calls as recommended (D-005..D-009). Next: full AGENT_SPEC.md in purpose → abilities → functions form.

- **2026-11-10 · Claude Code · PoC gate passed ·** Karissa reviewed the Onboarding screen and answered "Right shape, continue" with no changes. Moving to Stage 2 (feed-forward docs, review gate per doc), starting with DATA_MODEL.md.

- **2026-11-10 · Claude Code · Scaffold from PRD + Phase 1 PoC slice ·** Scaffolded `chiron` from Precast 0.12.4 after confirming all eight setup answers with Karissa (name, mission, new `chiron` Application, AgentBase hosting, gemini-3.5-flash, provisioned database, PRD look and feel, Cappadocia). Subscribed the Application to the chosen model (bootstrap had subscribed only the database agent; the first call was Forbidden). Built the PRD's PoC: `chiron` agent + deterministic `prepare_onboarding` tool (checklist by type, missing details, flags, pilot lock, BI/welcome/IT drafts, note to Mikki) whose result rides the A2A reply as a data part; Onboarding screen with four test hires standing in for Argus. Fixed opaque APC state layers locally (D-003). **Verified:** `pnpm verify:poc` green, 6 rule tests green, `pnpm poc` healthy, Employee and Project-based handoffs run live in the browser. **At the review gate.** · `apps/agents/src/mastra/{agents/chiron.ts,tools/prepare-onboarding.ts,onboarding/*,middleware/onboarding-prep.ts,crew.ts,index.ts,lib/request-context.ts}`, `packages/shared/src/onboarding.ts`, `apps/web/app/{page.tsx,globals.css,onboarding/*,api/onboarding/handoff/route.ts}`, `docs/{PRD,AGENT_SPEC,DESIGN_SYSTEM,PROGRESS,HANDOFF,TEST_CASES}.md`

- **2026-08-11 · Claude Code · orchestrator-crew Phases 2 + 4(R2/R3) — import-manifest emission + container telemetry ·** **P2:** extended `scripts/emit-import-manifest.mjs` to emit an `orchestration` block into `agentbase.import.json` — orchestrator id read from `ORCHESTRATOR_ID` via regex (single source; no TS loader/DB needed in the bare-Node emit context), `members` omitted (AgentBase discovers them, same as `agents`), `defaultImport: orchestrator-only`. Guarded by `apps/agents/src/mastra/orchestration-manifest.spec.ts` (manifest orchestrator === `ORCHESTRATOR_ID`, members omitted, valid mode). **P4 R2/R3:** added `apps/agents/src/mastra/telemetry/otel.ts` (`@opentelemetry/sdk-node` + `exporter-trace-otlp-http` + `instrumentation-http`/`-undici`), self-starting and imported FIRST in `index.ts`, so the container installs W3C propagation (continues AgentBase's inbound `traceparent` across the crew's in-process hops + re-injects on egress) and exports spans when `OTEL_EXPORTER_OTLP_ENDPOINT` is set (AgentBase injects it — R5). Telemetry init is best-effort and never crashes serving. **Why:** make the crew importable into AgentBase with an operator full-crew/orchestrator-only choice, and keep complete trace visibility despite in-process routing. **Verified:** typecheck + lint + 55 agents tests + `mastra build` all green. **Carry-forward:** live e2e trace-stitch through the _bundled_ container isn't verified here (no running stack); ESM instrumentation ordering may want a `node --import` preload — see HANDOFF §2. AgentBase-side P3 + P4 R1/R4/R5 landed in `~/Projects/agentbase`. · `scripts/emit-import-manifest.mjs`, `agentbase.import.json`, `apps/agents/src/mastra/{orchestration-manifest.spec.ts,telemetry/otel.ts,index.ts}`, `apps/agents/package.json`, `docs/{HANDOFF.md,PROGRESS.md,TECH_STACK.md,plans/orchestrator-crew-plan.md}`

- **2026-08-11 · Claude Code · orchestrator-crew Phase 1 — shipped the in-process orchestrator crew into the boilerplate ·** Added `apps/agents/src/mastra/crew.ts` as the single source of truth for the roster + orchestrator, `lib/crew.ts` (`defineCrew()` — N=1 transparent pass-through, activates at 2+; `crewAgents()` — deduped registration; guards for the reserved `crew-orchestrator` id, duplicate member ids, and nested crews), and `agents/orchestrator.ts` (`createOrchestrator()` — a Mastra Agent Network via the `agents:` field, i.e. in-process agents-as-tools with an LLM-routed tight prompt; no memory by design, same transformation-vs-conversation rule as `summary-agent`). Rewired `index.ts` to register `crewAgents(crew)` instead of hand-listing agents. Members are untouched → each keeps its own `/api/.well-known/:id/agent-card.json` and stays standalone; the orchestrator is purely additive. **Why:** Phase 1 of `docs/plans/orchestrator-crew-plan.md` — a default single-point-of-contact for every Precast Mastra app, without swallowing the subagents. **Verified:** `tsc --noEmit`, `eslint src`, 51 agents-package tests (8 new `lib/crew.spec.ts`), and `mastra build` all green. Live A2A-card fetch deferred: this checkout's `.env` has only placeholder DB creds + an invalid `file:` `MASTRA_DB_URL`, so the server can't boot here. **Next:** Phase 2 — extend `scripts/emit-import-manifest.mjs` to emit the `orchestration` block from `crew.ts`. · `apps/agents/src/mastra/{crew.ts,index.ts}`, `apps/agents/src/mastra/agents/orchestrator.ts`, `apps/agents/src/mastra/lib/{crew.ts,crew.spec.ts}`, `docs/{HANDOFF.md,PROGRESS.md,plans/orchestrator-crew-plan.md}`

---

## 9. Cross-Tool Handoff Notes

| Date       | Agent       | Context                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-11 | Claude Code | **Phase 1 foundations built and verified; showing Karissa the new screens.** Next: her real checklist/templates as playbook data, then step facts (F9) and C3/C4 drafts. Run e2e with `E2E_HOST=localhost` (sign-in trusts localhost only) and approver creds from `.precast/preview-account.txt`.                                                                                                                                                                                                                                                                            |
| 2026-11-10 | Claude Code | **Chiron PoC at the review gate.** Onboarding screen works end to end on the live model. Next: collect Karissa's reaction, then Stage 2 docs and hardening (B-001). Do not harden before her feedback. Local test sign-in for previews: `.precast/preview-account.txt` (git-ignored).                                                                                                                                                                                                                                                                                         |
| 2026-08-11 | Claude Code | Orchestrator-crew **Phase 1 done** — in-process orchestrator (`crew-orchestrator`, Mastra Agent Network) scaffolded into the boilerplate via `mastra/crew.ts` + `lib/crew.ts` (`defineCrew`/`crewAgents`) + `agents/orchestrator.ts`; activates at 2+ members, N=1 pass-through; members keep their own cards. Green: typecheck, lint, 51 agents tests, `mastra build`. **Next: Phase 2** — emit the `orchestration` block from `crew.ts` in `scripts/emit-import-manifest.mjs` (plan §8.2). Then mirror to precast-plugin / precast-ground-zero, and AgentBase-side Phase 3. |

---

## 10. Changelog

- (record notable milestones here)
