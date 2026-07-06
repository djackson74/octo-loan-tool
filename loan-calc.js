// Loan schedule calculator for the GrnBit / Phase 1 senior secured term loan.
//
// FIXED INPUTS (contractual terms, not to be optimized):
//   - Term: 48 months
//   - Annual rate: 12% (1% monthly, simple monthly compounding on the note)
//
// DYNAMIC INPUTS (sized from live OCTO dashboard simulation data):
//   - Monthly profit figure (from /api/economics "optimized" block)
//   - Interest-only (IO) period length
//   - Post-IO amortization payment, sized to a target DSCR band
//
// ---------------------------------------------------------------------------
// CALCULATION LOGIC (read this before trusting the numbers)
// ---------------------------------------------------------------------------
//
// 1. Monthly interest-only payment = principal * monthlyRate
//    (No principal reduction during the IO period — balance is unchanged.)
//
// 2. Post-IO amortization payment:
//    Let N = remaining months = TERM_MONTHS - ioMonths.
//    Let r = monthlyRate (0.01 for 12%/yr).
//    The MINIMUM payment that fully amortizes the full principal over N
//    months at rate r (standard annuity formula) is:
//
//        PMT_min = P * r / (1 - (1 + r)^-N)
//
//    This is the smallest payment consistent with a full 48-month payoff.
//    Its DSCR is therefore the HIGHEST DSCR obtainable while still fully
//    amortizing on schedule — i.e. it is simultaneously (a) the most
//    lender-friendly cushion available without stretching the term, and
//    (b) the most GrnBit-friendly payment (lowest debt service, most
//    retained margin) that still fully retires the loan in 48 months.
//
//    We do NOT size the payment upward to "use up" the whole DSCR band —
//    the goal stated is a defensible cushion, not maximizing extraction.
//
//    DSCR_natural = monthlyProfit / PMT_min
//
// 3. Acceptance check against the target DSCR band [dscrMin, dscrMax]
//    (default 1.3x–1.5x, configurable):
//      - If DSCR_natural >= dscrMin: ACCEPT. The loan fully amortizes in
//        48 months and clears the lender's minimum coverage bar. If
//        DSCR_natural > dscrMax, that is reported as "cushion above
//        target" (not a problem — it just means profit comfortably
//        covers debt service; we still don't inflate the payment to
//        force DSCR down into the band, since that would only benefit
//        the lender at GrnBit's expense with no term-sheet requirement
//        to do so).
//      - If DSCR_natural < dscrMin: FLAG. Even the minimum payment
//        required to fully amortize within 48 months does not leave the
//        target coverage cushion. The loan does NOT get silently
//        stretched or the DSCR silently lowered — this is surfaced so
//        principal, IO period, or term can be renegotiated deliberately.
//
// 4. Full amortization confirmation:
//    Because PMT_min is derived directly from the annuity formula for
//    exactly N months, full amortization within the 48-month term is true
//    by construction whenever PMT_min is finite and positive (i.e.
//    whenever N >= 1). We still verify by simulating the amortization
//    schedule month-by-month and checking the ending balance is ~0.
//
// ---------------------------------------------------------------------------

const TERM_MONTHS = 48;
const ANNUAL_RATE = 0.12;
const MONTHLY_RATE = ANNUAL_RATE / 12; // 1%

const IO_MIN_MONTHS = 3;
const IO_MAX_MONTHS = 12;

const DEFAULT_DSCR_MIN = 1.3;
const DEFAULT_DSCR_MAX = 1.5;

/**
 * Standard annuity payment that fully amortizes `principal` over `n`
 * months at monthly rate `r`.
 */
