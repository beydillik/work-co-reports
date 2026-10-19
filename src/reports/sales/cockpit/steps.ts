// The six checkpoints of the Sales cockpit (REQUIREMENTS §6, draft sequence).
// Each step is a placeholder for now; real checks are added step by step.
import type { CheckStatus } from '../../../checks/types';

export interface CockpitStep {
  id: string;
  title: string;
  description: string;
  /** Placeholder status until the real check is implemented. */
  status: CheckStatus;
}

export const salesCockpitSteps: CockpitStep[] = [
  { id: 'upload', title: 'Upload', description: 'Select the period and upload source files. Structure, data types and period are validated.', status: 'open' },
  { id: 'master-data', title: 'Master data', description: 'Materials without master data are listed and completed (customer, part family, weight).', status: 'open' },
  { id: 'scope', title: 'Account / scope', description: 'Unexpected accounts, profit centers or document types are flagged.', status: 'open' },
  { id: 'reconciliation', title: 'Reconciliation', description: 'Sales per month compared with P&L totals; differences outside tolerance need an explanation.', status: 'open' },
  { id: 'preview', title: 'Preview', description: 'The report is rendered with the new period.', status: 'open' },
  { id: 'approval', title: 'Approval', description: 'The period is locked, a snapshot is stored and an audit entry is written.', status: 'open' },
];
