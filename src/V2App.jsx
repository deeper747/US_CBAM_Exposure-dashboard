import React, { useState, useMemo, useRef, useCallback } from "react";
import ETS_PRICES from "./data/ets_prices.json";
import { TRADE } from "./data/tradeData.js";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const N={teal900:"#0c2a30",teal800:"#194852",teal600:"#348397",teal400:"#7dceda",teal200:"#b7f6fc",tealMid:"#78a0a3",tealLight:"#d0dbdd",tealPale:"#edf1f2",white:"#ffffff",yellow200:"#fef0c7",yellow600:"#bca45e",yellow900:"#52482a",orange400:"#f17d3a",orange500:"#da5831",green200:"#D7f881",green600:"#709628",green900:"#2c3811",purple200:"#e0c6fc",purple600:"#8655b2"};
const SERIF="'Neuton',Georgia,serif";
const SANS="'Hanken Grotesk','Inter',sans-serif";
const EUR_USD=1.08;
const Q1_ETS=ETS_PRICES.quarterly["2026-Q1"]||75.36;
const SECTORS_LIST=["Iron & Steel","Aluminium","Cement","Fertilisers","Hydrogen"];
const SC={"Iron & Steel":"#5b8ca8","Aluminium":"#348397","Cement":"#194852","Fertilisers":"#709628","Hydrogen":"#8655b2"};
const SCL={"Iron & Steel":"#78a0a3","Aluminium":"#b7f6fc","Cement":"#fef0c7","Fertilisers":"#D7f881","Hydrogen":"#e0c6fc"};
const fmtM=n=>{if(!n&&n!==0)return"—";const a=Math.abs(n);if(a>=1e9)return`$${(n/1e9).toFixed(2)}B`;if(a>=1e6)return`$${(n/1e6).toFixed(1)}M`;return`$${Math.round(n).toLocaleString()}`;};
const fmtKt=n=>n?`${(n/1000).toFixed(0)}kt`:"—";
const pct=(n,d=1)=>n==null?"—":`${n>=0?"+":""}${n.toFixed(d)}%`;

