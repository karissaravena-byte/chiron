import type { HireDetails } from '@precast/shared';

/**
 * TEST DATA: stand-ins for Argus's handoff of a confirmed hire, until Argus is connected over
 * A2A. Every person, address and number here is fictional; personal emails use example.com.
 * Each one exercises a PRD acceptance test (noted beside it) so the first preview shows the
 * rules working, not just the happy path.
 */
export interface TestHire {
  id: string;
  /** Why this hire is in the list, in Karissa's words. */
  scenario: string;
  details: HireDetails;
}

export const TEST_HIRES: TestHire[] = [
  {
    // SMOKE-1: Employee, level Mid, every detail given.
    id: 'andi-dela-cruz',
    scenario: 'Employee with every detail given',
    details: {
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
    },
  },
  {
    // ON-1 + ON-4: Project-based, starting on a Monday.
    id: 'migs-bautista',
    scenario: 'Project-based, starting on a Monday',
    details: {
      lastName: 'Bautista',
      firstName: 'Miguel',
      middleName: 'Ocampo',
      nickname: 'Migs',
      personalEmail: 'migs.bautista@example.com',
      mobile: '+63 917 555 0187',
      startDate: '2026-11-23',
      position: 'QA Tester',
      group: 'Platform Engineering',
      costCenter: 'PE-330',
      manager: 'Leah Tan',
      talentType: 'project-based',
    },
  },
  {
    // ON-2: Intern.
    id: 'bea-lim',
    scenario: 'Intern',
    details: {
      lastName: 'Lim',
      firstName: 'Beatriz',
      middleName: 'Uy',
      nickname: 'Bea',
      personalEmail: 'bea.lim@example.com',
      mobile: '+63 917 555 0119',
      startDate: '2026-12-02',
      position: 'Marketing Intern',
      group: 'Growth',
      costCenter: 'GR-120',
      manager: 'Carlo Mendoza',
      talentType: 'intern',
    },
  },
  {
    // ON-3: cost center missing. Also a Consultant at level High (ManCom 1:1s) with a
    // two-word first name.
    id: 'raffy-garcia',
    scenario: 'Consultant, level High, cost center missing',
    details: {
      lastName: 'Garcia',
      firstName: 'Jose Rafael',
      middleName: 'Ramos',
      nickname: 'Raffy',
      personalEmail: 'raffy.garcia@example.com',
      mobile: '+63 917 555 0163',
      startDate: '2026-12-07',
      position: 'Data Strategy Consultant',
      group: 'Data & Insights',
      manager: 'Nina Aquino',
      talentType: 'consultant',
      level: 'High',
    },
  },
];

/** The message Argus would send Chiron for this hire. */
export function handoffMessage(hire: TestHire): string {
  return [
    'Handoff from Argus (test): Mikki has confirmed this hire. Please prepare their onboarding.',
    '',
    JSON.stringify({ handoffRef: `test:${hire.id}`, ...hire.details }, null, 2),
  ].join('\n');
}
