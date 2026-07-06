// Pulls live simulation data from the OCTO AI dashboard's real backend API.
//
// The dashboard page is JS-rendered, but inspection of its bundled script
// (view-source, searched for `fetch(`) shows it calls plain JSON endpoints
// on the same origin:
//   /api/economics  - hashrate/power/revenue/profit, baseline vs optimized
//   /api/skill      - octo-mining skill status & validation status string
//   /api/metrics    - live power/hashrate/temp snapshot
//
// These are hit directly over HTTPS rather than driving a headless browser:
// the dashboard's own front-end reads these same endpoints to populate the
// page, so this returns identical numbers to what a user sees rendered,
// without the overhead/fragility of Puppeteer/Playwright. If the dashboard
// ever moves this data into a client-only bundle with no backing API, swap
// this module for a Playwright-based scraper (the public interface below —
// fetchDashboardData() returning the same shape — would not need to change).

const BASE_URL = 'https://octo-dashboard-rikj.onrender.com';
const LOG_PATH = require('path').join(__dirname, 'data', 'dashboard-log.jsonl');
const fs = require('fs');

const MATERIAL_CHANGE_THRESHOLD = 0.15; // 15%

async function fetchJson(path) {
  const res = await fetch(BASE_URL + path);
  if (!res.ok) {
    throw new Error(`Fetch failed for ${path}: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Pull the live simulation figures we need for the loan schedule.
 * Uses /api/economics "optimized" block, which reflects the corrected
 * (post hashrate/carbon-fix) numbers — confirmed by cross-checking against
 * the rendered dashboard page (profit margin 65.6%, +22.6% profit gain,
 * +13.7% hashrate recovery all match). If /api/economics ever reports an
 * "optimized" block that doesn't match the rendered page's headline figures,
 * treat the API as stale/pre-fix and do not use it for loan documents.
 */
async function fetchDashboardData() {
  const [economics, skill] = await Promise.all([
    fetchJson('/api/economics'),
    fetchJson('/api/skill'),
  ]);

  const optimized = economics.optimized;
  const comparison = economics.comparison;

  const dailyProfitUsd = optimized.daily_profit_usd;
  const monthlyProfitUsd = dailyProfitUsd * (365 / 12);
  const annualProfitUsd = dailyProfitUsd * 365;

  return {
    fetchedAt: new Date().toISOString(),
    octoDailyProfitUsd: dailyProfitUsd,
    octoEdgeVsBaselinePct: comparison.profit_gain_pct,
    phase1AnnualProfitUsd: round2(annualProfitUsd),
    monthlyProfitUsd: round2(monthlyProfitUsd),
    btcPriceUsd: economics.network.btc_price_usd,
    hashrateGainPct: comparison.hashrate_gain_pct,
    efficiencyGainPct: comparison.efficiency_gain_pct,
    validationStatus: skill.canonical_claims.validation_status,
    skillLoaded: skill.loaded,
  };
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

/**
 * Append the pulled data point to the local log (one JSON object per line),
 * and compare against the most recent prior entry to flag material moves
 * (>15%) in the daily profit figure — the key driver of the loan schedule.
 */
function logAndCheckStaleness(dataPoint) {
  fs.mkdirSync(require('path').dirname(LOG_PATH), { recursive: true });

  let lastEntry = null;
  if (fs.existsSync(LOG_PATH)) {
    const lines = fs.readFileSync(LOG_PATH, 'utf8').trim().split('\n').filter(Boolean);
    if (lines.length > 0) {
      lastEntry = JSON.parse(lines[lines.length - 1]);
    }
  }

  fs.appendFileSync(LOG_PATH, JSON.stringify(dataPoint) + '\n');

  if (!lastEntry) {
    return { isFirstRun: true, materialChange: false };
  }

  const prevProfit = lastEntry.octoDailyProfitUsd;
  const newProfit = dataPoint.octoDailyProfitUsd;
  const pctChange = prevProfit === 0 ? 0 : Math.abs(newProfit - prevProfit) / Math.abs(prevProfit);

  return {
    isFirstRun: false,
    materialChange: pctChange > MATERIAL_CHANGE_THRESHOLD,
    pctChange,
    previous: lastEntry,
  };
}

module.exports = { fetchDashboardData, logAndCheckStaleness, LOG_PATH, MATERIAL_CHANGE_THRESHOLD };
