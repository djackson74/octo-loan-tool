# GrnBit Senior Secured Term Loan — Package Guide

**Generated for:** Prospective senior lender / participation syndicate  
**Project:** Miracle Lake TX Phase 1 — OCTO AI validation site  
**Borrower:** GrnBit Cayman Holdings  
**Package stage:** Revised (Verified-ready discussion draft)  
**Simulation anchor:** 2026-07-06T19:53:22.251Z  
**Contact:** djackson@grnbit.digital

---

## Why this package exists

GrnBit is seeking a **senior secured term loan** ($2.0M or $3.0M tranche; no $1.0M) to fund Phase 1 energisation and live OCTO AI validation at Miracle Lake, Karnes County, South Texas. Debt service is sized from the **OCTO-optimized digital-twin simulation**, not static deck assumptions. The structure is a **balloon facility** because full 48-month amortization at 12% cannot reach a defensible 1.3x DSCR at offered principal levels.

This folder is the **lender-facing deliverable set**. Everything in `../documents/` is safe to select-all and attach or upload to a data room. Everything in `reference/` is supporting metadata for internal tracking and diligence — not required in the initial email blast.

---

## Folder layout

| Folder | Audience | Purpose |
|--------|----------|---------|
| `documents/` | Lenders, counsel, syndicate | PDF discussion drafts — copy and send |
| `reference/` | Operator, data room, OCTO | Index, CAPEX source data, this guide |

---

## Document index — what each file is for

| File | Generated for | Purpose |
|------|---------------|---------|
| **Cover_Letter_Revised_2026-07-06.pdf** | First contact / package intro | Explains why balloon structure, simulation substantiation, tranche options ($2M/$3M), and enclosures. Opens the conversation — not a binding offer. |
| **Term_Sheet_Revised_2026-07-06.pdf** | Term negotiation | Indicative commercial terms: 48 months, 12% fixed, 6-month IO, target-DSCR payments, balloon at maturity, security, covenants, CPs. |
| **Loan_Agreement_Form_Revised_2026-07-06.pdf** | Counsel markup | Form senior secured loan agreement with schedules. GrnBit counsel must review before execution. |
| **Simulation_Assumptions_Schedule.pdf** | Credit / technical diligence | Key twin inputs (power, hashrate, BTC, baseline vs OCTO-optimized). Full model available in data room. |
| **Key_Risks_Schedule_D.pdf** | Risk committee | Ten facility-specific risks linked to covenants and events of default. |
| **Changes_Memo.pdf** | Internal + sophisticated lenders | Summary of revisions from prior discussion draft (baseline definition, logic chains, Schedule D, etc.). |
| **capex-quotes.json** | Data room / build-out verification | Locked vendor quotes reconciled to $3.02M Phase 1 CAPEX (Schedule C). |
| **manifest.json** | Automation / OCTO tracking | Machine-readable index, simulation timestamp, file map. |

---

## Recommended send order

1. **Cover letter** + **Term sheet** (initial outreach)  
2. **Simulation Assumptions** + **Schedule D** (after NDA / diligence call)  
3. **Form loan agreement** (when counsel engaged)  
4. **Changes memo** (optional — shows revision discipline)  
5. **capex-quotes.json** (data room — not in first email)

---

## What this package is NOT

- Not an offer of securities  
- Not legal, tax, or investment advice  
- Not live-operational proof — OCTO metrics are **simulation-validated** pending energisation  
- Not binding until definitive documents are executed with counsel

---

## Regenerate

```bash
cd loan-tool && npm run revised
```

Outputs: PDFs → `documents/` · JSON + this guide → `reference/`

*Maintained by OCTO secretary workflow · GrnBit Cayman Holdings*