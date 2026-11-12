/**
 * Chiron's sensitive-data detector (AGENT_SPEC F35, DATA_MODEL invariant 1).
 *
 * Chiron must never store, log or pass to the model: government IDs, bank or card numbers, pay,
 * health information, BI results, reasons for leaving, or credentials. This is the one place
 * that decides what "looks like" one of those. A hit REJECTS a database write and blocks an
 * incoming message; logs get the redacted form.
 *
 * Honest limit: these are patterns. They catch numbers in the usual Philippine formats and the
 * usual words, not every way a person could describe something sensitive in prose. Mobile and
 * landline numbers are deliberately allowed, because a Talent's mobile is a required detail.
 */

export type SensitiveKind =
  | 'government-id'
  | 'card-number'
  | 'long-number'
  | 'pay'
  | 'health'
  | 'bi-result'
  | 'reason-for-leaving'
  | 'credential';

export const SENSITIVE_KIND_LABELS: Record<SensitiveKind, string> = {
  'government-id': 'a government ID number',
  'card-number': 'a card number',
  'long-number': 'a long number that could be a bank account or ID',
  pay: 'pay information',
  health: 'health information',
  'bi-result': 'a background investigation result',
  'reason-for-leaving': 'a reason for leaving',
  credential: 'a password or login',
};

export interface SensitiveHit {
  kind: SensitiveKind;
  start: number;
  end: number;
}

interface Rule {
  kind: SensitiveKind;
  pattern: RegExp;
  /** Extra check on the matched text; false discards the match. */
  accept?: (match: string) => boolean;
}

const digitsOf = (s: string) => s.replace(/\D/g, '');

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Philippine mobile and landline shapes: +63 9xx…, 09xx…, +63 2…, 02…. */
function looksLikePhone(match: string): boolean {
  const trimmed = match.trim();
  const d = digitsOf(trimmed);
  if (trimmed.startsWith('+')) return true;
  if (/^09\d{9}$/.test(d)) return true;
  if (/^639\d{9}$/.test(d)) return true;
  if (/^(02|632)\d{7,8}$/.test(d)) return true;
  return false;
}

