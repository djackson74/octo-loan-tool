// Models how a partial draw (< full Phase 1 CAPEX) funds a smaller build-out,
// and what that build-out's monthly profit actually is.
//
// Fixed/variable split is sourced from capex-quotes.json (locked vendor quotes),
// reconciled to financial_model.capex_usd = $3,020,000 in /api/economics.

const fs = require('fs');
const path = require('path');

const QUOTES_PATH = path.join(__dirname, 'capex-quotes.json');

function loadQuotes() {
  const raw = fs.readFileSync(QUOTES_PATH, 'utf8');
  return JSON.parse(raw);
}

const QUOTES = loadQuotes();
const COST = QUOTES.cost_model;

const TOTAL_CAPEX = QUOTES.total_capex_usd;
const TOTAL_MINERS = COST.miner_count;
const CONTAINERS = COST.container_count;
const MINERS_PER_CONTAINER = 70;

const SITE_FIXED_USD = COST.site_fixed_usd;
const CONTAINER_FIXED_USD = COST.container_fixed_usd_per_unit;
const MINER_VARIABLE_USD = COST.miner_variable_usd_per_unit;

/** @deprecated Percentages retained for CLI override compatibility only. */
const SITE_FIXED_PCT = SITE_FIXED_USD / TOTAL_CAPEX;
/** @deprecated Percentages retained for CLI override compatibility only. */
const CONTAINER_FIXED_PCT = (CONTAINER_FIXED_USD * CONTAINERS) / TOTAL_CAPEX;

/**
 * @param {object} opts
 * @param {number} opts.totalDailyProfitUsd - LIVE full-site daily profit
 *   pulled from the dashboard this run (do not hardcode — it moves with
 *   BTC price, difficulty, carbon pricing).
 * @param {number} [opts.siteFixedUsd] - override site fixed (USD)
 * @param {number} [opts.containerFixedUsd] - override per-container fixed (USD)
 * @param {number} [opts.minerVariableUsd] - override per-miner variable (USD)
 */
function buildCostModel(opts = {}) {
  const totalCapex = opts.totalCapex ?? TOTAL_CAPEX;
  const totalDailyProfitUsd = opts.totalDailyProfitUsd;
  if (totalDailyProfitUsd == null) {
    throw new Error('buildCostModel requires opts.totalDailyProfitUsd (live dashboard figure)');
  }

  const siteFixedCost = opts.siteFixedUsd ?? SITE_FIXED_USD;
  const containerFixedCost = opts.containerFixedUsd ?? CONTAINER_FIXED_USD;
  const variableCostPerMiner = opts.minerVariableUsd ?? MINER_VARIABLE_USD;

  const containerFixedTotal = containerFixedCost * CONTAINERS;
  const variableTotal = variableCostPerMiner * TOTAL_MINERS;

  const dailyProfitPerMiner = totalDailyProfitUsd / TOTAL_MINERS;
  const monthlyProfitPerMiner = dailyProfitPerMiner * (365 / 12);

  return {
    quotesLocked: QUOTES.status === 'locked',
    quotesLockedAt: QUOTES.locked_at,
    siteFixedPct: siteFixedCost / totalCapex,
    containerFixedPct: containerFixedTotal / totalCapex,
    variablePct: variableTotal / totalCapex,
    siteFixedCost,
    containerFixedCost,
    variableCostPerMiner,
    monthlyProfitPerMiner,
    totalCapex,
    quoteRefs: QUOTES.quotes.map((q) => `${q.vendor} ${q.quote_id}`),
  };
}

/**
 * Given a draw amount, determine the largest feasible build-out (number of
 * containers activated, and miners funded within those containers), then
 * derive the resulting monthly profit for that build-out.
 */
function resolveBuildout(drawAmount, costModel) {
  const { siteFixedCost, containerFixedCost, variableCostPerMiner, monthlyProfitPerMiner } = costModel;

  const budgetAfterSite = drawAmount - siteFixedCost;

  if (budgetAfterSite <= 0) {
    return {
      feasible: false,
      reason: `Draw of $${drawAmount.toLocaleString()} does not even cover the site-level fixed cost of $${Math.round(siteFixedCost).toLocaleString()} (Xplor interconnect quote).`,
      containersActivated: 0,
      minersFunded: 0,
      monthlyProfit: 0,
      fundedFraction: 0,
    };
  }

  let best = null;
  for (let c = 1; c <= CONTAINERS; c++) {
    const budgetForMiners = budgetAfterSite - c * containerFixedCost;
    if (budgetForMiners <= 0) continue;
    const minersRaw = Math.floor(budgetForMiners / variableCostPerMiner);
    const miners = Math.max(0, Math.min(minersRaw, c * MINERS_PER_CONTAINER, TOTAL_MINERS));
    if (!best || miners > best.minersFunded) {
      best = { containersActivated: c, minersFunded: miners };
    }
  }

  if (!best || best.minersFunded === 0) {
    return {
      feasible: false,
      reason: `Draw of $${drawAmount.toLocaleString()} covers site-level fixed cost but not even one container ($${Math.round(containerFixedCost).toLocaleString()}) plus any miners.`,
      containersActivated: 0,
      minersFunded: 0,
      monthlyProfit: 0,
      fundedFraction: 0,
    };
  }

  const monthlyProfit = best.minersFunded * monthlyProfitPerMiner;
  const spentOnSite = siteFixedCost;
  const spentOnContainers = best.containersActivated * containerFixedCost;
  const spentOnMiners = best.minersFunded * variableCostPerMiner;
  const totalSpent = spentOnSite + spentOnContainers + spentOnMiners;
  const undeployedCapital = drawAmount - totalSpent;

  return {
    feasible: true,
    containersActivated: best.containersActivated,
    minersFunded: best.minersFunded,
    fundedFraction: best.minersFunded / TOTAL_MINERS,
    monthlyProfit: round2(monthlyProfit),
    breakdown: {
      siteFixedCost: round2(spentOnSite),
      containerFixedCost: round2(spentOnContainers),
      minerVariableCost: round2(spentOnMiners),
      totalSpent: round2(totalSpent),
      undeployedCapital: round2(undeployedCapital),
    },
  };
}

function formatCapexSummary() {
  const q = QUOTES;
  const lines = [
    `Locked ${new Date(q.locked_at).toISOString().slice(0, 10)} · total ${usd(TOTAL_CAPEX)}`,
    `  Site interconnect (Xplor):     ${usd(SITE_FIXED_USD)}`,
    `  Per-container (AntSpace HK3):  ${usd(CONTAINER_FIXED_USD)} × ${CONTAINERS} = ${usd(CONTAINER_FIXED_USD * CONTAINERS)}`,
    `  Per-miner variable (AntSpace): ${usd(Math.round(MINER_VARIABLE_USD))} × ${TOTAL_MINERS} = ${usd(Math.round(MINER_VARIABLE_USD * TOTAL_MINERS))}`,
  ];
  return lines.join('\n');
}

function usd(n) {
  return '$' + Math.round(n).toLocaleString();
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

module.exports = {
  loadQuotes,
  buildCostModel,
  resolveBuildout,
  formatCapexSummary,
  QUOTES,
  TOTAL_CAPEX,
  TOTAL_MINERS,
  CONTAINERS,
  MINERS_PER_CONTAINER,
  SITE_FIXED_USD,
  CONTAINER_FIXED_USD,
  MINER_VARIABLE_USD,
  SITE_FIXED_PCT,
  CONTAINER_FIXED_PCT,
};