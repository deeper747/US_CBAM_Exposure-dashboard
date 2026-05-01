import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
const fmtT=n=>n==null?"—":Math.round(n).toLocaleString("en-US");
const dvLevel=v=>{if(!v||v===0)return 0;return v>=3?4:v>=2?3:v>=1?2:1;};
const pct=(n,d=1)=>n==null?"—":`${n>=0?"+":""}${n.toFixed(d)}%`;

function DefaultValueMeter({value,extreme=false}){
  const filled=dvLevel(value);
  if(!filled)return"—";
  return(
    <span
      title={`Default value: ${value.toFixed(2)} tCO₂e/t${extreme?" +":""}`}
      aria-label={`Default value intensity ${filled} of 4${extreme?", plus":""}`}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",gap:5,lineHeight:1,width:78}}
    >
      {Array.from({length:4}).map((_,i)=>(
        <span key={i} style={{
          width:11,height:11,display:"inline-block",
          clipPath:"polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)",
          background:i<filled?N.teal900:N.tealLight,
          opacity:i<filled?1:0.45,
          boxShadow:i<filled?"none":`inset 0 0 0 1px ${N.tealMid}`,
        }}/>
      ))}
      {extreme&&<span style={{fontFamily:SANS,fontSize:14,fontWeight:800,color:N.orange500,marginLeft:2}}>+</span>}
    </span>
  );
}

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
const APR_FRAC=28/30;
const SECTOR_STATS={};
for(const sec of SECTORS_LIST){
  const rows=RELEVANT.filter(d=>d.sector===sec);
  let annT=0,annE=0,wtDv=0,wtMv=0,wtW=0,ytdUsd=0,ytd26=0,ytd25j=0,cfQ1=0,cfApr=0;
  for(const d of rows){
    const mv=d.mv2026||0,tot=d.total||0;
    for(let m=1;m<=12;m++){const mo=String(m).padStart(2,"0");const t=avgMonthTonnes(d.cn,mo),e=avgMonthEur(d.cn,mo);annT+=t;annE+=e;wtDv+=t*tot;wtMv+=t*mv;wtW+=t;}
    // YTD (Jan–Apr avg) across 2022-2025
    let ytdS=0;
    for(const yr of["2022","2023","2024","2025"]){
      let e=0;for(const mo of TODAY_MOS){const v=TRADE[trKey(d.cn)]?.[`${yr}-${mo}`];if(v)e+=v[1];}
      const apr=TRADE[trKey(d.cn)]?.[`${yr}-04`];if(apr)e+=apr[1]*APR_FRAC;ytdS+=e;
    }
    ytdUsd+=ytdS/4*EUR_USD;
    // Jan growth 2026 vs 2025 (compare only confirmed Jan month)
    ytd26+=TRADE[trKey(d.cn)]?.["2026-01"]?.[1]??0;
    ytd25j+=TRADE[trKey(d.cn)]?.["2025-01"]?.[1]??0;
    // YTD cost factors: use actual Jan 2026 trade if available, else 4yr avg
    const jan26T=getMonthTonnes(d.cn,"2026-01");
    cfQ1+=(jan26T>0?jan26T:avgMonthTonnes(d.cn,"01"))*mv;
    cfQ1+=avgMonthTonnes(d.cn,"02")*mv;
    cfQ1+=avgMonthTonnes(d.cn,"03")*mv;
    cfApr+=avgMonthTonnes(d.cn,"04")*mv*APR_FRAC;
  }
  SECTOR_STATS[sec]={annT,annUsd:annE*EUR_USD,wDv:wtW>0?wtDv/wtW:0,wMv:wtW>0?wtMv/wtW:0,ytdAvgUsd:ytdUsd,ytdGrowth:ytd25j>0?(ytd26-ytd25j)/ytd25j*100:null,cfQ1,cfApr};
}

function sectorYearCost(sec,yr,forecastEts,liveEntries=null){
  const rows=RELEVANT.filter(d=>d.sector===sec);
  let cost=0;
  for(const d of rows){
    const mv=yr>=2028?(d.mv2028||0):yr===2027?(d.mv2027||0):(d.mv2026||0);
    for(let m=1;m<=12;m++){
      const mo=String(m).padStart(2,"0"),ym=`${yr}-${mo}`;
      const liveT=yr>=2026?liveEntries?.[trKey(d.cn)]?.[ym]?.[0]:null;
      const tonnes=yr>=2026?(liveT!=null?liveT:avgMonthTonnes(d.cn,mo)):getMonthTonnes(d.cn,ym);
      cost+=tonnes*mv*getQtrEts(ym,forecastEts);
    }
  }
  return cost*EUR_USD;
}

function sectorYearTonnes(sec,yr,liveEntries=null){
  const rows=RELEVANT.filter(d=>d.sector===sec);
  let tonnes=0;
  for(const d of rows){
    for(let m=1;m<=12;m++){
      const mo=String(m).padStart(2,"0"),ym=`${yr}-${mo}`;
      const liveT=yr>=2026?liveEntries?.[trKey(d.cn)]?.[ym]?.[0]:null;
      tonnes+=yr>=2026?(liveT!=null?liveT:avgMonthTonnes(d.cn,mo)):getMonthTonnes(d.cn,ym);
    }
  }
  return tonnes;
}

// ── LINE CHART COMPONENT ─────────────────────────────────────────────────────
// Data cutoff: last confirmed Comext month in 2026
const DATA_CUTOFF_YM="2026-01";
const CBAM_IDX=48; // Jan 2026 index in CHART_DATA (0 = 2022-01)
const CUT_IDX=48;  // same as CBAM_IDX while only Jan 2026 is confirmed
const TODAY_IDX=Math.round(48+3+APR_FRAC); // ~Apr 2026

