# OCTO Loan Schedule Tool

Generates a defensible $1.0M–$3.0M senior secured term loan repayment
schedule using **live** simulation data from the OCTO AI dashboard
(https://octo-dashboard-rikj.onrender.com/), instead of assumed profit
figures.

## What it does

1. Fetches the dashboard's live `/api/economics` and `/api/skill` JSON
   endpoints directly (these are the same endpoints the dashboard's own
   front-end reads to render the page — confirmed by cross-checking
   returned figures against the rendered page).
2. Logs each pull with a timestamp to `data/dashboard-log.jsonl` and flags
   if the daily profit figure has moved >15% since the last run (stale
   loan-doc warning).
3. Scales expected profit to what each draw tier ($1.0M/$2.0M/$3.0M)
   actually funds. A draw below the full $3.02M Phase 1 CAPEX funds a
   proportionally smaller build-out, not the full 210-miner site — so the
   tool models discrete container-based build-out (3 containers, 70
   miners each) with a fixed/variable CAPEX split (site interconnect +
   per-container infrastructure don't shrink with draw size) and derives
   a tier-specific monthly profit figure. The split is **locked in
   `capex-quotes.json`** (AntSpace/Bitmain hardware + Xplor interconnect
   quotes, reconciled to the dashboard's $3.02M Phase 1 total). Override
   with `--site-fixed-usd`, `--container-fixed-usd`, or `--miner-variable-usd`
   for sensitivity runs.
4. Builds a loan structure per tier at the fixed terms (48 months, 12%
   fixed annual rate), sizing:
   - an interest-only period (default 6 months, clamped to 3–12; the
     dashboard has no numeric "months to stable profit" signal today,
     only a static "simulation-validated" status string)
   - a post-IO amortization payment equal to the **minimum** payment that
     fully amortizes the principal in the remaining months — this is
     simultaneously the best DSCR obtainable without stretching the term
     and the smallest debt service GrnBit has to carry.
5. Flags any tier where even that minimum payment produces a DSCR below
   the 1.3x target floor — the tool does NOT silently stretch the term or
   lower the target to hide a shortfall. Also flags explicitly if a
   smaller draw ends up with a *worse* DSCR than a larger one once fixed
   costs are properly accounted for (fixed costs eat a bigger share of a
   smaller draw's budget) — this is a real finding, not a bug.

Full calculation logic is documented inline in `loan-calc.js`.

## Usage

```
npm run report
npm run docs
# or
node generate-report.js
node generate-loan-docs.js
node generate-report.js --io-months 4 --dscr-min 1.3 --dscr-max 1.5
node generate-report.js --site-fixed-usd 302000 --container-fixed-usd 151000
```

`npm run docs` writes lender discussion drafts to `output/`:

- `cover-letter.md`
- `term-sheet.md`
- `loan-agreement.md`

`npm run publish` generates docs and publishes to the sibling
[`octo-loan-docs`](../octo-loan-docs) repository under
`loan/YYYY-MM-DD/HH-MM-SSZ/` with `markdown/`, `docx/` (Pandoc), and
`pdf/` (`md-to-pdf` fallback) plus `manifest.json`.

`npm run revised` generates the **CHRITIC-revised** lender package into
`octo-loan-docs/loan/package/documents/` (PDFs only — select-all copy) and
`loan/package/reference/` (manifest + capex-quotes.json). Markdown sources
land in `loan-tool/output/revised/`.

**Tranches offered:** $2.0M and $3.0M only. **$1.0M is excluded** — it does not fund a viable build-out after site and container fixed costs.

## Files

- `fetch-dashboard.js` — live data pull + JSONL logging + staleness check
- `capex-quotes.json` — **locked vendor quote line items** (canonical CAPEX split)
- `capex-model.js` — build-out sizing (containers/miners fundable per draw)
  driven by `capex-quotes.json`
- `loan-calc.js` — pure loan math (amortization, DSCR sizing, flags)
- `generate-report.js` — CLI entry point, prints the comparison table
- `publish-docs.js` — export md/docx/pdf to `octo-loan-docs` repo
- `generate-revised-docs.js` — CHRITIC-revised lender PDFs (Verified-ready)
- `lib/resolve-pandoc.js` — locates Pandoc on Windows
- `data/dashboard-log.jsonl` — append-only history of pulled simulation values
