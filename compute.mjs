import { TRADE } from "./src/data/tradeData.js";
import ETS_PRICES from "./src/data/ets_prices.json" with { type: "json" };

const EUR_USD=1.08;

// Pull RAW + CN_MAP from V3App.jsx
import { readFileSync } from "fs";
const src = readFileSync("./src/V3App.jsx", "utf-8");
const rawStart = src.indexOf("const RAW=[");
const rawEnd = src.indexOf("];", rawStart);
const rawText = src.slice(rawStart, rawEnd+2);
// eval the RAW array via Function
function eu(v){if(v==null||v==="–"||v===""||v==="see below"||v==="N/A")return null;const s=String(v).trim().replace(/\s/g,"");if(!s||s==="–")return null;return parseFloat(s.replace(",","."));}
const RAW = (new Function("return " + rawText.replace("const RAW=", "")))();

const cnMapStart = src.indexOf("const CN_MAP");
const cnMapEnd = src.indexOf("};", cnMapStart);
const cnMapText = src.slice(cnMapStart + "const CN_MAP =".length, cnMapEnd+1);
const CN_MAP = (new Function("return " + cnMapText))();

const CBAM_DATA=RAW.map(r=>({cn:r[0],desc:r[1],sector:r[2],direct:eu(r[3]),indirect:eu(r[4]),total:eu(r[5]),mv2026:eu(r[6]),mv2027:eu(r[7]),mv2028:eu(r[8]),route:r[9]}));
const RELEVANT=CBAM_DATA.filter(d=>d.mv2026!=null);

function trKey(cn){const k=cn.replace(/\s/g,"");return CN_MAP[k]||k;}
function avgMonthTonnes(cn,mo){const td=TRADE[trKey(cn)];if(!td)return 0;return["2022","2023","2024","2025"].reduce((s,yr)=>{const v=td[`${yr}-${mo}`];return s+(v?v[0]:0);},0)/4;}
function getMonthTonnes(cn,ym){const td=TRADE[trKey(cn)];return td?.[ym]?.[0]??0;}
function getMonthEur(cn,ym){const td=TRADE[trKey(cn)];return td?.[ym]?.[1]??0;}
function getQtrEts(ym,forecastEts){const[y,m]=ym.split("-");const q=Math.ceil(parseInt(m)/3);return ETS_PRICES.quarterly[`${y}-Q${q}`]??forecastEts;}

const SECTORS=["Iron & Steel","Aluminium","Cement","Fertilisers","Hydrogen"];

// Annual cost at FIXED forecast €75.36 (dashboard default Q1 holds forward)
const FORECAST = 75.36;

function sectorYearCost(sec, yr){
  const rows=RELEVANT.filter(d=>d.sector===sec);
  let cost=0, tons=0;
  for(const d of rows){
    const mv=yr>=2028?(d.mv2028||0):yr===2027?(d.mv2027||0):(d.mv2026||0);
    for(let m=1;m<=12;m++){
      const mo=String(m).padStart(2,"0"),ym=`${yr}-${mo}`;
      // For 2026 use projected (2022-25 avg) unless confirmed (2026-01 exists for steel etc)
      let tonnes;
      if(yr>=2026){
        const liveT = getMonthTonnes(d.cn, ym);
        tonnes = liveT>0 ? liveT : avgMonthTonnes(d.cn, mo);
      } else {
        tonnes = getMonthTonnes(d.cn, ym);
      }
      cost += tonnes*mv*getQtrEts(ym, FORECAST);
      tons += tonnes;
    }
  }
  return {cost: cost*EUR_USD, tons};
}

console.log("=== Dashboard projection at €75.36/tCO₂e ===");
const yearTotals = {};
for(const yr of [2025, 2026, 2027, 2028]){
  let tot=0, totTons=0;
  console.log(`\n${yr}:`);
  for(const sec of SECTORS){
    const r = sectorYearCost(sec, yr);
    console.log(`  ${sec.padEnd(15)}: $${(r.cost/1e6).toFixed(2)}M  (${(r.tons/1000).toFixed(0)} kt)`);
    tot += r.cost; totTons += r.tons;
  }
  console.log(`  TOTAL          : $${(tot/1e6).toFixed(2)}M  (${(totTons/1000).toFixed(0)} kt)`);
  yearTotals[yr] = tot;
}

// 4-year cumulative 2026-2028
const cum3 = yearTotals[2026]+yearTotals[2027]+yearTotals[2028];
console.log(`\n3-year cumulative 2026-2028: $${(cum3/1e6).toFixed(1)}M`);

// Jan 2026 vs Jan 2025 (confirmed)
console.log("\n=== Jan 2026 vs Jan 2025 (confirmed Comext) ===");
for(const sec of SECTORS){
  const rows = RELEVANT.filter(d=>d.sector===sec);
  let v26=0, v25=0, t26=0, t25=0;
  for(const d of rows){
    v26 += getMonthEur(d.cn, "2026-01");
    v25 += getMonthEur(d.cn, "2025-01");
    t26 += getMonthTonnes(d.cn, "2026-01");
    t25 += getMonthTonnes(d.cn, "2025-01");
  }
  const g = v25>0 ? ((v26-v25)/v25)*100 : NaN;
  console.log(`  ${sec.padEnd(15)}: 2026-01 €${(v26/1e6).toFixed(2)}M (${(t26/1000).toFixed(1)} kt) vs 2025-01 €${(v25/1e6).toFixed(2)}M (${(t25/1000).toFixed(1)} kt) | growth ${isNaN(g)?"—":g.toFixed(1)+"%"}`);
}

// Confirmed Q1 2026 trade and CBAM cost
console.log("\n=== Confirmed Q1 2026 CBAM exposure (Jan + Feb + Mar where available) ===");
for(const sec of SECTORS){
  const rows = RELEVANT.filter(d=>d.sector===sec);
  let cost=0, tons=0, valueEur=0;
  for(const d of rows){
    const mv=d.mv2026||0;
    for(const ym of ["2026-01","2026-02","2026-03"]){
      const t = getMonthTonnes(d.cn, ym);
      const v = getMonthEur(d.cn, ym);
      cost += t*mv*getQtrEts(ym, FORECAST);
      tons += t;
      valueEur += v;
    }
  }
  console.log(`  ${sec.padEnd(15)}: CBAM Q1 confirmed ≈ $${(cost*EUR_USD/1e6).toFixed(2)}M  | trade value €${(valueEur/1e6).toFixed(1)}M  | ${(tons/1000).toFixed(0)} kt`);
}
