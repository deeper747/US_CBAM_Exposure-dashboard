# US CBAM Exposure Dashboard — Copy for Review

> **Notes for copy editor:**
> - Text in `[brackets]` is dynamic/computed and not editable as copy
> - `·` = interpunct used as a visual separator throughout
> - Abbreviations used: CBAM, ETS, YTD, tCO₂e, CN code, HR, CR, SS — confirm consistency
> - Superscripts: CO₂ (₂), tCO₂e (₂)
> - Non-breaking hyphen used in "emission‑intensive" (to prevent line break)

---

## Main Page

### Dashboard Header (top-right panel)

**Title:**
US CBAM Exposure Dashboard *(Beta)*

**Subtitle lines:**
Estimated costs for US exporters under the EU CBAM default values

A.K.A. Forgone revenue for the federal government

**Attribution:**
Author: Jia-Shen Tsai, Niskanen Center

---

### Headline Section (top-left)

**Year selector label:**
From [year] to [year]

**Main headline** (three verb variants depending on selected range):
- The US **is paying an estimated** [amount] to the EU
- The US **would have paid** [amount] to the EU
- The US **is projected to pay** [amount] to the EU

**Tagline below headline:**
for exporting emission‑intensive products.

---

### EU ETS Carbon Price Panel

**Section header:**
EU ETS Carbon Price

**Confirmed price card:**
Q1 2026 (confirmed) · [€75.36]
Official CBAM certificate price, EU Commission

**Forecast slider card:**
Forecast (Q2+) · [€slider value]
ETS Price — drag to adjust

**Slider range labels:**
€30 · €80 · €130

---

### Sector Bar Chart

**Section header** (changes with line chart hover):
- Default: YTD CBAM Exposure by Sector
- On hover over 2026: 2026 CBAM Exposure by Sector
- On hover over 2027: 2027 CBAM Exposure by Sector
- On hover over 2028: 2028 CBAM Exposure by Sector

**Subtitle** (changes with line chart hover):
- Default: YTD · Jan–Apr · at €[ETS]
- On hover 2026–2028: [year] projected · at €[ETS]

**Sector names (in bar chart):**
- Iron & Steel
- Aluminium
- Cement
- Fertilisers
- Hydrogen

---

### CBAM Exposure by Year Panel

**Section header:**
CBAM Exposure by Year

**Row labels** (depend on selected range):
- 2026 (YTD)
- 2026 / 2027 / 2028 (full years)

**Footer row:**
Total

---

### Line Chart

**Chart caption:**
Estimated CBAM cost per month ($M) · Gray dashed = 2024 H2–25 est. · Solid = Jan 2026 confirmed · Teal dashed = projected

**Chart legend labels:**
- 2024 H2–25 est.
- Confirmed data
- Projected

**Vertical marker labels:**
- CBAM start
- Today

**Year axis labels:**
2024 H2 · 2025 · 2026 · 2027 · 2028

**Hover tooltip hint:**
Click to select year

---

### Sector Table

**Table column headers:**
| Sector | Proj. 2026 Tonnes | Default Value (tCO₂e/t) | Mark-up % | CBAM through Apr 28, 2026 | *(detail arrow)* |

**Sector row labels:**
- Iron & Steel
- Aluminium
- Cement
- Fertilisers
- Hydrogen

**Total row label:**
Total

**Weighted average label (in total row):**
(weighted avg)

**Table footnote:**
Click any sector row for CN-code breakdown. Projected 2026 trade from 2022–25 monthly avg. CBAM costs use Q1 confirmed price (€75.36) and forecast for partial Apr.

---

### CBAM Cost Formula Section

**Section header:**
CBAM Cost Formula — hover each term

**Formula:**
CBAM Cost ($) = Exported Tonnes × Default Value (tCO₂e/t) × (1 + Mark-up) × [€value]/tCO₂e × $1.08 / €

**Slider label below ETS term:**
ETS Price — drag to adjust

**Default prompt (no term hovered):**
Hover a term above to see its definition and data source.

**Term definitions (shown on hover):**

