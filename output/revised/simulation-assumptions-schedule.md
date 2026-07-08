# Simulation Assumptions Schedule

**Project:** Miracle Lake, Karnes County, South Texas — Phase 1
**Model:** OCTO-optimized digital-twin simulation  
**Timestamp:** 2026-07-06T19:53:22.251Z  
**Dashboard:** https://octo-dashboard-rikj.onrender.com/  
**Status:** simulation-validated — live certification begins at Phase 1 energisation

---

## 1. Site and hardware

| Assumption | Value | Source |
|------------|-------|--------|
| Site | Miracle Lake, Karnes County, South Texas — Phase 1 | Project definition (Xplor Energy / Karnes Electric) |
| Containers | 3 × Bitmain ANTSPACE HK3 V6 (70 miner slots each) | Site config |
| Miners | 210 × Antminer S23 Hyd 580TH | asicminervalue.com (retrieved 2026-07-05) |
| Nominal hashrate | 121.8 PH/s | 210 × 580 TH |
| Nominal power draw | 1,157.1 kW | Fleet nameplate |
| Fleet efficiency | 9.5 J/TH | Miner spec sheet |

## 2. Power and network economics

| Assumption | Value | Source / logic chain |
|------------|-------|---------------------|
| Electricity rate | **$0.045/kWh** | Karnes County TX contract — Xplor Energy / Karnes Electric |
| BTC price (model) | **$63,581** | Input at 2026-07-06T19:53:22.251Z |
| Block reward | 3.125 BTC | Post-2024 halving |
| Blocks per day | 144 | Bitcoin protocol |
| Network difficulty | Modeled at pull | 2026-07-06T19:53:22.251Z twin run |

## 3. Scenario comparison (baseline vs OCTO-optimized)

| Parameter | Industry-typical baseline | OCTO-optimized digital-twin |
|-----------|--------------------------|----------------------------|
| Control layer | Rig-level SCADA, no OCTO skill | octo-mining per-chip thermal co-control |
| Hashrate utilization | **87.9%** | **100%** |
| Utilization basis | CleanSpark Feb 2026 operating/peak 86.4%; model uses mid-upper range | Recovered hashrate from thermal throttling |
| Hashrate gain vs baseline | — | **+13.7%** |
| Efficiency gain (J/TH) | — | **−12.1%** |
| Daily profit | Baseline scenario in twin | **$2,387/day** |
| Edge vs baseline | — | **+22.6%** |

**Industry-typical baseline** means rig-level SCADA without OCTO per-chip thermal co-control, modeled at **87.9% hashrate utilization** (within CleanSpark Feb 2026 operating/peak range); **Edge vs baseline** is the simulated daily-profit uplift of the OCTO-optimized digital-twin scenario over that unoptimized baseline.

## 4. Loan-sizing methodology

| Step | Method |
|------|--------|
| Tier daily profit | OCTO-optimized $2,387/day × (miners funded ÷ 210) |
| Tier monthly profit | Daily profit × (365 ÷ 12) |
| IO payment | Principal × 12% ÷ 12 |
| Post-IO payment | Tier monthly profit ÷ 1.3x target DSCR |
| Balloon | Principal remaining after months 7–48 at target-DSCR payments |
| Build-out sizing | Locked CAPEX quotes (Schedule C) applied to draw amount |

## 5. Data room

The **full OCTO-optimized digital-twin economics model** — including network difficulty sensitivity, power-cost scenarios, and container/miner deployment logic — is available in the lender data room. This schedule summarizes inputs material to debt sizing; definitive diligence should reference the complete model export.

---

**Contact:** djackson@grnbit.digital · https://grnbit.digital
