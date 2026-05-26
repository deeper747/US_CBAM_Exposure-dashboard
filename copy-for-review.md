# US CBAM Exposure Dashboard — Copy for Review

> **Notes for copy editors:**
> - Text in `[brackets]` is dynamic/computed and not editable as copy
> - `·` = interpunct used as a visual separator throughout
> - Abbreviations used: CBAM, ETS, YTD, tCO₂e, CN code, HR, CR, SS, EAF, SMR — confirm consistency
> - Superscripts: CO₂ (₂), tCO₂e (₂)
> - Non-breaking hyphen used in "emission‑intensive" (to prevent line break)
> - Sector name spelling: **Fertilizers** and **Aluminum** (American English throughout — not "Fertilisers" or "Aluminium")
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

*(Year options run from 2024 through 2035. 2024 and 2025 are pre-CBAM hypothetical. The "Today" end option is only available when start year is 2026.)*

**Main headline** (verb variants depending on selected range):
- The US **loses an estimated** [amount] to the EU *(YTD / confirmed view)*
- The US **would have lost** [amount] to the EU *(pre-2026 historical range)*
- The US **is projected to lose** [amount] to the EU *(future range, single year)*
- The US **is projected to lose** [amount] to the EU *(with "Through [endYear]" eyebrow for multi-year 2026+ ranges)*

**Tagline below headline:**
for exporting emission‑intensive products under carbon border adjustment mechanism.

---

### ETS Price / Right Panel

#### "How to explore" accordion (collapsed by default)

**Button label:**
How to explore

**Bullet items (icon + text):**
- ◎  Hover the chart to explore monthly cost estimates for 2026–2035
- ⇅  Drag the slider to model different carbon price scenarios
- ▶  Click any sector row in the table below for a full CN-code breakdown
- ↔  Use the year selectors to view multi-year totals and see the phase-in ramp

#### ETS Slider

**Slider label:**
Price on your choice *(from [FORECAST_FROM] on)*

**Slider value display:**
€[value]/tCO₂

**Slider range labels:**
€30 · €80 · €130

**Historical range note (below slider):**
Past 5-yr range: low €[X]/t ([Qtr]) · high €[X]/t ([Qtr])

---

### Sector Bar Chart (right panel, upper)

**Section header** (changes with line chart hover / confirmed view):
- Default: YTD CBAM Exposure by Sector
- Confirmed view pinned: Confirmed CBAM Exposure by Sector
- On hover over any year: [year] CBAM Exposure by Sector
- On multi-year range: [startYear]–[endYear] CBAM Exposure by Sector

**Subtitle** (changes with line chart hover and year selector):
- Default (no hover, YTD): YTD · [YTD label, e.g. Jan–May 19] · at €[ETS]
- Confirmed view (Jan–Feb 2026): Jan – [confirmed month, e.g. Feb 2026] · CBAM factor 97.5% · at €75.36
- On hover between confirmed data and today: YTD · [YTD label] · CBAM factor 97.5% · at €[ETS]
- On hover over 2024 or 2025: [year] hypothetical · CBAM factor 100% · at €[ETS]
- On hover over 2026–2033: [year] projected · CBAM factor [X]% · at €[ETS]
- On multi-year range: [start]–[end] · sector mix · at €[ETS]

**Confirmed view pinned indicator (small, below subtitle):**
⊗ Pinned · click to unpin

**Sector names (in bar chart):**
- Iron & Steel
- Aluminum
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

**Multi-year total row label:**
Total

---

### Line Chart

**Chart caption** (dynamic, below chart):
Estimated monthly CBAM cost ($M) · **Trade** ([Comext](link)): 2022–2025 monthly averages used as baseline; 2026 confirmed Jan–[latest confirmed month, e.g. Feb 2026], projected [next month]–2035 · **EU carbon price** ([EU Commission](link)): Q1 2026 confirmed at €75.36/tCO₂e, assumed from [FORECAST_FROM] · Data current as of [date, e.g. May 19, 2026]

*When live data is loading:*
…· Fetching…

*When live Comext fetch fails (fallback):*
· Live Comext fetch unavailable; using static baseline and bundled confirmed data.

**On-chart labels:**
- hypothetical exposure *(gray dashed segment, 2024–2025)*
- confirmed exposure *(solid yellow segment)*
- projected exposure *(teal dashed segment)*
- Cumulative CBAM cost *(thin teal line from Jan 2026)*

**Vertical marker labels:**
- CBAM start
- Today

**Year axis labels:**
'24 · 2025 · 2026 · 2027 · 2028 · 2029 · 2030

**Chart hover tooltip — sub-labels:**
- Pre-CBAM (2024–2025): Pre-CBAM · hypothetical · €[ETS]/tCO₂e
- Confirmed months: Actual Comext trade vol.
- Projected 2026: Projected (2022–25 avg trade · 10% mark-up)
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
| Sector | Proj. YTD trade volume (t) | Default value (tCO₂e/t) | Mark-up | Benchmark (tCO₂e/t) | CBAM factor | Proj. CBAM exposure YTD |

When a specific year is hovered/pinned:
| Sector | [Year] Proj. trade volume (t) | Default value (tCO₂e/t) | Mark-up | Benchmark (tCO₂e/t) | CBAM factor | Proj. CBAM exposure in [Year] |

When confirmed view is active:
| Sector | Confirmed trade volume (t) | Default value (tCO₂e/t) | Mark-up | Benchmark (tCO₂e/t) | CBAM factor | Confirmed CBAM exposure |

**Sector row labels:**
- Iron & Steel
- Aluminum
- Cement
- Fertilizers
- Hydrogen