*Exported Tonnes*
Annual quantity of US goods exported to the EU under CBAM, sourced from Eurostat Comext DS-045409. Projected 2026+ values use 2022–25 monthly averages.
Source: Eurostat Comext DS-045409

*Default Value (tCO₂e/t)*
The carbon intensity assigned to each product by EU IR 2025/2621 Annex I, without mark-up. Represents tonnes of CO₂-equivalent emitted per tonne of product exported.
Source: EU IR 2025/2621, Annex I (US-specific)

*Mark-up / Phase-in %*
Added to the base default value to account for gradual phase-in of CBAM. Most sectors: 10% in 2026, 20% in 2027, 30% in 2028. Fertilisers: 1% throughout (carbon leakage risk).
Source: EU CBAM Implementing Regulation

*Exchange Rate (USD/EUR)*
Fixed at $1.08/€, calculated as the simple average of weekly ECB EUR/USD reference rates over calendar year 2024.
Source: European Central Bank (ECB) Statistical Data Warehouse — EUR/USD reference rates, 2024 annual average

---

### Data Sources Footer

Sources: EU IR 2025/2621 Annex I (US) · Eurostat Comext DS-045409 (2022–2025) · ICAP + EU Commission · USD at $1.08/€

---

### FAQ Panel (≡ button)

**Tab labels:**
FAQ · Methodology

#### FAQ Tab

**Q: When are CBAM prices set, and when do importers actually pay?**
A: CBAM certificate prices are based on the weekly average auction price of EU ETS allowances. Importers must purchase and surrender certificates annually — for goods imported in 2026, the deadline is September 30, 2027.

**Q: Why does the fertilizer sector have a lower phase-in rate?**
A: Fertilizers have a lower initial phase-in rate starting at 1%, due to high exposure to carbon leakage, global competition, and importance for agricultural supply chains.

**Q: Why does the mark-up increase over time?**
A: The mark-up applied to CBAM default values increases over time (10% in 2026, rising to 30% in 2028) to ensure estimates remain conservative and to incentivize importers to report verified, installation-level emissions data instead of relying on defaults.

**Q: What has the EU carbon price been in recent years?**
A: EU ETS prices peaked near €100/tCO₂ in early 2023, then fell — averaging €66/tCO₂ in 2024. Prices averaged €74/tCO₂ in 2025. In Q1 2026, the official CBAM certificate price was confirmed at €75.36/tCO₂.

**Q: Are other countries implementing their own CBAM?**
A: The UK plans a CBAM starting in 2027. Canada has explored border carbon adjustments but not committed to a design. Australia's 2026 carbon leakage review recommended a CBAM-like scheme. Taiwan passed a carbon border charge framework in late 2025.

#### Methodology Tab

**Q: What data is used?**
A: Trade volumes are from Eurostat Comext DS-045409 (EU imports from US, CN4/CN6/CN8 level, matched exactly to CBAM regulation codes). Default emissions values are from EU Implementing Regulation 2025/2621, Annex I (US-specific). Historical ETS prices are from ICAP Allowance Price Explorer; the 2026-Q1 price (€75.36) is the official CBAM certificate price published by the European Commission.

**Q: How is the CBAM cost calculated?**
A: CBAM Cost (€) = Exported Tonnes × Default Value (tCO₂e/t, incl. mark-up) × ETS Price (€/tCO₂e). Converted to USD at a fixed rate of $1.08/€. Trade volumes for 2026+ are projected from the 2022–2025 monthly average. This represents a maximum exposure — exporters with verified emissions below the default value would pay less.

**Q: What does 'mark-up' mean?**
A: The EU adds a percentage mark-up to default values to ensure they are conservative. For 2026, this is 10% (shown as mv2026 = total × 1.10). The mark-up rises to 20% in 2027 and 30% in 2028. This tool uses the 2026 mark-up for all projections.

**Q: Why is this an upper bound?**
A: Default values are set conservatively and may exceed actual emissions for lower-carbon producers. US steelmakers (predominantly EAF-based) likely have lower actual emissions than the default iron & steel values. Exporters may also report verified installation-level data to avoid defaults.

---

---

## Sector Detail (Modal)

*Opens when clicking any row in the main sector table.*