function amortizingPayment(principal, r, n) {
  if (n <= 0) return principal; // degenerate: due immediately
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Simulate a full amortization schedule (IO months + amortizing months)
 * and return per-month balances so we can confirm payoff within term.
 */
function simulateSchedule(principal, ioMonths, postIoPayment) {
  const rows = [];
  let balance = principal;

  for (let m = 1; m <= ioMonths; m++) {
    const interest = balance * MONTHLY_RATE;
    rows.push({ month: m, phase: 'interest-only', payment: round2(interest), interest: round2(interest), principalPaid: 0, balance: round2(balance) });
  }

  const remainingMonths = TERM_MONTHS - ioMonths;
  for (let i = 1; i <= remainingMonths; i++) {
    const interest = balance * MONTHLY_RATE;
    let principalPaid = postIoPayment - interest;
    let payment = postIoPayment;
    if (principalPaid > balance) {
      // final payment: don't overpay past zero balance
      principalPaid = balance;
      payment = principalPaid + interest;
    }
    balance = balance - principalPaid;
    rows.push({
      month: ioMonths + i,
      phase: 'amortizing',
      payment: round2(payment),
      interest: round2(interest),
      principalPaid: round2(principalPaid),
      balance: round2(Math.max(balance, 0)),
    });
  }

  return rows;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

/**
 * Determine the interest-only period length.
 *
 * The dashboard currently exposes no explicit "months to stable/validated
 * profit" ramp metric (checked /api/economics, /api/skill, /api/metrics —
 * only a static "simulation-validated" status string, no numeric ramp).
 * In the absence of that signal we fall back to a configurable default,
 * clamped to the requested [3, 12] month sensible range.
 */
function resolveIoMonths(requestedIoMonths) {
  const raw = requestedIoMonths == null ? 6 : requestedIoMonths;
  return Math.min(IO_MAX_MONTHS, Math.max(IO_MIN_MONTHS, raw));
}

/**
 * Build the full recommended structure for one principal amount.
 *
 * @param {number} principal - loan principal, e.g. 1_000_000
 * @param {number} monthlyProfit - simulated monthly profit from dashboard
 * @param {object} opts
 * @param {number} [opts.ioMonths] - override IO period (else default 6, clamped 3-12)
 * @param {number} [opts.dscrMin] - target DSCR floor (default 1.3)
 * @param {number} [opts.dscrMax] - target DSCR ceiling (default 1.5)
 */
function buildLoanStructure(principal, monthlyProfit, opts = {}) {
  const ioMonths = resolveIoMonths(opts.ioMonths);
  const dscrMin = opts.dscrMin ?? DEFAULT_DSCR_MIN;
  const dscrMax = opts.dscrMax ?? DEFAULT_DSCR_MAX;

  const ioMonthlyPayment = round2(principal * MONTHLY_RATE);

  const remainingMonths = TERM_MONTHS - ioMonths;
  const postIoPayment = round2(amortizingPayment(principal, MONTHLY_RATE, remainingMonths));

  const dscrNatural = monthlyProfit / postIoPayment;
  const grnbitMarginPostIo = round2(monthlyProfit - postIoPayment);
  const grnbitMarginIo = round2(monthlyProfit - ioMonthlyPayment);

  const schedule = simulateSchedule(principal, ioMonths, postIoPayment);
  const finalBalance = schedule[schedule.length - 1].balance;
  // Tolerance accounts for cent-level rounding drift accumulated over up to
  // 48 rounded monthly payments (rounding each month independently), not a
  // real amortization shortfall.
  const fullyAmortizes = finalBalance <= 1.0;

  const meetsTargetDscr = dscrNatural >= dscrMin;
  const aboveTargetBand = dscrNatural > dscrMax;

  return {
    principal,
    monthlyProfit: round2(monthlyProfit),
    termMonths: TERM_MONTHS,
    annualRate: ANNUAL_RATE,
    ioMonths,
    remainingMonths,
    ioMonthlyPayment,
    postIoPayment,
    dscrTarget: { min: dscrMin, max: dscrMax },
    dscrNatural: round2(dscrNatural),
    meetsTargetDscr,
    aboveTargetBand,
    grnbitMarginDuringIo: grnbitMarginIo,
    grnbitMarginPostIo,
    fullyAmortizes,
    finalBalance,
    schedule,
    flag: !meetsTargetDscr
      ? `FLAG: Even the minimum fully-amortizing payment ($${postIoPayment.toLocaleString()}/mo) yields DSCR ${dscrNatural.toFixed(2)}x, below the ${dscrMin}x floor. Target DSCR is not achievable at this principal/IO combination within the fixed 48-month, 12% term. Consider a lower principal, shorter IO period, or renegotiating term/rate.`
      : null,
  };
}

/**
 * Alternative to full 48-month amortization: size the post-IO payment
 * directly to hit a target DSCR (payment = monthlyProfit / dscr), then see
 * what balance remains at month 48 (a balloon/refi due at maturity) rather
 * than forcing full payoff.
 *
 * This exists because buildLoanStructure() showed that full amortization at
 * 12%/48mo requires a ~35%/yr debt-service yield on principal, which this
 * site's ~29%/yr profit yield on capex cannot support at ANY principal in
 * the $1.0M-$3.0M range — the target DSCR band is mathematically
 * unreachable under full amortization here, not just at small draws. A
 * balloon structure is the standard project-finance alternative: pay down
 * what the target DSCR cushion allows, refinance or repay the remainder at
 * maturity.
 */
function solveTargetDscrBalloonStructure(principal, monthlyProfit, ioMonths, dscr) {
  const N = TERM_MONTHS - ioMonths;
  const ioPayment = round2(principal * MONTHLY_RATE);
  const ioDscr = round2(monthlyProfit / ioPayment);

  const paymentTarget = round2(monthlyProfit / dscr);
  const startingInterest = principal * MONTHLY_RATE;
  const negativeAmortization = paymentTarget < startingInterest;

  let balance = principal;
  for (let i = 0; i < N; i++) {
    const interest = balance * MONTHLY_RATE;
    const principalPaid = paymentTarget - interest; // can be negative if underwater
    balance -= principalPaid;
  }
  const balloonBalance = round2(Math.max(balance, 0));
  const balloonPct = round2((balloonBalance / principal) * 100);

  return {
    dscrTarget: dscr,
    ioMonths,
    ioPayment,
    ioDscr,
    paymentTarget,
    negativeAmortization,
    balloonBalance,
    balloonPct,
    fullyAmortizesAtTarget: balloonBalance <= 1.0,
  };
}

module.exports = {
  TERM_MONTHS,
  ANNUAL_RATE,
  MONTHLY_RATE,
  IO_MIN_MONTHS,
  IO_MAX_MONTHS,
  DEFAULT_DSCR_MIN,
  DEFAULT_DSCR_MAX,
  amortizingPayment,
  simulateSchedule,
  resolveIoMonths,
  buildLoanStructure,
  solveTargetDscrBalloonStructure,
};
