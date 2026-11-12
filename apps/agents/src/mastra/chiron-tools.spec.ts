import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * CH-AGT-2: fitness guard for AGENT_SPEC rules 5–6 and F37. The model must never hold a raw
 * connector tool, and Chiron must never act on behalf of the signed-in person. Precast's default
 * agent spreads every subscribed MCP tool into the model's toolset; for Chiron that would let the
 * model send an email without an approval, from Karissa's own account.
 */

const ROOT = join(__dirname);
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) return filesUnder(rel);
    return /\.ts$/.test(name) && !/\.spec\.ts$/.test(name) ? [rel] : [];
  });
}

describe('Chiron sees only its own tools (CH-AGT-2)', () => {
  const chiron = read('agents/chiron.ts');

  it('does not spread subscribed MCP tools into the model', () => {
    expect(chiron).not.toMatch(/createAgentMcpToolset|resolveAgentMcpTools|mcpTools/);
  });

  it('passes a fixed tool object, not a function of the caller', () => {
    expect(chiron).toMatch(/tools:\s*CHIRON_TOOLS\b/);
  });

  it('has no chat memory (D-012)', () => {
    expect(chiron).not.toMatch(/\bmemory\s*:/);
  });

  it("none of Chiron's tools reach a connector on behalf of the caller", () => {
    const sources = [...filesUnder('tools'), ...filesUnder('onboarding')]
      .filter((f) => !/example-tool|show-card/.test(f))
      .map((f) => [f, read(f)] as const);
    for (const [file, src] of sources) {
      expect(src, file).not.toMatch(/currentOnBehalfOf|resolveOnBehalfOf|attachOnBehalfOf/);
      expect(src, file).not.toMatch(/createAgentMcpToolset|resolveAgentMcpTools/);
    }
  });
});
