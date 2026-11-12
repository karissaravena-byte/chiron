import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Security guard (CH-WEB-3): every Chiron page that reads the tracker checks sign-in first.
 * Next renders a layout and its page in parallel, so the `(chiron)` layout's `requireUser()`
 * does not stop a page's own query. Each page must call `requireUser()` before `chironDb(`.
 */
const CHIRON_DIR = fileURLToPath(new URL('../app/(chiron)', import.meta.url));

function pages(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) pages(abs, acc);
    else if (entry === 'page.tsx') acc.push(abs);
  }
  return acc;
}

const readers = pages(CHIRON_DIR)
  .map((file) => ({ file, src: readFileSync(file, 'utf8') }))
  .filter(({ src }) => src.includes('chironDb('));

describe('Chiron pages check sign-in before reading the tracker (CH-WEB-3)', () => {
  it('finds the pages that read the tracker', () => {
    expect(readers.length).toBeGreaterThanOrEqual(4);
  });

  for (const { file, src } of readers) {
    it(relative(CHIRON_DIR, file), () => {
      const auth = src.indexOf('await requireUser()');
      expect(auth, 'calls await requireUser()').toBeGreaterThan(-1);
      expect(auth, 'before the first chironDb(').toBeLessThan(src.indexOf('chironDb('));
    });
  }
});
