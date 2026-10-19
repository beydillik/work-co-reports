// Generates SYNTHETIC sample files for the Sales Report pilot into sample-data/.
// All names, codes and amounts are invented; no real company data (CLAUDE.md hard rule 1).
//
// Output (Excel, like the real sources):
//   sap_actual_sales.xlsx  – SAP-like billing export, one row per billing item (ACT)
//   budget.xlsx            – HQ-style budget, customer × part family, months as columns (BUD)
//   material_master.xlsx   – material → customer, part family, weight per piece
//   pl_totals.xlsx         – monthly sales totals from the P&L (for reconciliation)
//
// Deliberate issues so the cockpit checks have something to find:
//   - Some materials sold in the last actual month are missing from the material master.
//   - One month's P&L total differs slightly from the sum of the SAP export.
//
// The random generator is seeded, so every run produces the same values.
//
// HYPOTHETICAL COLUMNS – all column names and layouts below are assumptions.
// Replace them when real sample files arrive (REQUIREMENTS.md §10.2); the adapters
// in src/adapters/ will then be written against the real layouts.

import ExcelJS from 'exceljs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_DIR = resolve('sample-data');

// --- Settings ---------------------------------------------------------------

const SEED = 20261019;
const ACTUAL_FROM = { year: 2025, month: 1 };
const ACTUAL_TO = { year: 2026, month: 9 }; // last closed period in the sample
const BUDGET_YEAR = 2026;
const CUSTOMERS = 12;
const MATERIALS = 60;
const MISSING_IN_MASTER = 4; // new materials that appear only in the last actual month
const PART_FAMILIES = ['PF-A', 'PF-B', 'PF-C', 'PF-D', 'PF-E'];
const PROFIT_CENTERS = ['PC-100', 'PC-200'];
const COMPANY_CODE = 'CC01';
// Period whose P&L total is deliberately off, and by how much (EUR).
const PL_DIFF_PERIOD = { year: 2026, month: 8 };
const PL_DIFF_EUR = 1250;

// Fixed date stamped into the workbook properties so files do not change on every run.
const FIXED_DATE = new Date(Date.UTC(2026, 0, 1));

// --- Seeded random numbers ---------------------------------------------------

// mulberry32: small, well-known deterministic PRNG; returns a float in [0, 1).
function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(SEED);
const between = (min: number, max: number) => min + random() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
// Source systems deliver amounts with 2 decimals; we work in cents to avoid float drift in sums.
const toCents = (value: number) => Math.round(value * 100);

// --- Master data ---------------------------------------------------------------

interface Material {
  material: string;
  description: string;
  customer: string;
  partFamily: string;
  profitCenter: string;
  weightKgPerPc: number;
  priceEurPerPc: number;
}

const customers = Array.from({ length: CUSTOMERS }, (_, i) => `CUST-${String(i + 1).padStart(3, '0')}`);

const materials: Material[] = Array.from({ length: MATERIALS + MISSING_IN_MASTER }, (_, i) => {
  const partFamily = pick(PART_FAMILIES);
  const weightKgPerPc = Number(between(0.2, 12).toFixed(3));
  return {
    material: `MAT-${10001 + i}`,
    description: `Sample part ${partFamily} ${i + 1}`,
    customer: pick(customers),
    partFamily,
    profitCenter: pick(PROFIT_CENTERS),
    weightKgPerPc,
    // Price roughly proportional to weight, with variation per part.
    priceEurPerPc: Number((weightKgPerPc * between(3, 9)).toFixed(2)),
  };
});
const knownMaterials = materials.slice(0, MATERIALS);
const newMaterials = materials.slice(MATERIALS);

// --- Periods and FX ------------------------------------------------------------

interface Period {
  year: number;
  month: number;
}

