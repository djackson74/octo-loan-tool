#!/usr/bin/env node
// Generate lender discussion drafts: cover letter, term sheet, loan agreement.
// Uses live dashboard data + balloon math ($2M / $3M only — $1M excluded).

const fs = require('fs');
const path = require('path');
const { fetchDashboardData } = require('./fetch-dashboard');
const { solveTargetDscrBalloonStructure, TERM_MONTHS, ANNUAL_RATE, DEFAULT_DSCR_MIN } = require('./loan-calc');
const { buildCostModel, resolveBuildout, formatCapexSummary, TOTAL_MINERS, QUOTES } = require('./capex-model');
const GRNBIT = require('./grnbit-brand');

const OUT_DIR = path.join(__dirname, 'output');
const PRINCIPALS = [2_000_000, 3_000_000];
const IO_MONTHS = 6;
const DSCR = DEFAULT_DSCR_MIN;

function usd(n) {
  return '$' + Math.round(n).toLocaleString();
}

function pct(n) {
  return n.toFixed(1) + '%';
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function buildTier(principal, costModel) {
  const buildout = resolveBuildout(principal, costModel);
  if (!buildout.feasible) return null;
  const balloon = solveTargetDscrBalloonStructure(
    principal,
    buildout.monthlyProfit,
    IO_MONTHS,
    DSCR,
  );
  return { principal, buildout, balloon };
}

function tierBlock(t) {
  const b = t.buildout;
  const s = t.balloon;
  return `### ${usd(t.principal)} tranche

| Item | Value |
|------|-------|
| Build-out funded | ${b.minersFunded} miners / ${TOTAL_MINERS} (${(b.fundedFraction * 100).toFixed(0)}%) · ${b.containersActivated} container(s) |
| Tier monthly profit (sim) | ${usd(b.monthlyProfit)}/mo |
| IO period | Months 1–${IO_MONTHS} · ${usd(s.ioPayment)}/mo |
| IO-period DSCR | ${s.ioDscr}x |
| Post-IO payment (target ${DSCR}x DSCR) | ${usd(s.paymentTarget)}/mo |
| Balloon due month ${TERM_MONTHS} | ${usd(s.balloonBalance)} (${pct(s.balloonPct)} of principal) |
`;
}

function coverLetter(ctx) {
  return `# Cover Letter — Senior Secured Term Loan (Discussion Draft)

**Date:** ${ctx.date}  
**From:** ${GRNBIT.legalName}  
**Address:** ${GRNBIT.registeredOffice}  
**Project:** ${GRNBIT.projectSite}  
**To:** Prospective senior lender / participation syndicate
**Re:** Indicative ${usd(3_000_000)} senior secured term loan facility — balloon structure  
**Status:** Non-binding · for discussion with counsel only

---

Dear Lender,

${GRNBIT.legalName} ("**Borrower**") requests your consideration of a senior secured term loan to fund energisation and OCTO AI validation at **${GRNBIT.projectSite}** (power: ${GRNBIT.powerPartner}).

### Why this letter

We are not asking you to rely on a static deck. Coverage metrics in the enclosed term sheet are sized from the **live OCTO AI dashboard simulation** pulled ${ctx.fetchedAt}:

- OCTO daily profit (optimized twin): **${usd(ctx.dailyProfit)}/day**
- OCTO edge vs industry-typical baseline: **+${ctx.edgePct}%**
- BTC price in model: **${usd(ctx.btc)}**
- Validation status: **${ctx.validation}**

The dashboard is the same surface we use for investor diligence:  
https://octo-dashboard-rikj.onrender.com/

### Why balloon — not full 48-month amortization

At the fixed commercial terms under discussion (**48 months · 12% fixed**), a fully amortizing schedule requires approximately **35%/yr** debt-service yield on principal. The simulation-derived profit yield on funded capex at Phase 1 scale is approximately **29%/yr**. Under full amortization, natural DSCR tops out near **0.82x** even at a **${usd(3_000_000)}** draw — below any defensible **1.3x–1.5x** lender floor.

This is a **structural** constraint, not a negotiating position. The financeable alternative — standard in project finance — is to **size post–interest-only payments to a target DSCR** and accept a **balloon / refinance balance at maturity** rather than pretend the loan self-liquidates in 48 months.

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

### Important disclosures

- OCTO AI performance is **simulation-validated** pending Phase 1 energisation.  
- CAPEX build-out sizing uses **locked vendor quotes** (AntSpace/Bitmain hardware + Xplor interconnect) in \`capex-quotes.json\`, reconciled to **$3.02M** Phase 1 total.
- This package is **not an offer of securities** and **not legal or tax advice**.

We welcome a diligence call and site scoping session. Contact: **${GRNBIT.contactEmail}** (debt / lender inquiries: **${GRNBIT.contactEmailDebt}**).

Respectfully,

${GRNBIT.signature()}
`;
}

function termSheet(ctx) {
  return `# Indicative Term Sheet — Senior Secured Term Loan (Balloon)

**Borrower:** ${GRNBIT.legalName}  
**Registered office:** ${GRNBIT.registeredOffice}  
**Project:** ${GRNBIT.projectSite} — OCTO AI industrial optimization validation site
**Date:** ${ctx.date}  
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

## 2. Economics (live simulation inputs — ${ctx.fetchedAt})

| Input | Value |
|-------|-------|
| OCTO daily profit (optimized) | ${usd(ctx.dailyProfit)} |
| Edge vs baseline | +${ctx.edgePct}% |
| BTC in model | ${usd(ctx.btc)} |
| Skill validation | ${ctx.validation} |

## 3. Commercial terms (fixed)

| Term | Value |
|------|-------|
| **Maturity** | ${TERM_MONTHS} months from first draw |
| **Interest rate** | **${(ANNUAL_RATE * 100).toFixed(0)}%** per annum, fixed |
| **Interest-only period** | **${IO_MONTHS} months** from first draw (construction / energisation) |
| **Post-IO payments** | Sized to **${DSCR}x target DSCR** on tier-specific simulated monthly profit |
| **Maturity payment** | **Balloon** — unpaid principal balance after scheduled payments (refinance, sale, or new money) |
| **Amortization** | **Not** full self-liquidating — see Section 8 |

${ctx.tierBlocks}

## 4. Security

- First-priority security interest in Miracle Lake Phase 1 equipment (containers, miners, PDUs, cooling).  
- Assignment of power purchase / interconnect agreements where assignable.  
- OCTO field-of-use license collateral assignment (scope per definitive docs).  
- Corporate guarantee of ${GRNBIT.legalName}.
- Senior to equity, SAFE, and convertible notes.

## 5. Covenants (indicative)

- **Minimum DSCR (post-IO):** ${DSCR}x tested quarterly on tier profit (live ops post-energisation; pre-energisation tests on lender-agreed budget).  
- **Debt service reserve:** 3 months post-IO payments (negotiable).  
- **Insurance:** Property, business interruption, liability — lender as loss payee.  
- **No additional senior debt** without lender consent.

## 6. Events of default (indicative)

- Payment default (5-business-day cure for interest).  
- DSCR below **1.15x** for two consecutive quarters post-energisation.  
- Failure to refinance or repay balloon within 30 days of month-${TERM_MONTHS} maturity.  
- Insolvency, material misrepresentation, loss of power contract.

## 7. Conditions precedent (indicative)

- Executed vendor contracts matching locked quote IDs in Schedule C (\`capex-quotes.json\`).
- Independent engineer report on energisation timeline.  
- UCC-1 / fixture filings perfected.  
- Phase 1 interconnect and power contract in assignable form.

## 8. Structural rationale (transparency)

Full ${TERM_MONTHS}-month amortization at ${(ANNUAL_RATE * 100).toFixed(0)}% implies ~**35%/yr** debt-service yield on principal. Simulation profit yield on funded capex is ~**29%/yr**. Natural full-amortization DSCR does not reach **${DSCR}x** at any offered principal. The balloon structure sizes payments to the target DSCR band (**${DSCR}x–1.5x**) and surfaces the remaining balance explicitly at maturity — not masked by an unfinanceable amortization schedule.

## 9. CAPEX model (locked vendor quotes)

Build-out sizing uses vendor quotes locked **${QUOTES.locked_at}** (see Schedule C):

${ctx.capexSummary}

Lender to confirm quote validity dates and executed purchase orders before closing.

## 10. Disclaimers

Not an offer of securities. Not legal, tax, or investment advice. OCTO metrics are simulation-validated pending live energisation. Definitive documents control over this summary.

---

**Contact:** ${GRNBIT.contactLine()}  
**Debt / IR:** ${GRNBIT.contactEmailDebt}
`;
}

function loanAgreement(ctx) {
  return `# Form Loan Agreement — Senior Secured Term Loan (Discussion Draft)

**WARNING:** Form only. GrnBit counsel must review before execution. Non-binding template.

**Date:** ${ctx.date}  
**Parties:** ${GRNBIT.legalName} ("Borrower") · [Lender Name] ("Lender")  
**Borrower address:** ${GRNBIT.registeredOffice}

---

## Article 1 — Definitions

Key definitions include: **Business Day**, **DSCR**, **Drawdown Date**, **Facility Amount**, **Interest Period**, **Maturity Date**, **OCTO Validation Milestone**, **Project Assets**, **Scheduled Payment**, **Balloon Payment**.

## Article 2 — Facility

2.1 **Commitment.** Lender commits **\${Lender Commitment Amount}** as part of an aggregate facility up to **${usd(3_000_000)}**.

2.2 **Tranche election.** Borrower elects at First Draw: **${usd(2_000_000)}** or **${usd(3_000_000)}** structure per Schedule A.

2.3 **Excluded tranche.** No **${usd(1_000_000)}** loans — insufficient build-out coverage.

2.4 **Use of proceeds.** Phase 1 Miracle Lake TX: site work, containers, miners, interconnect, OCTO deployment, reserves.

## Article 3 — Interest and fees

3.1 **Rate.** ${(ANNUAL_RATE * 100).toFixed(0)}% per annum, fixed, actual/360 or 30/360 (counsel to elect).

3.2 **Default rate.** Rate + 4% per annum on overdue amounts.

3.3 **Upfront fee.** [●]% of commitment (negotiable).  
3.4 **Exit / balloon fee.** [●]% of Balloon Payment if refinanced with third party (negotiable).

## Article 4 — Payment schedule (Schedule A)

**Phase A — Interest-only (months 1–${IO_MONTHS}):** interest on outstanding principal only.

**Phase B — Target-DSCR payments (months ${IO_MONTHS + 1}–${TERM_MONTHS}):** equal monthly Scheduled Payments sized so that **DSCR ≥ ${DSCR}x** based on trailing 3-month project EBITDA (post-energisation) or lender-approved pro forma (pre-energisation).

**Maturity (month ${TERM_MONTHS}):** payment in full of **Balloon Payment** (remaining principal).

See Schedule A for tranche-specific dollar amounts derived from simulation as of ${ctx.fetchedAt}.

${ctx.tierBlocks}

## Article 5 — Representations

Borrower represents: organization validly existing; power to borrow; no default under material contracts; Project Assets free of liens except Permitted Liens; simulation disclosures in Schedule B are accurate in substance; OCTO performance claims limited to simulation-validated status pending energisation.

## Article 6 — Covenants

Affirmative: maintain insurance; furnish quarterly compliance certificates with DSCR calculation; permit inspections; complete OCTO Validation Milestone by [●] months post-First Draw.

Negative: no additional senior debt; no asset sales outside ordinary course; no change of control without consent.

Financial: **Minimum DSCR ${DSCR}x** (post-IO, quarterly); debt service reserve account.

## Article 7 — Security

Grant of security interest in Project Assets; fixture filing in Karnes County, TX; account control agreements; assignment of material project contracts.

## Article 8 — Events of default

Includes: failure to pay; covenant breach; incorrect representation; insolvency; failure to pay Balloon within grace period; loss of power supply contract.

Remedies: acceleration, foreclosure on collateral, appointment of receiver (if permitted).

## Article 9 — Miscellaneous

Governing law: [Cayman / Texas — counsel to confirm]. Forum: [●]. Notices. Amendments in writing. counterparts / e-sign.

---

## Schedule A — Payment amounts (simulation-sized · ${ctx.fetchedAt})

${ctx.tierBlocks}

## Schedule B — Simulation disclosure

- Dashboard source: https://octo-dashboard-rikj.onrender.com/  
- OCTO daily profit at pull: ${usd(ctx.dailyProfit)}  
- BTC: ${usd(ctx.btc)} · Edge: +${ctx.edgePct}%  
- Validation: ${ctx.validation}  
- CAPEX: locked vendor quotes per Schedule C (\`capex-quotes.json\`).

---

*End of discussion draft.*
`;
}

async function main() {
  const data = await fetchDashboardData();
  const costModel = buildCostModel({ totalDailyProfitUsd: data.octoDailyProfitUsd });
  const tiers = PRINCIPALS.map((p) => buildTier(p, costModel)).filter(Boolean);
  if (!tiers.length) throw new Error('No feasible loan tiers');

  const tierBlocks = tiers.map(tierBlock).join('\n');
  const capexLines = formatCapexSummary()
    .split('\n')
    .slice(1)
    .map((line) => `- ${line.trim()}`)
    .join('\n');

  const ctx = {
    date: dateStamp(),
    fetchedAt: data.fetchedAt,
    dailyProfit: data.octoDailyProfitUsd,
    edgePct: data.octoEdgeVsBaselinePct,
    btc: data.btcPriceUsd,
    validation: data.validationStatus,
    tierBlocks,
    capexSummary: capexLines,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = {
    'cover-letter.md': coverLetter(ctx),
    'term-sheet.md': termSheet(ctx),
    'loan-agreement.md': loanAgreement(ctx),
  };
  for (const [name, body] of Object.entries(files)) {
    const fp = path.join(OUT_DIR, name);
    fs.writeFileSync(fp, body, 'utf8');
    console.log('Wrote', fp);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});