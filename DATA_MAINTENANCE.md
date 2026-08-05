# Data Maintenance Notes

Last reviewed: 2026-08-05

---

## 1. EU ETS Price (`src/data/ets_prices.json`)

**Source:** ICAP Allowance Price Explorer — `https://allowancepriceexplorer.icapcarbonaction.com/api/systems`  
**Update script:** `python3 scripts/update_ets_prices.py`

The script pulls daily secondary market EUA prices (systems 33 & 34) and computes quarterly averages. The dashboard default is set to the most recently completed quarter.

**When to run:**
- At the start of each new quarter, once the previous quarter's data appears on ICAP (typically a few weeks after quarter-end)
- Before any major public release or presentation
- If the ETS price has moved significantly and the default feels stale

**Known limitation:** ICAP does not publish an update schedule. The data currently ends 2025-12-15. Check whether the end date has advanced before assuming the script will produce new output. If ICAP has not updated after 6–8 weeks into a new quarter, seed the value manually using a published source (e.g. EEX, Ember Climate, or Reuters).

**Current default:** €80.37/tCO₂e (2025-Q4 average)

---

## 2. Trade Data — Eurostat Comext (`src/App.jsx`, `TRADE` constant)

**Source:** Eurostat Comext DS-045409 — US exports to EU27, by CN code  
**Live fetch:** The "Live Cost Clock" tab fetches 2026 monthly data directly from the Comext API at runtime.  
**Static baseline:** The `TRADE` object in `App.jsx` contains pre-loaded annual totals for 2022–2025.

### Comext publication lag

Eurostat publishes monthly trade data on a rolling basis with the following typical lags:

| Data type | Lag after reference month |
|---|---|
| Extra-EU aggregated & detailed | ~46 days (~6.5 weeks) |
| Intra-EU detailed | ~70 days (~2.5 months) |

Since DS-045409 covers extra-EU trade (US → EU27), **data for a given month is typically available within 6–7 weeks** of that month ending. For example, January 2026 data would normally appear in mid-March 2026.

Eurostat publishes a [release calendar](https://ec.europa.eu/eurostat/news/release-calendar) with exact dates in advance.

### Provisional vs. final

Monthly data is initially published as **provisional** (flagged `p` in the API). Revisions occur regularly as member states submit corrections. Data is not considered **final** until October of the following year — so 2026 monthly figures won't be final until October 2027.

For dashboard purposes, provisional figures are fine. Just be aware that figures for the most recent 1–2 months may shift slightly in subsequent releases.

### When to update the static baseline

- **2025 final data:** Expected October 2026. Update the `TRADE` constant in `App.jsx` at that point.
- **Mid-year check:** If you want to lock in provisional 2026 year-to-date figures (e.g. for a publication), extract from Comext in Q3 or Q4 2026 once several months of data are available.

**How to update:** Re-run the Comext data extraction process and replace the `TRADE` constant in `App.jsx`. The CN-code matching logic (`CN_MAP`) should not need changes unless the regulation's CN code list changes.

---

## 3. CBAM Default Values (`CBAM_DEFAULT_VALUE_ROWS` in `src/data/cbamDefaultValues.js`)

**Source:** EU Implementing Regulation 2025/2621, Annex I (US default values), as replaced by Correcting Regulation (EU) 2026/1740 (OJ L, 31.7.2026; in force 3.8.2026, applies retroactively from 1.1.2026)  
**Update trigger:** Only if the European Commission issues a further implementing regulation updating the default values. Monitor the EUR-Lex CBAM page for new implementing acts.

**2026-08-05 update (Reg 2026/1740):** No US emission default value changed (verified row by row against both OJ texts). Codes and routes updated:

- 2507 00 80 → TARIC 2507 00 80 80 (scope narrowed to calcined kaolinic clay); route indicator dropped
- 2523 10 00 → TARIC 2523 10 00 10 (white clinker, B) / 2523 10 00 90 (grey/other, A); dashboard attributes 8-digit trade flows to the grey variant (predominant in US exports); white rows listed with zero tonnage
- 2523 90 00 → TARIC 2523 90 00 10 (white, B) / 2523 90 00 90 (grey/other, A); same treatment
- 7205 route (C) → (C)/(F); benchmark lookup keeps the conservative (C) value
- Route changes not affecting rows in the dashboard subset: 7225 19 90 and 7226 19 80 (F→C), 7306 30 18 (gained C), 7318 12 10 and 7318 14 10 (lost C)

**Benchmarks (`src/data/cbamBenchmarks.js`):** from Reg 2025/2620, which 2026/1740 does NOT amend. Only the cement keys were renamed to the new TARIC codes.

---

## 4. Mark-up Schedule

**Source:** EU IR 2025/2621 as corrected by Reg (EU) 2026/1740, Annex I opening text  
**Current schedule:** 10% (2026), 20% (2027), 30% (2028+); Fertilisers 1% throughout  
**Note:** The correcting regulation deleted the printed 2026/27/28 mark-up columns (recital 10). The dashboard now computes marked-up values as `round(total × factor, 3)` in `cbamDefaultValues.js`, matching the CBAM Registry approach. Do not re-add hardcoded mark-up columns.  
**Update trigger:** Only if the Commission amends the phase-in schedule. No changes expected before 2028.

---

## 5. FAQ & Narrative Text

- **ETS price history** (FAQ): Update when a significant market event occurs (e.g. a new multi-year high or low). The February 2026 drop to ~€69/t is already reflected.
- **Other countries' CBAMs** (FAQ): Monitor UK legislation progress (CBAM expected 2027), Australia's follow-up to the 2026 leakage review, and Taiwan's implementation rules.
- **EUR/USD rate** (`EUR_USD = 1.08`): Currently fixed at the 2022–24 ECB average. Consider updating if the rate shifts materially for a sustained period.
