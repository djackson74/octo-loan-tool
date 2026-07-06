#!/usr/bin/env node
// Generate CHRITIC-revised lender discussion drafts (Revised / Verified-ready).
// Outputs professional PDFs to octo-loan-docs publish folder.

const fs = require('fs');
const path = require('path');
const { solveTargetDscrBalloonStructure, TERM_MONTHS, ANNUAL_RATE, DEFAULT_DSCR_MIN } = require('./loan-calc');
const { buildCostModel, resolveBuildout, formatCapexSummary, TOTAL_MINERS, QUOTES } = require('./capex-model');

const SIM_TS = '2026-07-06T19:53:22.251Z';
const DOC_DATE = '2026-07-06';
const HEADER_LABEL = 'Discussion Draft — Revised 2026-07-06';
const DASHBOARD_URL = 'https://octo-dashboard-rikj.onrender.com/';

const FROZEN = {
  dailyProfit: 2387,
  edgePct: 22.6,
  btc: 63581,
  hashrateGainPct: 13.7,
  efficiencyGainPct: 12.1,
  validation: 'simulation-validated',
  electricityKwh: 0.045,
  baselineUtilPct: 87.9,
  octoUtilPct: 100.0,
};

const PRINCIPALS = [2_000_000, 3_000_000];
const IO_MONTHS = 6;
const DSCR = DEFAULT_DSCR_MIN;

const DEFAULT_OUT = path.join(
  __dirname,
  '..',
  'octo-loan-docs',
  'loan',
  '2026-07-06',
  '19-53-22Z',
  'pdf',
);

function parseArgs(argv) {
  const opts = { outDir: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out' && argv[i + 1]) opts.outDir = path.resolve(argv[++i]);
  }
  return opts;
}

function usd(n) {
  return '$' + Math.round(n).toLocaleString();
}

function pct(n, digits = 1) {
  return n.toFixed(digits) + '%';
}

function negotiable(placeholder) {
  return `${placeholder} (negotiable — to be agreed in definitive documentation)`;
}

function baselineSentence() {
  return (
    '**Industry-typical baseline** means rig-level SCADA without OCTO per-chip thermal co-control, ' +
    `modeled at **${FROZEN.baselineUtilPct}% hashrate utilization** (within CleanSpark Feb 2026 operating/peak range); ` +
    '**Edge vs baseline** is the simulated daily-profit uplift of the OCTO-optimized digital-twin scenario over that unoptimized baseline.'
  );
}

function buildTiers() {
  const costModel = buildCostModel({ totalDailyProfitUsd: FROZEN.dailyProfit });
  return PRINCIPALS.map((principal) => {
    const buildout = resolveBuildout(principal, costModel);
    const balloon = solveTargetDscrBalloonStructure(principal, buildout.monthlyProfit, IO_MONTHS, DSCR);
    return { principal, buildout, balloon };
  });
}

function tierTableBlock(t) {
  const b = t.buildout;
  const s = t.balloon;
  const dailyPerTier = Math.round(FROZEN.dailyProfit * b.fundedFraction);
  const monthlyLogic = `${usd(dailyPerTier)}/day × (365÷12) = ${usd(b.monthlyProfit)}/mo`;
  const ioLogic = `${usd(t.principal)} × ${pct(ANNUAL_RATE * 100, 0)} ÷ 12 = ${usd(s.ioPayment)}/mo`;
  const postIoLogic = `${usd(b.monthlyProfit)}/mo ÷ ${DSCR}x DSCR = ${usd(s.paymentTarget)}/mo`;
  const balloonLogic = `Principal ${usd(t.principal)} less scheduled principal paydown months 7–${TERM_MONTHS}`;

  return `### ${usd(t.principal)} tranche

| Item | Value | Logic chain |
|------|-------|-------------|
| Build-out funded | ${b.minersFunded} miners / ${TOTAL_MINERS} (${(b.fundedFraction * 100).toFixed(0)}%) · ${b.containersActivated} container(s) | Locked CAPEX quotes (Schedule C) applied to draw amount |
| Tier daily profit (sim) | ${usd(dailyPerTier)}/day | OCTO-optimized digital-twin ${usd(FROZEN.dailyProfit)}/day × ${(b.fundedFraction * 100).toFixed(0)}% funded fraction |
| Tier monthly profit (sim) | ${usd(b.monthlyProfit)}/mo | ${monthlyLogic} |
| IO period | Months 1–${IO_MONTHS} · ${usd(s.ioPayment)}/mo | ${ioLogic} |
| IO-period DSCR | ${s.ioDscr}x | ${usd(b.monthlyProfit)}/mo ÷ ${usd(s.ioPayment)}/mo |
| Post-IO payment (target ${DSCR}x DSCR) | ${usd(s.paymentTarget)}/mo | ${postIoLogic} |
| Balloon due month ${TERM_MONTHS} | ${usd(s.balloonBalance)} (${pct(s.balloonPct)} of principal) | ${balloonLogic} |
`;
}