const RULES: Rule[] = [
  // Government IDs in their printed formats.
  { kind: 'government-id', pattern: /\b\d{3}-\d{3}-\d{3}(?:-\d{3,5})?\b/g }, // TIN
  { kind: 'government-id', pattern: /\b\d{2}-\d{7}-\d\b/g }, // SSS
  { kind: 'government-id', pattern: /\b\d{2}-\d{9}-\d\b/g }, // PhilHealth
  { kind: 'government-id', pattern: /\b\d{4}-\d{4}-\d{4}\b/g }, // Pag-IBIG MID
  { kind: 'government-id', pattern: /\b\d{4}-\d{7}-\d\b/g }, // UMID CRN
  { kind: 'government-id', pattern: /\b[A-Z]\d{7}[A-Z]\b/g }, // Passport (current format)
  {
    kind: 'government-id',
    pattern:
      /\b(?:TIN|SSS|PhilHealth|Pag-?IBIG|UMID|passport|driver'?s licen[cs]e)\s*(?:no\.?|number|#)?\s*[:=-]?\s*[A-Z0-9][A-Z0-9 -]{5,}/gi,
  },
  // Card numbers: 13–19 digits, optionally grouped, passing the Luhn check.
  {
    kind: 'card-number',
    pattern: /(?<![\d+])(?:\d[ -]?){12,18}\d(?!\d)/g,
    accept: (m) => !looksLikePhone(m) && luhnValid(digitsOf(m)),
  },
  // Any other long digit run (bank accounts, unformatted IDs), unless it's shaped like a phone.
  {
    kind: 'long-number',
    pattern: /(?<![\d])\+?(?:\d[ -]?){9,18}\d(?!\d)/g,
    accept: (m) => !looksLikePhone(m) && digitsOf(m).length >= 10,
  },
  // Pay.
  { kind: 'pay', pattern: /(?:₱|\bPHP\s?)\s?\d[\d,]*(?:\.\d+)?/gi },
  {
    kind: 'pay',
    pattern:
      /\b(?:salary|basic pay|base pay|monthly pay|compensation|take-?home|sweldo|final pay amount)\b[^.\n]{0,20}\d[\d,]{2,}/gi,
  },
  // Health.
  {
    kind: 'health',
    pattern:
      /\b(?:diagnos(?:is|ed|es)|medical condition|illness|pregnan(?:t|cy)|disabilit(?:y|ies)|HIV|cancer|diabet(?:es|ic)|depression|anxiety disorder|prescription|surgery|hospitali[sz]ed)\b/gi,
  },
  // BI results (BI *processed* is allowed; the result never is).
  {
    kind: 'bi-result',
    pattern:
      /\b(?:BI|background (?:investigation|check))\s+(?:results?|findings?|report|came back|flagged|hit)\b|\b(?:derogatory record|criminal record|NBI hit)\b/gi,
  },
  // Reasons for leaving.
  {
    kind: 'reason-for-leaving',
    pattern:
      /\breason (?:for|of) (?:leaving|resign(?:ing|ation)|separation)\b|\b(?:resign(?:ed|ing|s)?|leaving|quit(?:ting)?)\s+(?:because|due to)\b|\b(?:terminated|fired|dismissed) for\b/gi,
  },
  // Credentials.
  {
    kind: 'credential',
    pattern: /\b(?:password|passcode|pwd|temporary login|login code)\s*(?:is|:|=)\s*\S+/gi,
  },
];

/** Every sensitive-looking span in `text`, in order, overlaps merged to the first rule. */
export function findSensitive(text: string): SensitiveHit[] {
  if (!text) return [];
  const hits: SensitiveHit[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const m of text.matchAll(rule.pattern)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (rule.accept && !rule.accept(m[0])) continue;
      if (hits.some((h) => start < h.end && end > h.start)) continue;
      hits.push({ kind: rule.kind, start, end });
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

export function containsSensitive(text: string): boolean {
  return findSensitive(text).length > 0;
}

/** The kinds found, de-duplicated, for logs and refusals (never the matched text). */
export function sensitiveKinds(text: string): SensitiveKind[] {
  return [...new Set(findSensitive(text).map((h) => h.kind))];
}

/** `text` with every hit replaced by `[removed: <kind>]`, for logs. */
export function redactSensitive(text: string): string {
  let out = '';
  let at = 0;
  for (const h of findSensitive(text)) {
    out += text.slice(at, h.start) + `[removed: ${h.kind}]`;
    at = h.end;
  }
  return out + text.slice(at);
}

/** Every string inside a JSON-ish value, for checking a whole record at once. */
export function stringsIn(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) stringsIn(v, out);
  else if (value && typeof value === 'object')
    for (const v of Object.values(value)) stringsIn(v, out);
  return out;
}

export class SensitiveDataError extends Error {
  constructor(public readonly kinds: SensitiveKind[]) {
    super(
      `Refused: this looks like it contains ${kinds.map((k) => SENSITIVE_KIND_LABELS[k]).join(', ')}, which Chiron never stores.`,
    );
    this.name = 'SensitiveDataError';
  }
}

/** Throws `SensitiveDataError` when any string in `value` looks sensitive. */
export function assertNoSensitive(value: unknown): void {
  const kinds = [...new Set(stringsIn(value).flatMap((s) => sensitiveKinds(s)))];
  if (kinds.length) throw new SensitiveDataError(kinds);
}

/** The fixed reply to a message that looked sensitive (AGENT_SPEC F36, DESIGN_SYSTEM §5). */
export const SENSITIVE_INPUT_REPLY =
  "That message looked like it contained private information, so I didn't read it or keep it. " +
  'Please delete that message from this chat. If you meant to tell me a step is done, say just ' +
  'that, for example "Form A submitted" or "BI processed".';
