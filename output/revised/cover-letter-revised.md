# Cover Letter — Senior Secured Term Loan

**Date:** 2026-07-06  
**From:** GrnBit Cayman Holdings  
**Address:** One Capital Place, Grand Cayman, Cayman Islands  
**Project:** Miracle Lake, Karnes County, South Texas — Phase 1  
**To:** Prospective senior lender / participation syndicate
**Re:** Indicative $3,000,000 senior secured term loan facility — balloon structure  
**Status:** Non-binding · for discussion with counsel only

---

Dear Lender,

GrnBit Cayman Holdings ("**Borrower**") requests your consideration of a senior secured term loan to fund energisation and OCTO AI validation at **Miracle Lake, Karnes County, South Texas — Phase 1** (power: Xplor Energy / Karnes Electric).

### Substantiation — simulation source and traceability

We are not asking you to rely on a static deck. Coverage metrics in the enclosed term sheet are sized from the **OCTO-optimized digital-twin simulation** as of **2026-07-06T19:53:22.251Z** — the same model surface used for investor diligence at https://octo-dashboard-rikj.onrender.com/

At that pull:

| Metric | Value | Logic chain |
|--------|-------|-------------|
| OCTO-optimized daily profit | **$2,387/day** | OCTO-optimized digital-twin run at 2026-07-06T19:53:22.251Z |
| Edge vs industry-typical baseline | **+22.6%** | (Optimized − baseline) ÷ baseline daily profit in twin |
| BTC price in model | **$63,581** | Network economics input at 2026-07-06T19:53:22.251Z |
| Validation status | **simulation-validated** | Twin run only; live certification begins at Phase 1 energisation |

**Industry-typical baseline** means rig-level SCADA without OCTO per-chip thermal co-control, modeled at **87.9% hashrate utilization** (within CleanSpark Feb 2026 operating/peak range); **Edge vs baseline** is the simulated daily-profit uplift of the OCTO-optimized digital-twin scenario over that unoptimized baseline.

Tier monthly profits, IO payments, target-DSCR payments, and balloon balances trace to that simulation run, scaled by locked CAPEX build-out per tranche (Simulation Assumptions Schedule; Schedule C). The full economics model is available in the data room.

### Why balloon — not full 48-month amortization

At the fixed commercial terms under discussion (**48 months · 12% fixed**), a fully amortizing schedule requires approximately **35%/yr** debt-service yield on principal. The simulation-derived profit yield on funded capex at Phase 1 scale is approximately **29%/yr**. Under full amortization, natural DSCR tops out near **0.82x** even at a **$3,000,000** draw — below any defensible **1.3x–1.5x** lender floor.

| Comparison | Debt-service yield | Source |
|------------|-------------------|--------|
| Full 48-mo amortization at 12% | ~35%/yr on principal | Annuity formula on 48-month term |
| Simulation profit yield (funded capex) | ~29%/yr | Tier monthly profit ÷ funded build-out |
| Natural full-amortization DSCR ($3M) | ~0.82x | $3,000,000 draw — below 1.3x floor |

This is a **structural** constraint, not a negotiating position. The financeable alternative — standard in project finance — is to **size post–interest-only payments to a target DSCR** and accept a **balloon / refinance balance at maturity** rather than pretend the loan self-liquidates in 48 months.

### Facility sizes offered

| Tranche | Status |
|---------|--------|
| $1,000,000 | **Not offered** — does not fund a viable build-out after site and container fixed costs |
| $2,000,000 | Offered — see term sheet |
| $3,000,000 | Offered — full Phase 1 scale (preferred) |

Minimum lender participation: **$250,000**. Multiple lenders may participate pro-rata in a single facility up to **$3,000,000**.

### Enclosures

1. Indicative Term Sheet (balloon structure)  
2. Form Loan Agreement (discussion draft — counsel to finalize)  
3. Simulation Assumptions Schedule  
4. Schedule D — Key Risks

### Important disclosures

- OCTO AI performance is **simulation-validated** pending Phase 1 energisation.  
- CAPEX build-out sizing uses **locked vendor quotes** (AntSpace/Bitmain hardware + Xplor interconnect) in `capex-quotes.json`, reconciled to **$3.02M** Phase 1 total.
- This package is **not an offer of securities** and **not legal or tax advice**.

We welcome a diligence call and site scoping session. Contact: **djackson@grnbit.digital**.

Respectfully,

**GrnBit Cayman Holdings**  
One Capital Place, Grand Cayman, Cayman Islands  
Project: Miracle Lake, Karnes County, South Texas — Phase 1  
djackson@grnbit.digital · https://grnbit.digital

---

## Annex — Tranche payment summary (OCTO-optimized digital-twin · 2026-07-06T19:53:22.251Z)

### $2,000,000 tranche

| Item | Value | Logic chain |
|------|-------|-------------|
| Build-out funded | 129 miners / 210 (61%) · 2 container(s) | Locked CAPEX quotes (Schedule C) applied to draw amount |
| Tier daily profit (sim) | $1,466/day | OCTO-optimized digital-twin $2,387/day × 61% funded fraction |
| Tier monthly profit (sim) | $44,600/mo | $1,466/day × (365÷12) = $44,600/mo |
| IO period | Months 1–6 · $20,000/mo | $2,000,000 × 12% ÷ 12 = $20,000/mo |
| IO-period DSCR | 2.23x | $44,600/mo ÷ $20,000/mo |
| Post-IO payment (target 1.3x DSCR) | $34,308/mo | $44,600/mo ÷ 1.3x DSCR = $34,308/mo |
| Balloon due month 48 | $1,257,733 (62.9% of principal) | Principal $2,000,000 less scheduled principal paydown months 7–48 |

### $3,000,000 tranche

| Item | Value | Logic chain |
|------|-------|-------------|
| Build-out funded | 208 miners / 210 (99%) · 3 container(s) | Locked CAPEX quotes (Schedule C) applied to draw amount |
| Tier daily profit (sim) | $2,364/day | OCTO-optimized digital-twin $2,387/day × 99% funded fraction |
| Tier monthly profit (sim) | $71,913/mo | $2,364/day × (365÷12) = $71,913/mo |
| IO period | Months 1–6 · $30,000/mo | $3,000,000 × 12% ÷ 12 = $30,000/mo |
| IO-period DSCR | 2.4x | $71,913/mo ÷ $30,000/mo |
| Post-IO payment (target 1.3x DSCR) | $55,318/mo | $71,913/mo ÷ 1.3x DSCR = $55,318/mo |
| Balloon due month 48 | $1,686,539 (56.2% of principal) | Principal $3,000,000 less scheduled principal paydown months 7–48 |