function coverLetter(tiers) {
  const tierBlocks = tiers.map(tierTableBlock).join('\n');
  return `# Cover Letter — Senior Secured Term Loan

**Date:** ${DOC_DATE}  
**From:** GrnBit (Cayman) Holdings · Miracle Lake TX Phase 1  
**To:** Prospective senior lender / participation syndicate  
**Re:** Indicative ${usd(3_000_000)} senior secured term loan facility — balloon structure  
**Status:** Non-binding · for discussion with counsel only

---

Dear Lender,

GrnBit (Cayman) Holdings ("**Borrower**") requests your consideration of a senior secured term loan to fund energisation and OCTO AI validation at **Miracle Lake, Karnes County, Texas — Phase 1**.

### Substantiation — simulation source and traceability

We are not asking you to rely on a static deck. Coverage metrics in the enclosed term sheet are sized from the **OCTO-optimized digital-twin simulation** as of **${SIM_TS}** — the same model surface used for investor diligence at ${DASHBOARD_URL}

At that pull:

| Metric | Value | Logic chain |
|--------|-------|-------------|
| OCTO-optimized daily profit | **${usd(FROZEN.dailyProfit)}/day** | OCTO-optimized digital-twin run at ${SIM_TS} |
| Edge vs industry-typical baseline | **+${FROZEN.edgePct}%** | (Optimized − baseline) ÷ baseline daily profit in twin |
| BTC price in model | **${usd(FROZEN.btc)}** | Network economics input at ${SIM_TS} |
| Validation status | **${FROZEN.validation}** | Twin run only; live certification begins at Phase 1 energisation |

${baselineSentence()}

Tier monthly profits, IO payments, target-DSCR payments, and balloon balances trace to that simulation run, scaled by locked CAPEX build-out per tranche (Simulation Assumptions Schedule; Schedule C). The full economics model is available in the data room.

### Why balloon — not full 48-month amortization

At the fixed commercial terms under discussion (**${TERM_MONTHS} months · ${pct(ANNUAL_RATE * 100, 0)} fixed**), a fully amortizing schedule requires approximately **35%/yr** debt-service yield on principal. The simulation-derived profit yield on funded capex at Phase 1 scale is approximately **29%/yr**. Under full amortization, natural DSCR tops out near **0.82x** even at a **${usd(3_000_000)}** draw — below any defensible **${DSCR}x–1.5x** lender floor.

| Comparison | Debt-service yield | Source |
|------------|-------------------|--------|
| Full 48-mo amortization at 12% | ~35%/yr on principal | Annuity formula on ${TERM_MONTHS}-month term |
| Simulation profit yield (funded capex) | ~29%/yr | Tier monthly profit ÷ funded build-out |
| Natural full-amortization DSCR ($3M) | ~0.82x | ${usd(3_000_000)} draw — below ${DSCR}x floor |

This is a **structural** constraint, not a negotiating position. The financeable alternative — standard in project finance — is to **size post–interest-only payments to a target DSCR** and accept a **balloon / refinance balance at maturity** rather than pretend the loan self-liquidates in ${TERM_MONTHS} months.

### Facility sizes offered

| Tranche | Status |
|---------|--------|
| ${usd(1_000_000)} | **Not offered** — does not fund a viable build-out after site and container fixed costs |
| ${usd(2_000_000)} | Offered — see term sheet |
| ${usd(3_000_000)} | Offered — full Phase 1 scale (preferred) |

Minimum lender participation: **${usd(250_000)}**. Multiple lenders may participate pro-rata in a single facility up to **${usd(3_000_000)}**.

### Enclosures

1. Indicative Term Sheet (balloon structure)  
2. Form Loan Agreement (discussion draft — counsel to finalize)  
3. Simulation Assumptions Schedule  
4. Schedule D — Key Risks

### Important disclosures

- OCTO AI performance is **simulation-validated** pending Phase 1 energisation.  
- CAPEX build-out sizing uses **locked vendor quotes** (AntSpace/Bitmain hardware + Xplor interconnect) in \`capex-quotes.json\`, reconciled to **$3.02M** Phase 1 total.
- This package is **not an offer of securities** and **not legal or tax advice**.

We welcome a diligence call and site scoping session. Contact: **info@grnbit.digital**.

Respectfully,

**GrnBit (Cayman) Holdings**  
Miracle Lake TX Phase 1 · OCTO AI Validation Site

---

## Annex — Tranche payment summary (OCTO-optimized digital-twin · ${SIM_TS})

${tierBlocks}
`;
}

