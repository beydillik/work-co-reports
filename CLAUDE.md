# CLAUDE.md — CO Reports

Read this file at the start of every session. Detailed requirements are in `docs/REQUIREMENTS.md`, decisions and their reasons in `docs/DECISIONS.md`. Read both before planning any non-trivial change.

## What this project is

A web application that replaces the Plant Controller's Excel-based controlling reports (Sales, P&L, Stock, KPI, SG&A, Cashflow, Profitability) at a manufacturing plant. It has two parts:

1. **Cockpit** – a guided, checkpoint-based workflow where the controller uploads source files, resolves data issues (e.g. new materials without master data), reconciles totals and approves a period.
2. **Reports** – interactive, filterable, BI-quality report pages built only from approved data, with export to Excel / PDF / PNG / PowerPoint.

Pilot: **Sales Report**. Other reports follow the same engine.

## About the owner

- The owner is an experienced financial controller (SAP FI/CO, costing, closing) and is **learning software development and Claude Code** with this project.
- Domain decisions (accounting logic, report content) belong to the owner. Ask when a finance rule is unclear instead of guessing.
- **At the end of every session, write a short summary in Turkish**: what changed, which files, how to check it, what is next. Keep technical jargon explained in one line each.

## Hard rules

1. **No real company data in this repository, ever.** Only synthetic or anonymized sample data under `sample-data/`. Never add customer names, real amounts, employee names or company identifiers to code, comments, tests or commit messages.
2. **No runtime network calls.** The app must work on an intranet server and from a network drive without internet. Bundle every library; no CDN links, no fonts from the web, no analytics/telemetry.
3. **User interface language is English.** Code, comments and identifiers are English.
4. **Plan before code.** For anything larger than a small fix, present a plan and wait for approval.
5. **Small, reviewable steps.** One logical change per commit, clear commit messages.
6. **Explain the code.** Every module starts with a short comment describing its purpose. Non-obvious logic (calculations, mappings, checks) gets an explanatory comment.

## Architecture rules

- **Separate layers** (see `docs/REQUIREMENTS.md` §5):
  - `adapters/` – one reader per source file type (SAP actual export, budget file, material master, P&L totals). Converts the source format into the canonical model. If a source format changes, only its adapter changes.
  - `model/` – canonical data model: fact table with a `Scenario` column (ACT / BUD / later FC, PY derived) and dimension tables (Material, Customer, Profit Center, FX, Calendar).
  - `checks/` – cockpit checkpoints (master-data completeness, reconciliation, etc.). Each check returns a structured result: status, message, affected rows.
  - `storage/` – persistence behind an interface, so the same app can run on the future intranet server or as a file-based fallback.
  - `reports/<report-name>/` – one folder per report: definition, views, charts, export settings.
  - `ui/` – shared components (filters, KPI cards, tables, chart wrappers, export menu).
- **Finance rules:**
  - Never round stored values. Round only for display.
  - Amounts keep their currency; conversion is explicit and uses the FX table.
  - Reconciliation compares with a configurable tolerance and shows the difference amount.
  - Approved periods are locked; changes after approval need an explicit reopen with a reason (audit log).
- Prefer simple, well-known libraries. Ask before adding a new dependency.

## Repository layout (target)

```
CLAUDE.md
docs/            REQUIREMENTS.md, DECISIONS.md
sample-data/     synthetic / anonymized input files
src/
  adapters/  model/  checks/  storage/  reports/  ui/
tests/           unit tests for adapters, checks and calculations
dist/            single-file build for manual testing (see below)
```

## Build and test

Requires Node.js 20+ (development only; the server never runs Node, see D-011).

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server with hot reload |
| `npm test` | Run unit tests (Vitest) |
| `npm run typecheck` | TypeScript check without building |
| `npm run sample-data` | Regenerate synthetic files in `sample-data/` (deterministic) |
| `npm run build` | Build `dist/co-reports.html` (single self-contained file) |

Deployment: copy `dist/co-reports.html` to the IIS site folder (rename to `index.html` or set it as default document). The same file works when opened from a network drive.

- After each session that changes the UI, produce a **single-file build** (`dist/co-reports.html`) that the owner can download and open in Edge/Chrome without installing anything.
- Calculations and checks must have unit tests using the sample data.
