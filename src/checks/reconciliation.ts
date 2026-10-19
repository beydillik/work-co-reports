// Reconciliation check: compares a total from the report data with the
// corresponding total from the P&L (REQUIREMENTS §6 step 4).
//
// Finance rules (CLAUDE.md):
//   - The difference is returned unrounded; rounding happens only for display.
//   - A difference within the tolerance passes; outside it is a warning that
//     needs an explanation before approval.
// Tolerance is an absolute amount in the same currency for now. Whether a
// percentage tolerance is also needed is open (REQUIREMENTS §10.4).
import type { CheckResult } from './types';

export interface ReconciliationResult extends CheckResult<never> {
  /** Report total minus P&L total, unrounded. Positive = report is higher. */
  difference: number;
}

// Sums of many decimal amounts carry tiny binary floating-point noise
// (e.g. 0.1 + 0.2 = 0.30000000000000004). A difference that exceeds the
// tolerance by less than this is treated as within tolerance.
const FLOAT_NOISE = 1e-6;

export function reconcile(reportTotal: number, plTotal: number, tolerance: number): ReconciliationResult {
  if (tolerance < 0) throw new Error('Tolerance must not be negative.');
  const difference = reportTotal - plTotal;
  const withinTolerance = Math.abs(difference) <= tolerance + FLOAT_NOISE;
  return {
    status: withinTolerance ? 'passed' : 'warning',
    message: withinTolerance
      ? 'Report total matches the P&L total within tolerance.'
      : 'Report total differs from the P&L total by more than the tolerance. An explanation is required before approval.',
    affectedRows: [],
    difference,
  };
}