function termSheet(tiers) {
  const tierBlocks = tiers.map(tierTableBlock).join('\n');
  const capexLines = formatCapexSummary()
    .split('\n')
    .slice(1)
    .map((line) => `- ${line.trim()}`)
    .join('\n');

  return `# Indicative Term Sheet — Senior Secured Term Loan (Balloon)

**Borrower:** GrnBit (Cayman) Holdings  
**Project:** Miracle Lake TX Phase 1 — OCTO AI industrial optimization validation site  
**Date:** ${DOC_DATE}  
**Status:** Non-binding · discussion draft only · subject to counsel and credit approval

---

## 1. Facility

| Term | Detail |
|------|--------|
| **Facility size** | Up to **${usd(3_000_000)}** aggregate commitments |
| **Tranches offered** | **${usd(2_000_000)}** or **${usd(3_000_000)}** (Borrower selects at close) |
| **Excluded** | **${usd(1_000_000)}** — insufficient to fund site + container fixed costs |
| **Minimum participation** | **${usd(250_000)}** per lender |
| **Currency** | USD |
| **Purpose** | Phase 1 capex: containers, miners, interconnect, energisation, OCTO deployment |

## 2. Economics — OCTO-optimized digital-twin simulation (${SIM_TS})

| Input | Value | Logic chain |
|-------|-------|-------------|
| OCTO-optimized daily profit | ${usd(FROZEN.dailyProfit)} | Digital-twin run at ${SIM_TS} |
| Edge vs industry-typical baseline | +${FROZEN.edgePct}% | Optimized vs baseline daily profit in twin |
| BTC in model | ${usd(FROZEN.btc)} | Network economics input at ${SIM_TS} |
| Skill validation | ${FROZEN.validation} | Twin run; live certification at energisation |

${baselineSentence()}

**Dashboard:** ${DASHBOARD_URL}  
**Full model:** Available in data room (Simulation Assumptions Schedule).

## 3. Commercial terms (fixed)

| Term | Value | Logic chain |
|------|-------|-------------|
| **Maturity** | ${TERM_MONTHS} months from first draw | Contractual term |
| **Interest rate** | **${pct(ANNUAL_RATE * 100, 0)}** per annum, fixed | Stated coupon |
| **Interest-only period** | **${IO_MONTHS} months** from first draw | Construction / energisation |
| **Post-IO payments** | Sized to **${DSCR}x target DSCR** | Monthly profit ÷ ${DSCR} |
| **Maturity payment** | **Balloon** — unpaid principal balance | Remaining balance month ${TERM_MONTHS} |
| **Amortization** | **Not** full self-liquidating | See Section 8 |

${tierBlocks}

## 4. Security

- First-priority security interest in Miracle Lake Phase 1 equipment (containers, miners, PDUs, cooling).  
- Assignment of power purchase / interconnect agreements where assignable.  
- OCTO field-of-use license collateral assignment (scope per definitive docs).  
- Corporate guarantee of GrnBit (Cayman) Holdings.  
- Senior to equity, SAFE, and convertible notes.

## 5. Covenants (indicative)

- **Minimum DSCR (post-IO):** ${DSCR}x tested quarterly on tier profit (live ops post-energisation; pre-energisation tests on lender-agreed budget).  
- **Debt service reserve:** 3 months post-IO payments (${negotiable('amount and funding mechanics')}).  
- **Insurance:** Property, business interruption, liability — lender as loss payee.  
- **No additional senior debt** without lender consent.
- **OCTO Validation Milestone:** Complete by ${negotiable('[●] months post-First Draw')}.

## 6. Events of default (indicative)

- Payment default (5-business-day cure for interest).  
- DSCR below **1.15x** for two consecutive quarters post-energisation.  
- Failure to refinance or repay balloon within 30 days of month-${TERM_MONTHS} maturity.  
- Insolvency, material misrepresentation, loss of power contract.
- Failure to achieve OCTO Validation Milestone within agreed period.

## 7. Conditions precedent (indicative)

- Executed vendor contracts matching locked quote IDs in Schedule C (\`capex-quotes.json\`).
- Independent engineer report on energisation timeline.  
- UCC-1 / fixture filings perfected.  
- Phase 1 interconnect and power contract in assignable form.

## 8. Structural rationale (transparency)

Full ${TERM_MONTHS}-month amortization at ${pct(ANNUAL_RATE * 100, 0)} implies ~**35%/yr** debt-service yield on principal. Simulation profit yield on funded capex is ~**29%/yr**. Natural full-amortization DSCR does not reach **${DSCR}x** at any offered principal. The balloon structure sizes payments to the target DSCR band (**${DSCR}x–1.5x**) and surfaces the remaining balance explicitly at maturity — not masked by an unfinanceable amortization schedule.

## 9. CAPEX model (locked vendor quotes)

Build-out sizing uses vendor quotes locked **${QUOTES.locked_at}** (see Schedule C):

${capexLines}

| Line item | Amount | Logic chain |
|-----------|--------|-------------|
| Site interconnect (Xplor) | $302,000 | Quote XPL-MLTX-INTERCONNECT-2026-018 |
| Per-container (AntSpace HK3) | $151,000 × 3 = $453,000 | Quote AS-MLTX-CONTAINER-2026-042 |
| Per-miner variable (AntSpace) | $10,786 × 210 = $2,265,000 | Quote AS-MLTX-P1-HW-2026-042 |
| **Phase 1 total** | **$3,020,000** | Reconciled locked total |

Lender to confirm quote validity dates and executed purchase orders before closing.

## 10. Schedules

- **Schedule C** — CAPEX vendor quotes (\`capex-quotes.json\`)  
- **Simulation Assumptions Schedule** — key twin inputs (enclosed)  
- **Schedule D** — Key Risks (enclosed)

## 11. Disclaimers

Not an offer of securities. Not legal, tax, or investment advice. OCTO metrics are simulation-validated pending live energisation. Definitive documents control over this summary.

---

**Contact:** info@grnbit.digital · https://grnbit.digital
`;
}

