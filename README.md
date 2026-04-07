# US CBAM Exposure Dashboard

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC_BY--NC_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

An interactive dashboard estimating hypothetical CBAM (Carbon Border Adjustment Mechanism) costs on US exports to the EU, built by the [Niskanen Center](https://www.niskanencenter.org).

**[Live dashboard →](https://deeper747.github.io/US_CBAM_Exposure-dashboard/)**

---

## What it does

The EU's CBAM entered into force in 2026 under [IR 2025/2621](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2621). It imposes a carbon levy on imports of steel, aluminium, cement, fertilisers, and hydrogen from countries without equivalent carbon pricing.

This dashboard estimates what that levy would cost US exporters across five tabs:

| Tab | Description |
|-----|-------------|
| **Live Cost Clock** | Real-time accruing cost estimate since January 1, 2026, using confirmed official CBAM prices for completed quarters and a user-adjustable forecast for unconfirmed quarters |
| **Historical Baseline** | Year-by-year hypothetical exposure for 2023–2025 at current CBAM rules |
| **CN Code Table** | Full row-level breakdown by regulation CN code with default values, tonnage, and CBAM cost |
| **Exposure by Code** | Bar chart of CBAM exposure ranked by CN code |
| **Methodology** | Assumptions, mark-up schedule, data sources, and caveats |
| **FAQ** | Common questions about CBAM and this dataset |

## Data sources

- **Regulation:** EU Commission Implementing Regulation (EU) 2025/2621, Annex I (US-specific default values)
- **Trade volumes:** [Eurostat Comext DS-045409](https://ec.europa.eu/eurostat/databrowser/product/view/ds-045409) — matched at exact CN4/CN6/CN8 digit level as listed in the regulation
- **CBAM certificate price:** Official quarterly prices published by the [European Commission](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en) — the weighted average of EU ETS auction clearing prices for each completed quarter. Confirmed quarters are locked (Q1 2026: €75.36, published 7 Apr 2026). Quarters not yet published use a user-adjustable forecast via slider. Historical data (pre-2026) from [ICAP Allowance Price Explorer](https://allowancepriceexplorer.icapcarbonaction.com) (secondary market).
- **Exchange rate:** Fixed at $1.08/€ (2022–24 ECB average)

## How costs are calculated

```
CBAM exposure = Export tonnes × Default value (tCO₂e/t) × Mark-up × ETS price (€/t) × 1.08
```

- **Default value** — the regulation's Annex I value for each CN code and production route
- **Mark-up** — 10% in 2026, 20% in 2027, 30% from 2028 (1% for fertilisers throughout)
- **CBAM certificate price** — official quarterly prices from the European Commission (weighted average of EU ETS auction clearing prices). Confirmed quarters are locked at the published value; unconfirmed quarters use the slider as a forecast. The Live Cost Clock integrates each period at its own price, so the accrued total automatically uses the locked rate for completed quarters and the forecast rate from the current quarter onward.

These are **upper-bound estimates**: they use default (punitive) values. Exporters who provide verified facility-level emissions data would face lower levies.

## Updating the CBAM certificate price

The EU Commission publishes the official CBAM certificate price once per quarter (within the first week after each quarter ends). When a new price is published, add it to `src/data/ets_prices.json` under `quarterly`:

```json
"quarterly": {
  "2026-Q1": 75.36,
  "2026-Q2": XX.XX   ← add the new quarter here
}
```

Also update `default` and `latest_period` to match. The dashboard will automatically lock that quarter's price in the Live Cost Clock and remove it from the user-adjustable forecast range.

## Updating trade data

Trade data is fetched from Comext and compiled into a static CSV by `eu_trade.py`. Eurostat typically publishes Comext data 6–8 weeks after the reference month.

```bash
# Install dependencies
pip install requests pandas

# Fetch latest annual data (currently configured for 2022–2025)
python eu_trade.py
```

The script writes to `data/raw/comext_us_cbam_trade_by_year.csv`. After running it, update the `TRADE` object in `src/App.jsx` with the new values from the CSV.

## Development

```bash
npm install
npm run dev       # local dev server at http://localhost:5173
npm run build     # production build to dist/
npm run deploy    # build + deploy to GitHub Pages
```

Built with React 19 + Vite.

## Caveats

- **Default values only.** Verified facility data would lower actual costs significantly. US steel estimates are likely overstated because the regulation assigns BF/BOF-based defaults despite US EAF-dominated production.
- **No supply-side adjustment.** Based on observed 2022–25 trade volumes. Does not account for export diversion that CBAM itself may cause.
- **Payment timing.** Obligations for 2026 imports are not due until September 2027.
- **Exchange rate.** Fixed at $1.08/€; actual payments occur in EUR.

## License

This work is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — see [LICENSE](LICENSE).

You are free to reproduce and adapt this work for non-commercial purposes. If you reproduce or cite the **findings or data**, please credit the Niskanen Center. Attribution is not required if you reuse only the underlying code or methodology.

**Trademark notice:** The Niskanen Center name, logo, and visual identity are trademarks of the Niskanen Center and may not be reused in ways that suggest affiliation or endorsement.
