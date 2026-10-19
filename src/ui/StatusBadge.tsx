// Small coloured label showing a check status (open / warning / passed).
import type { CheckStatus } from '../checks/types';

const LABELS: Record<CheckStatus, string> = { open: 'Open', warning: 'Warning', passed: 'Passed' };

export function StatusBadge({ status }: { status: CheckStatus }) {
  return <span className={`badge badge-${status}`}>{LABELS[status]}</span>;
}