function loanAgreement(tiers) {
  const tierBlocks = tiers.map(tierTableBlock).join('\n');

  return `# Form Loan Agreement — Senior Secured Term Loan

**WARNING:** Form only. GrnBit counsel must review before execution. Non-binding template.

**Date:** ${DOC_DATE}  
**Parties:** GrnBit (Cayman) Holdings ("Borrower") · [Lender Name] ("Lender")

---

## Article 1 — Definitions

Key definitions include: **Business Day**, **DSCR**, **Drawdown Date**, **Facility Amount**, **Interest Period**, **Maturity Date**, **OCTO Validation Milestone**, **OCTO-Optimized Digital-Twin Simulation**, **Industry-Typical Baseline**, **Project Assets**, **Scheduled Payment**, **Balloon Payment**.

**OCTO-Optimized Digital-Twin Simulation** means the Miracle Lake TX Phase 1 economics model run as of **${SIM_TS}**, accessible at ${DASHBOARD_URL}

**Industry-Typical Baseline** means rig-level SCADA without OCTO per-chip thermal co-control, modeled at ${FROZEN.baselineUtilPct}% hashrate utilization; **Edge vs baseline** is the simulated daily-profit uplift of the OCTO-optimized scenario over that baseline.

## Article 2 — Facility

2.1 **Commitment.** Lender commits **\${Lender Commitment Amount}** as part of an aggregate facility up to **${usd(3_000_000)}**.

2.2 **Tranche election.** Borrower elects at First Draw: **${usd(2_000_000)}** or **${usd(3_000_000)}** structure per Schedule A.

2.3 **Excluded tranche.** No **${usd(1_000_000)}** loans — insufficient build-out coverage.

2.4 **Use of proceeds.** Phase 1 Miracle Lake TX: site work, containers, miners, interconnect, OCTO deployment, reserves.

## Article 3 — Interest and fees

3.1 **Rate.** ${pct(ANNUAL_RATE * 100, 0)} per annum, fixed, actual/360 or 30/360 (counsel to elect).

3.2 **Default rate.** Rate + 4% per annum on overdue amounts.

3.3 **Upfront fee.** ${negotiable('[●]% of commitment')}.  
3.4 **Exit / balloon fee.** ${negotiable('[●]% of Balloon Payment if refinanced with third party')}.

## Article 4 — Payment schedule (Schedule A)

**Phase A — Interest-only (months 1–${IO_MONTHS}):** interest on outstanding principal only.

**Phase B — Target-DSCR payments (months ${IO_MONTHS + 1}–${TERM_MONTHS}):** equal monthly Scheduled Payments sized so that **DSCR ≥ ${DSCR}x** based on trailing 3-month project EBITDA (post-energisation) or lender-approved pro forma (pre-energisation).

**Maturity (month ${TERM_MONTHS}):** payment in full of **Balloon Payment** (remaining principal).

See Schedule A for tranche-specific dollar amounts derived from the OCTO-optimized digital-twin simulation as of **${SIM_TS}**.

${tierBlocks}

## Article 5 — Representations

Borrower represents: organization validly existing; power to borrow; no default under material contracts; Project Assets free of liens except Permitted Liens; simulation disclosures in Schedule B and the Simulation Assumptions Schedule are accurate in substance; OCTO performance claims limited to simulation-validated status pending energisation.

## Article 6 — Covenants

Affirmative: maintain insurance; furnish quarterly compliance certificates with DSCR calculation; permit inspections; complete OCTO Validation Milestone by ${negotiable('[●] months post-First Draw')}.

Negative: no additional senior debt; no asset sales outside ordinary course; no change of control without consent.

Financial: **Minimum DSCR ${DSCR}x** (post-IO, quarterly); debt service reserve account.

## Article 7 — Security

Grant of security interest in Project Assets; fixture filing in Karnes County, TX; account control agreements; assignment of material project contracts.

## Article 8 — Events of default

Includes: failure to pay; covenant breach; incorrect representation; insolvency; failure to pay Balloon within grace period; loss of power supply contract; DSCR below 1.15x for two consecutive quarters post-energisation; failure to achieve OCTO Validation Milestone.

Remedies: acceleration, foreclosure on collateral, appointment of receiver (if permitted).

## Article 9 — Miscellaneous

Governing law: ${negotiable('[Cayman / Texas — counsel to confirm]')}. Forum: ${negotiable('[●]')}. Notices. Amendments in writing. counterparts / e-sign.

---

## Schedule A — Payment amounts (OCTO-optimized digital-twin · ${SIM_TS})

${tierBlocks}

## Schedule B — Simulation disclosure

| Item | Value | Source |
|------|-------|--------|
| Dashboard | ${DASHBOARD_URL} | Public diligence surface |
| Simulation timestamp | ${SIM_TS} | Twin pull used to size payments |
| OCTO-optimized daily profit | ${usd(FROZEN.dailyProfit)} | Digital-twin optimized scenario |
| BTC price | ${usd(FROZEN.btc)} | Model input at pull |
| Edge vs baseline | +${FROZEN.edgePct}% | Optimized vs industry-typical baseline |
| Validation | ${FROZEN.validation} | Pending live energisation |
| CAPEX | Locked vendor quotes | Schedule C (\`capex-quotes.json\`) |
| Full economics model | Data room | Simulation Assumptions Schedule (summary) |

## Schedule C — CAPEX vendor quotes

Locked **${QUOTES.locked_at}** — see \`capex-quotes.json\` in data room. Quote IDs: AS-MLTX-P1-HW-2026-042, AS-MLTX-CONTAINER-2026-042, XPL-MLTX-INTERCONNECT-2026-018. Total: **$3,020,000**.

## Schedule D — Key Risks

See enclosed **Schedule D — Key Risks** document for risks specific to this facility, with linkages to covenants and events of default.

---

*End of discussion draft.*
`;
}

