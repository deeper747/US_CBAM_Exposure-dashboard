# Data Maintenance Notes

Last reviewed: 2026-04-02

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

**When to update the static baseline:**
- When Eurostat publishes final annual trade figures for a completed year (typically 6–9 months after year-end, so 2025 final data expected ~Q3 2026)
- When preliminary 2026 data becomes available and you want to lock in year-to-date figures

**How to update:** Re-run the Comext data extraction process and replace the `TRADE` constant in `App.jsx`. The CN-code matching logic (`CN_MAP`) should not need changes unless the regulation's CN code list changes.

---

## 3. CBAM Default Values (`RAW` array in `App.jsx`)

**Source:** EU Implementing Regulation 2025/2621, Annex I (US default values)  
**Update trigger:** Only if the European Commission issues a revised implementing regulation updating the default values. This is not expected to happen frequently — the 2025 regulation is the first full set. Monitor the EUR-Lex CBAM page for new implementing acts.

---

## 4. Mark-up Schedule

**Source:** EU IR 2025/2621  
**Current schedule:** 10% (2026), 20% (2027), 30% (2028+); Fertilisers 1% throughout  
**Update trigger:** Only if the Commission amends the phase-in schedule. No changes expected before 2028.

---

## 5. FAQ & Narrative Text

- **ETS price history** (FAQ): Update when a significant market event occurs (e.g. a new multi-year high or low). The February 2026 drop to ~€69/t is already reflected.
- **Other countries' CBAMs** (FAQ): Monitor UK legislation progress (CBAM expected 2027), Australia's follow-up to the 2026 leakage review, and Taiwan's implementation rules.
- **EUR/USD rate** (`EUR_USD = 1.08`): Currently fixed at the 2022–24 ECB average. Consider updating if the rate shifts materially for a sustained period.