const MONTH_NAMES=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function LineChart({points,onChartHover,onChartLeave,onChartClick,cutIdx=CUT_IDX,viewStartYm="2024-07",viewEndYm="2028-06"}){
  const [hov,setHov]=useState(null);
  const svgRef=useRef(null);

  const W=820,H=360,pad={l:12,r:12,t:29,b:41};
  const visibleStartIdx=Math.max(0,points.findIndex(p=>p.ym>=viewStartYm));
  const afterEndIdx=points.findIndex(p=>p.ym>viewEndYm);
  const visibleEndIdx=afterEndIdx===-1?points.length-1:Math.max(visibleStartIdx,afterEndIdx-1);
  const visiblePoints=points.slice(visibleStartIdx,visibleEndIdx+1);
  const cW=W-pad.l-pad.r,cH=H-pad.t-pad.b,n=visiblePoints.length;
  const maxY=Math.max(...visiblePoints.map(p=>p.v),0.01)*1.15;
  const xp=i=>pad.l+(n<=1?0:i/(n-1)*cW);
  const yp=v=>pad.t+cH*(1-Math.min(v/maxY,1));
  const idxFromClientX=useCallback((clientX)=>{
    const svg=svgRef.current;if(!svg||!n)return null;
    const rect=svg.getBoundingClientRect();
    const svgX=(clientX-rect.left)/rect.width*W;
    const rawI=(svgX-pad.l)/cW*(n-1);
    return visibleStartIdx+Math.max(0,Math.min(n-1,Math.round(rawI)));
  },[cW,n,pad.l,visibleStartIdx]);

  const annualTotals=useMemo(()=>{
    const totals={};
    for(const p of points){
      const year=parseInt(p.ym.slice(0,4));
      totals[year]=(totals[year]||0)+p.v;
    }
    return totals;
  },[points]);

  const getTooltip=useCallback((idx)=>{
    const p=points[idx];
    const[yr,mo]=p.ym.split("-");
    const moName=MONTH_NAMES[parseInt(mo)-1];
    const label=`${moName} ${yr}`;
    const val=`$${p.v.toFixed(2)}M`;
    const year=parseInt(yr);
    const annual=annualTotals[year]||0;
    const annualAmt=`$${annual.toFixed(1)}M`;
    const isConfirmed=idx>=CBAM_IDX&&idx<=cutIdx;
    if(idx<CBAM_IDX){
      return{label,sub:"Pre-CBAM · hypothetical",value:val,note:`${year} annual estimate: ${annualAmt}`,hlTime:`In ${year}`,hlVerb:"would have paid an estimated",hlAmt:annualAmt,year,isConfirmed:false};
    }
    if(isConfirmed){
      return{label:`${label} (confirmed)`,sub:"Actual Comext trade vol.",value:val,note:`${year} annual estimate: ${annualAmt}`,hlTime:`In ${year}`,hlVerb:"is projected to pay",hlAmt:annualAmt,year,isConfirmed:true};
    }
    if(year===2026){
      return{label,sub:"Projected (2022–25 avg trade)",value:val,note:`Est. monthly · 2026 total: ${annualAmt}`,hlTime:"In 2026",hlVerb:"is projected to pay",hlAmt:annualAmt,year,isConfirmed:false};
    }
    if(year===2027){
      return{label,sub:"Projected (2022–25 avg · 20% mark-up)",value:val,note:`Est. monthly · 2027 total: ${annualAmt}`,hlTime:"In 2027",hlVerb:"is projected to pay",hlAmt:annualAmt,year,isConfirmed:false};
    }
    return{label,sub:"Projected (2022–25 avg · 30% mark-up)",value:val,note:`Est. monthly · 2028 total: ${annualAmt}`,hlTime:"In 2028",hlVerb:"is projected to pay",hlAmt:annualAmt,year,isConfirmed:false};
  },[points,annualTotals,cutIdx]);

  const handleMouseMove=useCallback((e)=>{
    const idx=idxFromClientX(e.clientX);if(idx==null)return;
    setHov({idx,sx:e.clientX,sy:e.clientY});
    if(onChartHover){const t=getTooltip(idx);onChartHover({hlTime:t.hlTime,hlVerb:t.hlVerb,hlAmt:t.hlAmt,year:t.year,isConfirmed:t.isConfirmed});}
  },[idxFromClientX,getTooltip,onChartHover]);

  const handleClick=useCallback((e)=>{
    const idx=idxFromClientX(e.clientX);if(idx==null||!onChartClick)return;
    const t=getTooltip(idx);
    setHov({idx,sx:e.clientX,sy:e.clientY});
    onChartClick(t.year,t);
  },[idxFromClientX,getTooltip,onChartClick]);

  const pathFrom=(startIdx,endIdx)=>{
    const s=Math.max(startIdx,visibleStartIdx);
    const e=Math.min(endIdx,visibleEndIdx);
    if(e<s)return null;
    return points.slice(s,e+1).map((p,i)=>{
      const idx=s+i;
      return `${i===0?"M":"L"}${xp(idx-visibleStartIdx).toFixed(1)},${yp(p.v).toFixed(1)}`;
    }).join(" ");
  };

  // Three path segments inside the visible 2024 H2-2028 window.
  const histD=pathFrom(visibleStartIdx,CBAM_IDX);
  const solidD=pathFrom(CBAM_IDX,cutIdx+1);
  const foreD=pathFrom(cutIdx,visibleEndIdx);

  const cbamX=CBAM_IDX>=visibleStartIdx&&CBAM_IDX<=visibleEndIdx?xp(CBAM_IDX-visibleStartIdx):null;
  const todayX=TODAY_IDX>=visibleStartIdx&&TODAY_IDX<=visibleEndIdx?xp(TODAY_IDX-visibleStartIdx):null;
  const yearMarks=[
    {label:"2024 H2",idx:visibleStartIdx},
    ...[2025,2026,2027,2028].map(y=>({label:String(y),idx:(y-2022)*12})),
  ].filter(m=>m.idx>=visibleStartIdx&&m.idx<=visibleEndIdx);
  const tip=hov?getTooltip(hov.idx):null;

  return(
    <div style={{position:"relative"}}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block",cursor:"crosshair"}}
           role="img" aria-label="Line chart showing estimated monthly CBAM costs for US exports to the EU from mid-2024 through 2028. Solid line shows confirmed trade data; dashed teal line shows projected costs. Hover or click to explore by month or year."
           onMouseMove={handleMouseMove} onMouseLeave={()=>{setHov(null);if(onChartLeave)onChartLeave();}} onClick={handleClick}>
        <title>US CBAM Exposure — Estimated Monthly Cost, 2024–2028</title>
        {/* CBAM start vertical marker */}
        {cbamX!=null&&(
          <>
            <line x1={cbamX} y1={pad.t} x2={cbamX} y2={H-pad.b} stroke={N.orange400} strokeWidth={2.2} strokeDasharray="6,5" opacity={0.7}/>
            <text x={cbamX+7} y={pad.t+16} fill={N.orange400} fontSize={14} fontFamily={SANS} fontWeight={700}>CBAM start</text>
          </>
        )}
        {/* Today vertical marker */}
        {todayX!=null&&(
          <>
            <line x1={todayX} y1={pad.t} x2={todayX} y2={H-pad.b} stroke={N.teal400} strokeWidth={2.2} opacity={0.7}/>
            <text x={todayX+7} y={pad.t+34} fill={N.teal400} fontSize={14} fontFamily={SANS} fontWeight={700}>Today</text>
          </>
        )}
        {/* Forecast dashed (drawn first, solid on top) */}
        {foreD&&<path d={foreD} fill="none" stroke={N.teal600} strokeWidth={4.1} strokeLinejoin="round" strokeDasharray="16,10" opacity={0.75}/>}
        {/* Historical dashed */}
        {histD&&<path d={histD} fill="none" stroke={N.tealMid} strokeWidth={3.4} strokeLinejoin="round" strokeDasharray="7,8"/>}
        {/* Solid (confirmed CBAM data) */}
        {solidD&&<path d={solidD} fill="none" stroke={N.teal600} strokeWidth={5} strokeLinejoin="round"/>}
        {/* Year labels */}
        {yearMarks.map(({label,idx})=>(
          <text key={label} x={xp(idx-visibleStartIdx)} y={H-8} textAnchor="middle" fill={label==="2026"?N.teal200:N.tealMid} fontSize={16} fontFamily={SANS} fontWeight={label==="2026"?700:500}>{label}</text>
        ))}
        {/* Legend */}
        <g transform={`translate(${W-198},${pad.t})`}>
          <line x1={0} y1={10} x2={34} y2={10} stroke={N.tealMid} strokeWidth={3.4} strokeDasharray="7,8"/>
          <text x={41} y={16} fill={N.tealMid} fontSize={13} fontFamily={SANS}>2024 H2–25 est.</text>
          <line x1={0} y1={31} x2={34} y2={31} stroke={N.teal600} strokeWidth={5}/>
          <text x={41} y={37} fill={N.tealMid} fontSize={13} fontFamily={SANS}>Confirmed data</text>
          <line x1={0} y1={53} x2={34} y2={53} stroke={N.teal600} strokeWidth={4.1} strokeDasharray="16,10"/>
          <text x={41} y={59} fill={N.tealMid} fontSize={13} fontFamily={SANS}>Projected</text>
        </g>
        {/* Hover dot */}
        {hov!=null&&(
          <circle cx={xp(hov.idx-visibleStartIdx)} cy={yp(points[hov.idx].v)} r={7.8} fill={N.teal600} stroke={N.white} strokeWidth={2.4}/>
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
          {onChartClick&&<div style={{fontSize:10,color:N.teal400,marginTop:5,borderTop:`1px solid rgba(255,255,255,0.08)`,paddingTop:4}}>Click to select year</div>}
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
      tabIndex={0} role="button" aria-pressed={active} aria-label={label}
      style={{display:"inline-block",cursor:"pointer",borderRadius:4,padding:"4px 10px",border:`2px solid ${active?color:N.tealLight}`,background:active?"rgba(255,255,255,0.12)":"transparent",color:active?color:N.white,transition:"all 0.15s",...style}}
      onMouseEnter={()=>setHovered(id)} onMouseLeave={()=>setHovered(null)}
      onFocus={()=>setHovered(id)} onBlur={()=>setHovered(null)}
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
function SectorModal({sec,ets,liveEntries,onClose}){
  const info=SECTOR_INFO[sec]||{desc:"",extra:""};
  const color=SC[sec]||N.teal600;
  const lightColor=SCL[sec]||N.teal400;
  const closeRef=useRef(null);
  useEffect(()=>{if(closeRef.current)closeRef.current.focus();},[]);
  useEffect(()=>{
    const h=e=>{if(e.key==="Escape")onClose();};
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[onClose]);

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
      // Jan growth 2026 vs 2025 (only confirmed month); prefer live data
      const _k=trKey(d.cn);
      const jan26Eur=liveEntries?.[_k]?.["2026-01"]?.[1]??(TRADE[_k]?.["2026-01"]?.[1]??0);
      const jan25Eur=TRADE[_k]?.["2025-01"]?.[1]??0;
      const ytdGrowth=jan25Eur>0?(jan26Eur-jan25Eur)/jan25Eur*100:null;
      // CBAM Q1: use actual Jan 2026 live data if available, else 4yr avg
      const jan26T=liveEntries?.[_k]?.["2026-01"]?.[0]??getMonthTonnes(d.cn,"2026-01");
      const cfQ1=((jan26T>0?jan26T:avgMonthTonnes(d.cn,"01"))+avgMonthTonnes(d.cn,"02")+avgMonthTonnes(d.cn,"03"))*mv;
      const taxQ1=cfQ1*Q1_ETS*EUR_USD;
      // CBAM through today
      const cfApr=avgMonthTonnes(d.cn,"04")*mv*APR_FRAC;
      const taxToday=(cfQ1*Q1_ETS+cfApr*ets)*EUR_USD;
      // Cost trajectory (using forecast ets for simplicity)
      const mvFn=mvk=>RELEVANT.find(x=>x.cn===d.cn)?.[mvk]||0;
      const traj=(mvk)=>[1,2,3,4,5,6,7,8,9,10,11,12].reduce((s,m)=>s+avgMonthTonnes(d.cn,String(m).padStart(2,"0"))*mvFn(mvk),0)*ets*EUR_USD;
      return{cn:d.cn,desc:d.desc,total:d.total,mv2026:d.mv2026,annT,ytdAvgUsd,ytdGrowth,taxQ1,taxToday,c2026:traj("mv2026"),c2027:traj("mv2027"),c2028:traj("mv2028")};
    }).sort((a,b)=>b.taxToday-a.taxToday);
  },[sec,ets,liveEntries]);

  const totT=cnRows.reduce((s,r)=>s+r.annT,0);
  const totYtd=cnRows.reduce((s,r)=>s+r.ytdAvgUsd,0);
  const totToday=cnRows.reduce((s,r)=>s+r.taxToday,0);
  const tot26=cnRows.reduce((s,r)=>s+r.c2026,0);
  const tot27=cnRows.reduce((s,r)=>s+r.c2027,0);
  const tot28=cnRows.reduce((s,r)=>s+r.c2028,0);

  if(!sec)return null;

  return(
    <>
      <div onClick={onClose} aria-hidden="true" style={{position:"fixed",inset:0,background:"rgba(12,42,48,0.75)",zIndex:300}}/>
      <div role="dialog" aria-modal="true" aria-label={`${sec} sector detail`}
        style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
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
          <button ref={closeRef} onClick={onClose} aria-label="Close sector detail" style={{background:"none",border:"none",color:N.tealLight,fontSize:24,cursor:"pointer",lineHeight:1,padding:"4px 8px"}}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{overflowY:"auto",flex:1,padding:"16px 16px 24px"}}>

          {/* Description */}
          <p style={{fontFamily:SANS,fontSize:14,color:N.tealLight,lineHeight:1.65,margin:"0 0 6px"}}>{info.desc}</p>
          <p style={{fontFamily:SANS,fontSize:13,color:N.tealMid,lineHeight:1.6,margin:"0 0 20px",fontStyle:"italic"}}>{info.extra}</p>

          {/* KPI cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
            {[
              {label:"Proj. Annual Tonnes",val:fmtKt(totT),sub:"2022–25 avg basis"},
              {label:"YTD Avg Trade Value",val:fmtM(totYtd),sub:"Jan–Apr avg · 4-year avg"},
              {label:"CBAM through Apr 28",val:fmtM(totToday),sub:"Q1 confirmed + forecast"},
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
            <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
              {[
                {year:"2026",cost:tot26,markup:sec==="Fertilisers"?"1%":"10%",col:N.orange400},
                {year:"2027",cost:tot27,markup:sec==="Fertilisers"?"1%":"20%",col:N.orange500},
                {year:"2028",cost:tot28,markup:sec==="Fertilisers"?"1%":"30%",col:"#c0392b"},
              ].map(({year,cost,markup,col})=>(
                <div key={year} style={{flex:"1 1 120px",background:"rgba(255,255,255,0.04)",borderRadius:4,padding:"12px 14px",borderTop:`3px solid ${col}`}}>
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
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>Default Value<br/>(tCO₂e/t)</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>Proj. 2026<br/>Tonnes</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>YTD Avg<br/>Trade (4yr)</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>Jan Growth<br/>2026 vs 2025</th>
                  <th style={{padding:"8px 10px",textAlign:"right",color:N.teal400,fontWeight:700,whiteSpace:"nowrap"}}>CBAM YTD</th>
                </tr>
              </thead>
              <tbody>
                {cnRows.map((r,i)=>{
                  const gr=r.ytdGrowth;
                  const gCol=gr==null?N.tealMid:gr>2?N.teal400:gr<-2?N.orange400:N.tealMid;
                  const gArr=gr==null?"":gr>2?"↑":gr<-2?"↓":"→";
                  return(
                    <tr key={r.cn} style={{borderBottom:`1px solid rgba(255,255,255,0.06)`,background:i%2===0?"transparent":"rgba(255,255,255,0.03)"}}>
                      <td style={{padding:"8px 10px",color:lightColor,fontWeight:700,fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{r.cn}</td>
                      <td style={{padding:"8px 10px",color:N.tealLight,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.desc}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:N.tealMid}}>{r.total!=null?r.total.toFixed(2):"—"}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:N.white}}>{fmtT(r.annT)}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:N.tealLight}}>{fmtM(r.ytdAvgUsd)}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:gCol}}>{gr==null?"—":`${gArr} ${pct(gr)}`}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:N.white}}>{fmtM(r.taxToday)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{background:"rgba(255,255,255,0.08)",fontWeight:700}}>
                  <td colSpan={3} style={{padding:"8px 10px",color:N.teal400}}>Total</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.white}}>{fmtT(totT)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.tealLight}}>{fmtM(totYtd)}</td>
                  <td/>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.white}}>{fmtM(totToday)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{marginTop:8,fontFamily:SANS,fontSize:11,color:N.tealMid}}>
            Sorted by CBAM exposure. YTD = Jan–Apr 28, 2026 partial. Jan growth compares Jan 2026 vs Jan 2025. Trajectory uses €{ets.toFixed(0)}/tCO₂e for all months (indicative).
          </div>
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
          padding:"0 22px 2px 0",cursor:"pointer",
          WebkitAppearance:"none",MozAppearance:"none",appearance:"none"}}>
        {options.map(y=><option key={y} value={y}>{y==="today"?"Today":y}</option>)}
      </select>
      <span style={{position:"absolute",right:2,top:"50%",transform:"translateY(-50%)",color:c,fontSize:"0.7em",pointerEvents:"none",lineHeight:1}}>▾</span>
    </span>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function V3App(){
  const [ets,setEts]=useState(ETS_PRICES.default||75.36);
  const [hovered,setHovered]=useState(null);
  const [rangeStart,setRangeStart]=useState(2026);
  const [rangeEnd,setRangeEnd]=useState("today");
  const [vw,setVw]=useState(typeof window!=="undefined"?window.innerWidth:1280);
  useEffect(()=>{const h=()=>setVw(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const isMobile=vw<640;
  const isTablet=vw<1024;
  const [chartHover,setChartHover]=useState(null);
  const [chartHoverPinned,setChartHoverPinned]=useState(false);
  const [chartPinnedYear,setChartPinnedYear]=useState(null);
  const [hoveredSector,setHoveredSector]=useState(null);
  const [selectedSector,setSelectedSector]=useState(null);

  // ── LIVE COMEXT FETCH ────────────────────────────────────────────────────────
  const [liveData,setLiveData]=useState(null);
  const [fetchStatus,setFetchStatus]=useState("idle");
  const fetchedRef=useRef(false);

  const fetchComext=useCallback(async()=>{
    if(fetchedRef.current)return;
    fetchedRef.current=true;
    setFetchStatus("loading");
    const BASE="https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/data/DS-045409";
    const QUERIES={"Iron & Steel":"2601+7201+7202+7203+7205+7206+7208+7209+7210+7211+7212+7213+7214+7215+7216+7217+7218+7219+7221+7223+7224+7225+7301+7302+7303+7304+7305+7306+7307+7308+7309+7310+7311+7318+7326","Aluminium":"7601+7603+7604+7605+7606+7607+7608+7609+7610+7611+7612+7613+7614+7616","Fertilisers":"2808+2814+2834+3102+3105","Hydrogen":"28041000","Cement":"2507+2523"};
    const raw={};let gotAny=false;
    for(const codes of Object.values(QUERIES)){
      try{
        const r=await fetch(`${BASE}/M.EU27_2020.US.${codes}.1./?format=SDMX-CSV&startPeriod=2026-01&endPeriod=2026-12`,{signal:AbortSignal.timeout(15000)});
        if(!r.ok)continue;
        const txt=await r.text();
        const lines=txt.split("\n").filter(l=>l.trim());
        const hdrLine=lines.find(l=>l.startsWith("DATAFLOW"));
        if(!hdrLine)continue;
        const hdrs=hdrLine.split(",").map(h=>h.trim().replace(/"/g,"").toLowerCase());
        const iInd=hdrs.indexOf("indicators"),iVal=hdrs.indexOf("obs_value"),iPer=hdrs.indexOf("time_period"),iProd=hdrs.indexOf("product");
        if(iInd<0||iVal<0||iPer<0||iProd<0)continue;
        for(const line of lines.filter(l=>!l.startsWith("DATAFLOW"))){
          const c=line.split(",").map(x=>x.trim().replace(/"/g,""));
          const ind=c[iInd],ym=c[iPer],cn=c[iProd],val=parseFloat(c[iVal]);
          if(!cn||!ym||isNaN(val)||val<=0)continue;
          const norm=cn.replace(/\s/g,"");
          let key=CN_MAP[norm]||norm;
          // Fallback: if not in TRADE, try 4-digit prefix (aggregate sub-codes)
          if(!TRADE[key]){const k4=norm.slice(0,4);if(TRADE[k4])key=k4;}
          if(!raw[key])raw[key]={};
          if(!raw[key][ym])raw[key][ym]=[0,0];
          if(ind==="QUANTITY_IN_100KG"){raw[key][ym][0]+=val/10;gotAny=true;}
          if(ind==="VALUE_IN_EUROS")raw[key][ym][1]+=val;
        }
      }catch{/* network or parse error */}
    }
    setLiveData({entries:raw,gotAny});
    setFetchStatus("done");
  },[]);

  useEffect(()=>{fetchComext();},[fetchComext]);

  // Merge live API data with static baseline; null if nothing fetched yet
  const mergedTrade=useMemo(()=>liveData?.gotAny?liveData.entries:null,[liveData]);

  // Per-sector YTD cost factors using actual Jan 2026 trade where available
  const ytdCostFactors=useMemo(()=>{
    const f={};
    for(const sec of SECTORS_LIST){
      const s=SECTOR_STATS[sec];
      const rows=RELEVANT.filter(d=>d.sector===sec);
      let cfQ1=0;
      for(const d of rows){
        const mv=d.mv2026||0,k=trKey(d.cn);
        const jan26T=mergedTrade?.[k]?.["2026-01"]?.[0];
        cfQ1+=(jan26T>0?jan26T:avgMonthTonnes(d.cn,"01"))*mv;
        cfQ1+=avgMonthTonnes(d.cn,"02")*mv;
        cfQ1+=avgMonthTonnes(d.cn,"03")*mv;
      }
      f[sec]={cfQ1,cfApr:s.cfApr};
    }
    return f;
  },[mergedTrade]);

  // Chart factor overrides for months with confirmed live data
  const liveChartOverrides=useMemo(()=>{
    if(!mergedTrade)return{};
    const confirmedYms=new Set(Object.values(mergedTrade).flatMap(m=>Object.keys(m)).filter(ym=>ym>="2026-01"));
    const ov={};
    for(const ym of confirmedYms){
      const mo=ym.split("-")[1];
      let factor=0;
      for(const d of RELEVANT){
        const k=trKey(d.cn),mv=d.mv2026||0;
        const liveT=mergedTrade[k]?.[ym]?.[0];
        factor+=(liveT!=null?liveT:avgMonthTonnes(d.cn,mo))*mv;
      }
      if(factor>0)ov[ym]=factor;
    }
    return ov;
  },[mergedTrade]);

  // Latest confirmed month index for line chart solid segment
  const liveDataCutIdx=useMemo(()=>{
    const yms=Object.keys(liveChartOverrides);
    if(!yms.length)return CUT_IDX;
    const latest=yms.sort().at(-1);
    const idx=CHART_DATA.findIndex(p=>p.ym===latest);
    return idx>CUT_IDX?idx:CUT_IDX;
  },[liveChartOverrides]);

  // Confirmed months list for caption display
  const liveMonths=useMemo(()=>Object.keys(liveChartOverrides).sort(),[liveChartOverrides]);

  // Chart: monthly costs applying ETS prices, with live overrides for confirmed months
  const chartPoints=useMemo(()=>CHART_DATA.map(m=>({...m,v:(liveChartOverrides[m.ym]??m.factor)*getQtrEts(m.ym,ets)*EUR_USD/1e6})),[ets,liveChartOverrides]);

  // Table rows
  const tableRows=useMemo(()=>SECTORS_LIST.map(sec=>{
    const s=SECTOR_STATS[sec];
    const{cfQ1,cfApr}=ytdCostFactors[sec];
    return{sec,...s,taxQ1:cfQ1*Q1_ETS*EUR_USD,taxToday:(cfQ1*Q1_ETS+cfApr*ets)*EUR_USD};
  }),[ets,ytdCostFactors]);

  const totTaxToday=tableRows.reduce((s,r)=>s+r.taxToday,0);
  const activeSectorYear=chartHover?.year??chartPinnedYear;
  const isHoverConfirmed=chartHover?.isConfirmed??false;
  // Confirmed 2026 hover keeps YTD display (null = default); projected 2026 hover shows full-year estimate
  const activeTableYear=(activeSectorYear&&!(activeSectorYear===2026&&isHoverConfirmed))?activeSectorYear:null;
  const displayTableRows=useMemo(()=>tableRows.map(r=>{
    if(!activeTableYear)return{...r,displayTonnes:r.annT,displayCbam:r.taxToday};
    return{
      ...r,
      displayTonnes:sectorYearTonnes(r.sec,activeTableYear,mergedTrade),
      displayCbam:sectorYearCost(r.sec,activeTableYear,ets,mergedTrade),
    };
  }),[tableRows,activeTableYear,ets,mergedTrade]);
  const displayTableTonnesTotal=displayTableRows.reduce((s,r)=>s+r.displayTonnes,0);
  const displayTableCbamTotal=displayTableRows.reduce((s,r)=>s+r.displayCbam,0);
  const tonnesColumnLabel=activeTableYear
    ?`${activeTableYear>=2026?"Proj.":"Act."} ${activeTableYear} Tonnes`
    :"Proj. 2026 Tonnes";
  const cbamColumnLabel=activeTableYear
    ?(activeTableYear<2026
      ?`Hyp. CBAM in ${activeTableYear}`
      :`CBAM exposure (est.) in ${activeTableYear}`)
    :"CBAM through Apr 28, 2026";

  // Sector proportions for right panel
  const sectorAnnCosts=useMemo(()=>{
    const yr=activeSectorYear;
    const items=SECTORS_LIST.map(sec=>{
      let cost;
      if(yr){cost=sectorYearCost(sec,yr,ets,mergedTrade);}
      else{const{cfQ1,cfApr}=ytdCostFactors[sec];cost=(cfQ1*Q1_ETS+cfApr*ets)*EUR_USD;}
      return{sec,cost};
    });
    const tot=items.reduce((s,d)=>s+d.cost,0);
    return items.map(d=>({...d,pct:tot>0?d.cost/tot*100:0})).sort((a,b)=>b.pct-a.pct);
  },[ets,activeSectorYear,mergedTrade,ytdCostFactors]);

  // Mark-up phase-in % for table column
  const markupPct=(sec)=>{
    if(sec==="Fertilisers")return"1%";
    const eEnd=rangeEnd==="today"?2026:rangeEnd;
    const startPct=rangeStart<=2026?10:rangeStart===2027?20:30;
    const endPct=eEnd<=2026?10:eEnd===2027?20:30;
    return startPct===endPct?`${startPct}%`:`${startPct}–${endPct}%`;
  };

  // Headline amounts by year range
  const {hlVerb,hlAmt}=useMemo(()=>{
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

  const handleChartHover=useCallback((info)=>{
    if(!chartHoverPinned)setChartHover(info);
  },[chartHoverPinned]);

  const handleChartLeave=useCallback(()=>{
    setChartHover(null);
  },[]);

  const handleChartClick=useCallback((yr)=>{
    setRangeStart(yr);
    setRangeEnd(yr);
    setChartHover(null);
    setChartPinnedYear(yr);
    setChartHoverPinned(true);
  },[]);

  const clearChartPinnedYear=useCallback(()=>{
    setChartPinnedYear(null);
    setChartHoverPinned(false);
    setChartHover(null);
  },[]);

  return(
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Neuton:wght@400;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;}html,body,#root{margin:0;min-height:100%;width:100%;max-width:100%;}body{background:${N.teal900};overflow-x:hidden;}:focus-visible{outline:2px solid ${N.teal400};outline-offset:2px;}`}</style>

      <div style={{fontFamily:SANS,minHeight:"100vh",color:N.teal900,width:"100%",margin:0,background:N.teal900}}>

        {/* MOBILE-ONLY: title at top */}
        {isMobile&&(
          <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${N.teal800}`}}>
            <div style={{fontFamily:SANS,fontSize:16,fontWeight:700,color:N.white,letterSpacing:"0.01em",marginBottom:3}}>US CBAM Exposure Dashboard <span style={{fontWeight:400,color:N.tealMid,fontSize:11}}>(Beta)</span></div>
            <div style={{fontFamily:SANS,fontSize:10,color:N.tealMid,lineHeight:1.5,marginBottom:2}}>Estimated costs for US exporters under the EU CBAM default values</div>
            <div style={{fontFamily:SANS,fontSize:10,color:N.tealMid,lineHeight:1.5,marginBottom:2}}>A.K.A. Forgone revenue for the federal government</div>
            <div style={{fontFamily:SANS,fontSize:10,color:N.tealMid}}>Author: Jia-Shen Tsai, Niskanen Center</div>
          </div>
        )}

        {/* TOP SECTION */}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTablet?"1fr 300px":"1fr 380px",gap:0,borderBottom:`1px solid ${N.teal800}`,background:N.teal900,position:"relative",width:"100%"}}>
          {/* LEFT: Headline + Chart */}
          <div style={{padding:isMobile?"10px 16px 0":"10px 28px 0",background:"transparent",position:"relative",zIndex:1,display:"flex",flexDirection:"column",minHeight:isMobile?0:560}}>
            {/* Eyebrow: inline year selects (or hover override) */}
            <div style={{margin:"0 0 10px",height:isMobile?undefined:"clamp(46px,5vw,58px)",minHeight:isMobile?36:undefined,fontSize:isMobile?22:"clamp(32px,4vw,45px)",fontWeight:700,color:N.teal400,fontFamily:SANS,letterSpacing:0,lineHeight:1,display:"flex",alignItems:"center",flexWrap:"nowrap",gap:"0 8px",flexShrink:0}}>
              {chartHover?(
                <span style={{fontFamily:SANS,fontSize:isMobile?22:"clamp(32px,4vw,45px)",fontWeight:700,lineHeight:1,letterSpacing:0}}>{chartHover.hlTime}</span>
              ):(
                <>
                  <span>From{" "}</span>
                  <InlineSelect value={rangeStart} onChange={v=>{clearChartPinnedYear();setRangeStart(v);if(v<=2025){if(rangeEnd==="today"||rangeEnd>2025||rangeEnd<v)setRangeEnd(v);}else{if(rangeEnd!=="today"&&rangeEnd<v)setRangeEnd(v);}}} options={[2022,2023,2024,2025,2026,2027,2028]} color={N.teal400}/>
                  <span>{" "}to{" "}</span>
                  <InlineSelect value={rangeEnd} onChange={v=>{clearChartPinnedYear();setRangeEnd(v);}} options={rangeStart<=2025?[2022,2023,2024,2025].filter(y=>y>=rangeStart):[...[2026,2027,2028].filter(y=>y>=rangeStart),"today"]} color={N.teal400}/>
                </>
              )}
            </div>
            <div style={{margin:"0 0 6px",fontFamily:SERIF,fontSize:isMobile?"clamp(28px,8vw,34px)":"clamp(43px,6vw,77px)",fontWeight:400,lineHeight:isMobile?1.08:0.98,letterSpacing:isMobile?"-0.02em":undefined,color:N.white}}>
              The US{" "}
              <span style={{color:N.teal400}}>{chartHover?chartHover.hlVerb:hlVerb}</span>{" "}
              <span style={{color:N.orange500,whiteSpace:"nowrap"}}>{chartHover?chartHover.hlAmt:hlAmt}</span>{" "}
              to the EU
            </div>
            <div style={{margin:"0 0 8px",fontFamily:SANS,fontSize:isMobile?14:"clamp(18px,2vw,23px)",fontWeight:400,lineHeight:1.4,color:N.tealMid}}>
              for exporting emission&#8209;intensive products.
            </div>
            <div style={{marginTop:"auto"}}>
              <LineChart points={chartPoints} onChartHover={handleChartHover} onChartLeave={handleChartLeave} viewStartYm="2024-07" onChartClick={handleChartClick} cutIdx={liveDataCutIdx}/>
              <p style={{margin:"2px 0 0",fontFamily:SANS,fontSize:12,color:N.tealMid}}>
                Estimated CBAM cost per month ($M) · Gray dashed = 2024 H2–25 est. · Solid = confirmed · Teal dashed = projected
                {fetchStatus==="loading"&&<span style={{color:N.teal400}}> · Fetching live 2026 data…</span>}
                {fetchStatus==="done"&&liveMonths.length>0&&<span style={{color:N.teal400}}> · Live: {liveMonths.join(", ")}</span>}
                {fetchStatus==="done"&&liveMonths.length===0&&<span style={{color:N.tealMid}}> · (live 2026 data not yet available)</span>}
              </p>
            </div>
          </div>

          {/* RIGHT: ETS + Sector panel */}
          <div style={{background:N.teal900,color:N.white,padding:isMobile?"16px 16px 24px":isTablet?"12px 20px 24px 16px":"12px 28px 24px 24px",display:"flex",flexDirection:"column",gap:20,position:"relative",zIndex:1,borderTop:isMobile?`1px solid ${N.teal800}`:"none"}}>
            {/* Dashboard title — hidden on mobile (shown above the grid instead) */}
            {!isMobile&&(
              <div style={{paddingBottom:4,textAlign:"right"}}>
                <div style={{fontFamily:SANS,fontSize:16,fontWeight:700,color:N.white,letterSpacing:"0.01em",marginBottom:3}}>US CBAM Exposure Dashboard <span style={{fontWeight:400,color:N.tealMid,fontSize:11}}>(Beta)</span></div>
                <div style={{fontFamily:SANS,fontSize:10,color:N.tealMid,lineHeight:1.5,marginBottom:2}}>Estimated costs for US exporters under the EU CBAM default values</div>
                <div style={{fontFamily:SANS,fontSize:10,color:N.tealMid,lineHeight:1.5,marginBottom:2}}>A.K.A. Forgone revenue for the federal government</div>
                <div style={{fontFamily:SANS,fontSize:10,color:N.tealMid}}>Author: Jia-Shen Tsai, Niskanen Center</div>
              </div>
            )}
            {/* ETS Price */}
            <div>
              <div style={{fontFamily:SANS,fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:N.teal400,textTransform:"uppercase",marginBottom:10}}>EU ETS Carbon Price</div>
              <div style={isMobile?{display:"flex",gap:8}:{}}>
                <div style={{flex:isMobile?"1 1 0":undefined,background:"rgba(255,255,255,0.06)",borderRadius:4,padding:"12px 14px",marginBottom:isMobile?0:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}>
                    <span style={{fontFamily:SANS,fontSize:13,color:N.tealMid}}>Q1 2026 (confirmed)</span>
                    <span style={{fontFamily:SERIF,fontSize:20,fontWeight:700,color:N.teal200}}>€{Q1_ETS.toFixed(2)}</span>
                  </div>
                  {!isMobile&&<div style={{fontSize:12,color:N.tealMid,marginTop:2}}>Official CBAM certificate price, EU Commission</div>}
                </div>
                <div style={{flex:isMobile?"1 1 0":undefined,background:"rgba(255,255,255,0.06)",borderRadius:4,padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8,flexWrap:"wrap",gap:4}}>
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
            </div>

            {/* Sector breakdown */}
            <div>
              <div style={{fontFamily:SANS,fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:N.teal400,textTransform:"uppercase",marginBottom:10}}>{activeSectorYear?`${activeSectorYear} `:"YTD "}CBAM Exposure by Sector</div>
              <div style={{fontSize:12,color:N.tealMid,marginBottom:10}}>{activeSectorYear?(activeSectorYear<2026?`${activeSectorYear} hypothetical`:`${activeSectorYear} projected`):"YTD · Jan–Apr"} · at €{ets.toFixed(0)}</div>
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
            <table style={{width:"100%",minWidth:isMobile?520:860,borderCollapse:"collapse",fontFamily:SANS,fontSize:isMobile?13:15,tableLayout:"fixed"}}>
              <colgroup>
                <col style={{width:"20%"}}/>
                <col style={{width:"20%"}}/>
                <col style={{width:"20%"}}/>
                <col style={{width:"12%"}}/>
                <col style={{width:"22%"}}/>
                <col style={{width:"6%"}}/>
              </colgroup>
              <thead>
                <tr style={{background:N.teal900,color:N.white,verticalAlign:"bottom"}}>
                  <th style={{padding:isMobile?"8px 8px":"8px 12px",textAlign:"left",fontWeight:700,fontSize:isMobile?13:16}}>Sector</th>
                  <th style={{padding:"8px 8px",textAlign:"right",fontWeight:700,fontSize:isMobile?13:16,...colHl("tonnes")}}>{tonnesColumnLabel}</th>
                  <th style={{padding:"8px 8px",textAlign:"right",fontWeight:700,fontSize:isMobile?13:16,...colHl("dv")}}>Default Value<br/>(tCO₂e/t)</th>
                  <th style={{padding:"8px 8px",textAlign:"right",fontWeight:700,fontSize:isMobile?13:16,...colHl("markup")}}>Mark-up %</th>
                  <th style={{padding:"8px 8px",textAlign:"right",fontWeight:700,fontSize:isMobile?13:16,borderLeft:`3px solid rgba(125,206,218,0.3)`,background:"rgba(52,131,151,0.4)"}}>{cbamColumnLabel}</th>
                  <th style={{padding:"8px 8px",color:N.tealMid,fontSize:isMobile?12:14,textAlign:"center"}}>detail</th>
                </tr>
              </thead>
              <tbody>
                {displayTableRows.map((r,i)=>(
                  <tr key={r.sec} tabIndex={0} role="button" aria-label={`Open ${r.sec} sector detail`}
                    style={{background:i%2===0?N.white:N.tealPale,borderBottom:`1px solid ${N.tealLight}`,cursor:"pointer"}}
                    onClick={()=>setSelectedSector(r.sec)}
                    onKeyDown={e=>(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),setSelectedSector(r.sec))}>
                    <td style={{padding:isMobile?"9px 8px":"9px 12px",fontSize:isMobile?14:17,fontWeight:800,color:SC[r.sec],borderLeft:`4px solid ${SC[r.sec]}`,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.sec}</td>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:isMobile?13:16,fontWeight:700,color:N.teal900,fontVariantNumeric:"tabular-nums",...colHl("tonnes")}}>{fmtT(r.displayTonnes)}</td>
                    <td style={{padding:"9px 8px",color:N.teal800,textAlign:"right",...colHl("dv")}}>
                      {isMobile?(
                        <span style={{fontSize:13,fontWeight:700,color:N.teal900,fontVariantNumeric:"tabular-nums"}}>{r.wDv>0?r.wDv.toFixed(3):"—"}</span>
                      ):(
                        <span style={{display:"inline-grid",gridTemplateColumns:"78px 52px",alignItems:"center",columnGap:4,whiteSpace:"nowrap"}}>
                          <DefaultValueMeter value={r.wDv} extreme={r.sec==="Hydrogen"}/>
                          <span style={{fontSize:16,fontWeight:700,color:N.teal900,fontVariantNumeric:"tabular-nums",textAlign:"right"}}>{r.wDv>0?r.wDv.toFixed(3):"—"}</span>
                        </span>
                      )}
                    </td>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:isMobile?13:16,fontWeight:700,color:N.teal800,...colHl("markup")}}>{markupPct(r.sec)}</td>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:isMobile?13:16,fontWeight:800,color:N.teal800,borderLeft:`3px solid ${N.tealLight}`,background:"rgba(61,131,151,0.04)",fontVariantNumeric:"tabular-nums"}}>{fmtM(r.displayCbam)}</td>
                    <td style={{padding:"9px 8px",textAlign:"center",color:N.teal800,fontSize:isMobile?13:16}} aria-hidden="true">›</td>
                  </tr>
                ))}
                <tr style={{background:N.teal900,color:N.white,fontWeight:700}}>
                  <td style={{padding:"9px 12px",fontSize:16}}>Total</td>
                  <td style={{padding:"9px 8px",textAlign:"right",fontSize:16,fontVariantNumeric:"tabular-nums"}}>{fmtT(displayTableTonnesTotal)}</td>
                  <td colSpan={2} style={{padding:"9px 8px",textAlign:"center",color:N.tealMid,fontSize:13}}>(weighted avg)</td>
                  <td style={{padding:"9px 8px",textAlign:"right",fontSize:16,borderLeft:`3px solid rgba(125,206,218,0.25)`,fontVariantNumeric:"tabular-nums"}}>{fmtM(displayTableCbamTotal)}</td>
                  <td/>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{padding:"6px 16px 8px",fontFamily:SANS,fontSize:12,color:N.tealMid}}>
            Click any sector row for CN-code breakdown. Hover the line chart to shift the tonnage and CBAM exposure columns by year. Projected trade uses 2022–25 monthly averages where live data is unavailable.
          </div>
        </div>
        {/* FORMULA */}
        <div style={{background:N.teal900,padding:isMobile?"24px 16px 60px":"32px 28px 72px",position:"relative"}}>
          <div style={{fontFamily:SANS,fontSize:12,fontWeight:700,letterSpacing:"0.12em",color:N.teal400,textTransform:"uppercase",marginBottom:16}}>CBAM Cost Formula</div>
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


      </div>

      {selectedSector&&<SectorModal sec={selectedSector} ets={ets} liveEntries={mergedTrade} onClose={()=>setSelectedSector(null)}/>}
    </>
  );
}