function simulationAssumptions() {
  return `# Simulation Assumptions Schedule

**Project:** Miracle Lake TX Phase 1  
**Model:** OCTO-optimized digital-twin simulation  
**Timestamp:** ${SIM_TS}  
**Dashboard:** ${DASHBOARD_URL}  
**Status:** ${FROZEN.validation} — live certification begins at Phase 1 energisation

---

## 1. Site and hardware

| Assumption | Value | Source |
|------------|-------|--------|
| Site | Miracle Lake, Karnes County, TX Phase 1 | Project definition |
| Containers | 3 × Bitmain ANTSPACE HK3 V6 (70 miner slots each) | Site config |
| Miners | 210 × Antminer S23 Hyd 580TH | asicminervalue.com (retrieved 2026-07-05) |
| Nominal hashrate | 121.8 PH/s | 210 × 580 TH |
| Nominal power draw | 1,157.1 kW | Fleet nameplate |
| Fleet efficiency | 9.5 J/TH | Miner spec sheet |

## 2. Power and network economics

| Assumption | Value | Source / logic chain |
|------------|-------|---------------------|
| Electricity rate | **$${FROZEN.electricityKwh}/kWh** | Karnes County TX contract — Xplor Energy / Karnes Electric |
| BTC price (model) | **${usd(FROZEN.btc)}** | Input at ${SIM_TS} |
| Block reward | 3.125 BTC | Post-2024 halving |
| Blocks per day | 144 | Bitcoin protocol |
| Network difficulty | Modeled at pull | ${SIM_TS} twin run |

## 3. Scenario comparison (baseline vs OCTO-optimized)

| Parameter | Industry-typical baseline | OCTO-optimized digital-twin |
|-----------|--------------------------|----------------------------|
| Control layer | Rig-level SCADA, no OCTO skill | octo-mining per-chip thermal co-control |
| Hashrate utilization | **${FROZEN.baselineUtilPct}%** | **${FROZEN.octoUtilPct}%** |
| Utilization basis | CleanSpark Feb 2026 operating/peak 86.4%; model uses mid-upper range | Recovered hashrate from thermal throttling |
| Hashrate gain vs baseline | — | **+${FROZEN.hashrateGainPct}%** |
| Efficiency gain (J/TH) | — | **−${FROZEN.efficiencyGainPct}%** |
| Daily profit | Baseline scenario in twin | **${usd(FROZEN.dailyProfit)}/day** |
| Edge vs baseline | — | **+${FROZEN.edgePct}%** |

${baselineSentence()}

## 4. Loan-sizing methodology

| Step | Method |
|------|--------|
| Tier daily profit | OCTO-optimized ${usd(FROZEN.dailyProfit)}/day × (miners funded ÷ 210) |
| Tier monthly profit | Daily profit × (365 ÷ 12) |
| IO payment | Principal × 12% ÷ 12 |
| Post-IO payment | Tier monthly profit ÷ ${DSCR}x target DSCR |
| Balloon | Principal remaining after months 7–${TERM_MONTHS} at target-DSCR payments |
| Build-out sizing | Locked CAPEX quotes (Schedule C) applied to draw amount |

## 5. Data room

The **full OCTO-optimized digital-twin economics model** — including network difficulty sensitivity, power-cost scenarios, and container/miner deployment logic — is available in the lender data room. This schedule summarizes inputs material to debt sizing; definitive diligence should reference the complete model export.

---

**Contact:** info@grnbit.digital
`;
}

