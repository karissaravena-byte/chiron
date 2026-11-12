import { randomUUID } from 'node:crypto';
import { SENSITIVE_INPUT_REPLY, sensitiveKinds, stringsIn } from '@precast/shared';

/**
 * AGENT_SPEC F36: screen every incoming A2A message BEFORE the model, memory or logs see it.
 * On a match the turn is answered here with a fixed reply asking Karissa to delete the chat;
 * the message never reaches Mastra. Logs record only the kinds found, never the text.
 *
 * Runs after auth (an unauthenticated caller gets 401, not a hint about the screen) and before
 * the A2UI and onboarding-prep middleware.
 */

interface ScreenContext {
  req: { method: string; path: string; header: (name: string) => string | undefined; raw: Request };
  res: Response;
}

type Logger = { warn: (msg: string, meta?: unknown) => void };

const isA2aExecution = (c: ScreenContext) =>
  c.req.method === 'POST' && /^\/api\/a2a\/[^/]+\/?$/.test(c.req.path);

/** The text a person or agent sent: every string inside the message's parts. */
export function inboundMessageText(body: unknown): string[] {
  const params = (body as { params?: { message?: { parts?: unknown } } } | null)?.params;
  return stringsIn(params?.message?.parts ?? []);
}

/** The JSON-RPC reply that stands in for the agent's answer, for either A2A wire. */
export function sensitiveInputReply(id: unknown, wire: '0.3' | '1.0'): unknown {
  const part =
    wire === '1.0'
      ? { text: SENSITIVE_INPUT_REPLY }
      : { kind: 'text', text: SENSITIVE_INPUT_REPLY };
  const message =
    wire === '1.0'
      ? { role: 'ROLE_AGENT', messageId: randomUUID(), parts: [part] }
      : { kind: 'message', role: 'agent', messageId: randomUUID(), parts: [part] };
  return { jsonrpc: '2.0', id: id ?? null, result: message };
}

export function createSensitiveInputMiddleware(log: Logger = console) {
  return async (c: ScreenContext, next: () => Promise<void>): Promise<Response | void> => {
    if (!isA2aExecution(c)) return next();

    let body: unknown;
    try {
      body = JSON.parse(await c.req.raw.clone().text());
    } catch {
      return next();
    }

    const kinds = [...new Set(inboundMessageText(body).flatMap((t) => sensitiveKinds(t)))];
    if (!kinds.length) return next();

    log.warn('Incoming message blocked by the sensitive-input screen', { kinds });
    const wire = c.req.header('A2A-Version')?.trim() === '1.0' ? '1.0' : '0.3';
    const id = (body as { id?: unknown } | null)?.id;
    return new Response(JSON.stringify(sensitiveInputReply(id, wire)), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-chiron-screened': 'sensitive-input' },
    });
  };
}

export const sensitiveInputMiddleware = createSensitiveInputMiddleware();
