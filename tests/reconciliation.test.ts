// Unit tests for the reconciliation check: rule cases first, then a run
// against the synthetic sample files (sample-data/), which contain a known
// 1,250.00 EUR difference in 2026-08.
import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { reconcile } from '../src/checks/reconciliation';

describe('reconcile', () => {
  it('passes when totals are equal', () => {
    const result = reconcile(1000, 1000, 0);
    expect(result.status).toBe('passed');
    expect(result.difference).toBe(0);
  });

  it('passes when the difference equals the tolerance', () => {
    expect(reconcile(1010, 1000, 10).status).toBe('passed');
  });

  it('warns when the difference is outside the tolerance and keeps the sign', () => {
    const result = reconcile(1000, 1010.5, 10);
    expect(result.status).toBe('warning');
    expect(result.difference).toBeCloseTo(-10.5, 10);
  });

  it('ignores floating-point noise from summing decimals', () => {
    expect(reconcile(0.1 + 0.2, 0.3, 0).status).toBe('passed');
  });

  it('rejects a negative tolerance', () => {
    expect(() => reconcile(1, 1, -1)).toThrow();
  });
});

// Reads one sheet into objects keyed by header. Column names are the
// HYPOTHETICAL ones from scripts/generate-sample-data.ts.
async function readSheet(file: string): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const sheet = workbook.worksheets[0];
  const headers = (sheet.getRow(1).values as unknown[]).slice(1) as string[];
  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const values = (row.values as unknown[]).slice(1);
    rows.push(Object.fromEntries(headers.map((h, i) => [h, values[i]])));
  });
  return rows;
}

describe('reconcile with sample data', () => {
  it('finds exactly the deliberate P&L difference in 2026-08', async () => {
    const actual = await readSheet('sample-data/sap_actual_sales.xlsx');
    const pl = await readSheet('sample-data/pl_totals.xlsx');

    const salesByPeriod = new Map<string, number>();
    for (const row of actual) {
      const key = `${row['Fiscal Year']}-${row['Posting Period']}`;
      salesByPeriod.set(key, (salesByPeriod.get(key) ?? 0) + (row['Net Value'] as number));
    }

    const warnings = pl
      .map((row) => {
        const key = `${row['Fiscal Year']}-${row['Posting Period']}`;
        return { key, result: reconcile(salesByPeriod.get(key) ?? 0, row['Amount EUR'] as number, 1) };
      })
      .filter((r) => r.result.status === 'warning');

    expect(pl).toHaveLength(21);
    expect(warnings.map((w) => w.key)).toEqual(['2026-8']);
    expect(warnings[0].result.difference).toBeCloseTo(-1250, 6);
  });
});