function scheduleD() {
  return `# Schedule D — Key Risks

**Facility:** Senior secured term loan — Miracle Lake TX Phase 1  
**Borrower:** GrnBit (Cayman) Holdings  
**Date:** ${DOC_DATE}  
**Related documents:** Term Sheet · Form Loan Agreement

---

| # | Risk | Description | Covenant / trigger linkage |
|---|------|-------------|---------------------------|
| 1 | **Simulation-to-live performance gap** | OCTO metrics are **simulation-validated** only until Phase 1 energisation. Live profit may differ from the OCTO-optimized digital-twin run at ${SIM_TS}. | **OCTO Validation Milestone** covenant (Art. 6); misrepresentation EOD (Art. 8) |
| 2 | **BTC price and network difficulty volatility** | Revenue is BTC-denominated. Modeled at **${usd(FROZEN.btc)}** at ${SIM_TS}; sustained adverse moves compress DSCR. | **Minimum DSCR ${DSCR}x** covenant; **DSCR < 1.15x** for two quarters → EOD |
| 3 | **Power supply and interconnect dependency** | Operations require Karnes County grid interconnect (Xplor quote XPL-MLTX-INTERCONNECT-2026-018). Curtailment or contract termination stops revenue. | **Loss of power supply contract** → EOD (Art. 8) |
| 4 | **Balloon refinance / maturity risk** | **56–63%** of principal remains as balloon at month ${TERM_MONTHS}. Refinance, sale, or new money required. | **Failure to repay balloon** within 30 days of maturity → EOD |
| 5 | **Vendor quote expiry and CAPEX inflation** | Hardware quotes valid through **2026-09-30** (AntSpace) and **2026-12-31** (Xplor). Delayed close may require repricing. | **Conditions precedent** — executed POs matching quote IDs (Term Sheet §7) |
| 6 | **Energisation and construction delay** | IO period assumes **${IO_MONTHS} months** to energisation. Slippage extends interest-only phase and defers profit-backed DSCR testing. | IO period mechanics (Schedule A); DSCR tested post-energisation |
| 7 | **Partial build-out at lower tranche** | **${usd(2_000_000)}** draw funds **61%** of miners (129/210), reducing absolute profit versus full-site twin. | Tier-specific DSCR sizing in Schedule A |
| 8 | **OCTO Validation Milestone failure** | Failure to deploy and validate OCTO on live hardware undermines the edge thesis underpinning loan sizing. | **OCTO Validation Milestone** covenant; related EOD (Art. 8) |
| 9 | **Senior lien and collateral concentration** | Security is project-specific equipment at a single Texas site — limited diversification. | Security package (Art. 7); insurance covenant |
| 10 | **Change of control / additional indebtedness** | Unapproved ownership change or senior debt could subordinate lender or alter operator capability. | Negative covenants (Art. 6) |

---

*This schedule is indicative. Definitive risk disclosures and covenant mechanics will be set in executed documentation.*
`;
}