**Total row label:**
Total

**Table footnote:**
Click any sector row for CN-code breakdown. Hover the line chart to shift the data display by year. Projected trade uses 2022–2025 monthly averages where live data is unavailable.

*When confirmed view is active, prepended:*
Confirmed Comext data: Jan 2026 – [confirmed month label].

---

### CBAM Cost Formula Section

**Section header:**
CBAM Cost Formula

**Formula terms (left to right):**
CBAM Cost ($) = Exported metric tons × ( Default value (tCO₂e/t) × (1 + Mark-up) − Benchmark × CBAM factor ) × €[ETS value]/tCO₂e × $1.13 / €

**Default prompt (no term hovered or clicked):**
- Desktop: Hover a term to preview its definition. Click to keep it open.
- Mobile: Tap a term to preview its definition. Click to keep it open.

**Term definitions (shown on hover/click):**

*Exported metric tons*
Title: Exported metric tons
Definition: How much CBAM-covered product the US ships to the EU. Confirmed Comext months use reported tonnage; all other months use the 2022–2025 monthly average as the trade baseline.
Source: [Comext database](link), which publishes monthly with a six-to-eight week lag.

*Default value (tCO₂e/t)*
Title: Default value (tCO₂e/t)
Definition: The EU-assigned emissions intensity for each product when an exporter does not report verified facility-level emissions. It converts one metric ton of product into estimated metric tons of CO₂-equivalent.
Source: [EU Implementing Regulation 2025/2621, Annex I](link).

*Mark-up / Phase-in %*
Title: Mark-up / Phase-in %
Definition: The penalty add-on applied to the default value. It nudges exporters toward submitting actual emissions data: 10% in 2026, 20% in 2027, 30% from 2028. Fertilizers stay at 1%.
Source: [EU Implementing Regulation 2025/2621, Annex I](link).

*Benchmark*
Title: EU ETS product benchmark (tCO₂e/t)
Definition: The best-in-class EU production emissions for each product. Multiplied by the CBAM factor each year, it gives the effective free-allocation equivalent deducted from the importer's liability. As the CBAM factor falls, this deduction shrinks and the charge grows.
Source: [EU Implementing Regulation 2025/2620](link).

*CBAM factor*
Title: CBAM factor
Definition: The fraction of the EU ETS product benchmark still granted as free allocation to EU producers. Starts at 97.5% in 2026 — so 97.5% of the benchmark is still deducted — then falls to 0% from 2034, after which no free allocation remains and importers pay for all embedded emissions above zero.
Source: [EU ETS Directive 2003/87/EC, Article 10a](link).

*€[ETS value]/tCO₂e*
Title: EU ETS carbon price
Definition: The carbon price used to turn net embedded emissions into a CBAM cost. Q1 2026 uses the official CBAM certificate price; later months use the assumed price so you can test different carbon-market scenarios.
Source: [CBAM certificate price](link).

*$1.13 / €*
Title: Exchange rate (USD/EUR)
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
Iron & Steel / Aluminum / Cement / Fertilizers / Hydrogen

---

### Sector Descriptions

#### Iron & Steel
The largest CBAM sector by US export volume. Covers iron ore products, pig iron, ferro-alloys, flat and long steel products (HR/CR/coated), tubes, sections, and fabricated steel articles.

*Additional context (italic):*
US steelmakers are predominantly EAF-based (electric arc furnace), which typically produces lower emissions than the blast furnace route assumed in EU default values — so actual costs may be lower for verified reporters.

#### Aluminum
Covers unwrought aluminium, semi-finished products (rods, wire, profiles, plates, foil), tubes, fabricated articles, and containers. The US is a significant primary and secondary aluminium producer.

*Additional context:*
Aluminum default values include upstream smelting and power generation emissions. The US power mix used in smelting will affect whether actual emissions are above or below the EU default.

#### Cement
Includes Portland and hydraulic cement, clinker, white and grey variants, and calcined clay. US–EU cement trade is limited by high freight costs relative to product value.

*Additional context:*
Cement is one of the most carbon-intensive sectors by tCO₂e/t. Even at low trade volumes, the per-metric-ton CBAM charge can be significant.

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
| Annual Avg trade volume | [value] | 2022–25 avg basis |
| Annual Avg trade value | [value] | 2022–25 avg basis |
| CBAM exposure YTD | [value] | [YTD label] |

---

### Projected Annual Cost Trajectory

**Section header:**
Projected Annual Cost Trajectory (at €[ETS]/tCO₂e)

**Year card labels:**
- 2026 · 10% mark-up · 97.5% CBAM factor
- 2027 · 20% mark-up · 95% CBAM factor
- 2028 · 30% mark-up · 90% CBAM factor

*(Fertilizers: 1% mark-up for all three years)*

---

### CN Code Breakdown Table

**Section header:**
CN Code Breakdown · [N] product code(s)

**Column headers:**
| CN Code / Description | YTD Trade Vol (t) | Default Value (tCO₂e/t) | Mark-up | Benchmark (tCO₂e/t) | CBAM Factor | CBAM Exposure YTD |

**Sort behavior:**
Click any column header to sort high → low; click again to sort low → high. Null values always sort last.

**Total row label:**
Total

**Table footnote:**
CBAM exposure uses V4 formula: max(0, Default Value × (1 + Mark-up) − Benchmark × CBAM Factor) × ETS × $1.13/€. YTD = [YTD label], 2026. Q1 at €75.36/tCO₂e (official), remainder at €[ETS]/tCO₂e assumed.

---

*End of copy document.*
