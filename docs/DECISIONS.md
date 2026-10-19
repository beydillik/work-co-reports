# CO Reports — Decision Log

Each entry: date, decision, reason, status. New decisions are added at the bottom; changed decisions are marked "superseded" with a reference to the new entry.

---

### D-001 · 2026-10-15 · No public hosting
**Decision:** The application and its data are not hosted on public services (Netlify, GitHub Pages, Firebase, etc.).
**Reason:** Financial company data; even if data stayed in the browser, a public URL creates the impression that financial data is on the internet.
**Status:** Accepted

### D-002 · 2026-10-15 · Target hosting: plant intranet virtual server
**Decision:** Target platform is the plant's own virtual server (also used for the HR application), as a separate site with a separate database, access through Windows/AD login and AD groups.
**Reason:** Only option that gives page-level access control (e.g. Sales Manager sees Sales but not Profitability), an intranet address, and view logging. Not affected by a future move from network drives to OneDrive.
**Conditions:** IT is informed that the server hosts both HR and Controlling applications; HR personal data and financial data are kept in separate databases.
**Status:** Accepted (server not yet available)

### D-003 · 2026-10-15 · Fallback: network drive with self-contained report snapshots
**Decision:** If the server is delayed, the cockpit runs from the controller's folder and approved reports are exported as self-contained HTML files (data embedded) into per-report folders with NTFS permissions.
**Reason:** No server needed; access control through existing folder permissions. Browsers block reading separate data files from locally opened HTML, therefore data is embedded.
**Limitations:** No view logging; files can be copied (same as today's Excel reports); access is per folder, not per page.
**Status:** Accepted as fallback

### D-004 · 2026-10-15 · OneDrive / SharePoint not used as app host
**Decision:** OneDrive and SharePoint are not used to host the application.
**Reason:** SharePoint Online (and OneDrive for Business, which runs on it) serves uploaded HTML files as downloads instead of rendering them; a personal OneDrive ties a corporate system to one person's account.
**Status:** Accepted

### D-005 · 2026-10-15 · Build a custom application instead of a BI tool
**Decision:** Custom web application.
**Reason:** Power BI is not licensed; Qlik Sense is available only with viewer (Analyzer) rights. The checkpoint-based preparation workflow and master-data entry are core requirements that BI tools do not cover well.
**Status:** Accepted

### D-006 · 2026-10-15 · Star schema with source adapters
**Decision:** Sources (SAP actual, HQ budget, material master, P&L totals) are uploaded in their original format; one adapter per source maps them into a canonical model: one fact table with a `Scenario` column (ACT / BUD / FC) plus dimension tables. Material mapping is done by the application.
**Reason:** Removes manual mapping work, makes budget-vs-actual a single query, isolates format changes to one adapter.
**Status:** Accepted

### D-007 · 2026-10-15 · Pilot report: Sales
**Decision:** Sales Report is built first, end to end.
**Reason:** It exercises every part of the system: master-data check for new materials, P&L reconciliation, multi-dimensional filters, export.
**Status:** Accepted

### D-008 · 2026-10-15 · User interface language: English
**Decision:** UI, code and documentation in English; session summaries for the owner in Turkish.
**Reason:** About 98% of the controller's reports are in English; reports may also be shared with HQ.
**Status:** Accepted

### D-009 · 2026-10-15 · Development with Claude Code on the web and a private GitHub repository
**Decision:** Development in Claude Code (claude.ai/code) connected to a private GitHub repository. The repository contains code and synthetic/anonymized sample data only.
**Reason:** No software installation on the work computer; version history; repository files (`CLAUDE.md`) act as the project memory.
**Status:** Accepted

### D-010 · 2026-10-15 · Proposed front-end stack (to confirm in the first planning session)
**Proposal:** Vite + TypeScript + React; Apache ECharts for charts; SheetJS for reading Excel; ExcelJS for formatted Excel export; PptxGenJS for PowerPoint; single-file build option for the network-drive fallback and manual testing.
**Reason:** Widely used, well-documented libraries that run fully offline. Server side to be aligned with the HR application once its stack is known.
**Status:** Superseded by D-012

### D-011 · 2026-10-19 · Deployment target: Windows Server + IIS, static files
**Decision:** The front end is deployed to the plant's Windows Server as static files served by IIS. Node.js/npm are used only for development and build (in Claude Code); the server never runs Node.
**Reason:** IIS is the existing web server on the plant VM (D-002). A static build needs no runtime installation and no IT involvement beyond copying a file.
**Consequences:** Routing uses URL hashes (`#/sales/cockpit`) so no IIS URL Rewrite module is needed. Until a server-side API exists, data is stored in the user's browser (IndexedDB) and is not shared between users.
**Status:** Accepted

### D-012 · 2026-10-19 · Front-end stack confirmed (amends D-010)
**Decision:** Vite + TypeScript + React; Apache ECharts (charts); ExcelJS (formatted Excel export and sample-data generation); PptxGenJS (PowerPoint); Vitest (unit tests); `vite-plugin-singlefile` builds one self-contained file `dist/co-reports.html`. Libraries are installed when the first feature needs them.
**Changes vs D-010:**
- **One build output, one file.** The same `co-reports.html` is used on IIS and on the network drive (D-003). A multi-file build is added only if file size or caching becomes a problem.
- **SheetJS (reading source Excel files):** the npm package `xlsx` is frozen at 0.18.5 and misses later security fixes; newer versions are published only at `cdn.sheetjs.com`. When the first adapter is built, the official `.tgz` is stored in `vendor/` and installed from there. `cdn.sheetjs.com` is currently blocked by the development environment's network policy and must be allowed first. Fallback: read `.xlsx` with ExcelJS (no legacy `.xls` support).
- **Own minimal hash router** instead of an extra routing library.
**Alternative considered:** Preact or Svelte (smaller bundles) — not chosen; React has the widest documentation and examples.
**Status:** Accepted
