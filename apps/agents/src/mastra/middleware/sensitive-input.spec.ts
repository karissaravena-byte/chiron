import { describe, expect, it, vi } from 'vitest';
import { SENSITIVE_INPUT_REPLY } from '@precast/shared';
import { createSensitiveInputMiddleware } from './sensitive-input';

function ctx(text: string, opts: { path?: string; wire?: string } = {}) {
  const body = {
    jsonrpc: '2.0',
    id: 'req-1',
    method: 'message/send',
    params: {
      message: { kind: 'message', role: 'user', messageId: 'm1', parts: [{ kind: 'text', text }] },
    },
  };
  const raw = new Request('http://agents.test/api/a2a/chiron', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return {
    req: {
      method: 'POST',
      path: opts.path ?? '/api/a2a/chiron',
      header: (n: string) => (n === 'A2A-Version' ? opts.wire : undefined),
      raw,
    },
    res: new Response('{}'),
  };
}

describe('sensitive-input screen (CH-GUARD-1, AGENT_SPEC F36)', () => {
  it('blocks a government ID before the agent runs, and never logs the text', async () => {
    const warn = vi.fn();
    const next = vi.fn(async () => {});
    const res = await createSensitiveInputMiddleware({ warn })(
      ctx('Her SSS is 34-1234567-8, please add it'),
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res).toBeInstanceOf(Response);
    const body = await (res as Response).json();
    expect(body.id).toBe('req-1');
    expect(body.result.parts[0].text).toBe(SENSITIVE_INPUT_REPLY);
    expect(JSON.stringify(body)).not.toContain('34-1234567-8');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('34-1234567-8');
    expect(warn.mock.calls[0]?.[1]).toEqual({ kinds: ['government-id'] });
  });

  it('blocks a bank number on the A2A 1.0 wire too', async () => {
    const next = vi.fn(async () => {});
    const res = await createSensitiveInputMiddleware({ warn: () => {} })(
      ctx('BPI account 001234567890', { wire: '1.0' }),
      next,
    );
    expect(next).not.toHaveBeenCalled();
    const body = await (res as Response).json();
    expect(body.result.role).toBe('ROLE_AGENT');
    expect(body.result.parts[0].text).toBe(SENSITIVE_INPUT_REPLY);
  });

  it('lets an ordinary handoff through', async () => {
    const next = vi.fn(async () => {});
    const res = await createSensitiveInputMiddleware({ warn: () => {} })(
      ctx('Form A submitted for Andi. Mobile +63 917 555 0142'),
      next,
    );
    expect(next).toHaveBeenCalledOnce();
    expect(res).toBeUndefined();
  });

  it('ignores routes other than A2A execution', async () => {
    const next = vi.fn(async () => {});
    await createSensitiveInputMiddleware({ warn: () => {} })(
      ctx('TIN 123-456-789-000', { path: '/api/.well-known/chiron/agent-card.json' }),
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
