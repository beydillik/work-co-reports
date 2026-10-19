// Shared result types for cockpit checkpoints.
// Every check returns the same structure so the cockpit can show any check uniformly.

/** Step / check status as shown in the cockpit (REQUIREMENTS §6). */
export type CheckStatus = 'open' | 'warning' | 'passed';

export interface CheckResult<Row = unknown> {
  status: CheckStatus;
  message: string;
  /** Rows the controller should look at (e.g. materials without master data). */
  affectedRows: Row[];
}