function periodsBetween(from: Period, to: Period): Period[] {
  const result: Period[] = [];
  for (let y = from.year, m = from.month; y < to.year || (y === to.year && m <= to.month); ) {
    result.push({ year: y, month: m });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return result;
}

const actualPeriods = periodsBetween(ACTUAL_FROM, ACTUAL_TO);
const samePeriod = (a: Period, b: Period) => a.year === b.year && a.month === b.month;
const lastDay = (p: Period) => new Date(Date.UTC(p.year, p.month, 0));

// Synthetic EUR→TRY rate per period, drifting upwards (illustrative only).
const fxRate = new Map<string, number>();
actualPeriods.forEach((p, i) => fxRate.set(`${p.year}-${p.month}`, Number((36 + i * 0.6 + between(-0.3, 0.3)).toFixed(4))));

// --- Actual sales (SAP export) --------------------------------------------------

// HYPOTHETICAL COLUMNS
const SAP_COLUMNS = [
  'Company Code',
  'Fiscal Year',
  'Posting Period',
  'Billing Document',
  'Item',
  'Billing Date',
  'Material',
  'Sold-to Party',
  'Profit Center',
  'Billed Quantity',
  'Sales Unit',
  'Net Weight',
  'Weight Unit',
  'Net Value',
  'Document Currency',
  'Net Value LC',
  'Local Currency',
] as const;

const actualRows: (string | number | Date)[][] = [];
const actualEurCentsByPeriod = new Map<string, number>();
const actualTryCentsByPeriod = new Map<string, number>();
let billingNo = 90000001;

for (const period of actualPeriods) {
  const key = `${period.year}-${period.month}`;
  const rate = fxRate.get(key)!;
  // New materials appear only in the last period → master-data check finds them.
  const sold = samePeriod(period, ACTUAL_TO) ? [...knownMaterials, ...newMaterials] : knownMaterials;
  for (const mat of sold) {
    if (random() < 0.25) continue; // not every material sells every month
    const invoices = intBetween(1, 3);
    for (let inv = 0; inv < invoices; inv++) {
      const qty = intBetween(50, 2000);
      const price = mat.priceEurPerPc * between(0.95, 1.05);
      const eurCents = toCents(qty * price);
      const tryCents = toCents((eurCents / 100) * rate);
      const day = intBetween(1, lastDay(period).getUTCDate());
      actualRows.push([
        COMPANY_CODE,
        period.year,
        period.month,
        String(billingNo++),
        10,
        new Date(Date.UTC(period.year, period.month - 1, day)),
        mat.material,
        mat.customer,
        mat.profitCenter,
        qty,
        'PC',
        Number((qty * mat.weightKgPerPc).toFixed(3)),
        'KG',
        eurCents / 100,
        'EUR',
        tryCents / 100,
        'TRY',
      ]);
      actualEurCentsByPeriod.set(key, (actualEurCentsByPeriod.get(key) ?? 0) + eurCents);
      actualTryCentsByPeriod.set(key, (actualTryCentsByPeriod.get(key) ?? 0) + tryCents);
    }
  }
}

// --- Budget (HQ format) --------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// HYPOTHETICAL COLUMNS – months as columns, one row per customer × part family × measure.
const BUDGET_COLUMNS = ['Year', 'Customer', 'Part Family', 'Profit Center', 'Measure', 'Unit', ...MONTHS, 'Total'];

const budgetRows: (string | number)[][] = [];
// Group known materials by customer × part family to derive plausible budget levels.
const groups = new Map<string, Material[]>();
for (const mat of knownMaterials) {
  const key = `${mat.customer}|${mat.partFamily}`;
  groups.set(key, [...(groups.get(key) ?? []), mat]);
}
for (const [key, mats] of [...groups.entries()].sort()) {
  const [customer, partFamily] = key.split('|');
  const qtyPerMonth = MONTHS.map(() => mats.reduce((sum) => sum + intBetween(600, 2600), 0));
  const avgWeight = mats.reduce((s, m) => s + m.weightKgPerPc, 0) / mats.length;
  const avgPrice = mats.reduce((s, m) => s + m.priceEurPerPc, 0) / mats.length;
  const measures: [string, string, number[]][] = [
    ['Quantity', 'PC', qtyPerMonth],
    ['Weight', 'KG', qtyPerMonth.map((q) => Number((q * avgWeight).toFixed(3)))],
    ['Net Sales', 'EUR', qtyPerMonth.map((q) => toCents(q * avgPrice) / 100)],
  ];
  for (const [measure, unit, values] of measures) {
    const total = measure === 'Quantity' ? values.reduce((a, b) => a + b, 0) : values.reduce((a, b) => a + toCents(b), 0) / 100;
    budgetRows.push([BUDGET_YEAR, customer, partFamily, mats[0].profitCenter, measure, unit, ...values, total]);
  }
}

// --- P&L totals ------------------------------------------------------------------

// HYPOTHETICAL COLUMNS
const PL_COLUMNS = ['Fiscal Year', 'Posting Period', 'P&L Line', 'Amount EUR', 'Amount LC', 'Local Currency'];

const plRows = actualPeriods.map((p) => {
  const key = `${p.year}-${p.month}`;
  const diffCents = samePeriod(p, PL_DIFF_PERIOD) ? PL_DIFF_EUR * 100 : 0;
  const eurCents = actualEurCentsByPeriod.get(key)! + diffCents;
  const tryCents = actualTryCentsByPeriod.get(key)! + toCents((diffCents / 100) * fxRate.get(key)!);
  return [p.year, p.month, 'Net Sales', eurCents / 100, tryCents / 100, 'TRY'];
});

// --- Material master ---------------------------------------------------------------

// HYPOTHETICAL COLUMNS
const MASTER_COLUMNS = ['Material', 'Description', 'Customer', 'Part Family', 'Profit Center', 'Weight per PC (kg)'];
const masterRows = knownMaterials.map((m) => [m.material, m.description, m.customer, m.partFamily, m.profitCenter, m.weightKgPerPc]);

// --- Write files ---------------------------------------------------------------------

async function writeWorkbook(fileName: string, sheetName: string, columns: readonly string[], rows: unknown[][]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'co-reports sample-data generator';
  workbook.created = FIXED_DATE;
  workbook.modified = FIXED_DATE;
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow([...columns]).font = { bold: true };
  sheet.addRows(rows);
  sheet.columns.forEach((col) => (col.width = 16));
  await workbook.xlsx.writeFile(resolve(OUT_DIR, fileName));
  console.log(`${fileName}: ${rows.length} rows`);
}

mkdirSync(OUT_DIR, { recursive: true });
await writeWorkbook('sap_actual_sales.xlsx', 'Export', SAP_COLUMNS, actualRows);
await writeWorkbook('budget.xlsx', `Budget ${BUDGET_YEAR}`, BUDGET_COLUMNS, budgetRows);
await writeWorkbook('material_master.xlsx', 'MatInfo', MASTER_COLUMNS, masterRows);
await writeWorkbook('pl_totals.xlsx', 'P&L', PL_COLUMNS, plRows);
console.log(`Materials missing in master: ${newMaterials.map((m) => m.material).join(', ')}`);
console.log(`P&L difference: ${PL_DIFF_EUR} EUR in ${PL_DIFF_PERIOD.year}-${String(PL_DIFF_PERIOD.month).padStart(2, '0')}`);
