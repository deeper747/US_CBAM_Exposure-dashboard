# US CBAM Exposure Dashboard — Copy for Review

> **Notes for copy editors:**
> - Text in `[brackets]` is dynamic/computed and not editable as copy
> - `·` = interpunct used as a visual separator throughout
> - Abbreviations used: CBAM, ETS, YTD, tCO₂e, CN code, HR, CR, SS, EAF, SMR — confirm consistency
> - Superscripts: CO₂ (₂), tCO₂e (₂)
> - Non-breaking hyphen used in "emission‑intensive" (to prevent line break)
> - Sector name spelling: **Fertilizers** (American English throughout — not "Fertilisers")
> - Exchange rate is now **$1.13/€** (updated from $1.08 in previous version), reflecting 2025 annual average
> - **Removed since last review:** FAQ/Methodology panel, dark footer with article cards, data sources footer row
> - **Added since last review:** "How to explore" accordion, live Comext data fetch caption, updated formula prompt

---

## Main Page

### Dashboard Header (top-right panel, also shown at top on mobile)

**Title:**
US CBAM Exposure Dashboard *(Beta)*

**Subtitle lines:**
Estimated costs for US exporters under the EU CBAM default values

A.K.A. **Forgone revenue** for the federal government

**Attribution:**
Author: Jia-Shen Tsai, Niskanen Center

---

### Headline Section (top-left)

**Year selector label:**
From [year] to [year]

**Main headline** (three verb variants depending on selected range):
- The US **owes an estimated** [amount] to the EU
- The US **would have owed** [amount] to the EU
- The US **is projected to owe** [amount] to the EU

**Tagline below headline:**
for exporting emission‑intensive products under carbon border adjustment mechanism.

---

### ETS Price / Right Panel

#### "How to explore" accordion (collapsed by default)

**Button label:**
How to explore

**Bullet items (icon + text):**
- ◎  Hover the chart to explore monthly cost estimates and cumulative totals
- ⇅  Drag the slider below to model different carbon price scenarios
- ▶  Click any sector row in the table below for a full CN-code breakdown
- ↔  Use the year selectors at the top to view multi-year totals and the sector breakdown

#### ETS Slider

**Slider label:**
Price on your choice *(from Apr 2026 on)*

**Slider value display:**
€[value]/tCO₂

**Slider range labels:**
€30 · €80 · €130

**Historical range note (below slider):**
Past 5-yr range: low €[X]/t ([Qtr]) · high €[X]/t ([Qtr])

---

### Sector Bar Chart (right panel, upper)

**Section header** (changes with line chart hover):
- Default: YTD CBAM Exposure by Sector
- On hover over pre-2026 year: [year] CBAM Exposure by Sector
- On hover over 2026–2028: [year] CBAM Exposure by Sector
- On multi-year range: [startYear]–[endYear] CBAM Exposure by Sector

**Subtitle** (changes with line chart hover and year selector):
- Default: YTD · [YTD label, e.g. Jan–May 18] · at €[ETS]
- On hover over pre-2026: [year] hypothetical · actual ETS prices
- On hover over 2026–2028: [year] projected · at €[ETS]
- On multi-year pre-2026 range: [start]–[end] · sector mix · actual ETS prices
- On multi-year range incl. 2026+: [start]–[end] · sector mix · at €[ETS]

**Sector names (in bar chart):**
- Iron & Steel
- Aluminium
- Cement
- Fertilizers
- Hydrogen

---

### CBAM Exposure by Year Panel (right panel, lower)

**Section header:**
CBAM Exposure by Year

**Row labels** (depend on selected range):
- 2026 (YTD)
- [year] *(full years when year range selected)*

**Sub-rows for pre-2026 years (quarterly breakdown):**
Q[N] · €[ETS price]/t

**Multi-year total row label:**
Total

---

### Line Chart

**Chart caption** (dynamic, below chart):
Estimated monthly CBAM cost ($M) · **Trade** ([Comext](link)): confirmed 2022 – [latest confirmed month, e.g. Jan 2026], projected [next month] – 2028 · **EU carbon price** ([EU Commission](link)): Q1 2026 confirmed at €75.36/tCO₂e, assumed from Apr 2026

*When live data is loading:*
…· Fetching…

**On-chart labels:**
- hypothetical exposure *(gray dashed segment)*
- confirmed exposure *(solid yellow segment)*
- projected exposure *(teal dashed segment)*
- Cumulative CBAM cost *(thin teal line from Jan 2026)*

**Vertical marker labels:**
- CBAM start
- Today

**Year axis labels:**
'24 · 2025 · 2026 · 2027 · 2028

**Chart hover tooltip — sub-labels:**
- Pre-CBAM: Pre-CBAM · hypothetical · €[ETS]/tCO₂e
- Confirmed months: Actual Comext trade vol.
- Projected 2026: Projected (2022–25 avg trade)
- Projected 2027: Projected (2022–25 avg · 20% mark-up)
- Projected 2028: Projected (2022–25 avg · 30% mark-up)

**Cumulative tooltip line (when hovering Jan 2026 onward):**
Cumulative since Jan '26 → [amount]

**Click hint (in tooltip):**
Click to select year

**ETS price annotation on chart:**
€75.36/tCO₂ *(Q1 2026 official, shown above Q1 segment)*
€[forecast]/tCO₂ *(Q2+ assumed price)*

---

### Sector Table

**Table column headers** (dynamic — change when hovering/selecting years):

