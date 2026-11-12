import { describe, expect, it } from 'vitest';
import {
  SensitiveDataError,
  assertNoSensitive,
  findSensitive,
  redactSensitive,
  sensitiveKinds,
} from './sensitive.js';

// Fictional values in real formats. None of these belong to anyone.
const MUST_CATCH: Array<[string, string]> = [
  ['TIN', 'My TIN is 123-456-789-000'],
  ['SSS', 'SSS 34-1234567-8 for payroll'],
  ['PhilHealth', 'PhilHealth: 12-345678901-2'],
  ['Pag-IBIG', 'Pag-IBIG MID 1234-5678-9012'],
  ['UMID', 'CRN 0111-2345678-9'],
  ['passport', 'passport P1234567A'],
  ['labelled ID', 'Passport no. EC1234567'],
  ['card', 'card 4111 1111 1111 1111'],
  ['bank account', 'BDO account 001234567890'],
  ['pay in pesos', 'Her offer is ₱85,000 a month'],
  ['pay words', 'basic pay of 60,000'],
  ['health', 'He was diagnosed with diabetes last year'],
  ['BI result', 'The BI result came back clean'],
  ['BI flagged', 'background check flagged something'],
  ['reason for leaving', 'Reason for leaving: better offer'],
  ['leaving because', 'She is resigning because of her manager'],
  ['password', 'Your temporary password: Welcome123!'],
];

const MUST_ALLOW: Array<[string, string]> = [
  ['mobile +63', 'Mobile: +63 917 555 0142'],
  ['mobile 09', 'Call 09175550142'],
  ['landline', 'Office line 02 8123 4567'],
  ['date', 'Start date: 2026-12-01'],
  ['cost center', 'Cost center: VS-210'],
  ['BI processed', 'BI processed for Andi'],
  ['BI request', 'Background investigation request: Andrea Santos Dela Cruz'],
  ['password reset', 'with a password reset on first login'],
  ['resignation', 'Margie confirmed the resignation; last day Dec 15'],
  ['form status', 'Form A submitted'],
];

describe('findSensitive (CH-GUARD-1, DATA_MODEL invariant 1)', () => {
  it.each(MUST_CATCH)('catches %s', (_label, text) => {
    expect(findSensitive(text).length).toBeGreaterThan(0);
  });

  it.each(MUST_ALLOW)('allows %s', (_label, text) => {
    expect(findSensitive(text)).toEqual([]);
  });

  it('redacts without echoing the value', () => {
    const out = redactSensitive('SSS 34-1234567-8, mobile +63 917 555 0142');
    expect(out).not.toContain('34-1234567-8');
    expect(out).toContain('[removed: government-id]');
    expect(out).toContain('+63 917 555 0142');
  });

  it('reports kinds, never the matched text', () => {
    expect(sensitiveKinds('TIN 123-456-789-000 and ₱50,000')).toEqual(['government-id', 'pay']);
  });

  it('assertNoSensitive refuses a record with a sensitive string anywhere inside', () => {
    expect(() => assertNoSensitive({ note: 'ok', nested: ['salary 90,000'] })).toThrow(
      SensitiveDataError,
    );
    expect(() => assertNoSensitive({ note: 'Form A submitted' })).not.toThrow();
  });
});
