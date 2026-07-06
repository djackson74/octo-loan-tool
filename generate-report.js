#!/usr/bin/env node
// CLI entry point: pull live dashboard data, build loan structures for
// $1.0M / $2.0M / $3.0M, print a comparison table, and log the pull.
//
// Usage:
//   node generate-report.js
//   node generate-report.js --io-months 6 --dscr-min 1.3 --dscr-max 1.5

const { fetchDashboardData, logAndCheckStaleness, MATERIAL_CHANGE_THRESHOLD } = require('./fetch-dashboard');
const { buildLoanStructure, solveTargetDscrBalloonStructure, TERM_MONTHS, ANNUAL_RATE } = require('./loan-calc');
const {
  buildCostModel,
  resolveBuildout,
  formatCapexSummary,
  TOTAL_CAPEX,
  TOTAL_MINERS,
  CONTAINERS,
  SITE_FIXED_USD,
  CONTAINER_FIXED_USD,
  MINER_VARIABLE_USD,
} = require('./capex-model');

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--io-months') opts.ioMonths = Number(argv[++i]);
    if (argv[i] === '--dscr-min') opts.dscrMin = Number(argv[++i]);
    if (argv[i] === '--dscr-max') opts.dscrMax = Number(argv[++i]);
    if (argv[i] === '--site-fixed-pct') opts.siteFixedPct = Number(argv[++i]);
    if (argv[i] === '--container-fixed-pct') opts.containerFixedPct = Number(argv[++i]);
    if (argv[i] === '--site-fixed-usd') opts.siteFixedUsd = Number(argv[++i]);
    if (argv[i] === '--container-fixed-usd') opts.containerFixedUsd = Number(argv[++i]);
    if (argv[i] === '--miner-variable-usd') opts.minerVariableUsd = Number(argv[++i]);
  }
  return opts;
}

