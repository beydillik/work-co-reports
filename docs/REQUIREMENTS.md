# CO Reports — Requirements

Status: draft v0.1 (2026-10-15). Field-level details of the Sales Report will be added after sample data is reviewed.

## 1. Goal

Turn the Plant Controller's Excel reports into a web application that:

- makes **report preparation** faster and controlled (guided cockpit, automatic mapping and checks instead of manual VLOOKUPs), and
- delivers **interactive, BI-quality reports** (comparable to Power BI / Qlik Sense / Tableau) to management, with per-report access control.

## 2. Users and access

| Role | Access |
|---|---|
| Controller (owner) | Cockpit, all reports, master data, period approval |
| Country Manager | All reports (read only) |
| Department managers (e.g. Sales Manager) | Only the reports assigned to them (e.g. Sales yes, Profitability/Stock no) |

- Users must not see reports they are not authorized for — on the home page, through direct links, or through exports.
- Target mechanism: Windows/AD login with AD groups (e.g. `MAN-CO-Sales-Viewers`, `MAN-CO-All-Viewers`). Fallback mechanism: folder permissions (see §3).

## 3. Hosting

| Phase | Hosting | Access control |
|---|---|---|
| Target | Plant intranet virtual server (shared with the HR application, separate site and separate database) | AD groups, page-level |
| Fallback (if server is delayed) | Network drive: cockpit in the controller's folder, approved reports exported as self-contained HTML files into per-report folders | NTFS folder permissions |

Excluded: public hosting (Netlify, GitHub Pages, etc.), OneDrive/SharePoint as app host. Reasons in `DECISIONS.md`.

The application must run without internet access (all libraries bundled).

## 4. Home page

- One card per report the user is authorized for: title, short description, last approved period, status.
- Controller additionally sees the cockpit status per report (e.g. "Sales – 2026-09 – waiting for master data").

## 5. Data model

### 5.1 Sources (uploaded as they come, no manual reshaping)

| Source | Origin | Frequency | Notes |
|---|---|---|---|
| Actual sales | SAP export | Monthly | Raw SAP columns, no manually added mapping columns |
| Budget | HQ Excel | Yearly (+ revisions) | HQ format, possibly months as columns |
| Material master (MatInfo) | Maintained by controller | When new materials appear | Material → Customer, Part Family, Weight, … |
| P&L totals | Controller | Monthly | Used for reconciliation |
| FX rates | TBD | Monthly / budget rate | Needed if currencies are converted |

Each source has its own adapter that maps it into the canonical model.

### 5.2 Canonical model (star schema)

- **Fact table** – one row per transaction/aggregate with a `Scenario` column: `ACT`, `BUD`, later `FC`. Prior year (`PY`) is derived from `ACT`.
- **Dimensions** – Material, Customer, Part Family, Profit Center, Calendar, FX.
- Mapping (Material → Customer / Part Family / Weight) is done by the application using the material master, not by the user.

### 5.3 Known modelling issues (to confirm with sample data)

- **Granularity:** Actual is probably at material/invoice level, Budget at customer/part family/month level. Budget comparisons are only possible at the common level; the UI must make this clear.
- **Currency and FX:** Budget probably in EUR at budget rate, Actual in TRY/EUR at actual rate. Whether price/volume/mix/FX variance is split depends on the current Excel report.
- **Units:** quantity (pcs) and weight (kg) must be kept consistent.

## 6. Cockpit (preparation workflow)

Each report has a checkpoint sequence. A report is published only after all checkpoints pass and the controller approves.

Sales pilot sequence (draft):

1. **Upload** – select period, upload source files; adapter validates structure (required columns, data types, period matches).
2. **Master data check** – list materials without master data; controller completes Customer / Part Family / Weight in the app; the material master is updated.
3. **Account / scope check** – unexpected accounts, profit centers or document types are flagged (rules TBD).
4. **Reconciliation** – Sales in report vs Sales in P&L per month; difference shown; if outside tolerance, an explanation is required before approval.
5. **Preview** – report rendered with the new period.
6. **Approval** – period locked, snapshot stored, audit entry written.

General cockpit features:

- Status per step (open / warning / passed), with affected rows downloadable.
- **Period lock** after approval; reopening requires a reason.
- **Audit log:** who uploaded which file, which warnings were accepted, who approved, when.
- Master data is shared by all reports (a material defined once is known everywhere).

## 7. Reports

Portfolio (order TBD after pilot): Sales (pilot), Income Statement, Stock, KPI, SG&A, Cashflow, Profitability.

### 7.1 Common report features

- Dynamic filters: period range (from/to), profit center, customer, part family, scenario comparison (ACT vs BUD / PY).
- Filter state visible on screen and included in every export.
- KPI cards, trend charts, breakdowns, sortable detail tables, drill-down from aggregate to detail rows.
- Visual quality comparable to commercial BI tools; consistent design system across reports.
- Number formatting: thousands separators, negative values clearly marked, configurable unit (units / k / m).

### 7.2 Sales Report (pilot) — proposed content, to be aligned with the current Excel report

- KPI cards: Sales amount, Quantity, Weight, Average price per kg — each vs Budget and vs Prior Year.
- Monthly trend: ACT vs BUD vs PY.
- Breakdown by customer (with Pareto / top-N) and by part family.
- Top movers: largest positive/negative changes vs BUD and PY.
- Variance bridge (price / volume / mix / FX) — only if supported by data granularity.
- Detail table with drill-down.

## 8. Export

| Format | Scope | Requirements |
|---|---|---|
| Excel (.xlsx) | Every table and chart | Numbers as numbers (not text) with formatting; frozen header row and autofilter; sheet "View" (as on screen) + sheet "Detail" (underlying rows); header block with report name, period, filters, data version, approval date; charts exported as their data table plus a PNG image |
| Copy to clipboard | Every table | Paste directly into Excel with correct columns and decimal separators (test with Turkish and English Excel locale) |
| PDF | Whole report page | Print layout; footer "Confidential – Internal", date, user |
| PNG | Every chart | One-click download |
| PowerPoint (.pptx) | Charts and key tables | One slide per chart/table, for management reviews |
| Word | — | Deferred; add only if a real need appears |

## 9. Non-functional requirements

- **Confidentiality:** no real data outside company systems; no runtime calls to external services.
- **Offline:** works without internet.
- **Browsers:** Microsoft Edge and Google Chrome (current versions).
- **Performance:** filters respond in under 1 second for at least 3 years of monthly sales data (volume to be confirmed).
- **Traceability:** every number in a report can be traced to the approved snapshot and source file.
- **Maintainability:** adding a new report should reuse adapters, model, checks and UI components; after two reports, the recurring steps become a Claude Code skill.

## 10. Open questions

1. Technology stack on the server side — to align with the HR application (ask the Ergene developer: language/framework, database, login method, deployment method).
2. Exact columns of the SAP export, budget file and material master — from sample data.
3. FX handling and variance split in the current Sales Excel report.
4. Reconciliation tolerance and source of P&L sales totals.
5. Data volume (rows per month).
