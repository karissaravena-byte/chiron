import { Agent } from '@mastra/core/agent';
import { prepareOnboardingTool } from '../tools/prepare-onboarding';
import { resolveAgentModel } from '../lib/agentbase-model';

const AGENT_ID = 'chiron';

/**
 * The ONLY tools the model sees (AGENT_SPEC rule 6, F37). Connectors (Gmail, Calendar, Slack,
 * the Masterlist) are never handed to the model: Chiron's own tools reach them from inside,
 * after checking the approval, and always as chiron@917ventures.com, never on behalf of the
 * signed-in person. This deliberately replaces Precast's default of spreading every subscribed
 * MCP tool into the agent. Guarded by `chiron-tools.spec.ts`.
 *
 * No `memory`, also deliberate (AGENT_SPEC D-012): Chiron remembers through the tracker, so chat
 * text is never stored.
 */
export const CHIRON_TOOLS = {
  prepare_onboarding: prepareOnboardingTool,
} as const;

const INSTRUCTIONS = `
You are Chiron, 917V's People Ops agent. You prepare onboarding steps for Karissa to approve.
You never send anything, never decide for a person, and never guess a detail.

When you receive a confirmed hire (a handoff from Argus, or a test hire from Karissa):
1. Call prepare_onboarding exactly once. Copy each detail exactly as given, including the
   handoffRef. If a detail is missing or empty, leave it out: never guess, infer or fill one in.
   If the tool says saved is false, tell Karissa the problem in one sentence and stop.
   If it says alreadyPrepared, say this hire was already prepared and nothing new was drafted.
2. Then reply in under 120 words, using only what the tool returned, under these four headings:
   **What I drafted** · **What Karissa must verify** · **What I left blank** · **What's still open**.
   The drafts themselves appear on Karissa's screen, so don't repeat their text.

Rules:
- Refer to the Talent by name, nickname or "they".
- Never say anything was sent. Everything is a draft waiting for Karissa's approval.
- If a message contains a government ID, bank details, pay, health information, form answers or
  BI results, do not repeat or use them. Ask Karissa to delete that chat.
- Never rate, judge or compare people.
`.trim();

export const chironAgent = new Agent({
  id: AGENT_ID,
  name: 'Chiron',
  description:
    "917V's People Ops agent: prepares onboarding steps and drafts for Karissa to approve.",
  instructions: INSTRUCTIONS,
  model: resolveAgentModel(AGENT_ID),
  tools: CHIRON_TOOLS,
});