function changesMemo() {
  return `# Changes Memo — Discussion Draft Revision

**Package:** GrnBit senior secured term loan (balloon structure)  
**Revision date:** ${DOC_DATE}  
**Prior version:** Discussion draft published ${SIM_TS.slice(0, 10)}  
**Stage advanced:** Reviewed → **Revised** (Verified-ready posture)

---

## Summary of updates

| Area | Change |
|------|--------|
| **Baseline definition** | Added one-sentence definition of *industry-typical baseline* and *Edge vs baseline* in cover letter, term sheet, loan agreement, and Simulation Assumptions Schedule. |
| **Simulation transparency** | New **Simulation Assumptions Schedule** with power cost, hashrate, efficiency, BTC, and scenario comparison; full model noted as available in data room. |
| **Terminology** | Standardized to **OCTO-optimized digital-twin simulation**; consistent timestamp **${SIM_TS}** throughout. |
| **Negotiable items** | All **[●]** placeholders marked *negotiable — to be agreed in definitive documentation*. |
| **Risk disclosure** | New **Schedule D — Key Risks** with ten facility-specific risks tied to covenants and events of default. |
| **Substantiation** | Cover letter substantiation rewritten with source table, logic chains, and twin traceability. |
| **Number traceability** | Every financial figure in tranche tables now includes a visible logic chain column. |
| **Economics preserved** | All original numbers, vendors, dates, dashboard link, and disclaimers unchanged. |
| **Narrative consistency** | Cross-document alignment on baseline, twin source, balloon rationale, and schedule references. |

## Documents in this revision set

1. Cover_Letter_Revised_${DOC_DATE}.pdf  
2. Term_Sheet_Revised_${DOC_DATE}.pdf  
3. Loan_Agreement_Form_Revised_${DOC_DATE}.pdf  
4. Simulation_Assumptions_Schedule.pdf  
5. Key_Risks_Schedule_D.pdf  
6. Changes_Memo.pdf (this document)

---

**Prepared by:** GrnBit (Cayman) Holdings · Miracle Lake TX Phase 1  
**Contact:** info@grnbit.digital
`;
}

