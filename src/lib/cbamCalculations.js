import ETS_PRICES from "../data/ets_prices.json";
import { TRADE } from "../data/tradeData.js";
import { CN_MAP, RELEVANT, SECTORS_LIST } from "../data/cbamDefaultValues.js";
import {
  BASELINE_YEARS,
  DATA_CUTOFF_YM,
  DEFAULT_FORECAST_ETS,
  EUR_USD,
  REPORT_AS_OF,
  YTD_YEAR,
} from "../config/publicationConfig.js";

export const Q1_ETS = ETS_PRICES.quarterly["2026-Q1"] || DEFAULT_FORECAST_ETS;
export const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const REPORT_DATE = new Date(`${REPORT_AS_OF}T12:00:00Z`);
export const AS_OF_YEAR = REPORT_DATE.getUTCFullYear();
export const AS_OF_MONTH_INDEX = REPORT_DATE.getUTCMonth();
export const AS_OF_DAY = REPORT_DATE.getUTCDate();
export const CURRENT_YM = `${AS_OF_YEAR}-${String(AS_OF_MONTH_INDEX + 1).padStart(2, "0")}`;
const AS_OF_DAYS_IN_MONTH = new Date(Date.UTC(AS_OF_YEAR, AS_OF_MONTH_INDEX + 1, 0)).getUTCDate();

export const REPORT_AS_OF_LABEL = `${MONTH_NAMES[AS_OF_MONTH_INDEX]} ${AS_OF_DAY}, ${AS_OF_YEAR}`;
export const YTD_FULL_MONTHS = Array.from({ length: AS_OF_MONTH_INDEX }, (_, i) => String(i + 1).padStart(2, "0"));
export const YTD_PARTIAL_MONTH = String(AS_OF_MONTH_INDEX + 1).padStart(2, "0");
export const YTD_PARTIAL_FRACTION = AS_OF_DAY / AS_OF_DAYS_IN_MONTH;
export const YTD_MONTHS = [...YTD_FULL_MONTHS, YTD_PARTIAL_MONTH];
export const YTD_LABEL = `Jan–${MONTH_NAMES[AS_OF_MONTH_INDEX]} ${AS_OF_DAY}`;

export function trKey(cn) {
  const k = cn.replace(/\s/g, "");
  return CN_MAP[k] || k;
}

export function getTradeRecord(cn) {
  return TRADE[trKey(cn)] || null;
}

export function avgMonthTonnes(cn, mo) {
  const td = TRADE[trKey(cn)];
  if (!td) return 0;
  return BASELINE_YEARS.reduce((s, yr) => {
    const v = td[`${yr}-${mo}`];
    return s + (v ? v[0] : 0);
  }, 0) / BASELINE_YEARS.length;
}

export function avgMonthEur(cn, mo) {
  const td = TRADE[trKey(cn)];
  if (!td) return 0;
  return BASELINE_YEARS.reduce((s, yr) => {
    const v = td[`${yr}-${mo}`];
    return s + (v ? v[1] : 0);
  }, 0) / BASELINE_YEARS.length;
}

export function getMonthTonnes(cn, ym) {
  const td = TRADE[trKey(cn)];
  return td?.[ym]?.[0] ?? 0;
}

export function getQtrEts(ym, forecastEts) {
  const [y, m] = ym.split("-");
  const q = Math.ceil(parseInt(m) / 3);
  return ETS_PRICES.quarterly[`${y}-Q${q}`] ?? forecastEts;
}

export function ytdMonthFraction(mo) {
  return mo === YTD_PARTIAL_MONTH ? YTD_PARTIAL_FRACTION : 1;
}

export function ytdAvgEur(cn) {
  let sum = 0;
  for (const yr of BASELINE_YEARS) {
    for (const mo of YTD_MONTHS) {
      const v = TRADE[trKey(cn)]?.[`${yr}-${mo}`];
      if (v) sum += v[1] * ytdMonthFraction(mo);
    }
  }
  return sum / BASELINE_YEARS.length;
}

export function ytdTonnesForRows(rows, liveEntries = null) {
  let total = 0;
  for (const d of rows) {
    const k = trKey(d.cn);
    for (const mo of YTD_MONTHS) {
      const liveT = liveEntries?.[k]?.[`${YTD_YEAR}-${mo}`]?.[0];
      total += (liveT > 0 ? liveT : avgMonthTonnes(d.cn, mo)) * ytdMonthFraction(mo);
    }
  }
  return total;
}

export function ytdCostFactorsForRows(rows, liveEntries = null) {
  let cfQ1 = 0;
  let cfApr = 0;
  for (const d of rows) {
    const mv = d.mv2026 || 0;
    const k = trKey(d.cn);
    for (const mo of YTD_MONTHS) {
      const liveT = liveEntries?.[k]?.[`${YTD_YEAR}-${mo}`]?.[0];
      const tonnes = (liveT > 0 ? liveT : avgMonthTonnes(d.cn, mo)) * ytdMonthFraction(mo);
      if (mo <= "03") cfQ1 += tonnes * mv;
      else cfApr += tonnes * mv;
    }
  }
  return { cfQ1, cfApr };
}

const etsFiveYearStart = AS_OF_YEAR - 5;
const etsFiveYearEntries = Object.entries(ETS_PRICES.quarterly).filter(([k]) => parseInt(k) >= etsFiveYearStart);