Default (YTD):
| Sector | YTD Trade Volume (t) | Default Value (tCO₂e/t) | Mark-up % | CBAM exposure YTD |

When a specific year is selected:
| Sector | [Year] Est. Trade Volume (t) *or* [Year] Trade Volume (t) | Default Value (tCO₂e/t) | Mark-up % | Proj. CBAM exposure in [Year] *or* Hyp. CBAM in [Year] |

**Sector row labels:**
- Iron & Steel
- Aluminium
- Cement
- Fertilizers
- Hydrogen

**Total row label:**
Total

**Table footnote:**
Click any sector row for CN-code breakdown. Hover the line chart to shift the data display by year. Projected trade uses 2022–25 monthly averages where live data is unavailable.

---

### CBAM Cost Formula Section

**Section header:**
CBAM Cost Formula

**Formula terms (left to right):**
CBAM Cost ($) = Exported Tonnes × Default Value (tCO₂e/t) × (1 + Mark-up) × €[ETS value]/tCO₂e × $1.13 / €

**Default prompt (no term hovered or clicked):**
Hover a term to preview its definition. Click to keep it open.

**Term definitions (shown on hover/click):**

*Exported Tonnes*
Title: Exported Tonnes
Definition: How much CBAM-covered product the US ships to the EU. Past years use reported Comext tonnage; future and not-yet-confirmed months use the 2022–25 monthly average as the trade baseline.
Source: [Comext database](link), which publishes monthly with a six-to-eight week lag.

*Default Value (tCO₂e/t)*
Title: Default Value (tCO₂e/t)
Definition: The EU-assigned emissions intensity for each product when an exporter does not report verified facility-level emissions. It converts one tonne of product into estimated tonnes of CO₂-equivalent.
Source: [EU Implementing Regulation 2025/2621, Annex I](link).

*Mark-up / Phase-in %*
Title: Mark-up / Phase-in %
Definition: The penalty add-on in the default-value design. It nudges exporters toward submitting actual emissions data and grows over time for most sectors: 10% in 2026, 20% in 2027, and 30% in 2028. Fertilizers stay at 1% in this model.
Source: [EU Implementing Regulation 2025/2621, Annex I](link).

*EU ETS Carbon Price (the €[value]/tCO₂e term)*
Title: EU ETS Carbon Price
Definition: The carbon price used to turn embedded emissions into a CBAM cost. Q1 2026 uses the official CBAM certificate price; later months use the assumed price so you can test different carbon-market scenarios.
Source: [CBAM certificate price](link).

*$1.13 / €*
Title: Exchange Rate (USD/EUR)
Definition: The conversion from euro-denominated CBAM costs into US dollars. This dashboard holds the exchange rate fixed at $1.13 per euro, based on the 2025 annual average.
Source: European Central Bank (ECB) Statistical Data Warehouse

---

---

## Sector Detail Modal

*Opens when clicking any row in the main sector table.*

### Modal Header

**Label (small caps above sector name):**
Sector Detail

**Sector name** (one of):
Iron & Steel / Aluminium / Cement / Fertilizers / Hydrogen

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

#### Fertilizers
Nitrogen-based fertilizers including anhydrous ammonia, urea, ammonium nitrate, and compound fertilizers (NPK/NK/DAP/MAP). The US is a major global ammonia and urea producer.

*Additional context:*
Fertilizers have a special phase-in rate of 1% throughout 2026–2028 (vs. 10–30% for other sectors) due to high carbon leakage risk and food security concerns.

#### Hydrogen
Covers hydrogen gas (CN 2804 10 00). CBAM applies based on the hydrogen's production emissions intensity — electrolytic, SMR, or by-product routes have very different default values.

*Additional context:*
At 26.64 tCO₂e/t, hydrogen has the highest default value of any CBAM product. Even small trade volumes can carry a large CBAM cost.

---

### KPI Cards (three cards across the top of the modal)

| Label | Value | Sub-label |
|---|---|---|
| Proj. Annual Tonnes | [value] | 2022–25 avg basis |
| Annual Avg Trade Value | [value] | 2022–25 avg basis |
| CBAM Exposure YTD | [value] | [YTD label] · Q1 price + assumed |

---

### Projected Annual Cost Trajectory

**Section header:**
Projected Annual Cost Trajectory (at €[ETS]/tCO₂e)

**Year card labels:**
- 2026 · 10% mark-up
- 2027 · 20% mark-up
- 2028 · 30% mark-up

*(Fertilizers: 1% mark-up for all three years)*

---

### CN Code Breakdown Table

**Section header:**
CN Code Breakdown · [N] product code(s)

**Column headers** (5th column header is dynamic based on latest Comext data month):
| CN Code | Description | Default Value (tCO₂e/t) | YTD Avg Trade Volume (t) | Jan 2026 vs 2025 *or* Jan–[Mo] 2026 vs 2025 | CBAM exposure YTD | Proj. 2026 CBAM exposure |

**Sort behavior:**
Click any column header to sort high → low; click again to sort low → high. Null values always sort last.

**Total row label:**
Total

**Table footnote:**
Sorted by CBAM exposure YTD. YTD = [YTD label], 2026. YTD trade volume and Proj. 2026 use actual Comext data for confirmed months; remaining months use 2022–25 avg. Growth comparison uses confirmed Comext tonnes only. ETS price: Q1 official + €[ETS]/tCO₂e assumed thereafter.

---

*End of copy document.*
