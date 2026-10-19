// List of all reports shown on the home page.
// "available" reports have a cockpit; "planned" ones are shown as coming soon.
// Later: filtered by the user's access rights (REQUIREMENTS §2).

export interface ReportInfo {
  id: string;
  title: string;
  description: string;
  status: 'available' | 'planned';
}

export const reports: ReportInfo[] = [
  { id: 'sales', title: 'Sales', description: 'Sales amount, quantity and weight vs Budget and Prior Year.', status: 'available' },
  { id: 'income-statement', title: 'Income Statement', description: 'P&L by month vs Budget and Prior Year.', status: 'planned' },
  { id: 'stock', title: 'Stock', description: 'Inventory levels and coverage.', status: 'planned' },
  { id: 'kpi', title: 'KPI', description: 'Plant key performance indicators.', status: 'planned' },
  { id: 'sga', title: 'SG&A', description: 'Selling, general and administrative expenses.', status: 'planned' },
  { id: 'cashflow', title: 'Cashflow', description: 'Cash generation and use.', status: 'planned' },
  { id: 'profitability', title: 'Profitability', description: 'Margins by customer and part family.', status: 'planned' },
];