export let ETS_5Y_HIGH = 0;
export let ETS_5Y_LOW = Infinity;
export let ETS_5Y_HIGH_QTR = "";
export let ETS_5Y_LOW_QTR = "";

for (const [k, v] of etsFiveYearEntries) {
  if (v > ETS_5Y_HIGH) {
    ETS_5Y_HIGH = v;
    ETS_5Y_HIGH_QTR = k;
  }
  if (v < ETS_5Y_LOW) {
    ETS_5Y_LOW = v;
    ETS_5Y_LOW_QTR = k;
  }
}

export const fmtQtr = k => {
  if (!k) return "";
  const [y, q] = k.split("-");
  return `${q} '${y.slice(2)}`;
};

export const CHART_DATA = [];
for (let y = 2022; y <= 2028; y++) {
  for (let m = 1; m <= 12; m++) {
    const mo = String(m).padStart(2, "0");
    const ym = `${y}-${mo}`;
    const isProjected = y >= 2026;
    let factor = 0;
    for (const d of RELEVANT) {
      const mv = y >= 2028 ? (d.mv2028 || 0) : y === 2027 ? (d.mv2027 || 0) : (d.mv2026 || 0);
      factor += (isProjected ? avgMonthTonnes(d.cn, mo) : getMonthTonnes(d.cn, ym)) * mv;
    }
    CHART_DATA.push({ ym, factor, isProjected });
  }
}

export const SECTOR_STATS = {};
for (const sec of SECTORS_LIST) {
  const rows = RELEVANT.filter(d => d.sector === sec);
  let annT = 0;
  let annE = 0;
  let wtDv = 0;
  let wtMv = 0;
  let wtW = 0;
  let ytdUsd = 0;
  let ytd26 = 0;
  let ytd25j = 0;
  let cfQ1 = 0;
  let cfApr = 0;
  for (const d of rows) {
    const mv = d.mv2026 || 0;
    const tot = d.total || 0;
    for (let m = 1; m <= 12; m++) {
      const mo = String(m).padStart(2, "0");
      const t = avgMonthTonnes(d.cn, mo);
      const e = avgMonthEur(d.cn, mo);
      annT += t;
      annE += e;
      wtDv += t * tot;
      wtMv += t * mv;
      wtW += t;
    }
    ytdUsd += ytdAvgEur(d.cn) * EUR_USD;
    ytd26 += TRADE[trKey(d.cn)]?.["2026-01"]?.[1] ?? 0;
    ytd25j += TRADE[trKey(d.cn)]?.["2025-01"]?.[1] ?? 0;
    const ytdFactors = ytdCostFactorsForRows([d]);
    cfQ1 += ytdFactors.cfQ1;
    cfApr += ytdFactors.cfApr;
  }
  SECTOR_STATS[sec] = {
    annT,
    annUsd: annE * EUR_USD,
    wDv: wtW > 0 ? wtDv / wtW : 0,
    wMv: wtW > 0 ? wtMv / wtW : 0,
    ytdAvgUsd: ytdUsd,
    ytdGrowth: ytd25j > 0 ? (ytd26 - ytd25j) / ytd25j * 100 : null,
    cfQ1,
    cfApr,
  };
}

export function sectorYearCost(sec, yr, forecastEts, liveEntries = null) {
  const rows = RELEVANT.filter(d => d.sector === sec);
  let cost = 0;
  for (const d of rows) {
    const mv = yr >= 2028 ? (d.mv2028 || 0) : yr === 2027 ? (d.mv2027 || 0) : (d.mv2026 || 0);
    for (let m = 1; m <= 12; m++) {
      const mo = String(m).padStart(2, "0");
      const ym = `${yr}-${mo}`;
      const liveT = yr >= 2026 ? liveEntries?.[trKey(d.cn)]?.[ym]?.[0] : null;
      const tonnes = yr >= 2026 ? (liveT != null ? liveT : avgMonthTonnes(d.cn, mo)) : getMonthTonnes(d.cn, ym);
      cost += tonnes * mv * getQtrEts(ym, forecastEts);
    }
  }
  return cost * EUR_USD;
}

export function sectorYearTonnes(sec, yr, liveEntries = null) {
  const rows = RELEVANT.filter(d => d.sector === sec);
  let tonnes = 0;
  for (const d of rows) {
    for (let m = 1; m <= 12; m++) {
      const mo = String(m).padStart(2, "0");
      const ym = `${yr}-${mo}`;
      const liveT = yr >= 2026 ? liveEntries?.[trKey(d.cn)]?.[ym]?.[0] : null;
      tonnes += yr >= 2026 ? (liveT != null ? liveT : avgMonthTonnes(d.cn, mo)) : getMonthTonnes(d.cn, ym);
    }
  }
  return tonnes;
}

export const CBAM_IDX = CHART_DATA.findIndex(p => p.ym === "2026-01");
const dataCutoffIdx = CHART_DATA.findIndex(p => p.ym === DATA_CUTOFF_YM);
export const CUT_IDX = dataCutoffIdx >= 0 ? Math.max(CBAM_IDX, dataCutoffIdx) : CBAM_IDX;
export const TODAY_IDX = Math.round(CBAM_IDX + AS_OF_MONTH_INDEX + AS_OF_DAY / AS_OF_DAYS_IN_MONTH);
