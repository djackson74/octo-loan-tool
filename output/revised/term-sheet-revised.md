# Indicative Term Sheet — Senior Secured Term Loan (Balloon)

**Borrower:** GrnBit Cayman Holdings  
**Registered office:** One Capital Place, Grand Cayman, Cayman Islands  
**Project:** Miracle Lake, Karnes County, South Texas — Phase 1 — OCTO AI industrial optimization validation site
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

## 2. Economics — OCTO-optimized digital-twin simulation (2026-07-06T19:53:22.251Z)

| Input | Value | Logic chain |
|-------|-------|-------------|
| OCTO-optimized daily profit | $2,387 | Digital-twin run at 2026-07-06T19:53:22.251Z |
| Edge vs industry-typical baseline | +22.6% | Optimized vs baseline daily profit in twin |
| BTC in model | $63,581 | Network economics input at 2026-07-06T19:53:22.251Z |
| Skill validation | simulation-validated | Twin run; live certification at energisation |

**Industry-typical baseline** means rig-level SCADA without OCTO per-chip thermal co-control, modeled at **87.9% hashrate utilization** (within CleanSpark Feb 2026 operating/peak range); **Edge vs baseline** is the simulated daily-profit uplift of the OCTO-optimized digital-twin scenario over that unoptimized baseline.

**Dashboard:** https://octo-dashboard-rikj.onrender.com/  
**Full model:** Available in data room (Simulation Assumptions Schedule).

## 3. Commercial terms (fixed)

| Term | Value | Logic chain |
|------|-------|-------------|
| **Maturity** | 48 months from first draw | Contractual term |
| **Interest rate** | **12%** per annum, fixed | Stated coupon |
| **Interest-only period** | **6 months** from first draw | Construction / energisation |
| **Post-IO payments** | Sized to **1.3x target DSCR** | Monthly profit ÷ 1.3 |
| **Maturity payment** | **Balloon** — unpaid principal balance | Remaining balance month 48 |
| **Amortization** | **Not** full self-liquidating | See Section 8 |

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


## 4. Security

- First-priority security interest in Miracle Lake, Karnes County, South Texas — Phase 1 equipment (containers, miners, PDUs, cooling).
- Assignment of power purchase / interconnect agreements where assignable.  
- OCTO field-of-use license collateral assignment (scope per definitive docs).  
- Corporate guarantee of GrnBit Cayman Holdings.
- Senior to equity, SAFE, and convertible notes.

## 5. Covenants (indicative)

- **Minimum DSCR (post-IO):** 1.3x tested quarterly on tier profit (live ops post-energisation; pre-energisation tests on lender-agreed budget).  
- **Debt service reserve:** 3 months post-IO payments (amount and funding mechanics (negotiable — to be agreed in definitive documentation)).  
- **Insurance:** Property, business interruption, liability — lender as loss payee.  
- **No additional senior debt** without lender consent.
- **OCTO Validation Milestone:** Complete by [●] months post-First Draw (negotiable — to be agreed in definitive documentation).

## 6. Events of default (indicative)

- Payment default (5-business-day cure for interest).  
- DSCR below **1.15x** for two consecutive quarters post-energisation.  
- Failure to refinance or repay balloon within 30 days of month-48 maturity.  
- Insolvency, material misrepresentation, loss of power contract.
- Failure to achieve OCTO Validation Milestone within agreed period.

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

| Line item | Amount | Logic chain |
|-----------|--------|-------------|
| Site interconnect (Xplor) | $302,000 | Quote XPL-MLTX-INTERCONNECT-2026-018 |
| Per-container (AntSpace HK3) | $151,000 × 3 = $453,000 | Quote AS-MLTX-CONTAINER-2026-042 |
| Per-miner variable (AntSpace) | $10,786 × 210 = $2,265,000 | Quote AS-MLTX-P1-HW-2026-042 |
| **Phase 1 total** | **$3,020,000** | Reconciled locked total |

Lender to confirm quote validity dates and executed purchase orders before closing.

## 10. Schedules

- **Schedule C** — CAPEX vendor quotes (`capex-quotes.json`)  
- **Simulation Assumptions Schedule** — key twin inputs (enclosed)  
- **Schedule D** — Key Risks (enclosed)

## 11. Disclaimers

Not an offer of securities. Not legal, tax, or investment advice. OCTO metrics are simulation-validated pending live energisation. Definitive documents control over this summary.

---

**Contact:** djackson@grnbit.digital · https://grnbit.digital
