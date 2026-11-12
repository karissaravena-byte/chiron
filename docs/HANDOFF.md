# HANDOFF.md — Continuity Plan

> **Purpose.** Single, always-current entry point for any agent about to pick up work. Read this file first; everything you need to take over the last-executed task or continue the next one is captured here.
>
> **Authority.** This doc lives at the top of `docs/`. It is the **only** doc a takeover agent is required to read before doing anything else. Once you've read this, the **Resume prompt** below tells you exactly which other docs to consult.
>
> **Updates.** Every meaningful task closure MUST overwrite §1 + §2 + §4 of this file in the same change set that closes the task. See the enforcement clause in [`CLAUDE.md` §3.5](../CLAUDE.md#35-handoffmd-enforcement--mandatory).
>
> **What this is NOT.** Long-form session history (→ [`PROGRESS.md Session Log`](PROGRESS.md)); architectural rationale (→ [`SPEC.md`](SPEC.md)); the plan being executed (→ `docs/plans/...`). This file is _only_ the single-page continuity checkpoint.

---

## 1. Current state (overwrite on each handoff)

**Chiron Phase 1 foundations, built and verified (2026-11-11).** All three feed-forward docs are
approved ([DATA_MODEL](DATA_MODEL.md), [AGENT_SPEC](AGENT_SPEC.md), [DESIGN_SYSTEM](DESIGN_SYSTEM.md)).
Built from them:

- **Agent `chiron`** sees only `CHIRON_TOOLS` (today: `prepare_onboarding`); no MCP tools, no
  on-behalf-of, no chat memory (guarded by `chiron-tools.spec.ts`). Inbound messages pass the
  sensitive-input screen first (`middleware/sensitive-input.ts`).
- **Tracker:** `packages/shared/src/chiron-db/` (Drizzle schema, embedded SQL migrations, repo).
  11 tables in `chiron_app`, created in the provisioned database. Server-only entry:
  `@precast/shared/server`.
- **Rules:** `packages/shared/src/chiron-rules.ts`: pilot lock, approver list, exact-version
  hash, blanks, send gate, kind timing. `sensitive.ts`: the detector.
- **Web:** `apps/web/app/(chiron)/`: side menu, Waiting for you, Onboarding table + test hires,
  Talent page, Draft review (Approve / Edit / Discard / Copy / Mark as sent), stubs for
  Holidays, Playbook, Settings. Actions via `api/drafts/[id]`; handoffs via `api/onboarding/handoff`.
- **Verified:** lint, typecheck, build; Vitest shared 65 · a2ui 34 · web 358 · agents 168;
  Playwright 12/13 against the live preview (B-008 is a starter test that expects no database).

_Known carry-forwards:_ see PROGRESS blockers B-001 (four `Not Started` rows), B-007 (open
sign-up; SSO before hosting), B-008, B-009 (local test approver in `.env`); D-004 (placeholder
agents still on disk as fixtures for framework specs).

---

## 2. Next task (overwrite on each handoff)

1. Load Karissa's real "Checklist by type", request templates, welcome emails and 1:1 contact
   list as versioned playbook entries (F4, F6, D-007), replacing the sample wording.
2. Record step facts (F9: BI processed, IT confirmed, Form A submitted …) on the Talent page,
   then the C3 activation reminder and C4 drafts.
3. Connect Gmail as chiron@917ventures.com through the F37 gate (F13 + kind timing).
4. Before anyone but Karissa can reach the app: SSO sign-in (B-007), remove the test approver
   (B-009), push to a private GitHub repo, import into AgentBase.

---

## 3. Resume prompt (paste into the next agent)

> Copy the block below verbatim into whichever agent picks up next. The prompt is self-contained — it tells the agent which docs to read, the authority order between them, and what verification to run before reporting "done".

```
You are taking over work. Read these in order before touching code:

1) docs/HANDOFF.md (this file) — current state + next task + return contract.
2) docs/PROGRESS.md — long-form context for the most recently closed task.
3) The plan file the current task references (linked in §2 above, if applicable). If §2 says "No scheduled next task", instead read PROGRESS.md Task Tracker and pick the highest-priority unchecked task there.

Authority order on disagreement:
- Tech-stack facts (versions, libs, container images, ports) → docs/TECH_STACK.md wins.
- Boilerplate structure (file layout, naming, conventions) → docs/SPEC.md wins.
- Working rules → CLAUDE.md wins.

Execution rules:
- Make atomic changes per task (code + tests + doc updates in one change set).
- Update docs/PROGRESS.md (Last Updated, Session Log, handoff note) on every meaningful change.
- Update docs/HANDOFF.md §1 + §2 + §4 in the SAME change set that closes a task.
- Run all tests listed for the task. If a pre-existing unrelated failure carries forward, document it under "Known carry-forwards" in HANDOFF.md §1.
- Stop after one logical task and report (a) what changed, (b) what tests ran + outcomes, (c) what's next.

Return format:
- Completed: <one-line summary>
- Files changed: <list>
- Tests run + outcomes: <list with green/red>
- Risks / blockers: <list>
- Next: <pointer to HANDOFF.md §2 or the new state thereof>
```

## 4. File map for takeover (always-current)

| Area                    | Path                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Product docs            | `docs/PRD.md`, `docs/DATA_MODEL.md`, `docs/AGENT_SPEC.md`, `docs/DESIGN_SYSTEM.md`                |
| Agent + roster          | `apps/agents/src/mastra/agents/chiron.ts`, `crew.ts`, `index.ts` (middleware order)               |
| Onboarding rules (pure) | `apps/agents/src/mastra/onboarding/{checklist-by-type,prepare}.ts`                                |
| Tools                   | `apps/agents/src/mastra/tools/prepare-onboarding.ts` (live), `tools/planned.ts` (interfaces only) |
| Middleware              | `apps/agents/src/mastra/middleware/{sensitive-input,onboarding-prep}.ts`                          |
| Shared, browser-safe    | `packages/shared/src/{onboarding,sensitive}.ts`                                                   |
| Shared, server-only     | `packages/shared/src/{server,chiron-rules}.ts`, `packages/shared/src/chiron-db/*`                 |
| Screens                 | `apps/web/app/(chiron)/**` (layout + ChironShell, pages)                                          |
| Web routes              | `apps/web/app/api/onboarding/handoff/route.ts`, `apps/web/app/api/drafts/[id]/route.ts`           |
| Web helpers             | `apps/web/app/lib/{session,chiron-ui,test-hires}.ts`                                              |
| Tests                   | `**/*.spec.ts` beside the code; `apps/web/e2e/{chiron,home}.spec.ts`                              |
| Local test sign-in      | `.precast/preview-account.txt` (git-ignored)                                                      |

---

## 5. Lifecycle — when this file gets updated

- **On every meaningful task closure** — §1 (Current state), §2 (Next task), and §4 (File map for takeover, if files moved) are overwritten by the closing agent in the same change set as the code/doc changes.
- **§3 (Resume prompt) is stable** — only updated when the takeover contract itself changes (very rare).
- **§5 (Lifecycle) is meta** — only updated when this enforcement contract itself changes.

If you are picking up mid-session because the previous agent is unavailable, your first action is to read this file's §1 and §3, then paste §3's resume prompt into your next prompt to whichever agent continues the work. The seam is intentionally one file deep.
