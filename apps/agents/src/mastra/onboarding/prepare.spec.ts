import { describe, expect, it } from 'vitest';
import { assertNoSensitive, TALENT_TYPES, type HireDetails } from '@precast/shared';
import { PILOT, prepareOnboarding, requestedCompanyEmail } from './prepare';

const TODAY = new Date('2026-11-10T00:00:00Z');

const employee: HireDetails = {
  lastName: 'Dela Cruz',
  firstName: 'Andrea',
  middleName: 'Santos',
  nickname: 'Andi',
  personalEmail: 'andi.delacruz@example.com',
  mobile: '+63 917 555 0142',
  startDate: '2026-12-01',
  position: 'Product Designer',
  group: 'Venture Studio',
  costCenter: 'VS-210',
  manager: 'Paolo Reyes',
  talentType: 'employee',
  level: 'Mid',
};

const status = (prep: ReturnType<typeof prepareOnboarding>, id: string) =>
  prep.checklist.find((s) => s.id === id)?.status;

describe('prepareOnboarding (PoC slice)', () => {
  it('SMOKE-1: Employee Mid gets the Employee checklist and three drafts, all addressed to Karissa', () => {
    const prep = prepareOnboarding(employee, TODAY);
    expect(prep.missing).toEqual([]);
    expect(prep.drafts.map((d) => d.id)).toEqual([
      'bi-request',
      'welcome-email',
      'it-email-request',
    ]);
    expect(prep.drafts.every((d) => d.to === PILOT.recipient)).toBe(true);
    expect(status(prep, 'welcome-lunch')).toBe('Pending');
    expect(status(prep, 'hmo-request')).toBe('Pending');
  });

  it('ON-1: Project-based has no BI, no Code of Conduct, no form link, and a z-address', () => {
    const prep = prepareOnboarding(
      { ...employee, talentType: 'project-based', level: undefined, startDate: '2026-12-02' },
      TODAY,
    );
    expect(prep.drafts.map((d) => d.id)).not.toContain('bi-request');
    const welcome = prep.drafts.find((d) => d.id === 'welcome-email')!.body;
    expect(welcome).not.toMatch(/Code of Conduct|Form A/);
    expect(requestedCompanyEmail({ ...employee, talentType: 'project-based' })).toBe(
      'zandrea.delacruz@917ventures.com',
    );
  });

  it('ON-2: Intern welcome has no Employee ID, form link, guide or NHO; keeps intro and shirt size', () => {
    const prep = prepareOnboarding({ ...employee, talentType: 'intern', level: undefined }, TODAY);
    const welcome = prep.drafts.find((d) => d.id === 'welcome-email')!.body;
    expect(welcome).not.toMatch(/Employee ID|Form A|onboarding guide|Orientation/);
    expect(welcome).toMatch(/intro about yourself/);
    expect(welcome).toMatch(/shirt size/);
  });

  it('ON-3: a missing cost center is listed, Mikki gets a note, other drafts continue', () => {
    const prep = prepareOnboarding({ ...employee, costCenter: undefined }, TODAY);
    expect(prep.missing).toEqual(['Cost center']);
    expect(prep.drafts[0]!.id).toBe('note-to-mikki');
    expect(prep.drafts).toHaveLength(4);
  });

  it('ON-4: a project-based Monday start is flagged and left unchanged', () => {
    const prep = prepareOnboarding(
      { ...employee, talentType: 'project-based', level: undefined, startDate: '2026-11-23' },
      TODAY,
    );
    expect(prep.talent.startDate).toMatch(/Mon, Nov 23, 2026/);
    expect(prep.summary.open.some((o) => /Monday/.test(o))).toBe(true);
  });

  it('never fills in an address for a real recipient', () => {
    const prep = prepareOnboarding(employee, TODAY);
    const bi = prep.drafts.find((d) => d.id === 'bi-request')!;
    expect(bi.realRecipient).toBe('ABSI');
    expect(bi.body).not.toMatch(/@(?!example\.com)/);
  });

  it('drafts for every talent type pass the sensitive-data screen, so the tracker can save them', () => {
    for (const talentType of TALENT_TYPES) {
      const prep = prepareOnboarding({ ...employee, talentType }, TODAY);
      expect(() => assertNoSensitive(prep), talentType).not.toThrow();
    }
  });
});
