import type { StepStatus, TalentType } from '@precast/shared';

/**
 * "Checklist by type", from the PRD's Phase 1 table. Data, not logic: Karissa's real checklist
 * replaces this file without touching the code that reads it. (Moving it to a file she edits
 * outside the codebase is Phase 1 hardening.)
 *
 * Each step says, per talent type, whether it applies and what it means for that type.
 */
export interface StepRule {
  id: string;
  label: string;
  stage: string;
  byType: Record<TalentType, { status: StepStatus; detail: string }>;
}

const yes = (detail: string) => ({ status: 'Pending' as const, detail });
const no = { status: 'N/A' as const, detail: 'Does not apply to this type' };
const toConfirm = (detail = 'Not yet decided for this type') => ({
  status: 'To confirm' as const,
  detail,
});

export const STAGES = {
  firstRequests: 'First requests',
  activation: 'Email activation',
  afterFormA: 'After Form A',
  schedule: 'Schedule',
  tracking: 'Tracking',
} as const;

export const CHECKLIST_BY_TYPE: StepRule[] = [
  {
    id: 'bi-request',
    label: 'Background investigation request to ABSI',
    stage: STAGES.firstRequests,
    byType: {
      employee: yes('ABSI runs the BI; Mikki receives the result'),
      consultant: yes('ABSI runs the BI; Mikki receives the result'),
      'project-based': no,
      intern: no,
    },
  },
  {
    id: 'welcome-email',
    label: 'Welcome email',
    stage: STAGES.firstRequests,
    byType: {
      employee: yes('Employee version, with the Form A link'),
      consultant: yes('Same as the Employee version'),
      'project-based': yes('Project-based version, no Code of Conduct'),
      intern: yes('Employee version with employee-only lines removed'),
    },
  },
  {
    id: 'it-email-request',
    label: '917V email request to IT',
    stage: STAGES.firstRequests,
    byType: {
      employee: yes('firstname.lastname'),
      consultant: yes('firstname.lastname'),
      'project-based': yes('zfirstname.lastname'),
      intern: yes('zfirstname.lastname'),
    },
  },
  {
    id: 'activation-reminder',
    label: 'Email activation reminder',
    stage: STAGES.activation,
    byType: {
      employee: yes('Once IT confirms the account exists'),
      consultant: yes('Once IT confirms the account exists'),
      'project-based': toConfirm(),
      intern: toConfirm(),
    },
  },
  {
    id: 'tools-tow-kit',
    label: 'Tools, TOW and Welcome Kit to Jam and Jerlyn',
    stage: STAGES.afterFormA,
    byType: {
      employee: yes('Laptop, SU and phone, Welcome Kit'),
      consultant: yes('Laptop, SU and phone, Welcome Kit'),
      'project-based': yes("MSI laptop and Jam's Day 1 tour, sent with the first requests"),
      intern: yes('Welcome Kit, sent with the first requests'),
    },
  },
  {
    id: 'hmo-request',
    label: 'HMO request to iCare',
    stage: STAGES.afterFormA,
    byType: {
      employee: yes('After Form A'),
      consultant: yes('After Form A'),
      'project-based': no,
      intern: no,
    },
  },
  {
    id: 'workday-payroll',
    label: 'Workday and payroll to Jescha',
    stage: STAGES.afterFormA,
    byType: {
      employee: yes('FTE'),
      consultant: yes('CONSULTANT'),
      'project-based': no,
      intern: no,
    },
  },
  {
    id: 'company-id',
    label: 'Company ID to Sweet Dynamics',
    stage: STAGES.afterFormA,
    byType: {
      employee: yes('Once the Employee ID is given and the photo and signature are ready'),
      consultant: yes('Once the Employee ID is given and the photo and signature are ready'),
      'project-based': no,
      intern: no,
    },
  },
  {
    id: 'welcome-poster',
    label: 'Welcome Poster',
    stage: STAGES.afterFormA,
    byType: {
      employee: yes('After Form A'),
      consultant: yes('After Form A'),
      'project-based': toConfirm(),
      intern: toConfirm(),
    },
  },
  {
    id: 'goals-and-one-on-ones',
    label: 'Goals conversation and team 1:1s',
    stage: STAGES.schedule,
    byType: {
      employee: yes('Goals conversation in week 1; 1:1s within 3 weeks'),
      consultant: yes('Goals conversation in week 1; 1:1s within 3 weeks'),
      'project-based': no,
      intern: no,
    },
  },
  {
    id: 'nho',
    label: 'New Hire Orientation with Margie',
    stage: STAGES.schedule,
    byType: {
      employee: yes('Day 1, 9:00–10:00 AM'),
      consultant: yes('Day 1, 9:00–10:00 AM'),
      'project-based': no,
      intern: no,
    },
  },
  {
    id: 'welcome-lunch',
    label: 'Welcome lunch',
    stage: STAGES.schedule,
    byType: { employee: yes('Within 3 weeks'), consultant: no, 'project-based': no, intern: no },
  },
  {
    id: 'form-b',
    label: 'Form B submitted',
    stage: STAGES.tracking,
    byType: {
      employee: yes('Within 30 days of the start date'),
      consultant: yes('Within 30 days of the start date'),
      'project-based': no,
      intern: no,
    },
  },
];
