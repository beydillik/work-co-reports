# adapters/

One reader per source file type (SAP actual export, budget file, material master, P&L totals).
Each adapter converts its source format into the canonical model in `model/`.
If a source format changes, only its adapter changes. (Empty until real sample files arrive.)
