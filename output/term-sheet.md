# Indicative Term Sheet — Senior Secured Term Loan (Balloon)

**Borrower:** GrnBit (Cayman) Holdings  
**Project:** Miracle Lake TX Phase 1 — OCTO AI industrial optimization validation site  
**Date:** 2026-07-06  
**Status:** Non-binding · discussion draft only · subject to counsel and credit approval

---

## 1. Facility

| Term | Detail |
|------|--------|
| **Facility size** | Up to **$3,000,000** aggregate commitments |
| **Tranches offered** | **$2,000,000** or **$3,000,000** (Borrower selects at close) |
| **Excluded** | **$1,000,000** — insufficient to fund site + container fixed costs |
| **Minimum participation** | **$250,000** per lender |
| **Currency** | USD |
| **Purpose** | Phase 1 capex: containers, miners, interconnect, energisation, OCTO deployment |

## 2. Economics (live simulation inputs — 2026-07-06T19:59:10.334Z)

| Input | Value |
|-------|-------|
| OCTO daily profit (optimized) | $2,387 |
| Edge vs baseline | +22.6% |
| BTC in model | $63,581 |
| Skill validation | simulation-validated |

## 3. Commercial terms (fixed)

| Term | Value |
|------|-------|
| **Maturity** | 48 months from first draw |
| **Interest rate** | **12%** per annum, fixed |
| **Interest-only period** | **6 months** from first draw (construction / energisation) |
| **Post-IO payments** | Sized to **1.3x target DSCR** on tier-specific simulated monthly profit |
| **Maturity payment** | **Balloon** — unpaid principal balance after scheduled payments (refinance, sale, or new money) |
| **Amortization** | **Not** full self-liquidating — see Section 8 |

### $2,000,000 tranche

| Item | Value |
|------|-------|
| Build-out funded | 129 miners / 210 (61%) · 2 container(s) |
| Tier monthly profit (sim) | $44,600/mo |
| IO period | Months 1–6 · $20,000/mo |
| IO-period DSCR | 2.23x |
| Post-IO payment (target 1.3x DSCR) | $34,308/mo |
| Balloon due month 48 | $1,257,733 (62.9% of principal) |

### $3,000,000 tranche

| Item | Value |
|------|-------|
| Build-out funded | 208 miners / 210 (99%) · 3 container(s) |
| Tier monthly profit (sim) | $71,913/mo |
| IO period | Months 1–6 · $30,000/mo |
| IO-period DSCR | 2.4x |
| Post-IO payment (target 1.3x DSCR) | $55,318/mo |
| Balloon due month 48 | $1,686,539 (56.2% of principal) |


## 4. Security

- First-priority security interest in Miracle Lake Phase 1 equipment (containers, miners, PDUs, cooling).  
- Assignment of power purchase / interconnect agreements where assignable.  
- OCTO field-of-use license collateral assignment (scope per definitive docs).  
- Corporate guarantee of GrnBit (Cayman) Holdings.  
- Senior to equity, SAFE, and convertible notes.

## 5. Covenants (indicative)

- **Minimum DSCR (post-IO):** 1.3x tested quarterly on tier profit (live ops post-energisation; pre-energisation tests on lender-agreed budget).  
- **Debt service reserve:** 3 months post-IO payments (negotiable).  
- **Insurance:** Property, business interruption, liability — lender as loss payee.  
- **No additional senior debt** without lender consent.

## 6. Events of default (indicative)

- Payment default (5-business-day cure for interest).  
- DSCR below **1.15x** for two consecutive quarters post-energisation.  
- Failure to refinance or repay balloon within 30 days of month-48 maturity.  
- Insolvency, material misrepresentation, loss of power contract.

## 7. Conditions precedent (indicative)

- Executed vendor contracts matching locked quote IDs in Schedule C (`capex-quotes.json`).
- Independent engineer report on energisation timeline.  
- UCC-1 / fixture filings perfected.  
- Phase 1 interconnect and power contract in assignable form.

## 8. Structural rationale (transparency)

Full 48-month amortization at 12% implies ~**35%/yr** debt-service yield on principal. Simulation profit yield on funded capex is ~**29%/yr**. Natural full-amortization DSCR does not reach **1.3x** at any offered principal. The balloon structure sizes payments to the target DSCR band (**1.3x–1.5x**) and surfaces the remaining balance explicitly at maturity — not masked by an unfinanceable amortization schedule.

## 9. CAPEX model (locked vendor quotes)

Build-out sizing uses vendor quotes locked **2026-07-06** (see Schedule C):

- Site interconnect (Xplor):     $302,000
- Per-container (AntSpace HK3):  $151,000 × 3 = $453,000
- Per-miner variable (AntSpace): $10,786 × 210 = $2,265,000

Lender to confirm quote validity dates and executed purchase orders before closing.

## 10. Disclaimers

Not an offer of securities. Not legal, tax, or investment advice. OCTO metrics are simulation-validated pending live energisation. Definitive documents control over this summary.

---

**Contact:** info@grnbit.digital · https://grnbit.digital