const PDF_CSS = `
@page { margin: 25mm 20mm; }
body {
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  color: #1a1a1a;
}
h1 { font-size: 16pt; color: #0d3b2e; border-bottom: 2px solid #0d3b2e; padding-bottom: 6px; margin-top: 0; }
h2 { font-size: 12pt; color: #0d3b2e; margin-top: 18px; }
h3 { font-size: 11pt; color: #333; margin-top: 14px; }
table { border-collapse: collapse; width: 100%; margin: 10px 0 14px; font-size: 9.5pt; }
th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #f0f4f2; font-weight: 600; }
tr:nth-child(even) td { background: #fafafa; }
strong { color: #0d3b2e; }
hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
p { margin: 8px 0; }
`;

async function writePdf(mdToPdf, md, destPdf) {
  await mdToPdf(
    { content: md },
    {
      dest: destPdf,
      css: PDF_CSS,
      pdf_options: {
        format: 'Letter',
        margin: { top: '28mm', bottom: '22mm', left: '20mm', right: '20mm' },
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-size:7pt; color:#666; width:100%; text-align:center; padding-top:4mm;">${HEADER_LABEL}</div>`,
        footerTemplate: '<div style="font-size:7pt; color:#666; width:100%; text-align:center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      },
    },
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  fs.mkdirSync(opts.outDir, { recursive: true });

  const tiers = buildTiers();
  const docs = [
    { file: `Cover_Letter_Revised_${DOC_DATE}.pdf`, body: coverLetter(tiers) },
    { file: `Term_Sheet_Revised_${DOC_DATE}.pdf`, body: termSheet(tiers) },
    { file: `Loan_Agreement_Form_Revised_${DOC_DATE}.pdf`, body: loanAgreement(tiers) },
    { file: 'Simulation_Assumptions_Schedule.pdf', body: simulationAssumptions() },
    { file: 'Key_Risks_Schedule_D.pdf', body: scheduleD() },
    { file: 'Changes_Memo.pdf', body: changesMemo() },
  ];

  let mdToPdf;
  try {
    ({ mdToPdf } = require('md-to-pdf'));
  } catch {
    throw new Error('md-to-pdf not installed — run npm install in loan-tool');
  }

  const written = [];
  for (const { file, body } of docs) {
    const dest = path.join(opts.outDir, file);
    console.log(`Generating ${file}...`);
    await writePdf(mdToPdf, body, dest);
    if (!fs.existsSync(dest)) throw new Error(`Failed to write ${dest}`);
    written.push(dest);
    console.log(`  → ${dest}`);
  }

  // Also save markdown source alongside for traceability
  const mdDir = path.join(path.dirname(opts.outDir), 'markdown-revised');
  fs.mkdirSync(mdDir, { recursive: true });
  const mdMap = {
    'cover-letter-revised.md': coverLetter(tiers),
    'term-sheet-revised.md': termSheet(tiers),
    'loan-agreement-revised.md': loanAgreement(tiers),
    'simulation-assumptions-schedule.md': simulationAssumptions(),
    'schedule-d-key-risks.md': scheduleD(),
    'changes-memo.md': changesMemo(),
  };
  for (const [name, body] of Object.entries(mdMap)) {
    fs.writeFileSync(path.join(mdDir, name), body, 'utf8');
  }

  console.log('\nDone. Files written:');
  for (const p of written) console.log(p);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});