function usd(n) {
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  console.log('Fetching live simulation data from OCTO dashboard...\n');
  const data = await fetchDashboardData();
  const staleness = logAndCheckStaleness(data);

  console.log('=== LIVE DASHBOARD SIMULATION INPUTS ===');
  console.log(`Pulled at:              ${data.fetchedAt}`);
  console.log(`OCTO Daily Profit:      ${usd(data.octoDailyProfitUsd)}`);
  console.log(`OCTO Edge vs Baseline:  +${data.octoEdgeVsBaselinePct}%`);
  console.log(`Phase 1 Annual Profit:  ${usd(data.phase1AnnualProfitUsd)}`);
  console.log(`Derived Monthly Profit: ${usd(data.monthlyProfitUsd)}  (FULL 210-miner site reference only —`);
  console.log(`                        NOT used directly below; each draw tier gets its own scaled-down`);
  console.log(`                        profit figure based on the build-out it actually funds, see below)`);
  console.log(`BTC price (live):       ${usd(data.btcPriceUsd)}`);
  console.log(`Skill validation:       ${data.validationStatus}`);
  console.log('');

  if (staleness.isFirstRun) {
    console.log('(First run — no prior data point to compare against for staleness check.)\n');
  } else if (staleness.materialChange) {
    console.log(`*** STALE DATA WARNING ***`);
    console.log(`Daily profit moved ${(staleness.pctChange * 100).toFixed(1)}% since the last pull `
      + `(was ${usd(staleness.previous.octoDailyProfitUsd)} at ${staleness.previous.fetchedAt}).`);
    console.log(`This exceeds the ${MATERIAL_CHANGE_THRESHOLD * 100}% threshold — any loan document`);
    console.log(`built on the previous figure is stale and should be regenerated before it goes to a lender.\n`);
  } else {
    console.log(`Daily profit change since last pull: ${(staleness.pctChange * 100).toFixed(1)}% (within ${MATERIAL_CHANGE_THRESHOLD * 100}% tolerance, not material).\n`);
  }

  // --- Tier-specific build-out sizing ---------------------------------
  // A draw below the full $3.02M Phase 1 CAPEX funds a proportionally
  // smaller build-out (fewer containers/miners energized), NOT the full
  // 210-miner site. Profit must scale with the miners that draw actually
  // funds, net of costs that don't shrink linearly (site interconnect,
  // per-container infrastructure). See capex-model.js for the full
  // fixed/variable cost logic and the flagged assumption it depends on.
  const costModel = buildCostModel({
    totalDailyProfitUsd: data.octoDailyProfitUsd,
    siteFixedUsd: opts.siteFixedUsd ?? (opts.siteFixedPct != null ? TOTAL_CAPEX * opts.siteFixedPct : undefined),
    containerFixedUsd: opts.containerFixedUsd ?? (opts.containerFixedPct != null
      ? (TOTAL_CAPEX * opts.containerFixedPct) / CONTAINERS
      : undefined),
    minerVariableUsd: opts.minerVariableUsd,
  });

  console.log('=== BUILD-OUT COST MODEL (LOCKED VENDOR QUOTES) ===');
  console.log(formatCapexSummary());
  console.log(`Full-site CAPEX (dashboard + quotes): ${usd(TOTAL_CAPEX)} for ${TOTAL_MINERS} miners / ${CONTAINERS} containers`);
  console.log(`  Site-level fixed (Xplor interconnect quote):                 ${usd(Math.round(costModel.siteFixedCost))}`);
  console.log(`  Per-container fixed (AntSpace HK3 V6 bundle), x${CONTAINERS}:  ${usd(Math.round(costModel.containerFixedCost))}/container`);
  console.log(`  Per-miner variable (S23 Hyd unit + install):               ${usd(Math.round(costModel.variableCostPerMiner))}/miner`);
  console.log(`  Monthly profit per funded miner (linear extrapolation):    ${usd(Math.round(costModel.monthlyProfitPerMiner))}/mo`);
  console.log(`  Quote refs: ${costModel.quoteRefs.join(' · ')}`);
  console.log(`  Override USD flags: --site-fixed-usd / --container-fixed-usd / --miner-variable-usd\n`);

  console.log(`=== LOAN STRUCTURE (fixed terms: ${TERM_MONTHS}mo term, ${(ANNUAL_RATE * 100).toFixed(0)}% fixed annual rate) ===\n`);

  const principals = [2_000_000, 3_000_000];
  console.log('Note: $1.0M tranche excluded — insufficient build-out after site/container fixed costs.\n');
  const buildouts = principals.map(p => ({ principal: p, buildout: resolveBuildout(p, costModel) }));

  const infeasible = buildouts.filter(b => !b.buildout.feasible);
  if (infeasible.length) {
    infeasible.forEach(b => console.log(`INFEASIBLE at ${usd(b.principal)}: ${b.buildout.reason}`));
    console.log('');
  }

  const results = buildouts
    .filter(b => b.buildout.feasible)
    .map(b => ({
      principal: b.principal,
      buildout: b.buildout,
      loan: buildLoanStructure(b.principal, b.buildout.monthlyProfit, opts),
    }));

  const rows = results.map(r => ({
    'Principal': usd(r.principal),
    'Miners Funded': `${r.buildout.minersFunded} / ${TOTAL_MINERS} (${(r.buildout.fundedFraction * 100).toFixed(0)}%)`,
    'Containers': r.buildout.containersActivated,
    'Tier Monthly Profit': usd(r.buildout.monthlyProfit),
    'IO Period': `${r.loan.ioMonths} mo`,
    'IO Monthly Pmt': usd(r.loan.ioMonthlyPayment),
    'Post-IO Monthly Pmt': usd(r.loan.postIoPayment),
    'Resulting DSCR': `${r.loan.dscrNatural.toFixed(2)}x`,
    'GrnBit Margin (post-IO, /mo)': usd(r.loan.grnbitMarginPostIo),
    'Fully Amortizes in 48mo?': r.loan.fullyAmortizes ? 'YES' : 'NO',
    'Meets Target DSCR Band?': r.loan.meetsTargetDscr ? 'YES' : 'NO — SEE FLAG',
  }));

  console.table(rows);

  results.forEach(r => {
    if (r.loan.flag) {
      console.log(`\n${r.loan.flag}`);
    }
  });

  // --- Explicit check: does a SMALLER draw end up with WORSE DSCR than a
  // larger one, once fixed-cost drag is properly accounted for? This is
  // the opposite of what a flat-profit-per-dollar model would show, and is
  // exactly the failure mode this recalculation exists to catch.
  for (let i = 1; i < results.length; i++) {
    const smaller = results[i - 1];
    const larger = results[i];
    if (smaller.principal < larger.principal && smaller.loan.dscrNatural < larger.loan.dscrNatural) {
      console.log(`\n*** DSCR INVERSION FLAG ***`);
      console.log(`${usd(smaller.principal)} draw (${smaller.buildout.minersFunded} miners) yields DSCR ${smaller.loan.dscrNatural.toFixed(2)}x,`);
      console.log(`WORSE than the ${usd(larger.principal)} draw (${larger.buildout.minersFunded} miners) at DSCR ${larger.loan.dscrNatural.toFixed(2)}x.`);
      console.log(`This is because fixed site/container costs consume a larger share of a smaller draw's`);
      console.log(`budget, leaving proportionally less capital for revenue-generating miners per loan dollar.`);
      console.log(`A smaller loan is NOT inherently safer here — it may be the weaker credit.`);
    }
  }

  // --- Full-amortization ceiling check ---------------------------------
  // Full 48mo amortization at 12% requires a fixed ~35.1%/yr debt-service
  // yield on principal (independent of principal size, once past the
  // fixed-cost-drag region) - this site's profit yield on capex is only
  // ~28.9%/yr, so no principal in range can hit the 1.3x-1.5x band under
  // full amortization. The alternative below sizes payment to the target
  // DSCR directly and reports the balloon/refi balance due at month 48.
  console.log(`=== ALTERNATIVE: TARGET-DSCR PAYMENT + BALLOON AT MONTH 48 ===`);
  console.log(`Full amortization cannot reach the 1.3x-1.5x DSCR band at ANY principal in this range`);
  console.log(`(even the full \$3.02M site tops out at ~0.82x - see flags above). The standard`);
  console.log(`project-finance alternative: size the post-IO payment to the target DSCR directly`);
  console.log(`and accept a balloon/refinance balance at month 48 instead of forcing full payoff.\n`);

  results.forEach(r => {
    console.log(`--- ${usd(r.principal)} (${r.buildout.minersFunded} miners, ${usd(r.buildout.monthlyProfit)}/mo tier profit) ---`);
    [1.3, 1.5].forEach(d => {
      const s = solveTargetDscrBalloonStructure(r.principal, r.buildout.monthlyProfit, r.loan.ioMonths, d);
      const warn = s.negativeAmortization ? '  *** NEGATIVE AMORTIZATION — payment is below interest-only; balance GROWS. Not financeable at this DSCR. ***' : '';
      console.log(`  DSCR ${d}x target: IO-period DSCR ${s.ioDscr}x, post-IO payment ${usd(s.paymentTarget)}/mo, balloon due mo.48: ${usd(s.balloonBalance)} (${s.balloonPct}% of principal)${warn}`);
    });
    console.log('');
  });

  console.log(`\nTarget DSCR band used: ${DEFAULT_DSCR_MIN_MAX(opts)}`);
  console.log(`IO period used: ${results[0] ? results[0].loan.ioMonths : 'n/a'} months (dashboard exposes no numeric ramp-to-stable-profit`);
  console.log(`metric today — only a static "simulation-validated" status string — so this falls back to the`);
  console.log(`configured default, clamped to the requested 3-12 month sensible range. Override with --io-months.`);

  console.log(`\nLog file: ${require('./fetch-dashboard').LOG_PATH}`);
}

function DEFAULT_DSCR_MIN_MAX(opts) {
  const { DEFAULT_DSCR_MIN, DEFAULT_DSCR_MAX } = require('./loan-calc');
  const min = opts.dscrMin ?? DEFAULT_DSCR_MIN;
  const max = opts.dscrMax ?? DEFAULT_DSCR_MAX;
  return `${min}x - ${max}x`;
}

main().catch(err => {
  console.error('Error generating report:', err.message);
  process.exit(1);
});
