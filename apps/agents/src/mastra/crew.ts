import { chironAgent } from './agents/chiron';
import { defineCrew } from './lib/crew';

/**
 * THE CREW — the single source of truth for this project's agent roster and its
 * orchestrator front door. Declare the crew here and nowhere else:
 *
 *   - `mastra/index.ts` registers exactly `crewAgents(crew)` on the Mastra
 *     instance (orchestrator + members, de-duplicated).
 *   - Phase 2 will extend `emit:import-manifest` to write the AgentBase
 *     `orchestration` block from this same value, so the import contract can't
 *     drift from the wiring. (See docs/plans/orchestrator-crew-plan.md.)
 *
 * The orchestrator (`crew-orchestrator`) is a single point of contact that
 * routes to the right member in-process; each member keeps its own A2A card and
 * stays independently invocable. With a single member the orchestrator collapses
 * to that member (no routing hop) — it activates at 2+ members.
 *
 * Chiron is the only member for now (PoC). With one member the orchestrator
 * collapses to Chiron itself. Argus is a separate agent reached over A2A, not a
 * crew member.
 */
export const crew = defineCrew({
  members: [chironAgent],
});

export { crewAgents } from './lib/crew';