### Modal Header

**Label (small caps above sector name):**
Sector Detail

**Sector name** (one of):
Iron & Steel / Aluminium / Cement / Fertilisers / Hydrogen

---

### Sector Descriptions

#### Iron & Steel
The largest CBAM sector by US export volume. Covers iron ore products, pig iron, ferro-alloys, flat and long steel products (HR/CR/coated), tubes, sections, and fabricated steel articles.

*Additional context (italic):*
US steelmakers are predominantly EAF-based (electric arc furnace), which typically produces lower emissions than the blast furnace route assumed in EU default values — so actual costs may be lower for verified reporters.

#### Aluminium
Covers unwrought aluminium, semi-finished products (rods, wire, profiles, plates, foil), tubes, fabricated articles, and containers. The US is a significant primary and secondary aluminium producer.

*Additional context:*
Aluminium default values include upstream smelting and power generation emissions. The US power mix used in smelting will affect whether actual emissions are above or below the EU default.

#### Cement
Includes Portland and hydraulic cement, clinker, white and grey variants, and calcined clay. US–EU cement trade is limited by high freight costs relative to product value.

*Additional context:*
Cement is one of the most carbon-intensive sectors by tCO₂e/t. Even at low trade volumes, the per-tonne CBAM charge can be significant.

#### Fertilisers
Nitrogen-based fertilisers including anhydrous ammonia, urea, ammonium nitrate, and compound fertilisers (NPK/NK/DAP/MAP). The US is a major global ammonia and urea producer.

*Additional context:*
Fertilisers have a special phase-in rate of 1% throughout 2026–2028 (vs. 10–30% for other sectors) due to high carbon leakage risk and food security concerns.

#### Hydrogen
Covers hydrogen gas (CN 2804 10 00). CBAM applies based on the hydrogen's production emissions intensity — electrolytic, SMR, or by-product routes have very different default values.

*Additional context:*
At 26.64 tCO₂e/t, hydrogen has the highest default value of any CBAM product. Even small trade volumes can carry a large CBAM cost.

---

### KPI Cards

| Label | Sub-label |
|---|---|
| Proj. Annual Tonnes | 2022–25 avg basis |
| YTD Avg Trade Value | Jan–Apr avg · 4-year avg |
| CBAM through Apr 28 | Q1 confirmed + forecast |

---

### Projected Annual Cost Trajectory

**Section header:**
Projected Annual Cost Trajectory (at €[ETS]/tCO₂e)

**Year card labels:**
- 2026 · 10% mark-up
- 2027 · 20% mark-up
- 2028 · 30% mark-up

*(Fertilisers: 1% mark-up for all three years)*

---

### CN Code Breakdown Table

**Section header:**
CN Code Breakdown · [N] product code(s)

**Column headers:**
| CN Code | Description | Proj. 2026 Tonnes | YTD Avg Trade (4yr) | Jan Growth 2026 vs 2025 | CBAM Q1 2026 | CBAM through Apr 28 |

**Total row label:**
Total

**Table footnote:**
Sorted by CBAM exposure. YTD = Jan–Apr 28, 2026 partial. Jan growth compares Jan 2026 vs Jan 2025. Trajectory uses €[ETS]/tCO₂e for all months (indicative).

---

## Dark Footer

**Brand text:**
Niskanen Center

**Program label:**
Climate & Energy

**Article cards:**

### Where U.S. Carbon Policy Is Being Decided in 2026
An overview of the key legislative and regulatory venues shaping U.S. carbon policy this year.

CTA: Read →

### Reforming Carbon Accounting for a New Era of Competition
The case for updating the Greenhouse Gas Protocol to reflect trade competitiveness realities.

CTA: Read →

### Carbon Border Adjustment Bills: How Do the U.S. Proposals Compare to the EU One?
A comparative analysis of U.S. CBAM legislative proposals against the EU's implemented mechanism.

CTA: Read →

**Bottom sources row:**
Sources: EU IR 2025/2621 Annex I (US) · Eurostat Comext DS-045409 (2022–2025) · ICAP + EU Commission · USD at $1.08/€

---

*End of copy document.*