// ── RAW CBAM DEFAULT VALUE DATA (EU IR 2025/2621 Annex I) ────────────────────
function eu(v){if(v==null||v==="–"||v===""||v==="see below"||v==="N/A")return null;const s=String(v).trim().replace(/\s/g,"");if(!s||s==="–")return null;return parseFloat(s.replace(",","."));}
const RAW=[
  ["2507 00 80","Calcined clay","Cement","0,220","0,090","0,310","0,341","0,372","0,403","A"],
  ["2523 10 00","White clinker","Cement","1,320","0,050","1,370","1,507","1,644","1,781","B"],
  ["2523 10 00","Grey clinker","Cement","1,160","0,030","1,190","1,309","1,428","1,547","A"],
  ["2523 21 00","White Portland cement","Cement","1,240","0,140","1,380","1,518","1,656","1,794",""],
  ["2523 29 00","Grey Portland cement","Cement","1,160","0,060","1,210","1,331","1,452","1,573",""],
  ["2523 90 00","White hydraulic cements","Cement","1,290","0,160","1,450","1,595","1,740","1,885","B"],
  ["2523 90 00","Grey hydraulic cements","Cement","1,100","0,060","1,160","1,276","1,392","1,508","A"],
  ["2523 30 00","Aluminous cement","Cement","1,800","0,140","1,940","2,134","2,328","2,522",""],
  ["2808 00 00","Nitric acid","Fertilisers","1,870","0,030","1,900","1,919","1,919","1,919",""],
  ["2814 10 00","Anhydrous ammonia","Fertilisers","3,320","0,090","3,410","3,444","3,444","3,444",""],
  ["2814 20 00","Ammonia in aqueous solution","Fertilisers","1","0,030","1,020","1,030","1,030","1,030",""],
  ["2834 21 00","Nitrate of potassium","Fertilisers","1,860","0,040","1,910","1,929","1,929","1,929",""],
  ["3102 10 12","Urea aq. sol. >45%N, 31.8–33.2%","Fertilisers","0,740","0,020","0,760","0,768","0,768","0,768",""],
  ["3102 10 15","Urea aq. sol. >45%N, 33.2–55%","Fertilisers","1,220","0,020","1,240","1,252","1,252","1,252",""],
  ["3102 10 19","Urea >45%N solid","Fertilisers","2,220","0,070","2,290","2,313","2,313","2,313",""],
  ["3102 10 90","Urea ≤45%N","Fertilisers","2,170","0,070","2,240","2,262","2,262","2,262",""],
  ["3102 21 00","Ammonium sulphate","Fertilisers","0,970","0,060","1,030","1,040","1,040","1,040",""],
  ["3102 29 00","Double salts: ammonium sulphate/nitrate","Fertilisers","1,460","0,060","1,530","1,545","1,545","1,545",""],
  ["3102 30 10","Ammonium nitrate aqueous","Fertilisers","1,430","0,050","1,470","1,485","1,485","1,485",""],
  ["3102 30 90","Ammonium nitrate solid","Fertilisers","2,190","0,070","2,270","2,293","2,293","2,293",""],
  ["3102 40 10","AN+CaCO₃ ≤28%N","Fertilisers","1,910","0,070","1,980","2","2","2",""],
  ["3102 40 90","AN+CaCO₃ >28%N","Fertilisers","1,910","0,070","1,980","2","2","2",""],
  ["3102 50 00","Sodium nitrate","Fertilisers","2,920","0,050","2,970","3","3","3",""],
  ["3102 60 00","Calcium nitrate/ammonium nitrate mix","Fertilisers","1,840","0,060","1,910","1,929","1,929","1,929",""],
  ["3102 80 00","UAN solution","Fertilisers","1,680","0,060","1,740","1,757","1,757","1,757",""],
  ["3102 90 00","Other N-fertilisers","Fertilisers","1,950","0,070","2,020","2,040","2,040","2,040",""],
  ["3105 10 00","NPK packaged ≤10kg","Fertilisers","0,900","0,060","0,960","0,970","0,970","0,970",""],
  ["3105 20 10","NPK >10%N","Fertilisers","1","0,070","1,060","1,071","1,071","1,071",""],
  ["3105 20 90","NPK ≤10%N","Fertilisers","0,680","0,050","0,740","0,747","0,747","0,747",""],
  ["3105 30 00","DAP","Fertilisers","0,780","0,040","0,820","0,828","0,828","0,828",""],
  ["3105 40 00","MAP","Fertilisers","0,500","0,030","0,530","0,535","0,535","0,535",""],
  ["3105 51 00","NP nitrates+phosphates","Fertilisers","1,340","0,090","1,420","1,434","1,434","1,434",""],
  ["3105 59 00","NP other","Fertilisers","0,900","0,100","1,010","1,020","1,020","1,020",""],
  ["3105 90 20","NK >10%N","Fertilisers","1,280","0,050","1,340","1,353","1,353","1,353",""],
  ["3105 90 80","NK ≤10%N","Fertilisers","0,670","0,040","0,710","0,717","0,717","0,717",""],
  ["7601","Unwrought aluminium","Aluminium","1,700",null,"1,700","1,870","2,040","2,210","K"],
  ["7603","Al powders and flakes","Aluminium","2,032",null,"2,032","2,235","2,439","2,642","K"],
  ["7604 10 10","Al bars and rods","Aluminium","2,258",null,"2,258","2,484","2,709","2,935","K"],
  ["7604 10 90","Al profiles","Aluminium","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7604 21 00","Al hollow profiles","Aluminium","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7604 29 10","Al bars and rods (other)","Aluminium","2,258",null,"2,258","2,484","2,709","2,935","K"],
  ["7604 29 90","Al profiles (other)","Aluminium","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7605","Aluminium wire","Aluminium","2,258",null,"2,258","2,484","2,709","2,935","K"],
  ["7606","Al plates, sheets, strip >0.2mm","Aluminium","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7607","Aluminium foil ≤0.2mm","Aluminium","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7608","Aluminium tubes and pipes","Aluminium","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7609 00 00","Al tube/pipe fittings","Aluminium","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7610 10 00","Al doors, windows, frames","Aluminium","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7611 00 00","Al reservoirs/tanks >300L","Aluminium","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7612","Al casks, drums, cans ≤300L","Aluminium","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7613 00 00","Al containers compressed gas","Aluminium","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7614","Al stranded wire, cables","Aluminium","2,258",null,"2,258","2,484","2,709","2,935","K"],
  ["7616 10 00","Al nails, screws, nuts","Aluminium","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7616 91 00","Al cloth, grill, netting","Aluminium","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7616 99 10","Al cast articles","Aluminium","2,032",null,"2,032","2,235","2,439","2,642","K"],
  ["7616 99 90","Other Al articles","Aluminium","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["2804 10 00","Hydrogen","Hydrogen","26,640",null,"26,640","29,304","31,968","34,632",""],
  ["2601 12 00","Agglomerated iron ores","Iron & Steel","0,660","0,020","0,680","0,748","0,816","0,884",""],
  ["7201","Pig iron","Iron & Steel","1,210",null,"1,210","1,331","1,452","1,573",""],
  ["7202 11","Ferro-manganese >2%C","Iron & Steel","1,690",null,"1,690","1,859","2,028","2,197",""],
  ["7202 41","Ferro-chromium >4%C","Iron & Steel","2,350",null,"2,350","2,585","2,820","3,055",""],
  ["7202 60 00","Ferro-nickel","Iron & Steel","3,480",null,"3,480","3,828","4,176","4,524",""],
  ["7203","DRI products","Iron & Steel","0,450",null,"0,450","0,495","0,540","0,585",""],
  ["7205","Granules/powders pig iron","Iron & Steel","2,425",null,"2,425","2,667","2,910","3,152","C"],
  ["7206 10 00","Steel ingots","Iron & Steel","1,330",null,"1,330","1,463","1,596","1,729","C"],
  ["7208","HR flat-rolled ≥600mm","Iron & Steel","1,400",null,"1,400","1,540","1,680","1,820","C"],
  ["7209","CR flat-rolled ≥600mm","Iron & Steel","1,440",null,"1,440","1,584","1,728","1,872","C"],
  ["7210","Flat-rolled ≥600mm coated","Iron & Steel","1,440",null,"1,440","1,584","1,728","1,872","C"],
  ["7211 13 00","Wide flats 150–600mm","Iron & Steel","1,400",null,"1,400","1,540","1,680","1,820","C"],
  ["7212","Flat-rolled <600mm coated","Iron & Steel","1,440",null,"1,440","1,584","1,728","1,872","C"],
  ["7213","Bars and rods HR in coils","Iron & Steel","1,390",null,"1,390","1,529","1,668","1,807","C"],
  ["7214 20 00","Rebars","Iron & Steel","1,390",null,"1,390","1,529","1,668","1,807","C"],
  ["7215","Bars and rods, cold-formed","Iron & Steel","1,390",null,"1,390","1,529","1,668","1,807","C"],
  ["7216","Angles, shapes and sections","Iron & Steel","1,390",null,"1,390","1,529","1,668","1,807","C"],
  ["7217 10","Wire, uncoated","Iron & Steel","1,390",null,"1,390","1,529","1,668","1,807","C"],
  ["7217 20","Wire, zinc-coated","Iron & Steel","1,390",null,"1,390","1,529","1,668","1,807","C"],
  ["7218 10 00","SS ingots","Iron & Steel","3,110",null,"3,110","3,421","3,732","4,043",""],
  ["7219 11 00","SS flat-rolled ≥600mm HR","Iron & Steel","3,220",null,"3,220","3,542","3,864","4,186",""],
  ["7219 31 00","SS flat-rolled ≥600mm CR","Iron & Steel","3,270",null,"3,270","3,597","3,924","4,251",""],
  ["7221","SS bars/rods HR in coils","Iron & Steel","3,270",null,"3,270","3,597","3,924","4,251",""],
  ["7223 00","SS wire in coils","Iron & Steel","3,270",null,"3,270","3,597","3,924","4,251",""],
  ["7224 10","Alloy steel ingots","Iron & Steel","3,490",null,"3,490","3,839","4,188","4,537","F"],
  ["7225 11 00","Si-elec. steel GO ≥600mm","Iron & Steel","4,730",null,"4,730","5,203","5,676","6,149","C"],
  ["7225 30","Alloy steel HR ≥600mm coils","Iron & Steel","3,590",null,"3,590","3,949","4,308","4,667","F"],
  ["7225 50","Alloy steel CR ≥600mm","Iron & Steel","3,640",null,"3,640","4,004","4,368","4,732","F"],
  ["7301","Sheet piling","Iron & Steel","1,440",null,"1,440","1,584","1,728","1,872","C"],
  ["7302","Railway track material","Iron & Steel","2,740",null,"2,740","3,014","3,288","3,562","C"],
  ["7303 00","Cast iron tubes/pipes","Iron & Steel","1,850",null,"1,850","2,035","2,220","2,405",""],
  ["7304 19","Seamless line pipe non-SS","Iron & Steel","1,974",null,"1,974","2,171","2,369","2,566","C"],
  ["7304 39","Seamless circular tubes HR","Iron & Steel","1,974",null,"1,974","2,171","2,369","2,566","C"],
  ["7305","Large-diameter welded pipes","Iron & Steel","1,440",null,"1,440","1,584","1,728","1,872","C"],
  ["7306 19 00","Welded line pipe non-SS","Iron & Steel","1,440",null,"1,440","1,584","1,728","1,872","C"],
  ["7306 30 80","Welded tubes 168–406mm","Iron & Steel","1,440",null,"1,440","1,584","1,728","1,872","C"],
  ["7307 21 00","SS flanges","Iron & Steel","2,800",null,"2,800","3,080","3,360","3,640",""],
  ["7307 91 00","Flanges non-SS","Iron & Steel","1,410",null,"1,410","1,551","1,692","1,833","C"],
  ["7308","Steel structures","Iron & Steel","2,900",null,"2,900","3,190","3,480","3,770","C"],
  ["7309","Steel tanks >300L","Iron & Steel","3,190",null,"3,190","3,509","3,828","4,147","C"],
  ["7310","Steel tanks ≤300L","Iron & Steel","1,440",null,"1,440","1,584","1,728","1,872","C"],
  ["7311 00","Steel containers compressed gas","Iron & Steel","3,730",null,"3,730","4,103","4,476","4,849","C"],
  ["7318 15","Threaded screws and bolts","Iron & Steel","2,580",null,"2,580","2,838","3,096","3,354","C"],
  ["7318 16","Nuts","Iron & Steel","3,030",null,"3,030","3,333","3,636","3,939","C"],
  ["7318 22 00","Washers","Iron & Steel","1,830",null,"1,830","2,013","2,196","2,379","C"],
  ["7318 23 00","Rivets","Iron & Steel","1,680",null,"1,680","1,848","2,016","2,184","C"],
  ["7326 90 98","Articles of iron/steel NES","Iron & Steel","1,440",null,"1,440","1,584","1,728","1,872","C"],
];

const CN_MAP = {
  "25070080":"25070080","25231000":"25231000","25232100":"25232100",
  "25232900":"25232900","25233000":"25233000","25239000":"25239000",
  "25233000":"25233000",
  "28080000":"28080000","28141000":"28141000","28142000":"28142000",
  "28342100":"28342100",
  "31021012":"31021012","31021015":"31021015","31021019":"31021019",
  "31021090":"31021090","31022100":"31022100","31022900":"31022900",
  "31023010":"31023010","31023090":"31023090","31024010":"31024010",
  "31024090":"31024090","31025000":"31025000","31026000":"31026000",
  "31028000":"31028000","31029000":"31029000","31051000":"31051000",
  "31052010":"31052010","31052090":"31052090","31053000":"31053000",
  "31054000":"31054000","31055100":"31055100","31055900":"31055900",
  "31059020":"31059020","31059080":"31059080",
  "7601":"7601","7603":"7603",
  "76041010":"76041010","76041090":"76041090","76042100":"76042100",
  "76042910":"76042910","76042990":"76042990",
  "7605":"7605","7606":"7606","7607":"7607","7608":"7608",
  "76090000":"76090000","76101000":"76101000","76110000":"76110000",
  "7612":"7612","76130000":"76130000","7614":"7614",
  "76161000":"76161000","76169100":"76169100",
  "76169910":"76169910","76169990":"76169990",
  "76091000":"76090000",  // 7609 00 00 → 76090000
  "76100000":"76101000",  // fallback
  // Aluminium regulation codes with spaces stripped
  "76091000":"76090000","76101000":"76101000","76110000":"76110000",
  "76130000":"76130000","76161000":"76161000","76169100":"76169100",
  "76169910":"76169910","76169990":"76169990",
  "28041000":"28041000",
  "26011200":"26011200",
  "7201":"7201","720211":"720211","720241":"720241",
  "72026000":"72026000","7203":"7203","7205":"7205",
  "72061000":"72061000","7208":"7208","7209":"7209","7210":"7210",
  "72111300":"72111300","7212":"7212","7213":"7213",
  "72142000":"72142000","7215":"7215","7216":"7216",
  "721710":"721710","721720":"721720",
  "72181000":"72181000","72191100":"72191100","72193100":"72193100",
  "7221":"7221","722300":"722300","722410":"722410",
  "72251100":"72251100","722530":"722530","722550":"722550",
  "7301":"7301","7302":"7302","7303":"7303",
  "730419":"730419","730439":"730439","7305":"7305",
  "73061900":"73061900","73063080":"73063080",
  "73072100":"73072100","73079100":"73079100",
  "7308":"7308","7309":"7309","7310":"7310",
  "731100":"731100","731815":"731815","731816":"731816",
  "73182200":"73182200","73182300":"73182300",
  "73269098":"73269098",
  // Regulation codes that map to TRADE keys
  "72021100":"720211","72024100":"720241",
  "72111300":"72111300",
  "72141000":"72142000",  // regulation 7214 20 00 → trade 72142000
  "72171000":"721710","72172000":"721720",
  "72230000":"722300","72241000":"722410",
  "72253000":"722530","72255000":"722550",
  "73030000":"7303","73041900":"730419","73043900":"730439",
  "73110000":"731100","73181500":"731815","73181600":"731816",
};


// ── CBAM DATA & HELPERS ────────────────────────────────────────────────────────
const CBAM_DATA=RAW.map(r=>({cn:r[0],desc:r[1],sector:r[2],direct:eu(r[3]),indirect:eu(r[4]),total:eu(r[5]),mv2026:eu(r[6]),mv2027:eu(r[7]),mv2028:eu(r[8]),route:r[9]}));
const RELEVANT=CBAM_DATA.filter(d=>d.mv2026!=null);

function trKey(cn){const k=cn.replace(/\s/g,"");return CN_MAP[k]||k;}
function avgMonthTonnes(cn,mo){const td=TRADE[trKey(cn)];if(!td)return 0;return["2022","2023","2024","2025"].reduce((s,yr)=>{const v=td[`${yr}-${mo}`];return s+(v?v[0]:0);},0)/4;}
function avgMonthEur(cn,mo){const td=TRADE[trKey(cn)];if(!td)return 0;return["2022","2023","2024","2025"].reduce((s,yr)=>{const v=td[`${yr}-${mo}`];return s+(v?v[1]:0);},0)/4;}
function getMonthTonnes(cn,ym){const td=TRADE[trKey(cn)];return td?.[ym]?.[0]??0;}
function getQtrEts(ym,forecastEts){const[y,m]=ym.split("-");const q=Math.ceil(parseInt(m)/3);return ETS_PRICES.quarterly[`${y}-Q${q}`]??forecastEts;}

// ── PRECOMPUTE CHART DATA (2022-01 to 2028-12) ────────────────────────────────
const CHART_DATA=[];
for(let y=2022;y<=2028;y++){
  for(let m=1;m<=12;m++){
    const mo=String(m).padStart(2,"0"),ym=`${y}-${mo}`,isProjected=y>=2026;
    let factor=0;
    for(const d of RELEVANT){const mv=y>=2028?(d.mv2028||0):y===2027?(d.mv2027||0):(d.mv2026||0);factor+=(isProjected?avgMonthTonnes(d.cn,mo):getMonthTonnes(d.cn,ym))*mv;}
    CHART_DATA.push({ym,factor,isProjected});
  }
}

// ── PRECOMPUTE SECTOR STATS ───────────────────────────────────────────────────
const TODAY_MOS=["01","02","03"];
const APR_FRAC=24/30;
const SECTOR_STATS={};
for(const sec of SECTORS_LIST){
  const rows=RELEVANT.filter(d=>d.sector===sec);
  let annT=0,annE=0,wtDv=0,wtMv=0,wtW=0,ytdUsd=0,ytd25=0,ytd24=0,cfQ1=0,cfApr=0;
  for(const d of rows){
    const mv=d.mv2026||0,tot=d.total||0;
    for(let m=1;m<=12;m++){const mo=String(m).padStart(2,"0");const t=avgMonthTonnes(d.cn,mo),e=avgMonthEur(d.cn,mo);annT+=t;annE+=e;wtDv+=t*tot;wtMv+=t*mv;wtW+=t;}
    // YTD (Jan–Apr24) avg across 2022-2025
    let ytdS=0;
    for(const yr of["2022","2023","2024","2025"]){
      let e=0;for(const mo of TODAY_MOS){const v=TRADE[trKey(d.cn)]?.[`${yr}-${mo}`];if(v)e+=v[1];}
      const apr=TRADE[trKey(d.cn)]?.[`${yr}-04`];if(apr)e+=apr[1]*APR_FRAC;ytdS+=e;
    }
    ytdUsd+=ytdS/4*EUR_USD;
    // 2025 vs 2024 YTD growth
    const ytdE=(yr)=>{let e=0;for(const mo of TODAY_MOS){const v=TRADE[trKey(d.cn)]?.[`${yr}-${mo}`];if(v)e+=v[1];}const apr=TRADE[trKey(d.cn)]?.[`${yr}-04`];if(apr)e+=apr[1]*APR_FRAC;return e;};
    ytd25+=ytdE("2025");ytd24+=ytdE("2024");
    // 2026 projected cost factors
    for(const mo of TODAY_MOS)cfQ1+=avgMonthTonnes(d.cn,mo)*mv;
    cfApr+=avgMonthTonnes(d.cn,"04")*mv*APR_FRAC;
  }
  SECTOR_STATS[sec]={annT,annUsd:annE*EUR_USD,wDv:wtW>0?wtDv/wtW:0,wMv:wtW>0?wtMv/wtW:0,ytdAvgUsd:ytdUsd,ytdGrowth:ytd24>0?(ytd25-ytd24)/ytd24*100:null,cfQ1,cfApr};
}

// ── LINE CHART COMPONENT ─────────────────────────────────────────────────────
// Data cutoff: last confirmed Comext month in 2026
const DATA_CUTOFF_YM="2026-01";
const CBAM_IDX=48; // Jan 2026 index in CHART_DATA (0 = 2022-01)
const CUT_IDX=48;  // same as CBAM_IDX while only Jan 2026 is confirmed
const TODAY_IDX=Math.round(48+3+APR_FRAC); // ~Apr 2026

const MONTH_NAMES=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function LineChart({points,onChartHover,onChartLeave}){
  const [hov,setHov]=useState(null);
  const svgRef=useRef(null);

  const W=820,H=200,pad={l:8,r:8,t:18,b:22};
  const cW=W-pad.l-pad.r,cH=H-pad.t-pad.b,n=points.length;
  const maxY=Math.max(...points.map(p=>p.v),0.01)*1.15;
  const xp=i=>pad.l+i/(n-1)*cW;
  const yp=v=>pad.t+cH*(1-Math.min(v/maxY,1));

  // Precompute annual sums for tooltip
  const ann4yrAvg=["2022","2023","2024","2025"].reduce((s,_,i)=>s+points.slice(i*12,i*12+12).reduce((a,p)=>a+p.v,0),0)/4;
  const ann2026=points.slice(48,60).reduce((s,p)=>s+p.v,0);
  const ann2027=points.slice(60,72).reduce((s,p)=>s+p.v,0);
  const ann2028=points.slice(72,84).reduce((s,p)=>s+p.v,0);

  const getTooltip=useCallback((idx)=>{
    const p=points[idx];
    const[yr,mo]=p.ym.split("-");
    const moName=MONTH_NAMES[parseInt(mo)-1];
    const label=`${moName} ${yr}`;
    const val=`$${p.v.toFixed(2)}M`;
    if(idx<CBAM_IDX){
      return{label,sub:"Pre-CBAM · hypothetical",value:val,note:"Historical trade data, hypothetical CBAM cost",hlTime:"2022–25 hypothetical",hlVerb:"would have paid",hlAmt:`$${ann4yrAvg.toFixed(1)}M / yr`};
    }
    if(idx===CUT_IDX){
      return{label:`${label} (confirmed)`,sub:"Actual Comext trade vol.",value:val,note:"Confirmed data · Q1 2026 ETS price",hlTime:"Since January 2026",hlVerb:"is paying an estimated",hlAmt:`$${(p.v*12).toFixed(1)}M / yr`};
    }
    if(parseInt(yr)===2026){
      return{label,sub:"Projected (2022–25 avg trade)",value:val,note:`Est. monthly · 2026 total: $${ann2026.toFixed(1)}M`,hlTime:"In 2026",hlVerb:"is projected to pay",hlAmt:`$${ann2026.toFixed(1)}M`};
    }
    if(parseInt(yr)===2027){
      return{label,sub:"Projected (2022–25 avg · 20% mark-up)",value:val,note:`Est. monthly · 2027 total: $${ann2027.toFixed(1)}M`,hlTime:"In 2027",hlVerb:"is projected to pay",hlAmt:`$${ann2027.toFixed(1)}M`};
    }
    return{label,sub:"Projected (2022–25 avg · 30% mark-up)",value:val,note:`Est. monthly · 2028 total: $${ann2028.toFixed(1)}M`,hlTime:"In 2028",hlVerb:"is projected to pay",hlAmt:`$${ann2028.toFixed(1)}M`};
  },[points,ann4yrAvg,ann2026,ann2027,ann2028]);

  const handleMouseMove=useCallback((e)=>{
    const svg=svgRef.current;if(!svg)return;
    const rect=svg.getBoundingClientRect();
    const svgX=(e.clientX-rect.left)/rect.width*W;
    const rawI=(svgX-pad.l)/cW*(n-1);
    const idx=Math.max(0,Math.min(n-1,Math.round(rawI)));
    setHov({idx,sx:e.clientX,sy:e.clientY});
    if(onChartHover){const t=getTooltip(idx);onChartHover({hlTime:t.hlTime,hlVerb:t.hlVerb,hlAmt:t.hlAmt});}
  },[cW,n,getTooltip,onChartHover]);

  // Three path segments
  // 1. Historical dashed: 0..CBAM_IDX
  const histD=points.slice(0,CBAM_IDX+1).map((p,i)=>`${i===0?"M":"L"}${xp(i).toFixed(1)},${yp(p.v).toFixed(1)}`).join(" ");
  // 2. Solid: CBAM_IDX..CUT_IDX+1 (short segment of confirmed data)
  const solidPts=points.slice(CBAM_IDX,CUT_IDX+2);
  const solidD=solidPts.length>1?solidPts.map((p,i)=>`${i===0?"M":"L"}${xp(i+CBAM_IDX).toFixed(1)},${yp(p.v).toFixed(1)}`).join(" "):null;
  // 3. Forecast dashed: CUT_IDX..end
  const foreD=points.slice(CUT_IDX).map((p,i)=>`${i===0?"M":"L"}${xp(i+CUT_IDX).toFixed(1)},${yp(p.v).toFixed(1)}`).join(" ");

  const cbamX=xp(CBAM_IDX);
  const todayX=xp(TODAY_IDX);
  const yrs=["2022","2023","2024","2025","2026","2027","2028"];
  const tip=hov?getTooltip(hov.idx):null;

  return(
    <div style={{position:"relative"}}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block",cursor:"crosshair"}}
           onMouseMove={handleMouseMove} onMouseLeave={()=>{setHov(null);if(onChartLeave)onChartLeave();}}>
        {/* CBAM start vertical marker */}
        <line x1={cbamX} y1={pad.t} x2={cbamX} y2={H-pad.b} stroke={N.orange400} strokeWidth={1.2} strokeDasharray="4,3" opacity={0.7}/>
        <text x={cbamX+4} y={pad.t+10} fill={N.orange400} fontSize={9} fontFamily={SANS} fontWeight={700}>CBAM start</text>
        {/* Today vertical marker */}
        <line x1={todayX} y1={pad.t} x2={todayX} y2={H-pad.b} stroke={N.teal400} strokeWidth={1.2} opacity={0.7}/>
        <text x={todayX+4} y={pad.t+22} fill={N.teal400} fontSize={9} fontFamily={SANS} fontWeight={700}>Today</text>
        {/* Forecast dashed (drawn first, solid on top) */}
        <path d={foreD} fill="none" stroke={N.teal600} strokeWidth={2} strokeLinejoin="round" strokeDasharray="10,6" opacity={0.75}/>
        {/* Historical dashed */}
        <path d={histD} fill="none" stroke={N.tealMid} strokeWidth={1.8} strokeLinejoin="round" strokeDasharray="4,5"/>
        {/* Solid (confirmed CBAM data) */}
        {solidD&&<path d={solidD} fill="none" stroke={N.teal600} strokeWidth={2.8} strokeLinejoin="round"/>}
        {/* Year labels */}
        {yrs.map((yr,i)=>(
          <text key={yr} x={xp(i*12)} y={H-4} textAnchor="middle" fill={yr==="2026"?N.teal200:N.tealMid} fontSize={10} fontFamily={SANS} fontWeight={yr==="2026"?700:400}>{yr}</text>
        ))}
        {/* Legend */}
        <g transform={`translate(${W-148},${pad.t})`}>
          <line x1={0} y1={7} x2={22} y2={7} stroke={N.tealMid} strokeWidth={1.8} strokeDasharray="4,5"/>
          <text x={26} y={11} fill={N.tealMid} fontSize={9} fontFamily={SANS}>2022–25 est.</text>
          <line x1={0} y1={21} x2={22} y2={21} stroke={N.teal600} strokeWidth={2.8}/>
          <text x={26} y={25} fill={N.tealMid} fontSize={9} fontFamily={SANS}>Confirmed data</text>
          <line x1={0} y1={35} x2={22} y2={35} stroke={N.teal600} strokeWidth={2} strokeDasharray="10,6"/>
          <text x={26} y={39} fill={N.tealMid} fontSize={9} fontFamily={SANS}>Projected</text>
        </g>
        {/* Hover dot */}
        {hov!=null&&(
          <circle cx={xp(hov.idx)} cy={yp(points[hov.idx].v)} r={4.5} fill={N.teal600} stroke={N.white} strokeWidth={1.5}/>
        )}
      </svg>
      {/* Hover tooltip */}
      {tip&&hov&&(
        <div style={{position:"fixed",left:Math.min(hov.sx+16,window.innerWidth-195),top:Math.max(hov.sy-70,10),
          background:N.teal900,color:N.white,borderRadius:4,padding:"10px 14px",
          boxShadow:"0 4px 12px rgba(12,42,48,0.28)",border:`1px solid ${N.teal600}`,
          fontFamily:SANS,pointerEvents:"none",zIndex:60,minWidth:180}}>
          <div style={{fontSize:10,fontWeight:700,color:N.teal400,textTransform:"uppercase",letterSpacing:"0.08em"}}>{tip.label}</div>
          <div style={{fontSize:11,color:N.tealMid,marginTop:2}}>{tip.sub}</div>
          <div style={{fontSize:22,fontWeight:700,color:N.white,marginTop:6,fontFamily:SERIF}}>{tip.value}</div>
          <div style={{fontSize:11,color:N.tealMid,marginTop:3}}>{tip.note}</div>
        </div>
      )}
    </div>
  );
}

// ── FORMULA TERM COMPONENT ────────────────────────────────────────────────────
function Term({id,label,hovered,setHovered,color,style={}}){
  const active=hovered===id;
  return(
    <span
      style={{display:"inline-block",cursor:"pointer",borderRadius:4,padding:"4px 10px",border:`2px solid ${active?color:N.tealLight}`,background:active?"rgba(255,255,255,0.12)":"transparent",color:active?color:N.white,transition:"all 0.15s",...style}}
      onMouseEnter={()=>setHovered(id)} onMouseLeave={()=>setHovered(null)}
    >
      <span style={{fontFamily:SERIF,fontSize:"clamp(16px,2vw,26px)",fontWeight:700,letterSpacing:"-0.01em"}}>{label}</span>
    </span>
  );
}

// ── ACCORDION ─────────────────────────────────────────────────────────────────
function Accordion({items}){
  const [open,setOpen]=useState(null);
  return items.map((it,i)=>(
    <div key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.1)`,marginBottom:2}}>
      <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",textAlign:"left",background:"none",border:"none",cursor:"pointer",padding:"12px 0",fontFamily:SANS,fontSize:15,fontWeight:600,color:N.tealLight,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        {it.q}<span style={{fontSize:18,color:N.teal400,lineHeight:1}}>{open===i?"−":"+"}</span>
      </button>
      {open===i&&<div style={{fontFamily:SANS,fontSize:14,lineHeight:1.7,color:N.tealMid,paddingBottom:14}}>{it.a}</div>}
    </div>
  ));
}


// ── SECTOR DESCRIPTIONS ───────────────────────────────────────────────────────
const SECTOR_INFO={
  "Iron & Steel":{
    desc:"The largest CBAM sector by US export volume. Covers iron ore products, pig iron, ferro-alloys, flat and long steel products (HR/CR/coated), tubes, sections, and fabricated steel articles.",
    extra:"US steelmakers are predominantly EAF-based (electric arc furnace), which typically produces lower emissions than the blast furnace route assumed in EU default values — so actual costs may be lower for verified reporters.",
  },
  "Aluminium":{
    desc:"Covers unwrought aluminium, semi-finished products (rods, wire, profiles, plates, foil), tubes, fabricated articles, and containers. The US is a significant primary and secondary aluminium producer.",
    extra:"Aluminium default values include upstream smelting and power generation emissions. The US power mix used in smelting will affect whether actual emissions are above or below the EU default.",
  },
  "Cement":{
    desc:"Includes Portland and hydraulic cement, clinker, white and grey variants, and calcined clay. US–EU cement trade is limited by high freight costs relative to product value.",
    extra:"Cement is one of the most carbon-intensive sectors by tCO₂e/t. Even at low trade volumes, the per-tonne CBAM charge can be significant.",
  },
  "Fertilisers":{
    desc:"Nitrogen-based fertilisers including anhydrous ammonia, urea, ammonium nitrate, and compound fertilisers (NPK/NK/DAP/MAP). The US is a major global ammonia and urea producer.",
    extra:"Fertilisers have a special phase-in rate of 1% throughout 2026–2028 (vs. 10–30% for other sectors) due to high carbon leakage risk and food security concerns.",
  },
  "Hydrogen":{
    desc:"Covers hydrogen gas (CN 2804 10 00). CBAM applies based on the hydrogen's production emissions intensity — electrolytic, SMR, or by-product routes have very different default values.",
    extra:"At 26.64 tCO₂e/t, hydrogen has the highest default value of any CBAM product. Even small trade volumes can carry a large CBAM cost.",
  },
};

// ── SECTOR MODAL ──────────────────────────────────────────────────────────────
function SectorModal({sec,ets,onClose}){
  if(!sec)return null;
  const info=SECTOR_INFO[sec]||{desc:"",extra:""};
  const color=SC[sec]||N.teal600;
  const lightColor=SCL[sec]||N.teal400;

  const cnRows=useMemo(()=>{
    if(!sec)return[];
    return RELEVANT.filter(d=>d.sector===sec).map(d=>{
      const mv=d.mv2026||0;
      // Annual projected tonnes
      const annT=[1,2,3,4,5,6,7,8,9,10,11,12].reduce((s,m)=>s+avgMonthTonnes(d.cn,String(m).padStart(2,"0")),0);
      // YTD avg trade (4yr)
      let ytdEurSum=0;
      for(const yr of["2022","2023","2024","2025"]){
        let e=0;
        for(const mo of TODAY_MOS){const v=TRADE[trKey(d.cn)]?.[`${yr}-${mo}`];if(v)e+=v[1];}
        const apr=TRADE[trKey(d.cn)]?.[`${yr}-04`];if(apr)e+=apr[1]*APR_FRAC;
        ytdEurSum+=e;
      }
      const ytdAvgUsd=ytdEurSum/4*EUR_USD;
      // YTD growth 2025 vs 2024
      const ytdE=yr=>{let e=0;for(const mo of TODAY_MOS){const v=TRADE[trKey(d.cn)]?.[`${yr}-${mo}`];if(v)e+=v[1];}const apr=TRADE[trKey(d.cn)]?.[`${yr}-04`];if(apr)e+=apr[1]*APR_FRAC;return e;};
      const [y25,y24]=[ytdE("2025"),ytdE("2024")];
      const ytdGrowth=y24>0?(y25-y24)/y24*100:null;
      // CBAM Q1
      const cfQ1=TODAY_MOS.reduce((s,mo)=>s+avgMonthTonnes(d.cn,mo)*mv,0);
      const taxQ1=cfQ1*Q1_ETS*EUR_USD;
      // CBAM through today
      const cfApr=avgMonthTonnes(d.cn,"04")*mv*APR_FRAC;
      const taxToday=(cfQ1*Q1_ETS+cfApr*ets)*EUR_USD;
      // Cost trajectory (using forecast ets for simplicity)
      const mvFn=mvk=>RELEVANT.find(x=>x.cn===d.cn)?.[mvk]||0;
      const traj=(mvk)=>[1,2,3,4,5,6,7,8,9,10,11,12].reduce((s,m)=>s+avgMonthTonnes(d.cn,String(m).padStart(2,"0"))*mvFn(mvk),0)*ets*EUR_USD;
      return{cn:d.cn,desc:d.desc,total:d.total,mv2026:d.mv2026,annT,ytdAvgUsd,ytdGrowth,taxQ1,taxToday,c2026:traj("mv2026"),c2027:traj("mv2027"),c2028:traj("mv2028")};
    }).sort((a,b)=>b.taxToday-a.taxToday);
  },[sec,ets]);

  const totT=cnRows.reduce((s,r)=>s+r.annT,0);
  const totYtd=cnRows.reduce((s,r)=>s+r.ytdAvgUsd,0);
  const totToday=cnRows.reduce((s,r)=>s+r.taxToday,0);
  const tot26=cnRows.reduce((s,r)=>s+r.c2026,0);
  const tot27=cnRows.reduce((s,r)=>s+r.c2027,0);
  const tot28=cnRows.reduce((s,r)=>s+r.c2028,0);

  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(12,42,48,0.75)",zIndex:300}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:"min(920px,96vw)",maxHeight:"88vh",background:N.teal900,borderRadius:4,
        overflow:"hidden",display:"flex",flexDirection:"column",zIndex:301,
        boxShadow:"0 12px 32px rgba(12,42,48,0.55)",border:`1px solid ${color}44`}}>

        {/* Modal header */}
        <div style={{background:`${color}1a`,borderBottom:`2px solid ${color}`,padding:"18px 24px",
          display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontFamily:SANS,fontSize:10,fontWeight:700,color:lightColor,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Sector Detail</div>
            <div style={{fontFamily:SERIF,fontSize:26,fontWeight:700,color:N.white}}>{sec}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:N.tealMid,fontSize:24,cursor:"pointer",lineHeight:1,padding:"4px 8px"}}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{overflowY:"auto",flex:1,padding:"20px 24px 28px"}}>

          {/* Description */}
          <p style={{fontFamily:SANS,fontSize:14,color:N.tealLight,lineHeight:1.65,margin:"0 0 6px"}}>{info.desc}</p>
          <p style={{fontFamily:SANS,fontSize:13,color:N.tealMid,lineHeight:1.6,margin:"0 0 20px",fontStyle:"italic"}}>{info.extra}</p>

          {/* KPI cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
            {[
              {label:"Proj. Annual Tonnes",val:fmtKt(totT),sub:"2022–25 avg basis"},
              {label:"YTD Avg Trade Value",val:fmtM(totYtd),sub:"Jan–Apr avg · 4-year avg"},
              {label:"CBAM through Apr 24",val:fmtM(totToday),sub:"Q1 confirmed + forecast"},
            ].map(({label,val,sub})=>(
              <div key={label} style={{background:"rgba(255,255,255,0.05)",borderRadius:4,padding:"12px 14px",border:`1px solid rgba(255,255,255,0.08)`}}>
                <div style={{fontFamily:SANS,fontSize:10,color:N.tealMid,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{label}</div>
                <div style={{fontFamily:SERIF,fontSize:22,fontWeight:700,color:N.teal200}}>{val}</div>
                <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,marginTop:4}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Cost trajectory */}
          <div style={{marginBottom:20}}>
            <div style={{fontFamily:SANS,fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:N.teal400,textTransform:"uppercase",marginBottom:10}}>Projected Annual Cost Trajectory (at €{ets.toFixed(0)}/tCO₂e)</div>
            <div style={{display:"flex",gap:12}}>
              {[
                {year:"2026",cost:tot26,markup:sec==="Fertilisers"?"1%":"10%",col:N.orange400},
                {year:"2027",cost:tot27,markup:sec==="Fertilisers"?"1%":"20%",col:N.orange500},
                {year:"2028",cost:tot28,markup:sec==="Fertilisers"?"1%":"30%",col:"#c0392b"},
              ].map(({year,cost,markup,col})=>(
                <div key={year} style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:4,padding:"12px 14px",borderTop:`3px solid ${col}`}}>
                  <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,marginBottom:4}}>{year} · {markup} mark-up</div>
                  <div style={{fontFamily:SERIF,fontSize:20,fontWeight:700,color:N.white}}>{fmtM(cost)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CN code table */}
          <div style={{fontFamily:SANS,fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:N.teal400,textTransform:"uppercase",marginBottom:10}}>
            CN Code Breakdown · {cnRows.length} product code{cnRows.length!==1?"s":""}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:SANS,fontSize:12}}>
              <thead>
                <tr style={{background:"rgba(255,255,255,0.06)"}}>
                  <th style={{padding:"8px 10px",textAlign:"left",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>CN Code</th>
                  <th style={{padding:"8px 10px",textAlign:"left",color:N.teal400,fontWeight:700,maxWidth:180}}>Description</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>Proj. 2026<br/>Tonnes</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>YTD Avg<br/>Trade (4yr)</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>YTD Growth<br/>2025 vs 2024</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>CBAM Q1<br/>2026</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>CBAM through<br/>Apr 24</th>
                </tr>
              </thead>
              <tbody>
                {cnRows.map((r,i)=>{
                  const gr=r.ytdGrowth;
                  const gCol=gr==null?N.tealMid:gr>2?N.green600:gr<-2?N.orange500:N.tealMid;
                  const gArr=gr==null?"":gr>2?"↑":gr<-2?"↓":"→";
                  return(
                    <tr key={r.cn} style={{borderBottom:`1px solid rgba(255,255,255,0.06)`,background:i%2===0?"transparent":"rgba(255,255,255,0.03)"}}>
                      <td style={{padding:"8px 10px",color:lightColor,fontWeight:700,fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{r.cn}</td>
                      <td style={{padding:"8px 10px",color:N.tealLight,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.desc}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:N.white}}>{fmtKt(r.annT)}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:N.tealLight}}>{fmtM(r.ytdAvgUsd)}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:gCol}}>{gr==null?"—":`${gArr} ${pct(gr)}`}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:N.tealLight}}>{fmtM(r.taxQ1)}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:N.white}}>{fmtM(r.taxToday)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{background:"rgba(255,255,255,0.08)",fontWeight:700}}>
                  <td colSpan={2} style={{padding:"8px 10px",color:N.teal400}}>Total</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.white}}>{fmtKt(totT)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.tealLight}}>{fmtM(totYtd)}</td>
                  <td/>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.tealLight}}>{fmtM(cnRows.reduce((s,r)=>s+r.taxQ1,0))}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.white}}>{fmtM(totToday)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{marginTop:8,fontFamily:SANS,fontSize:11,color:N.tealMid}}>
            Sorted by CBAM exposure. YTD = Jan–Apr 24, 2026 partial. YTD growth compares 2025 vs 2024. Trajectory uses €{ets.toFixed(0)}/tCO₂e for all months (indicative).
          </div>
        </div>
      </div>
    </>
  );
}

// ── HAMBURGER MENU ────────────────────────────────────────────────────────────
const FAQ_ITEMS=[
  {q:"When are CBAM prices set, and when do importers actually pay?",a:"CBAM certificate prices are based on the weekly average auction price of EU ETS allowances. Importers must purchase and surrender certificates annually — for goods imported in 2026, the deadline is September 30, 2027."},
  {q:"Why does the fertilizer sector have a lower phase-in rate?",a:"Fertilizers have a lower initial phase-in rate starting at 1%, due to high exposure to carbon leakage, global competition, and importance for agricultural supply chains."},
  {q:"Why does the mark-up increase over time?",a:"The mark-up applied to CBAM default values increases over time (10% in 2026, rising to 30% in 2028) to ensure estimates remain conservative and to incentivize importers to report verified, installation-level emissions data instead of relying on defaults."},
  {q:"What has the EU carbon price been in recent years?",a:"EU ETS prices peaked near €100/tCO₂ in early 2023, then fell — averaging €66/tCO₂ in 2024. Prices averaged €74/tCO₂ in 2025. In Q1 2026, the official CBAM certificate price was confirmed at €75.36/tCO₂."},
  {q:"Are other countries implementing their own CBAM?",a:"The UK plans a CBAM starting in 2027. Canada has explored border carbon adjustments but not committed to a design. Australia's 2026 carbon leakage review recommended a CBAM-like scheme. Taiwan passed a carbon border charge framework in late 2025."},
];
const METHODOLOGY=[
  {q:"What data is used?",a:"Trade volumes are from Eurostat Comext DS-045409 (EU imports from US, CN4/CN6/CN8 level, matched exactly to CBAM regulation codes). Default emissions values are from EU Implementing Regulation 2025/2621, Annex I (US-specific). Historical ETS prices are from ICAP Allowance Price Explorer; the 2026-Q1 price (€75.36) is the official CBAM certificate price published by the European Commission."},
  {q:"How is the CBAM cost calculated?",a:"CBAM Cost (€) = Exported Tonnes × Default Value (tCO₂e/t, incl. mark-up) × ETS Price (€/tCO₂e). Converted to USD at a fixed rate of $1.08/€. Trade volumes for 2026+ are projected from the 2022–2025 monthly average. This represents a maximum exposure — exporters with verified emissions below the default value would pay less."},
  {q:"What does 'mark-up' mean?",a:"The EU adds a percentage mark-up to default values to ensure they are conservative. For 2026, this is 10% (shown as mv2026 = total × 1.10). The mark-up rises to 20% in 2027 and 30% in 2028. This tool uses the 2026 mark-up for all projections."},
  {q:"Why is this an upper bound?",a:"Default values are set conservatively and may exceed actual emissions for lower-carbon producers. US steelmakers (predominantly EAF-based) likely have lower actual emissions than the default iron & steel values. Exporters may also report verified installation-level data to avoid defaults."},
];

function HamburgerMenu({open,setOpen}){
  const [tab,setTab]=React.useState("faq");
  if(!open)return(
    <button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:28,right:28,width:52,height:52,borderRadius:"50%",background:N.teal800,border:`2px solid ${N.teal600}`,color:N.white,fontSize:22,cursor:"pointer",boxShadow:"0 4px 16px rgba(12,42,48,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:SANS}}><span style={{display:"block",marginBottom:3}}>≡</span></button>
  );
  return(
    <>
      <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(12,42,48,0.6)",zIndex:199}}/>
      <div style={{position:"fixed",bottom:0,right:0,width:"min(560px,100vw)",height:"70vh",background:N.teal900,borderRadius:"4px 0 0 0",zIndex:200,display:"flex",flexDirection:"column",boxShadow:"-8px -8px 40px rgba(12,42,48,0.45)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px 0"}}>
          <div style={{display:"flex",gap:4,background:"rgba(255,255,255,0.07)",borderRadius:4,padding:4}}>
            {[["faq","FAQ"],["methodology","Methodology"]].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{padding:"6px 16px",border:"none",cursor:"pointer",fontFamily:SANS,fontSize:14,fontWeight:600,borderRadius:2,background:tab===k?N.teal600:"transparent",color:tab===k?N.white:N.tealMid}}>{l}</button>
            ))}
          </div>
          <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:N.tealMid,fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 24px 24px"}}>
          {tab==="faq"&&<Accordion items={FAQ_ITEMS}/>}
          {tab==="methodology"&&<Accordion items={METHODOLOGY}/>}
        </div>
      </div>
    </>
  );
}

// ── TERM DEFINITIONS FOR FORMULA PANEL ──────────────────────────────────────
const TERM_DEFS={
  tonnes:{title:"Exported Tonnes",def:"Annual quantity of US goods exported to the EU under CBAM, sourced from Eurostat Comext DS-045409. Projected 2026+ values use 2022–25 monthly averages.",source:"Eurostat Comext DS-045409"},
  dv:{title:"Default Value (tCO₂e/t)",def:"The carbon intensity assigned to each product by EU IR 2025/2621 Annex I, without mark-up. Represents tonnes of CO₂-equivalent emitted per tonne of product exported.",source:"EU IR 2025/2621, Annex I (US-specific)"},
  markup:{title:"Mark-up / Phase-in %",def:"Added to the base default value to account for gradual phase-in of CBAM. Most sectors: 10% in 2026, 20% in 2027, 30% in 2028. Fertilisers: 1% throughout (carbon leakage risk).",source:"EU CBAM Implementing Regulation"},
  fxrate:{title:"Exchange Rate (USD/EUR)",def:"Fixed at $1.08/€, calculated as the simple average of weekly ECB EUR/USD reference rates over calendar year 2024.",source:"European Central Bank (ECB) Statistical Data Warehouse — EUR/USD reference rates, 2024 annual average"},
};

// ── INLINE SELECT (underline + arrow, no border) ─────────────────────────────
function InlineSelect({value,onChange,options,color}){
  const c=color||"#348397";
  return(
    <span style={{position:"relative",display:"inline-block"}}>
      <select value={value} onChange={e=>{const v=e.target.value;onChange(v==="today"?v:+v);}}
        style={{fontFamily:"'Hanken Grotesk','Inter',sans-serif",fontSize:"inherit",fontWeight:700,color:c,
          background:"transparent",border:"none",borderBottom:`2px solid ${c}`,
          padding:"0 22px 2px 0",outline:"none",cursor:"pointer",
          WebkitAppearance:"none",MozAppearance:"none",appearance:"none"}}>
        {options.map(y=><option key={y} value={y}>{y==="today"?"Today":y}</option>)}
      </select>
      <span style={{position:"absolute",right:2,top:"50%",transform:"translateY(-50%)",color:c,fontSize:"0.7em",pointerEvents:"none",lineHeight:1}}>▾</span>
    </span>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function V2App(){
  const [ets,setEts]=useState(ETS_PRICES.default||75.36);
  const [hovered,setHovered]=useState(null);
  const [rangeStart,setRangeStart]=useState(2026);
  const [rangeEnd,setRangeEnd]=useState("today");
  const [menuOpen,setMenuOpen]=useState(false);
  const [chartHover,setChartHover]=useState(null);
  const [hoveredSector,setHoveredSector]=useState(null);
  const [selectedSector,setSelectedSector]=useState(null);

  // Chart: monthly costs applying ETS prices
  const chartPoints=useMemo(()=>CHART_DATA.map(m=>({...m,v:m.factor*getQtrEts(m.ym,ets)*EUR_USD/1e6})),[ets]);

  // Table rows
  const tableRows=useMemo(()=>SECTORS_LIST.map(sec=>{
    const s=SECTOR_STATS[sec];
    return{sec,...s,taxQ1:s.cfQ1*Q1_ETS*EUR_USD,taxToday:(s.cfQ1*Q1_ETS+s.cfApr*ets)*EUR_USD};
  }),[ets]);

  const totTaxToday=tableRows.reduce((s,r)=>s+r.taxToday,0);
  const totAnnUsd=tableRows.reduce((s,r)=>s+r.annUsd,0);

  // Sector proportions for right panel
  const sectorAnnCosts=useMemo(()=>{
    const items=SECTORS_LIST.map(sec=>{const s=SECTOR_STATS[sec];return{sec,cost:s.annT*s.wMv*ets*EUR_USD};});
    const tot=items.reduce((s,d)=>s+d.cost,0);
    return items.map(d=>({...d,pct:tot>0?d.cost/tot*100:0})).sort((a,b)=>b.pct-a.pct);
  },[ets]);

  // Mark-up phase-in % for table column
  const markupPct=(sec)=>{
    if(sec==="Fertilisers")return"1%";
    const eEnd=rangeEnd==="today"?2026:rangeEnd;
    const startPct=rangeStart<=2026?10:rangeStart===2027?20:30;
    const endPct=eEnd<=2026?10:eEnd===2027?20:30;
    return startPct===endPct?`${startPct}%`:`${startPct}–${endPct}%`;
  };

  // Headline amounts by year range
  const {hlTime,hlVerb,hlAmt}=useMemo(()=>{
    if(rangeEnd==="today"){
      return{hlTime:"Since January 2026",hlVerb:"is paying an estimated",hlAmt:fmtM(totTaxToday)};
    }
    const startYm=`${rangeStart}-01`,endYm=`${rangeEnd}-12`;
    if(rangeEnd<=2025){
      const hist=CHART_DATA.filter(m=>m.ym>=startYm&&m.ym<=endYm).reduce((s,m)=>s+m.factor*getQtrEts(m.ym,ets),0)/(rangeEnd-rangeStart+1)*EUR_USD;
      const label=rangeStart===rangeEnd?`${rangeStart}`:`${rangeStart}–${rangeEnd}`;
      return{hlTime:`In ${label}`,hlVerb:"would have paid",hlAmt:fmtM(hist)+" / year (est.)"};
    }
    const tot=CHART_DATA.filter(m=>m.ym>=startYm&&m.ym<=endYm).reduce((s,m)=>s+m.factor*getQtrEts(m.ym,ets),0)*EUR_USD;
    const hlLabel=rangeStart===rangeEnd?`In ${rangeStart}`:`Through ${rangeEnd}`;
    return{hlTime:hlLabel,hlVerb:"is projected to pay",hlAmt:fmtM(tot)+" total"};
  },[rangeStart,rangeEnd,ets,totTaxToday]);

  // Per-year cost breakdown for right panel
  const annualCosts=useMemo(()=>{
    if(rangeEnd==="today")return[{year:"2026 (YTD)",cost:totTaxToday}];
    const result=[];
    for(let y=rangeStart;y<=rangeEnd;y++){
      const cost=CHART_DATA.filter(m=>m.ym.startsWith(String(y))).reduce((s,m)=>s+m.factor*getQtrEts(m.ym,ets),0)*EUR_USD;
      result.push({year:String(y),cost});
    }
    return result;
  },[rangeStart,rangeEnd,ets,totTaxToday]);

    // Column highlight from formula hover
  const colHl=col=>hovered===col?{background:`${N.teal600}22`,outline:`1.5px solid ${N.teal600}`}:{};

  return(
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Neuton:wght@400;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;}body{margin:0;background:${N.tealPale};}`}</style>

      <div style={{fontFamily:SANS,minHeight:"100vh",color:N.teal900,maxWidth:1400,margin:"0 auto"}}>

        {/* HEADER */}
        <div style={{background:N.teal900,color:N.white,padding:"14px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <img src="/US_CBAM_Exposure-dashboard/nc-logo-white.png" alt="Niskanen Center" style={{height:28,display:"block",marginBottom:10}}/>
            <div style={{fontFamily:SANS,fontSize:16,fontWeight:700,color:N.white,letterSpacing:"0.01em"}}>US CBAM Exposure Dashboard <span style={{fontWeight:400,color:N.tealMid,fontSize:13}}>(Beta)</span></div>
            <div style={{fontFamily:SANS,fontSize:12,color:N.tealMid,lineHeight:1.5}}>Maximum carbon costs for US exporters under the EU CBAM default values</div>
            <div style={{fontFamily:SANS,fontSize:12,color:N.tealMid}}>A.K.A. Forgone revenue for the federal government</div>
          </div>
          <div style={{fontSize:12,color:N.tealMid,textAlign:"right",lineHeight:1.6}}>
            <div>EU IR 2025/2621 · Eurostat Comext DS-045409</div>
            <div>Last updated Apr 7, 2026</div>
          </div>
        </div>

        {/* TOP SECTION */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:0,minHeight:380,borderBottom:`1px solid ${N.teal800}`,background:N.teal900,position:"relative",overflow:"hidden"}}>
          {/* Brand motif overlay */}
          <img src="/US_CBAM_Exposure-dashboard/nc-motif.png" alt="" aria-hidden="true" style={{position:"absolute",left:0,top:0,height:"100%",width:"auto",opacity:0.18,filter:"brightness(3) saturate(0.3)",pointerEvents:"none",userSelect:"none",zIndex:0}}/>
          {/* LEFT: Headline + Chart */}
          <div style={{padding:"32px 32px 24px",background:"transparent",position:"relative",zIndex:1}}>
            {/* Eyebrow: inline year selects (or hover override) */}
            <div style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:N.teal400,fontFamily:SANS,textTransform:"uppercase",letterSpacing:"0.12em",display:"flex",alignItems:"baseline",flexWrap:"wrap",gap:"0 8px"}}>
              {chartHover?(
                <span>{chartHover.hlTime}</span>
              ):(
                <>
                  <span>From{" "}</span>
                  <InlineSelect value={rangeStart} onChange={v=>{setRangeStart(v);if(v<=2025){if(rangeEnd==="today"||rangeEnd>2025||rangeEnd<v)setRangeEnd(v);}else{if(rangeEnd!=="today"&&rangeEnd<v)setRangeEnd(v);}}} options={[2022,2023,2024,2025,2026,2027,2028]} color={N.teal400}/>
                  <span>{" "}to{" "}</span>
                  <InlineSelect value={rangeEnd} onChange={setRangeEnd} options={rangeStart<=2025?[2022,2023,2024,2025].filter(y=>y>=rangeStart):[...[2026,2027,2028].filter(y=>y>=rangeStart),"today"]} color={N.teal400}/>
                </>
              )}
            </div>
            <h1 style={{margin:"0 0 24px",fontFamily:SERIF,fontSize:"clamp(26px,3.5vw,46px)",fontWeight:700,lineHeight:1.15,color:N.white}}>
              The US{" "}
              <span style={{color:N.teal400}}>{chartHover?chartHover.hlVerb:hlVerb}</span>{" "}
              <span style={{color:N.orange500,whiteSpace:"nowrap"}}>{chartHover?chartHover.hlAmt:hlAmt}</span>{" "}
              to the EU for exporting emission&#8209;intensive products.
            </h1>
            <LineChart points={chartPoints} onChartHover={setChartHover} onChartLeave={()=>setChartHover(null)}/>
            <p style={{margin:"8px 0 0",fontFamily:SANS,fontSize:12,color:N.tealMid}}>
              Estimated CBAM cost per month ($M) · Gray dashed = 2022–25 est. · Solid = Jan 2026 confirmed · Teal dashed = projected
            </p>
          </div>

          {/* RIGHT: ETS + Sector panel */}
          <div style={{background:N.teal900,color:N.white,padding:"28px 24px",display:"flex",flexDirection:"column",gap:20,position:"relative",zIndex:1}}>
            {/* ETS Price */}
            <div>
              <div style={{fontFamily:SANS,fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:N.teal400,textTransform:"uppercase",marginBottom:10}}>EU ETS Carbon Price</div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:SANS,fontSize:13,color:N.tealMid}}>Q1 2026 (confirmed)</span>
                  <span style={{fontFamily:SERIF,fontSize:20,fontWeight:700,color:N.teal200}}>€{Q1_ETS.toFixed(2)}</span>
                </div>
                <div style={{fontSize:12,color:N.tealMid,marginTop:2}}>Official CBAM certificate price, EU Commission</div>
              </div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                  <span style={{fontFamily:SANS,fontSize:13,color:N.tealMid}}>Forecast (Q2+)</span>
                  <span style={{fontFamily:SERIF,fontSize:20,fontWeight:700,color:N.orange400}}>€{ets.toFixed(1)}</span>
                </div>
                <input type="range" min={30} max={130} value={ets} onChange={e=>setEts(+e.target.value)}
                  style={{width:"100%",accentColor:N.orange400,cursor:"pointer"}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:N.tealMid,marginTop:2}}>
                  <span>€30</span><span>€80</span><span>€130</span>
                </div>
              </div>
            </div>

            {/* Sector breakdown */}
            <div>
              <div style={{fontFamily:SANS,fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:N.teal400,textTransform:"uppercase",marginBottom:10}}>Annual CBAM Exposure by Sector</div>
              <div style={{fontSize:12,color:N.tealMid,marginBottom:10}}>at €{ets.toFixed(0)} forecast · 2022–25 avg trade</div>
              {sectorAnnCosts.map(({sec,cost,pct})=>(
                <div key={sec} style={{marginBottom:10,cursor:"pointer"}}
                  onMouseEnter={()=>setHoveredSector(sec)} onMouseLeave={()=>setHoveredSector(null)}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontFamily:SANS,fontSize:13,fontWeight:600,color:SCL[sec]}}>{sec}</span>
                    <span style={{fontFamily:SANS,fontSize:13,fontWeight:700,color:N.white,opacity:hoveredSector===sec?1:0,transition:"opacity 0.2s"}}>{fmtM(cost)}</span>
                  </div>
                  <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct.toFixed(1)}%`,background:SC[sec]||N.teal600,borderRadius:3,transition:"width 0.3s"}}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{borderTop:`1px solid rgba(255,255,255,0.1)`,paddingTop:14,marginTop:"auto"}}>
              <div style={{fontFamily:SANS,fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:N.teal400,textTransform:"uppercase",marginBottom:10}}>CBAM Exposure by Year</div>
              {annualCosts.map(({year,cost})=>(
                <div key={year} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontFamily:SANS,fontSize:13,color:N.tealMid}}>{year}</span>
                  <span style={{fontFamily:SERIF,fontSize:18,fontWeight:700,color:N.teal200}}>{fmtM(cost)}</span>
                </div>
              ))}
              {annualCosts.length>1&&(
                <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid rgba(255,255,255,0.1)`,paddingTop:8,marginTop:2}}>
                  <span style={{fontFamily:SANS,fontSize:13,color:N.tealMid,fontWeight:700}}>Total</span>
                  <span style={{fontFamily:SERIF,fontSize:20,fontWeight:700,color:N.teal200}}>{fmtM(annualCosts.reduce((s,d)=>s+d.cost,0))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTOR TABLE */}
        <div style={{background:N.white,padding:"0 0 4px"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:SANS,fontSize:13}}>
              <thead>
                <tr style={{background:N.teal900,color:N.white}}>
                  <th style={{padding:"10px 16px",textAlign:"left",fontWeight:700,whiteSpace:"nowrap",minWidth:130}}>Sector</th>
                  <th style={{padding:"10px 10px",textAlign:"right",fontWeight:700,whiteSpace:"nowrap",...colHl("tonnes")}}>Proj. 2026<br/>Tonnes</th>
                  <th style={{padding:"10px 10px",textAlign:"right",fontWeight:700,whiteSpace:"nowrap",...colHl("dv")}}>Default Value<br/>(tCO₂e/t)</th>
                  <th style={{padding:"10px 10px",textAlign:"right",fontWeight:700,whiteSpace:"nowrap",...colHl("markup")}}>Mark-up<br/>Phase-in %</th>
                  <th style={{padding:"10px 10px",textAlign:"right",fontWeight:700,whiteSpace:"nowrap",borderLeft:`3px solid rgba(125,206,218,0.3)`,background:"rgba(52,131,151,0.4)"}}>CBAM through<br/>Apr 24, 2026</th>
                  <th style={{padding:"10px 16px",width:32,color:N.tealMid,fontSize:10,textAlign:"center"}}>detail</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r,i)=>(
                  <tr key={r.sec} style={{background:i%2===0?N.white:N.tealPale,borderBottom:`1px solid ${N.tealLight}`,cursor:"pointer"}}
                    onClick={()=>setSelectedSector(r.sec)}>
                    <td style={{padding:"11px 16px",fontWeight:700,color:SC[r.sec],borderLeft:`4px solid ${SC[r.sec]}`}}>{r.sec}</td>
                    <td style={{padding:"11px 10px",textAlign:"right",fontWeight:600,color:N.teal900,...colHl("tonnes")}}>{fmtKt(r.annT)}</td>
                    <td style={{padding:"11px 10px",textAlign:"right",color:N.teal900,...colHl("dv")}}>{r.wDv>0?r.wDv.toFixed(3):"—"}</td>
                    <td style={{padding:"11px 10px",textAlign:"right",fontWeight:700,color:N.teal600,...colHl("markup")}}>{markupPct(r.sec)}</td>
                    <td style={{padding:"11px 10px",textAlign:"right",fontWeight:700,color:N.teal800,borderLeft:`3px solid ${N.tealLight}`,background:"rgba(61,131,151,0.04)"}}>{fmtM(r.taxToday)}</td>
                    <td style={{padding:"11px 16px",textAlign:"center",color:N.tealMid,fontSize:14}}>›</td>
                  </tr>
                ))}
                <tr style={{background:N.teal900,color:N.white,fontWeight:700}}>
                  <td style={{padding:"10px 16px"}}>Total</td>
                  <td style={{padding:"10px 10px",textAlign:"right"}}>{fmtKt(tableRows.reduce((s,r)=>s+r.annT,0))}</td>
                  <td colSpan={2} style={{padding:"10px 10px",textAlign:"center",color:N.tealMid,fontSize:12}}>weighted avg ↑</td>
                  <td style={{padding:"10px 10px",textAlign:"right",borderLeft:`3px solid rgba(125,206,218,0.25)`}}>{fmtM(totTaxToday)}</td>
                  <td/>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{padding:"6px 16px 8px",fontFamily:SANS,fontSize:12,color:N.tealMid}}>
            Click any sector row for CN-code breakdown. Projected 2026 trade from 2022–25 monthly avg. CBAM costs use Q1 confirmed price (€{Q1_ETS}) and forecast for partial Apr.
          </div>
        </div>
        {/* FORMULA */}
        <div style={{background:N.teal900,padding:"32px 28px 72px",position:"relative"}}>
          <div style={{fontFamily:SANS,fontSize:12,fontWeight:700,letterSpacing:"0.12em",color:N.teal400,textTransform:"uppercase",marginBottom:16}}>CBAM Cost Formula — hover each term</div>
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"flex-end",gap:"12px 8px",userSelect:"none"}}>
            <span style={{fontFamily:SERIF,fontSize:"clamp(16px,2vw,26px)",fontWeight:700,color:N.teal200}}>CBAM Cost ($)</span>
            <span style={{fontFamily:SANS,fontSize:20,color:N.tealMid,fontWeight:300}}>=</span>
            <Term id="tonnes" label="Exported Tonnes" hovered={hovered} setHovered={setHovered} color={N.teal400}/>
            <span style={{fontFamily:SANS,fontSize:20,color:N.tealMid,fontWeight:300}}>×</span>
            <Term id="dv" label="Default Value (tCO₂e/t)" hovered={hovered} setHovered={setHovered} color={N.teal400}/>
            <span style={{fontFamily:SANS,fontSize:20,color:N.tealMid,fontWeight:300}}>×</span>
            <Term id="markup" label="(1 + Mark-up)" hovered={hovered} setHovered={setHovered} color={N.teal400}/>
            <span style={{fontFamily:SANS,fontSize:20,color:N.tealMid,fontWeight:300}}>×</span>
            {/* ETS Price — interactive inline */}
            <span style={{display:"inline-block",position:"relative"}}>
              <span style={{display:"inline-block",fontFamily:SERIF,fontSize:"clamp(16px,2vw,26px)",fontWeight:700,color:N.orange400,background:"rgba(241,125,58,0.1)",borderRadius:4,padding:"4px 10px",border:`2px solid ${N.orange400}`}}>
                €{ets.toFixed(1)}/tCO₂e
              </span>
              <span style={{position:"absolute",top:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:2,whiteSpace:"nowrap"}}>
                <input type="range" min={30} max={130} value={ets} onChange={e=>setEts(+e.target.value)}
                  style={{width:120,accentColor:N.orange400,cursor:"pointer"}}/>
                <span style={{fontFamily:SANS,fontSize:11,color:N.tealMid}}>ETS Price — drag to adjust</span>
              </span>
            </span>
            <span style={{fontFamily:SANS,fontSize:20,color:N.tealMid,fontWeight:300}}>×</span>
            <Term id="fxrate" label="$1.08 / €" hovered={hovered} setHovered={setHovered} color={N.teal400}/>
          </div>
          <div style={{marginTop:16,borderTop:`1px solid rgba(255,255,255,0.1)`,paddingTop:12,minHeight:76,fontFamily:SANS}}>
            {hovered&&TERM_DEFS[hovered]?(
              <div>
                <div style={{fontSize:11,color:N.teal400,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{TERM_DEFS[hovered].title}</div>
                <div style={{fontSize:13,color:N.tealLight,lineHeight:1.55,maxWidth:700}}>{TERM_DEFS[hovered].def}</div>
                <div style={{fontSize:11,color:N.tealMid,marginTop:6}}>Source: {TERM_DEFS[hovered].source}</div>
              </div>
            ):(
              <div style={{fontSize:13,color:N.tealMid,fontStyle:"italic"}}>Hover a term above to see its definition and data source.</div>
            )}
          </div>
        </div>

        {/* DATA NOTE */}
        <div style={{background:N.tealPale,borderTop:`1px solid ${N.tealLight}`,padding:"10px 28px 60px",fontFamily:SANS,fontSize:12,color:N.tealMid}}>
          <b style={{color:N.teal800}}>Sources:</b> Default values: EU IR 2025/2621 Annex I (US). Trade: Eurostat Comext DS-045409 (2022–2025). ETS: ICAP + EU Commission. All figures in USD at $1.08/€. Figures represent maximum exposure using default values; actual CBAM costs for low-carbon producers may be lower.
        </div>

      </div>

      <HamburgerMenu open={menuOpen} setOpen={setMenuOpen}/>
      {selectedSector&&<SectorModal sec={selectedSector} ets={ets} onClose={()=>setSelectedSector(null)}/>}
    </>
  );
}
