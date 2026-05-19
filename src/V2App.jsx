import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import ETS_PRICES from "./data/ets_prices.json";
import { TRADE } from "./data/tradeData.js";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const N={teal900:"#0c2a30",teal800:"#194852",teal600:"#348397",teal400:"#7dceda",teal200:"#b7f6fc",tealMid:"#78a0a3",tealLight:"#d0dbdd",tealPale:"#edf1f2",white:"#ffffff",yellow200:"#fef0c7",yellow600:"#bca45e",yellow900:"#52482a",orange400:"#f17d3a",orange500:"#da5831",green200:"#D7f881",green600:"#709628",green900:"#2c3811",purple200:"#e0c6fc",purple600:"#8655b2"};
const SERIF="'Neuton',Georgia,serif";
const SANS="'Hanken Grotesk','Inter',sans-serif";
const EUR_USD=1.13;
const Q1_ETS=ETS_PRICES.quarterly["2026-Q1"]||75.36;
const FORECAST_FROM="Apr 2026";         // ← update together when next quarter is confirmed
const ETS_CONFIRMED_THROUGH="Mar 2026"; // ← update together with FORECAST_FROM
const SECTORS_LIST=["Iron & Steel","Aluminum","Cement","Fertilizers","Hydrogen"];
const SC={"Iron & Steel":"#b05c38","Aluminum":"#348397","Cement":"#bca45e","Fertilizers":"#709628","Hydrogen":"#8655b2"};
const SCL={"Iron & Steel":"#f0c4a8","Aluminum":"#b7f6fc","Cement":"#fef0c7","Fertilizers":"#D7f881","Hydrogen":"#e0c6fc"};
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
  ["2808 00 00","Nitric acid","Fertilizers","1,870","0,030","1,900","1,919","1,919","1,919",""],
  ["2814 10 00","Anhydrous ammonia","Fertilizers","3,320","0,090","3,410","3,444","3,444","3,444",""],
  ["2814 20 00","Ammonia in aqueous solution","Fertilizers","1","0,030","1,020","1,030","1,030","1,030",""],
  ["2834 21 00","Nitrate of potassium","Fertilizers","1,860","0,040","1,910","1,929","1,929","1,929",""],
  ["3102 10 12","Urea aq. sol. >45%N, 31.8–33.2%","Fertilizers","0,740","0,020","0,760","0,768","0,768","0,768",""],
  ["3102 10 15","Urea aq. sol. >45%N, 33.2–55%","Fertilizers","1,220","0,020","1,240","1,252","1,252","1,252",""],
  ["3102 10 19","Urea >45%N solid","Fertilizers","2,220","0,070","2,290","2,313","2,313","2,313",""],
  ["3102 10 90","Urea ≤45%N","Fertilizers","2,170","0,070","2,240","2,262","2,262","2,262",""],
  ["3102 21 00","Ammonium sulphate","Fertilizers","0,970","0,060","1,030","1,040","1,040","1,040",""],
  ["3102 29 00","Double salts: ammonium sulphate/nitrate","Fertilizers","1,460","0,060","1,530","1,545","1,545","1,545",""],
  ["3102 30 10","Ammonium nitrate aqueous","Fertilizers","1,430","0,050","1,470","1,485","1,485","1,485",""],
  ["3102 30 90","Ammonium nitrate solid","Fertilizers","2,190","0,070","2,270","2,293","2,293","2,293",""],
  ["3102 40 10","AN+CaCO₃ ≤28%N","Fertilizers","1,910","0,070","1,980","2","2","2",""],
  ["3102 40 90","AN+CaCO₃ >28%N","Fertilizers","1,910","0,070","1,980","2","2","2",""],
  ["3102 50 00","Sodium nitrate","Fertilizers","2,920","0,050","2,970","3","3","3",""],
  ["3102 60 00","Calcium nitrate/ammonium nitrate mix","Fertilizers","1,840","0,060","1,910","1,929","1,929","1,929",""],
  ["3102 80 00","UAN solution","Fertilizers","1,680","0,060","1,740","1,757","1,757","1,757",""],
  ["3102 90 00","Other N-fertilizers","Fertilizers","1,950","0,070","2,020","2,040","2,040","2,040",""],
  ["3105 10 00","NPK packaged ≤10kg","Fertilizers","0,900","0,060","0,960","0,970","0,970","0,970",""],
  ["3105 20 10","NPK >10%N","Fertilizers","1","0,070","1,060","1,071","1,071","1,071",""],
  ["3105 20 90","NPK ≤10%N","Fertilizers","0,680","0,050","0,740","0,747","0,747","0,747",""],
  ["3105 30 00","DAP","Fertilizers","0,780","0,040","0,820","0,828","0,828","0,828",""],
  ["3105 40 00","MAP","Fertilizers","0,500","0,030","0,530","0,535","0,535","0,535",""],
  ["3105 51 00","NP nitrates+phosphates","Fertilizers","1,340","0,090","1,420","1,434","1,434","1,434",""],
  ["3105 59 00","NP other","Fertilizers","0,900","0,100","1,010","1,020","1,020","1,020",""],
  ["3105 90 20","NK >10%N","Fertilizers","1,280","0,050","1,340","1,353","1,353","1,353",""],
  ["3105 90 80","NK ≤10%N","Fertilizers","0,670","0,040","0,710","0,717","0,717","0,717",""],
  ["7601","Unwrought aluminium","Aluminum","1,700",null,"1,700","1,870","2,040","2,210","K"],
  ["7603","Al powders and flakes","Aluminum","2,032",null,"2,032","2,235","2,439","2,642","K"],
  ["7604 10 10","Al bars and rods","Aluminum","2,258",null,"2,258","2,484","2,709","2,935","K"],
  ["7604 10 90","Al profiles","Aluminum","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7604 21 00","Al hollow profiles","Aluminum","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7604 29 10","Al bars and rods (other)","Aluminum","2,258",null,"2,258","2,484","2,709","2,935","K"],
  ["7604 29 90","Al profiles (other)","Aluminum","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7605","Aluminum wire","Aluminum","2,258",null,"2,258","2,484","2,709","2,935","K"],
  ["7606","Al plates, sheets, strip >0.2mm","Aluminum","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7607","Aluminum foil ≤0.2mm","Aluminum","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7608","Aluminum tubes and pipes","Aluminum","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7609 00 00","Al tube/pipe fittings","Aluminum","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7610 10 00","Al doors, windows, frames","Aluminum","2,278",null,"2,278","2,506","2,734","2,962","K"],
  ["7611 00 00","Al reservoirs/tanks >300L","Aluminum","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7612","Al casks, drums, cans ≤300L","Aluminum","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7613 00 00","Al containers compressed gas","Aluminum","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7614","Al stranded wire, cables","Aluminum","2,258",null,"2,258","2,484","2,709","2,935","K"],
  ["7616 10 00","Al nails, screws, nuts","Aluminum","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7616 91 00","Al cloth, grill, netting","Aluminum","2,730",null,"2,730","3,003","3,276","3,549","K"],
  ["7616 99 10","Al cast articles","Aluminum","2,032",null,"2,032","2,235","2,439","2,642","K"],
  ["7616 99 90","Other Al articles","Aluminum","2,730",null,"2,730","3,003","3,276","3,549","K"],
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

const BASELINE_YEARS=["2022","2023","2024","2025"];
const YTD_YEAR="2026";
// Dynamic YTD: Jan 1 → today. Actual Comext data used where confirmed; 2022-25 avg otherwise.
const _td=new Date(),_tdMo=_td.getMonth(),_tdDay=_td.getDate();
const _CURRENT_YM=`${_td.getFullYear()}-${String(_tdMo+1).padStart(2,"0")}`;
const _tdDIM=new Date(_td.getFullYear(),_tdMo+1,0).getDate();
const _MO_ABB=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YTD_FULL_MONTHS=Array.from({length:_tdMo},(_,i)=>String(i+1).padStart(2,"0"));
const YTD_PARTIAL_MONTH=String(_tdMo+1).padStart(2,"0");
const YTD_PARTIAL_FRACTION=_tdDay/_tdDIM;
const YTD_MONTHS=[...YTD_FULL_MONTHS,YTD_PARTIAL_MONTH];
const YTD_LABEL=`Jan–${_MO_ABB[_tdMo]} ${_tdDay}`;
function ytdMonthFraction(mo){return mo===YTD_PARTIAL_MONTH?YTD_PARTIAL_FRACTION:1;}
function ytdAvgEur(cn){
  let sum=0;
  for(const yr of BASELINE_YEARS){
    for(const mo of YTD_MONTHS){
      const v=TRADE[trKey(cn)]?.[`${yr}-${mo}`];
      if(v)sum+=v[1]*ytdMonthFraction(mo);
    }
  }
  return sum/BASELINE_YEARS.length;
}
function ytdTonnesForRows(rows,liveEntries=null){
  let total=0;
  for(const d of rows){
    const k=trKey(d.cn);
    for(const mo of YTD_MONTHS){
      const liveT=liveEntries?.[k]?.[`${YTD_YEAR}-${mo}`]?.[0];
      total+=(liveT>0?liveT:avgMonthTonnes(d.cn,mo))*ytdMonthFraction(mo);
    }
  }
  return total;
}
function ytdCostFactorsForRows(rows,liveEntries=null){
  let cfQ1=0,cfApr=0;
  for(const d of rows){
    const mv=d.mv2026||0,k=trKey(d.cn);
    for(const mo of YTD_MONTHS){
      const liveT=liveEntries?.[k]?.[`${YTD_YEAR}-${mo}`]?.[0];
      const tonnes=(liveT>0?liveT:avgMonthTonnes(d.cn,mo))*ytdMonthFraction(mo);
      if(mo<="03")cfQ1+=tonnes*mv; // Q1 2026: official CBAM cert price
      else cfApr+=tonnes*mv;        // post-Q1: adjustable forecast
    }
  }
  return{cfQ1,cfApr};
}

// ── 5-YEAR ETS HIGH / LOW ────────────────────────────────────────────────────
const _5yStartY=_td.getFullYear()-5;
const _5yEntries=Object.entries(ETS_PRICES.quarterly).filter(([k])=>parseInt(k)>=_5yStartY);
let ETS_5Y_HIGH=0,ETS_5Y_LOW=Infinity,ETS_5Y_HIGH_QTR="",ETS_5Y_LOW_QTR="";
for(const[k,v]of _5yEntries){if(v>ETS_5Y_HIGH){ETS_5Y_HIGH=v;ETS_5Y_HIGH_QTR=k;}if(v<ETS_5Y_LOW){ETS_5Y_LOW=v;ETS_5Y_LOW_QTR=k;}}
const fmtQtr=k=>{const[y,q]=k.split("-");return`${q} '${y.slice(2)}`;};

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
const SECTOR_STATS={};
for(const sec of SECTORS_LIST){
  const rows=RELEVANT.filter(d=>d.sector===sec);
  let annT=0,annE=0,wtDv=0,wtMv=0,wtW=0,ytdUsd=0,ytd26=0,ytd25j=0,cfQ1=0,cfApr=0;
  for(const d of rows){
    const mv=d.mv2026||0,tot=d.total||0;
    for(let m=1;m<=12;m++){const mo=String(m).padStart(2,"0");const t=avgMonthTonnes(d.cn,mo),e=avgMonthEur(d.cn,mo);annT+=t;annE+=e;wtDv+=t*tot;wtMv+=t*mv;wtW+=t;}
    ytdUsd+=ytdAvgEur(d.cn)*EUR_USD;
    // Jan growth 2026 vs 2025 (compare only confirmed Jan month)
    ytd26+=TRADE[trKey(d.cn)]?.["2026-01"]?.[1]??0;
    ytd25j+=TRADE[trKey(d.cn)]?.["2025-01"]?.[1]??0;
    const ytdFactors=ytdCostFactorsForRows([d]);
    cfQ1+=ytdFactors.cfQ1;
    cfApr+=ytdFactors.cfApr;
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
const TODAY_IDX=Math.round(48+_tdMo+_tdDay/_tdDIM);

const MONTH_NAMES=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function LineChart({points,onChartHover,onChartLeave,onChartClick,cutIdx=CUT_IDX,viewStartYm="2024-07",viewEndYm="2028-06",q1Ets=Q1_ETS,forecastEts=75,onConfirmedClick,confirmedPinned=false}){
  const [hov,setHov]=useState(null);
  const [q1LinkHov,setQ1LinkHov]=useState(false);
  const svgRef=useRef(null);
  const chartLeaveTimer=useRef(null);

  const W=820,H=360,pad={l:12,r:12,t:50,b:41};
  const visibleStartIdx=Math.max(0,points.findIndex(p=>p.ym>=viewStartYm));
  const afterEndIdx=points.findIndex(p=>p.ym>viewEndYm);
  const visibleEndIdx=afterEndIdx===-1?points.length-1:Math.max(visibleStartIdx,afterEndIdx-1);
  const visiblePoints=points.slice(visibleStartIdx,visibleEndIdx+1);
  const cW=W-pad.l-pad.r,cH=H-pad.t-pad.b,n=visiblePoints.length;
  const cumValues=useMemo(()=>{
    const arr=new Array(points.length).fill(0);
    let running=0;
    for(let i=CBAM_IDX;i<points.length;i++){running+=points[i].v;arr[i]=running;}
    return arr;
  },[points]);
  const maxY=500;
  const xp=i=>pad.l+(n<=1?0:i/(n-1)*cW);
  const yp=v=>pad.t+cH*(1-Math.min(v/maxY,1));
  const ypRaw=v=>pad.t+cH*(1-v/maxY); // unclamped — used with clipPath for cumulative line
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
    const cumRaw=idx>=CBAM_IDX?cumValues[idx]:null;
    const cumulative=cumRaw!=null?(cumRaw>=1000?`$${(cumRaw/1000).toFixed(2)}B`:`$${cumRaw.toFixed(0)}M`):null;
    if(idx<CBAM_IDX){
      const qEts=getQtrEts(p.ym,q1Ets);
      return{label,sub:`Pre-CBAM · hypothetical · €${qEts.toFixed(2)}/tCO₂e`,value:val,note:`${year} annual estimate: ${annualAmt}`,hlTime:`In ${year}`,hlVerb:"would have owed",hlAmt:annualAmt,year,isConfirmed:false,cumulative};
    }
    if(isConfirmed){
      return{label:`${label} (confirmed)`,sub:"Actual Comext trade vol.",value:val,note:`${year} annual estimate: ${annualAmt}`,hlTime:`In ${year}`,hlVerb:"owes an estimated",hlAmt:annualAmt,year,isConfirmed:true,cumulative};
    }
    if(year===2026){
      return{label,sub:"Projected (2022–25 avg trade)",value:val,note:`Est. monthly · 2026 total: ${annualAmt}`,hlTime:"In 2026",hlVerb:"is projected to owe",hlAmt:annualAmt,year,isConfirmed:false,cumulative};
    }
    if(year===2027){
      return{label,sub:"Projected (2022–25 avg · 20% mark-up)",value:val,note:`Est. monthly · 2027 total: ${annualAmt}`,hlTime:"In 2027",hlVerb:"is projected to owe",hlAmt:annualAmt,year,isConfirmed:false,cumulative};
    }
    return{label,sub:"Projected (2022–25 avg · 30% mark-up)",value:val,note:`Est. monthly · 2028 total: ${annualAmt}`,hlTime:"In 2028",hlVerb:"is projected to owe",hlAmt:annualAmt,year,isConfirmed:false,cumulative};
  },[points,annualTotals,cutIdx,cumValues]);

  const handleMouseMove=useCallback((e)=>{
    if(chartLeaveTimer.current){clearTimeout(chartLeaveTimer.current);chartLeaveTimer.current=null;}
    const idx=idxFromClientX(e.clientX);if(idx==null)return;
    setHov({idx,sx:e.clientX,sy:e.clientY});
    if(onChartHover){const t=getTooltip(idx);onChartHover({hlTime:t.hlTime,hlVerb:t.hlVerb,hlAmt:t.hlAmt,year:t.year,isConfirmed:t.isConfirmed,ym:points[idx].ym});}
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

  // Cumulative line from Jan 2026 to end of visible range
  const cumStart=Math.max(CBAM_IDX,visibleStartIdx);
  const cumD=cumStart<=visibleEndIdx?points.slice(cumStart,visibleEndIdx+1).map((p,i)=>{
    const idx=cumStart+i;
    return`${i===0?"M":"L"}${xp(idx-visibleStartIdx).toFixed(1)},${ypRaw(cumValues[idx]).toFixed(1)}`;
  }).join(" "):null;

  const cbamX=CBAM_IDX>=visibleStartIdx&&CBAM_IDX<=visibleEndIdx?xp(CBAM_IDX-visibleStartIdx):null;
  const todayX=TODAY_IDX>=visibleStartIdx&&TODAY_IDX<=visibleEndIdx?xp(TODAY_IDX-visibleStartIdx):null;
  const yearMarks=[
    {label:"’24",idx:visibleStartIdx},
    ...[2025,2026,2027,2028].map(y=>({label:String(y),idx:(y-2022)*12})),
  ].filter(m=>m.idx>=visibleStartIdx&&m.idx<=visibleEndIdx);
  const lineLabel=(idx,text,color,dx=0,dy=-14,anchor="middle")=>idx>=visibleStartIdx&&idx<=visibleEndIdx
    ?{x:xp(idx-visibleStartIdx)+dx,y:yp(points[idx].v)+dy,text,color,anchor}
    :null;
  const graphLabels=[
    lineLabel(Math.min(CBAM_IDX-4,visibleStartIdx+9),"hypothetical exposure",N.tealMid,-20,-25),
    lineLabel(Math.min(Math.max(CBAM_IDX,visibleStartIdx),Math.min(cutIdx,visibleEndIdx)),"confirmed exposure","#F4DA91",5,22,"start"),
    lineLabel(Math.min(Math.max(cutIdx+18,CBAM_IDX+9),visibleEndIdx-5),"projected exposure",N.teal600,90,-1),
  ].filter(Boolean);
  const tip=hov?getTooltip(hov.idx):null;

  return(
    <div style={{position:"relative"}}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block",cursor:"crosshair"}}
           role="img" aria-label="Line chart showing estimated monthly CBAM costs for US exports to the EU from mid-2024 through 2028. On-chart labels distinguish estimates based on historic trade, confirmed trade, and projected data. Hover or click to explore by month or year."
           onMouseMove={handleMouseMove} onMouseLeave={()=>{chartLeaveTimer.current=setTimeout(()=>{setHov(null);if(onChartLeave)onChartLeave();},80);}} onClick={handleClick}>
        <defs><clipPath id="cum-clip"><rect x={pad.l} y={pad.t} width={cW} height={cH}/></clipPath></defs>
        {/* ETS price annotation lines at top */}
        {(()=>{
          const lineY=24,tickH=5;
          const inV=i=>i>=visibleStartIdx&&i<=visibleEndIdx;
          const q1sX=inV(48)?xp(48-visibleStartIdx):null;
          const q1eX=51<=visibleEndIdx?xp(Math.min(51,visibleEndIdx)-visibleStartIdx):null;
          const q2sX=inV(51)?xp(51-visibleStartIdx):null;
          const q2eX=xp(visibleEndIdx-visibleStartIdx);
          return(<>
            {q1sX!=null&&q1eX!=null&&(<>
              <line x1={q1sX} y1={lineY} x2={q1eX} y2={lineY} stroke="#F4DA91" strokeWidth={1.5} strokeDasharray="5,3"/>
              <line x1={q1sX} y1={lineY-tickH} x2={q1sX} y2={lineY+tickH} stroke="#F4DA91" strokeWidth={1.5}/>
              <line x1={q1eX} y1={lineY-tickH} x2={q1eX} y2={lineY+tickH} stroke="#F4DA91" strokeWidth={1.5}/>
              <a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en" target="_blank" rel="noreferrer"
                onMouseEnter={()=>setQ1LinkHov(true)} onMouseLeave={()=>setQ1LinkHov(false)} style={{cursor:"pointer"}}>
                <text x={(q1sX+q1eX)/2} y={lineY-7} textAnchor="middle" fill="#F4DA91" fontSize={10} fontFamily={SANS} fontWeight={700}
                  stroke={N.teal900} strokeWidth={3} paintOrder="stroke">€{q1Ets.toFixed(2)}/tCO<tspan dy="2" fontSize={8}>2</tspan></text>
                {q1LinkHov&&<line x1={(q1sX+q1eX)/2-30} y1={lineY-5} x2={(q1sX+q1eX)/2+30} y2={lineY-5} stroke="#F4DA91" strokeWidth={1}/>}
              </a>
            </>)}
            {q2sX!=null&&(<>
              <line x1={q2sX} y1={lineY} x2={q2eX} y2={lineY} stroke={N.teal400} strokeWidth={1.5} strokeDasharray="5,3"/>
              <line x1={q2sX} y1={lineY-tickH} x2={q2sX} y2={lineY+tickH} stroke={N.teal400} strokeWidth={1.5}/>
              <line x1={q2eX} y1={lineY-tickH} x2={q2eX} y2={lineY+tickH} stroke={N.teal400} strokeWidth={1.5}/>
              <text x={(q2sX+q2eX)/2} y={lineY-7} textAnchor="middle" fill={N.teal400} fontSize={10} fontFamily={SANS} fontWeight={700}
                stroke={N.teal900} strokeWidth={3} paintOrder="stroke">€{Math.round(forecastEts)}/tCO<tspan dy="2" fontSize={8}>2</tspan></text>
            </>)}
          </>);
        })()}
        {/* CBAM start vertical marker + Y-axis ticks */}
        {cbamX!=null&&(
          <>
            <line x1={cbamX} y1={pad.t} x2={cbamX} y2={H-pad.b} stroke={N.orange400} strokeWidth={2.2} opacity={0.7}/>
            <text x={cbamX-80} y={pad.t+16} fill={N.orange400} fontSize={14} fontFamily={SANS} fontWeight={700}>CBAM start</text>
            <text x={cbamX-8} y={yp(400)-10} textAnchor="end" fill={N.tealMid} fontSize={9} fontFamily={SANS} opacity={0.6}>monthly cost</text>
            {[100,200,300,400].map(v=>(
              <g key={v}>
                <line x1={cbamX-5} y1={yp(v)} x2={cbamX} y2={yp(v)} stroke={N.tealMid} strokeWidth={1} opacity={0.5}/>
                <text x={cbamX-8} y={yp(v)+3} textAnchor="end" fill={N.tealMid} fontSize={9} fontFamily={SANS} opacity={0.6}>${v}M</text>
              </g>
            ))}
          </>
        )}
        {/* Today vertical marker */}
        {todayX!=null&&(
          <>
            <line x1={todayX} y1={pad.t} x2={todayX} y2={H-pad.b} stroke={N.teal400} strokeWidth={2.2} strokeDasharray="6,5" opacity={0.7}/>
            <text x={todayX+7} y={pad.t+34} fill={N.teal400} fontSize={14} fontFamily={SANS} fontWeight={700}>Today</text>
          </>
        )}
        {/* Cumulative CBAM cost from Jan 2026 — clipped at chart top, drawn behind main lines */}
        {cumD&&<path d={cumD} fill="none" stroke={N.teal200} strokeWidth={4} strokeLinejoin="round" opacity={0.35} clipPath="url(#cum-clip)"/>}
        {cumD&&(()=>{const labelIdx=Math.min(CBAM_IDX+15,visibleEndIdx);return labelIdx>=visibleStartIdx?(
          <text x={xp(labelIdx-visibleStartIdx)+8} y={pad.t+14}
            fill={N.teal200} fontSize={11} fontFamily={SANS} fontWeight={700} opacity={0.6}
            stroke={N.teal900} strokeWidth={4} paintOrder="stroke" pointerEvents="none">Cumulative CBAM cost</text>
        ):null;})()}
        {/* Forecast dashed (drawn first, solid on top) */}
        {foreD&&<path d={foreD} fill="none" stroke={N.teal600} strokeWidth={4.1} strokeLinejoin="round" strokeDasharray="16,10" opacity={0.75}/>}
        {/* Historical dashed */}
        {histD&&<path d={histD} fill="none" stroke={N.tealMid} strokeWidth={3.4} strokeLinejoin="round" strokeDasharray="7,8"/>}
        {/* Solid (confirmed CBAM data) */}
        {solidD&&<path d={solidD} fill="none" stroke={confirmedPinned?"#ffe88a":"#F4DA91"} strokeWidth={confirmedPinned?6:5} strokeLinejoin="round"/>}
        {/* Wider transparent hit area for clicking the confirmed segment to pin */}
        {solidD&&<path d={solidD} fill="none" stroke="transparent" strokeWidth={22} strokeLinejoin="round" style={{cursor:"pointer"}}
          onClick={e=>{e.stopPropagation();onConfirmedClick?.();}}
        />}
        {/* Year labels */}
        {yearMarks.map(({label,idx})=>(
          <text key={label} x={xp(idx-visibleStartIdx)} y={H-8} textAnchor="middle" fill={label==="2026"?N.teal200:N.tealMid} fontSize={16} fontFamily={SANS} fontWeight={label==="2026"?700:500}>{label}</text>
        ))}
        {/* Direct labels — "confirmed exposure" is interactive */}
        {graphLabels.map(({x,y,text,color,anchor})=>{
          if(text==="confirmed exposure"){
            return(
              <g key={text}>
                <text x={x} y={y} textAnchor={anchor} fill={confirmedPinned?"#ffe88a":color} stroke={N.teal900} strokeWidth={5} paintOrder="stroke" fontSize={13} fontFamily={SANS} fontWeight={800} letterSpacing={0} pointerEvents="none">{text}{confirmedPinned?" ⊗":""}</text>
                {confirmedPinned&&<line x1={x} y1={y+2} x2={x+120} y2={y+2} stroke="#ffe88a" strokeWidth={1} opacity={0.7} pointerEvents="none"/>}
              </g>
            );
          }
          return(<text key={text} x={x} y={y} textAnchor={anchor} fill={color} stroke={N.teal900} strokeWidth={5} paintOrder="stroke" fontSize={13} fontFamily={SANS} fontWeight={800} letterSpacing={0} pointerEvents="none">{text}</text>);
        })}
        {/* Hover dot — main line */}
        {hov!=null&&(
          <circle cx={xp(hov.idx-visibleStartIdx)} cy={yp(points[hov.idx].v)} r={7.8} fill={N.teal600} stroke={N.white} strokeWidth={2.4}/>
        )}
        {/* Hover dot — cumulative line */}
        {hov!=null&&hov.idx>=CBAM_IDX&&cumValues[hov.idx]>0&&(
          <circle cx={xp(hov.idx-visibleStartIdx)} cy={ypRaw(cumValues[hov.idx])} r={6} fill={N.teal200} stroke={N.white} strokeWidth={2} opacity={0.85} clipPath="url(#cum-clip)"/>
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
          {tip.cumulative&&<div style={{fontSize:11,color:N.teal200,marginTop:5,borderTop:`1px solid rgba(255,255,255,0.08)`,paddingTop:4}}>Cumulative since Jan '26 → {tip.cumulative}</div>}
          {onChartClick&&<div style={{fontSize:10,color:N.teal400,marginTop:5,borderTop:`1px solid rgba(255,255,255,0.08)`,paddingTop:4}}>Click to select year</div>}
        </div>
      )}
    </div>
  );
}

// ── FORMULA TERM COMPONENT ────────────────────────────────────────────────────
function Term({id,label,hovered,setHovered,pinnedTerm,setPinnedTerm,color,style={}}){
  const active=hovered===id||pinnedTerm===id;
  return(
    <span
      tabIndex={0} role="button" aria-pressed={active} aria-label={label}
      style={{display:"inline-flex",alignItems:"center",minHeight:32,cursor:"pointer",borderRadius:4,padding:"4px 10px",border:`2px solid ${active?color:N.tealLight}`,background:active?"rgba(255,255,255,0.12)":"transparent",color:active?color:N.white,transition:"all 0.15s",...style}}
      onMouseEnter={()=>setHovered(id)} onMouseLeave={()=>setHovered(null)}
      onFocus={()=>setHovered(id)} onBlur={()=>setHovered(null)}
      onClick={()=>setPinnedTerm(p=>p===id?null:id)}
    >
      <span style={{fontFamily:SERIF,fontSize:"clamp(14px,2vw,24px)",fontWeight:700,letterSpacing:0,lineHeight:1.1}}>{label}</span>
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
  "Aluminum":{
    desc:"Covers unwrought aluminium, semi-finished products (rods, wire, profiles, plates, foil), tubes, fabricated articles, and containers. The US is a significant primary and secondary aluminium producer.",
    extra:"Aluminum default values include upstream smelting and power generation emissions. The US power mix used in smelting will affect whether actual emissions are above or below the EU default.",
  },
  "Cement":{
    desc:"Includes Portland and hydraulic cement, clinker, white and grey variants, and calcined clay. US–EU cement trade is limited by high freight costs relative to product value.",
    extra:"Cement is one of the most carbon-intensive sectors by tCO₂e/t. Even at low trade volumes, the per-tonne CBAM charge can be significant.",
  },
  "Fertilizers":{
    desc:"Nitrogen-based fertilizers including anhydrous ammonia, urea, ammonium nitrate, and compound fertilizers (NPK/NK/DAP/MAP). The US is a major global ammonia and urea producer.",
    extra:"Fertilizers have a special phase-in rate of 1% throughout 2026–2028 (vs. 10–30% for other sectors) due to high carbon leakage risk and food security concerns.",
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
  const [sortCol,setSortCol]=useState("taxToday");
  const [sortDir,setSortDir]=useState("desc");
  const handleSort=col=>{
    if(sortCol===col){setSortDir(d=>d==="desc"?"asc":"desc");}
    else{setSortCol(col);setSortDir("desc");}
  };
  useEffect(()=>{if(closeRef.current)closeRef.current.focus();},[]);
  useEffect(()=>{
    const h=e=>{if(e.key==="Escape")onClose();};
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[onClose]);

  // Latest month with confirmed Comext data (from live fetch)
  const latestConfirmedYm=useMemo(()=>{
    if(!liveEntries)return null;
    const yms=Object.values(liveEntries).flatMap(m=>Object.keys(m)).filter(ym=>ym>="2026-01");
    return yms.length?yms.sort().at(-1):null;
  },[liveEntries]);

  const cnRows=useMemo(()=>{
    if(!sec)return[];
    const latestMo=latestConfirmedYm?parseInt(latestConfirmedYm.split("-")[1]):0;
    const confirmedMos=Array.from({length:latestMo},(_,i)=>String(i+1).padStart(2,"0"));
    return RELEVANT.filter(d=>d.sector===sec).map(d=>{
      // Keep annT + ytdAvgUsd for KPI cards, c2026/27/28 for trajectory section
      const annT=[1,2,3,4,5,6,7,8,9,10,11,12].reduce((s,m)=>s+avgMonthTonnes(d.cn,String(m).padStart(2,"0")),0);
      const ytdAvgUsd=ytdAvgEur(d.cn)*EUR_USD;
      const mvFn=mvk=>RELEVANT.find(x=>x.cn===d.cn)?.[mvk]||0;
      const traj=(mvk)=>[1,2,3,4,5,6,7,8,9,10,11,12].reduce((s,m)=>s+avgMonthTonnes(d.cn,String(m).padStart(2,"0"))*mvFn(mvk),0)*ets*EUR_USD;
      const _k=trKey(d.cn);
      // YTD trade volume: actual 2026 data + 4yr avg for remaining months
      const ytdTonnes=ytdTonnesForRows([d],liveEntries);
      // Cumulative growth Jan–latestConfirmedMo, 2026 vs 2025 (tonnes)
      let cum2026=0,cum2025=0,hasCum=false;
      for(const mo of confirmedMos){
        const liveT=liveEntries?.[_k]?.["2026-"+mo]?.[0];
        const t26=liveT!=null?liveT:0;
        const t25=TRADE[_k]?.["2025-"+mo]?.[0]??0;
        if(t26>0||t25>0)hasCum=true;
        cum2026+=t26;cum2025+=t25;
      }
      const cumGrowth=hasCum&&cum2025>0?(cum2026-cum2025)/cum2025*100:null;
      // CBAM exposure YTD
      const {cfQ1,cfApr}=ytdCostFactorsForRows([d],liveEntries);
      const taxQ1=cfQ1*Q1_ETS*EUR_USD;
      const taxToday=(cfQ1*Q1_ETS+cfApr*ets)*EUR_USD;
      // Proj. 2026 CBAM: actual data for confirmed months + 4yr avg for remainder
      let pCfQ1=0,pCfRest=0;
      const mv=d.mv2026||0;
      for(let m=1;m<=12;m++){
        const mo=String(m).padStart(2,"0"),ym=`${YTD_YEAR}-${mo}`;
        const liveT=liveEntries?.[_k]?.[ym]?.[0];
        const tonnes=liveT!=null&&liveT>0?liveT:avgMonthTonnes(d.cn,mo);
        if(mo<="03")pCfQ1+=tonnes*mv;else pCfRest+=tonnes*mv;
      }
      const proj2026Cbam=(pCfQ1*Q1_ETS+pCfRest*ets)*EUR_USD;
      return{cn:d.cn,desc:d.desc,total:d.total,mv2026:d.mv2026,annT,ytdAvgUsd,ytdTonnes,cumGrowth,taxQ1,taxToday,proj2026Cbam,c2026:traj("mv2026"),c2027:traj("mv2027"),c2028:traj("mv2028")};
    });
  },[sec,ets,liveEntries,latestConfirmedYm]);

  const totT=cnRows.reduce((s,r)=>s+r.annT,0);
  const totYtd=cnRows.reduce((s,r)=>s+r.ytdAvgUsd,0);
  const totYtdTonnes=cnRows.reduce((s,r)=>s+r.ytdTonnes,0);
  const totToday=cnRows.reduce((s,r)=>s+r.taxToday,0);
  const totProj2026=cnRows.reduce((s,r)=>s+r.proj2026Cbam,0);
  const tot26=cnRows.reduce((s,r)=>s+r.c2026,0);
  const tot27=cnRows.reduce((s,r)=>s+r.c2027,0);
  const tot28=cnRows.reduce((s,r)=>s+r.c2028,0);
  // Growth column header label
  const _latestMo=latestConfirmedYm?parseInt(latestConfirmedYm.split("-")[1]):0;
  const growthColLabel=_latestMo===0?"2026 vs 2025":_latestMo===1?"Jan 2026 vs 2025":`Jan–${_MO_ABB[_latestMo-1]} 2026 vs 2025`;

  // Sorted rows
  const sortedRows=useMemo(()=>{
    const dir=sortDir==="desc"?-1:1;
    return[...cnRows].sort((a,b)=>{
      const av=a[sortCol],bv=b[sortCol];
      if(av==null&&bv==null)return 0;
      if(av==null)return 1;   // nulls always last
      if(bv==null)return -1;
      if(typeof av==="string")return dir*(av.localeCompare(bv));
      return dir*(av-bv);
    });
  },[cnRows,sortCol,sortDir]);

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
              {label:"Annual Avg Trade Value",val:fmtM(SECTOR_STATS[sec]?.annUsd||0),sub:"2022–25 avg basis"},
              {label:"CBAM Exposure YTD",val:fmtM(totToday),sub:`${YTD_LABEL} · Q1 price + assumed`},
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
                {year:"2026",cost:tot26,markup:sec==="Fertilizers"?"1%":"10%",col:N.orange400},
                {year:"2027",cost:tot27,markup:sec==="Fertilizers"?"1%":"20%",col:N.orange500},
                {year:"2028",cost:tot28,markup:sec==="Fertilizers"?"1%":"30%",col:"#c0392b"},
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
                  {[
                    {col:"cn",label:"CN Code",align:"left"},
                    {col:"desc",label:"Description",align:"left"},
                    {col:"total",label:<>Default Value<br/>(tCO₂e/t)</>,align:"right"},
                    {col:"ytdTonnes",label:<>YTD Avg Trade<br/>Volume (t)</>,align:"right"},
                    {col:"cumGrowth",label:growthColLabel,align:"right"},
                    {col:"taxToday",label:<>Proj. YTD<br/>CBAM exposure</>,align:"right"},
                    {col:"proj2026Cbam",label:<>Proj. 2026<br/>CBAM exposure</>,align:"right"},
                  ].map(({col,label,align})=>{
                    const active=sortCol===col;
                    const arrow=active?(sortDir==="desc"?" ↓":" ↑"):"";
                    return(
                      <th key={col} onClick={()=>handleSort(col)}
                        style={{padding:"8px 10px",textAlign:align,color:active?N.white:N.teal400,fontWeight:700,
                          whiteSpace:"nowrap",cursor:"pointer",userSelect:"none",
                          background:active?"rgba(255,255,255,0.1)":"transparent",
                          transition:"background 0.15s, color 0.15s"}}>
                        {label}{arrow}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r,i)=>{
                  const gr=r.cumGrowth;
                  const gCol=gr==null?N.tealMid:gr>2?N.teal400:gr<-2?N.orange400:N.tealMid;
                  const gArr=gr==null?"":gr>2?"↑":gr<-2?"↓":"→";
                  return(
                    <tr key={r.cn} style={{borderBottom:`1px solid rgba(255,255,255,0.06)`,background:i%2===0?"transparent":"rgba(255,255,255,0.03)"}}>
                      <td style={{padding:"8px 10px",color:lightColor,fontWeight:700,fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{r.cn}</td>
                      <td style={{padding:"8px 10px",color:N.tealLight,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.desc}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:N.tealMid}}>{r.total!=null?r.total.toFixed(2):"—"}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:N.white}}>{fmtT(Math.round(r.ytdTonnes))}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:gCol}}>{gr==null?"—":`${gArr} ${pct(gr)}`}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:N.white}}>{fmtM(r.taxToday)}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",color:N.teal200}}>{fmtM(r.proj2026Cbam)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{background:"rgba(255,255,255,0.08)",fontWeight:700}}>
                  <td colSpan={3} style={{padding:"8px 10px",color:N.teal400}}>Total</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.white}}>{fmtT(Math.round(totYtdTonnes))}</td>
                  <td/>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.white}}>{fmtM(totToday)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",color:N.teal200}}>{fmtM(totProj2026)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{marginTop:8,fontFamily:SANS,fontSize:11,color:N.tealMid}}>
            Sorted by CBAM exposure YTD. YTD = {YTD_LABEL}, 2026. YTD trade volume and Proj. 2026 use actual Comext data for confirmed months; remaining months use 2022–25 avg. Growth comparison uses confirmed Comext tonnes only. ETS price: Q1 official + €{ets.toFixed(0)}/tCO₂e assumed thereafter.
          </div>
        </div>
      </div>
    </>
  );
}


// ── TERM DEFINITIONS FOR FORMULA PANEL ──────────────────────────────────────
const LS={color:N.teal200,textDecoration:"underline"};
const TERM_DEFS={
  tonnes:{title:"Exported Tonnes",def:"How much CBAM-covered product the US ships to the EU. Past years use reported Comext tonnage; future and not-yet-confirmed months use the 2022–25 monthly average as the trade baseline.",source:<>Source: <a href="https://ec.europa.eu/eurostat/databrowser/view/ds-045409__custom_21409230/default/table" target="_blank" rel="noreferrer" style={LS}>Comext database</a>, which publishes monthly with a six-to-eight week lag.</>},
  dv:{title:"Default Value (tCO₂e/t)",def:"The EU-assigned emissions intensity for each product when an exporter does not report verified facility-level emissions. It converts one tonne of product into estimated tonnes of CO₂-equivalent.",source:<>Source: <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2621" target="_blank" rel="noreferrer" style={LS}>EU Implementing Regulation 2025/2621, Annex I</a>.</>},
  markup:{title:"Mark-up / Phase-in %",def:"The penalty add-on in the default-value design. It nudges exporters toward submitting actual emissions data and grows over time for most sectors: 10% in 2026, 20% in 2027, and 30% in 2028. Fertilizers stay at 1% in this model.",source:<>Source: <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2621" target="_blank" rel="noreferrer" style={LS}>EU Implementing Regulation 2025/2621, Annex I</a>.</>},
  ets:{title:"EU ETS Carbon Price",def:"The carbon price used to turn embedded emissions into a CBAM cost. Q1 2026 uses the official CBAM certificate price; later months use the assumed price so you can test different carbon-market scenarios.",source:<>Source: <a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en" target="_blank" rel="noreferrer" style={LS}>CBAM certificate price</a>.</>},
  fxrate:{title:"Exchange Rate (USD/EUR)",def:"The conversion from euro-denominated CBAM costs into US dollars. This dashboard holds the exchange rate fixed at $1.13 per euro, based on the 2025 annual average.",source:"Source: European Central Bank (ECB) Statistical Data Warehouse"},
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
  const [pinnedTerm,setPinnedTerm]=useState(null);
  const [rangeStart,setRangeStart]=useState(2026);
  const [rangeEnd,setRangeEnd]=useState("today");
  const [vw,setVw]=useState(typeof window!=="undefined"?window.innerWidth:1280);
  useEffect(()=>{const h=()=>setVw(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  useEffect(()=>{const send=()=>window.parent.postMessage({cbam_height:document.documentElement.scrollHeight},"*");const ro=new ResizeObserver(send);ro.observe(document.body);send();return()=>ro.disconnect();},[]);
  const isMobile=vw<640;
  const isTablet=vw<1024;
  const [chartHover,setChartHover]=useState(null);
  const [chartHoverPinned,setChartHoverPinned]=useState(false);
  const [chartPinnedYear,setChartPinnedYear]=useState(null);
  const [hoveredSector,setHoveredSector]=useState(null);
  const [selectedSector,setSelectedSector]=useState(null);
  const [hoveredRow,setHoveredRow]=useState(null);
  const sectorLeaveTimer=useRef(null);
  const rowLeaveTimer=useRef(null);
  const [howToOpen,setHowToOpen]=useState(false);
  const [confirmedViewPinned,setConfirmedViewPinned]=useState(false);
  const confirmedViewActive=(chartHover?.isConfirmed??false)||confirmedViewPinned;

  // ── LIVE COMEXT FETCH ────────────────────────────────────────────────────────
  const [liveData,setLiveData]=useState(null);
  const [fetchStatus,setFetchStatus]=useState("idle");
  const fetchedRef=useRef(false);

  const fetchComext=useCallback(async()=>{
    if(fetchedRef.current)return;
    fetchedRef.current=true;
    setFetchStatus("loading");
    const BASE="https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/data/DS-045409";
    const QUERIES={"Iron & Steel":"2601+7201+7202+7203+7205+7206+7208+7209+7210+7211+7212+7213+7214+7215+7216+7217+7218+7219+7221+7223+7224+7225+7301+7302+7303+7304+7305+7306+7307+7308+7309+7310+7311+7318+7326","Aluminum":"7601+7603+7604+7605+7606+7607+7608+7609+7610+7611+7612+7613+7614+7616","Fertilizers":"2808+2814+2834+3102+3105","Hydrogen":"28041000","Cement":"2507+2523"};
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

  // Per-sector YTD cost factors use confirmed 2026 trade where available, otherwise the monthly baseline.
  const ytdCostFactors=useMemo(()=>{
    const f={};
    for(const sec of SECTORS_LIST){
      const rows=RELEVANT.filter(d=>d.sector===sec);
      f[sec]=ytdCostFactorsForRows(rows,mergedTrade);
    }
    return f;
  },[mergedTrade]);

  // Per-sector YTD tonnes: confirmed months use actual 2026 data, remainder uses 2022–25 avg pro-rated to today
  const ytdTonnesBySector=useMemo(()=>{
    const t={};
    for(const sec of SECTORS_LIST){
      t[sec]=ytdTonnesForRows(RELEVANT.filter(d=>d.sector===sec),mergedTrade);
    }
    return t;
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

  // Latest confirmed Comext month (e.g. "2026-03")
  const latestConfirmedYm=useMemo(()=>{
    if(!mergedTrade)return null;
    const yms=Object.values(mergedTrade).flatMap(m=>Object.keys(m)).filter(ym=>ym>="2026-01");
    return yms.length?yms.sort().at(-1):null;
  },[mergedTrade]);

  const confirmedMosList=useMemo(()=>{
    if(!latestConfirmedYm)return[];
    const lm=parseInt(latestConfirmedYm.split("-")[1]);
    return Array.from({length:lm},(_,i)=>String(i+1).padStart(2,"0"));
  },[latestConfirmedYm]);

  // Per-sector confirmed trade volume and CBAM exposure (Jan 2026 – latestConfirmedYm)
  const confirmedDataBySector=useMemo(()=>{
    if(!mergedTrade||!latestConfirmedYm||!confirmedMosList.length)return null;
    const result={};
    for(const sec of SECTORS_LIST){
      const rows=RELEVANT.filter(d=>d.sector===sec);
      let tonnes=0,cost=0;
      for(const d of rows){
        const k=trKey(d.cn),mv=d.mv2026||0;
        for(const mo of confirmedMosList){
          const ym=`2026-${mo}`;
          const t=mergedTrade[k]?.[ym]?.[0]??0;
          const qEts=getQtrEts(ym,ets);
          tonnes+=t;
          cost+=t*mv*qEts*EUR_USD;
        }
      }
      result[sec]={tonnes,cost};
    }
    return result;
  },[mergedTrade,latestConfirmedYm,confirmedMosList,ets]);

  const confirmedTotal=useMemo(()=>{
    if(!confirmedDataBySector)return 0;
    return Object.values(confirmedDataBySector).reduce((s,d)=>s+d.cost,0);
  },[confirmedDataBySector]);

  const confirmedMonthLabel=useMemo(()=>{
    if(!latestConfirmedYm)return"";
    const[,m]=latestConfirmedYm.split("-");
    return`${MONTH_NAMES[parseInt(m)-1]} 2026`;
  },[latestConfirmedYm]);

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
  // Hovering between latest confirmed month and today also shows YTD (these months have no confirmed data yet)
  const isHoverPreToday=!!(chartHover?.ym&&latestConfirmedYm&&chartHover.ym>latestConfirmedYm&&chartHover.ym<=_CURRENT_YM);
  const showYtdForHover=activeSectorYear===2026&&(isHoverConfirmed||isHoverPreToday);
  const activeTableYear=(activeSectorYear&&!showYtdForHover)?activeSectorYear:null;
  const displayTableRows=useMemo(()=>{
    if(confirmedViewActive&&confirmedDataBySector){
      return tableRows.map(r=>({...r,displayTonnes:confirmedDataBySector[r.sec]?.tonnes??0,displayCbam:confirmedDataBySector[r.sec]?.cost??0}));
    }
    return tableRows.map(r=>{
      if(!activeTableYear)return{...r,displayTonnes:ytdTonnesBySector[r.sec],displayCbam:r.taxToday};
      return{
        ...r,
        displayTonnes:sectorYearTonnes(r.sec,activeTableYear,mergedTrade),
        displayCbam:sectorYearCost(r.sec,activeTableYear,ets,mergedTrade),
      };
    });
  },[tableRows,activeTableYear,ets,mergedTrade,confirmedViewActive,confirmedDataBySector,ytdTonnesBySector]);
  const displayTableTonnesTotal=displayTableRows.reduce((s,r)=>s+r.displayTonnes,0);
  const displayTableCbamTotal=displayTableRows.reduce((s,r)=>s+r.displayCbam,0);
  const tonnesColumnLabel=confirmedViewActive
    ?"Confirmed trade volume (t)"
    :activeTableYear
      ?(activeTableYear>=2026?`${activeTableYear} Proj. trade volume (t)`:`${activeTableYear} trade volume (t)`)
      :"Proj. YTD trade volume (t)";
  const cbamColumnLabel=confirmedViewActive
    ?"Confirmed CBAM exposure"
    :activeTableYear
      ?(activeTableYear<2026
        ?`Hyp. CBAM in ${activeTableYear}`
        :`Proj. CBAM exposure in ${activeTableYear}`)
      :"Proj. CBAM exposure YTD";

  // Sector proportions for right panel
  const sectorAnnCosts=useMemo(()=>{
    if(confirmedViewActive&&confirmedDataBySector){
      const items=SECTORS_LIST.map(sec=>({sec,cost:confirmedDataBySector[sec]?.cost??0}));
      const tot=items.reduce((s,d)=>s+d.cost,0);
      return items.map(d=>({...d,pct:tot>0?d.cost/tot*100:0})).sort((a,b)=>b.pct-a.pct);
    }
    const yr=showYtdForHover?null:activeSectorYear;
    const items=SECTORS_LIST.map(sec=>{
      let cost;
      if(yr){
        cost=sectorYearCost(sec,yr,ets,mergedTrade);
      } else if(rangeEnd!=="today"){
        // Multi-year range: sum across selected years (ratios are range-independent)
        let sum=0;
        for(let y=rangeStart;y<=Number(rangeEnd);y++) sum+=sectorYearCost(sec,y,ets,mergedTrade);
        cost=sum;
      } else{
        const{cfQ1,cfApr}=ytdCostFactors[sec];cost=(cfQ1*Q1_ETS+cfApr*ets)*EUR_USD;
      }
      return{sec,cost};
    });
    const tot=items.reduce((s,d)=>s+d.cost,0);
    return items.map(d=>({...d,pct:tot>0?d.cost/tot*100:0})).sort((a,b)=>b.pct-a.pct);
  },[ets,activeSectorYear,mergedTrade,ytdCostFactors,rangeStart,rangeEnd,confirmedViewActive,confirmedDataBySector,showYtdForHover]);

  // Mark-up phase-in % for table column
  const markupPct=(sec)=>{
    if(sec==="Fertilizers")return"1%";
    const eEnd=rangeEnd==="today"?2026:rangeEnd;
    const startPct=rangeStart<=2026?10:rangeStart===2027?20:30;
    const endPct=eEnd<=2026?10:eEnd===2027?20:30;
    return startPct===endPct?`${startPct}%`:`${startPct}–${endPct}%`;
  };

  // Headline amounts by year range
  const {hlVerb,hlAmt}=useMemo(()=>{
    if(rangeEnd==="today"){
      return{hlTime:"Since January 2026",hlVerb:"owes an estimated",hlAmt:fmtM(totTaxToday)};
    }
    const startYm=`${rangeStart}-01`,endYm=`${rangeEnd}-12`;
    if(rangeEnd<=2025){
      const hist=CHART_DATA.filter(m=>m.ym>=startYm&&m.ym<=endYm).reduce((s,m)=>s+m.factor*getQtrEts(m.ym,ets),0)/(rangeEnd-rangeStart+1)*EUR_USD;
      const label=rangeStart===rangeEnd?`${rangeStart}`:`${rangeStart}–${rangeEnd}`;
      return{hlTime:`In ${label}`,hlVerb:"would have owed",hlAmt:fmtM(hist)+" / year"};
    }
    const tot=CHART_DATA.filter(m=>m.ym>=startYm&&m.ym<=endYm).reduce((s,m)=>s+m.factor*getQtrEts(m.ym,ets),0)*EUR_USD;
    const hlLabel=rangeStart===rangeEnd?`In ${rangeStart}`:`Through ${rangeEnd}`;
    return{hlTime:hlLabel,hlVerb:"is projected to owe",hlAmt:fmtM(tot)};
  },[rangeStart,rangeEnd,ets,totTaxToday]);

  // Per-year cost breakdown for right panel
  const annualCosts=useMemo(()=>{
    if(rangeEnd==="today")return[{year:"2026 (YTD)",cost:totTaxToday,quarters:null}];
    const result=[];
    for(let y=rangeStart;y<=rangeEnd;y++){
      const yearData=CHART_DATA.filter(m=>m.ym.startsWith(String(y)));
      const cost=yearData.reduce((s,m)=>s+m.factor*getQtrEts(m.ym,ets),0)*EUR_USD;
      let quarters=null;
      if(y<2026){
        quarters=[1,2,3,4].map(q=>{
          const etsPrice=ETS_PRICES.quarterly[`${y}-Q${q}`]||0;
          const qCost=yearData.filter(m=>{const mo=parseInt(m.ym.split("-")[1]);return Math.ceil(mo/3)===q;}).reduce((s,m)=>s+m.factor*etsPrice,0)*EUR_USD;
          return{q,etsPrice,cost:qCost};
        });
      }
      result.push({year:String(y),cost,quarters});
    }
    return result;
  },[rangeStart,rangeEnd,ets,totTaxToday]);

    // Column highlight from formula hover
  const colHl=(col,pos='mid')=>{
    if(hovered!==col)return{};
    const c=N.teal600,bg={background:`${c}22`};
    const lr=`inset 2px 0 0 0 ${c}, inset -2px 0 0 0 ${c}`;
    if(pos==='top')return{...bg,boxShadow:`${lr}, inset 0 2px 0 0 ${c}`};
    if(pos==='bot')return{...bg,boxShadow:`${lr}, inset 0 -2px 0 0 ${c}`};
    return{...bg,boxShadow:lr};
  };

  const handleChartHover=useCallback((info)=>{
    if(!chartHoverPinned)setChartHover(info);
  },[chartHoverPinned]);

  const handleChartLeave=useCallback(()=>{
    setChartHover(null);
  },[]);

  const handleChartClick=useCallback((yr,tooltipInfo)=>{
    if(tooltipInfo?.isConfirmed){
      setConfirmedViewPinned(p=>!p);
      return;
    }
    setRangeStart(yr);
    setRangeEnd(yr);
    setChartHover(null);
    setChartPinnedYear(yr);
    setChartHoverPinned(true);
    setConfirmedViewPinned(false);
  },[]);

  const clearChartPinnedYear=useCallback(()=>{
    setChartPinnedYear(null);
    setChartHoverPinned(false);
    setChartHover(null);
    setConfirmedViewPinned(false);
  },[]);

  const handleConfirmedClick=useCallback(()=>setConfirmedViewPinned(p=>!p),[]);

  return(
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Neuton:wght@400;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;}html,body,#root{margin:0;min-height:100%;width:100%;max-width:100%;}body{background:${N.teal900};overflow-x:hidden;}:focus-visible{outline:2px solid ${N.teal400};outline-offset:2px;}svg a:hover text{text-decoration:underline;}`}</style>

      <div style={{fontFamily:SANS,minHeight:"100vh",color:N.teal900,width:"100%",margin:0,background:N.teal900}}>

        {/* MOBILE-ONLY: title at top */}
        {isMobile&&(
          <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${N.teal800}`}}>
            <div style={{fontFamily:SANS,fontSize:20,fontWeight:700,color:N.white,letterSpacing:"0.01em",marginBottom:3}}>US CBAM Exposure Dashboard <span style={{fontWeight:400,color:N.tealMid,fontSize:11}}>(Beta)</span></div>
            <div style={{fontFamily:SANS,fontSize:14,color:N.tealMid,lineHeight:1.5,marginBottom:2}}>Estimated costs for US exporters under the EU CBAM default values</div>
            <div style={{fontFamily:SANS,fontSize:14,color:N.tealMid,lineHeight:1.5,marginBottom:2}}>A.K.A. <span style={{color:N.orange400,fontWeight:800}}>Forgone revenue</span> for the federal government</div>
            <div style={{fontFamily:SANS,fontSize:14,color:N.tealMid}}>Author: Jia-Shen Tsai, Niskanen Center</div>
          </div>
        )}

        {/* TOP SECTION */}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTablet?"1fr 300px":"1fr 380px",gap:0,borderBottom:`1px solid ${N.teal800}`,background:N.teal900,position:"relative",width:"100%"}}>
          {/* LEFT: Headline + Chart */}
          <div style={{padding:isMobile?"10px 16px 0":"10px 28px 0",background:"transparent",position:"relative",zIndex:1,display:"flex",flexDirection:"column",minHeight:isMobile?0:560}}>
            {/* Eyebrow: inline year selects (or hover override) */}
            <div style={{margin:"0 0 10px",height:isMobile?undefined:"clamp(46px,5vw,58px)",minHeight:isMobile?36:undefined,fontSize:isMobile?22:"clamp(32px,4vw,45px)",fontWeight:700,color:N.teal400,fontFamily:SANS,letterSpacing:0,lineHeight:1,display:"flex",alignItems:"center",flexWrap:"nowrap",gap:"0 8px",flexShrink:0}}>
              {confirmedViewActive?(
                <span style={{fontFamily:SANS,fontSize:isMobile?22:"clamp(32px,4vw,45px)",fontWeight:700,lineHeight:1,letterSpacing:0,color:"#F4DA91"}}>Jan 2026 – {confirmedMonthLabel}</span>
              ):(chartHover&&!showYtdForHover)?(
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
              <span style={{color:N.teal400}}>{confirmedViewActive?"owes":(chartHover&&!showYtdForHover)?chartHover.hlVerb:hlVerb}</span>{" "}
              <span style={{color:N.orange500,whiteSpace:"nowrap"}}>{confirmedViewActive?fmtM(confirmedTotal):(chartHover&&!showYtdForHover)?chartHover.hlAmt:hlAmt}</span>{" "}
              to the EU
            </div>
            <div style={{margin:"0 0 8px",fontFamily:SANS,fontSize:isMobile?20:"clamp(18px,2vw,23px)",fontWeight:400,lineHeight:1.4,color:N.tealMid}}>
              for exporting emission&#8209;intensive products under carbon border adjustment mechanism.
            </div>
            <div style={{marginTop:"auto"}}>
              <LineChart points={chartPoints} onChartHover={handleChartHover} onChartLeave={handleChartLeave} viewStartYm="2024-07" onChartClick={handleChartClick} cutIdx={liveDataCutIdx} q1Ets={Q1_ETS} forecastEts={ets} onConfirmedClick={handleConfirmedClick} confirmedPinned={confirmedViewPinned}/>
              {(()=>{
                const latestYm=liveMonths.length>0?liveMonths[liveMonths.length-1]:DATA_CUTOFF_YM;
                const[lcY,lcM]=latestYm.split("-");
                const latestLabel=`${MONTH_NAMES[parseInt(lcM)-1]} ${lcY}`;
                const nextMoNum=parseInt(lcM)%12+1;
                const nextYr=parseInt(lcM)===12?parseInt(lcY)+1:parseInt(lcY);
                const nextLabel=`${MONTH_NAMES[nextMoNum-1]} ${nextYr}`;
                return(
                  <p style={{margin:"4px 0 0",fontFamily:SANS,fontSize:11,color:N.tealMid,lineHeight:1.5}}>
                    Estimated monthly CBAM cost ($M) · <span style={{color:N.tealLight,fontWeight:600}}>Trade</span> (<a href="https://ec.europa.eu/eurostat/databrowser/view/ds-045409__custom_21409230/default/table" target="_blank" rel="noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Comext</a>): confirmed 2022 – {latestLabel}, projected {nextLabel} – 2028 · <span style={{color:N.tealLight,fontWeight:600}}>EU carbon price</span> (<a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en" target="_blank" rel="noreferrer" style={{color:"inherit",textDecoration:"underline"}}>EU Commission</a>): Q1 2026 confirmed at €{Q1_ETS.toFixed(2)}/tCO₂e, assumed from {FORECAST_FROM}{fetchStatus==="loading"&&<span style={{color:N.teal400}}> · Fetching…</span>}
                  </p>
                );
              })()}
            </div>
          </div>

          {/* RIGHT: ETS + Sector panel */}
          <div style={{background:N.teal900,color:N.white,padding:isMobile?"16px 16px 24px":isTablet?"12px 20px 24px 16px":"12px 28px 24px 24px",display:"flex",flexDirection:"column",gap:20,position:"relative",zIndex:1,borderTop:isMobile?`1px solid ${N.teal800}`:"none"}}>
            {/* Dashboard title — hidden on mobile (shown above the grid instead) */}
            {!isMobile&&(
              <div style={{paddingBottom:4,textAlign:"right"}}>
                <div style={{fontFamily:SANS,fontSize:16,fontWeight:700,color:N.white,letterSpacing:"0.01em",marginBottom:3}}>US CBAM Exposure Dashboard <span style={{fontWeight:400,color:N.tealMid,fontSize:11}}>(Beta)</span></div>
                <div style={{fontFamily:SANS,fontSize:10,color:N.tealMid,lineHeight:1.5,marginBottom:2}}>Estimated costs for US exporters under the EU CBAM default values</div>
                <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,lineHeight:1.5,marginBottom:2}}>A.K.A. <span style={{color:N.orange400,fontWeight:800}}>Forgone revenue</span> for the federal government</div>
                <div style={{fontFamily:SANS,fontSize:10,color:N.tealMid}}>Author: Jia-Shen Tsai, Niskanen Center</div>
              </div>
            )}
            {/* ETS Price */}
            <div>
              <div style={{marginBottom:4}}>
                <div style={{background:"rgba(255,255,255,0.05)",borderRadius:4,border:`1px solid rgba(255,255,255,0.08)`,marginBottom:12,overflow:"hidden"}}>
                  <button onClick={()=>setHowToOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",cursor:"pointer",padding:"10px 14px",fontFamily:SANS,fontSize:10,fontWeight:700,color:N.teal400,textTransform:"uppercase",letterSpacing:"0.08em"}}>
                    <span>How to explore</span>
                    <span style={{fontSize:14,lineHeight:1,transition:"transform 0.2s",transform:howToOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
                  </button>
                  {howToOpen&&(
                    <div style={{padding:"0 14px 12px"}}>
                      {[
                        ["◎","Hover the chart to explore monthly cost estimates and cumulative totals"],
                        ["⇅","Drag the slider below to model different carbon price scenarios"],
                        ["▶","Click any sector row in the table below for a full CN-code breakdown"],
                        ["↔","Use the year selectors at the top to view multi-year totals and the sector breakdown"],
                      ].map(([icon,text],i)=>(
                        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,fontFamily:SANS,fontSize:12,color:N.tealLight,lineHeight:1.5,marginBottom:i<3?6:0}}>
                          <span style={{color:N.teal400,flexShrink:0}}>{icon}</span>
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                  <span style={{fontFamily:SANS,fontSize:12,color:N.tealMid}}>Price on your choice <span style={{fontSize:11,opacity:0.65}}>from {FORECAST_FROM} on</span></span>
                  <span style={{fontFamily:SANS,fontSize:17,fontWeight:700,color:N.teal400}}>€{ets.toFixed(1)}<span style={{fontSize:12,fontWeight:400}}>/tCO<sub>2</sub></span></span>
                </div>
                <input type="range" min={30} max={130} value={ets} onChange={e=>setEts(+e.target.value)}
                  style={{width:"100%",accentColor:N.teal400,cursor:"pointer",marginBottom:2}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontFamily:SANS,fontSize:11,color:N.tealMid}}>
                  <span>€30</span><span>€80</span><span>€130</span>
                </div>
                <div style={{marginTop:5,fontFamily:SANS,fontSize:11,color:N.tealMid,lineHeight:1.5}}>
                  Past 5-yr range: low €{ETS_5Y_LOW.toFixed(0)}/t ({fmtQtr(ETS_5Y_LOW_QTR)}) · high €{ETS_5Y_HIGH.toFixed(0)}/t ({fmtQtr(ETS_5Y_HIGH_QTR)})
                </div>
              </div>
            </div>

            {/* Sector breakdown */}
            <div>
              <div style={{fontFamily:SANS,fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:N.teal400,textTransform:"uppercase",marginBottom:6}}>
                {confirmedViewActive?"Confirmed CBAM Exposure by Sector":`${(activeSectorYear&&!showYtdForHover)?`${activeSectorYear} `:rangeEnd!=="today"?`${rangeStart}${Number(rangeEnd)>rangeStart?`–${rangeEnd}`:""} `:"YTD "}CBAM Exposure by Sector`}
              </div>
              <div style={{fontSize:12,color:N.tealMid,marginBottom:confirmedViewActive?6:10}}>
                {confirmedViewActive
                  ?`Jan – ${confirmedMonthLabel} · actual Comext data · at €${Q1_ETS.toFixed(2)}`
                  :showYtdForHover
                    ?`YTD · ${YTD_LABEL} · at €${ets.toFixed(0)}`
                    :(activeSectorYear&&!showYtdForHover)
                      ?(activeSectorYear<2026?`${activeSectorYear} hypothetical`:`${activeSectorYear} projected`)
                      :rangeEnd!=="today"
                        ?`${rangeStart}${Number(rangeEnd)>rangeStart?`–${rangeEnd}`:""} · sector mix`
                        :`YTD · ${YTD_LABEL}`
                }{!confirmedViewActive&&!showYtdForHover&&((activeSectorYear&&activeSectorYear<2026)||(rangeEnd!=="today"&&Number(rangeEnd)<=2025)
                  ?` · actual ETS prices`
                  :activeSectorYear?` · at €${ets.toFixed(0)}`:` · at €${ets.toFixed(0)}`)
                }
              </div>
              {confirmedViewActive&&confirmedViewPinned&&(
                <div style={{marginBottom:8,fontFamily:SANS,fontSize:11,color:N.tealMid,opacity:0.85,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}
                  onClick={()=>setConfirmedViewPinned(false)}>
                  <span style={{fontSize:13}}>⊗</span><span>Pinned · click to unpin</span>
                </div>
              )}
              {sectorAnnCosts.map(({sec,cost,pct})=>(
                <div key={sec} style={{marginBottom:10,cursor:"pointer"}}
                  onMouseEnter={()=>{clearTimeout(sectorLeaveTimer.current);setHoveredSector(sec);}} onMouseLeave={()=>{sectorLeaveTimer.current=setTimeout(()=>setHoveredSector(null),80);}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontFamily:SANS,fontSize:13,fontWeight:600,color:SCL[sec]}}>{sec}</span>
                    <span style={{fontFamily:SANS,fontSize:13,fontWeight:700,color:N.white,opacity:(confirmedViewActive||hoveredSector===sec)?1:0,transition:"opacity 0.2s"}}>{fmtM(cost)}</span>
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
              {(()=>{const showQtr=rangeEnd!=="today"&&rangeStart===rangeEnd&&rangeStart<2026;return annualCosts.map(({year,cost,quarters})=>(
                <div key={year} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:showQtr&&quarters?4:0}}>
                    <span style={{fontFamily:SANS,fontSize:13,color:N.tealMid}}>{year}</span>
                    <span style={{fontFamily:SERIF,fontSize:18,fontWeight:700,color:N.teal200}}>{fmtM(cost)}</span>
                  </div>
                  {showQtr&&quarters&&quarters.map(({q,etsPrice,cost:qCost})=>(
                    <div key={q} style={{display:"flex",justifyContent:"space-between",marginBottom:3,paddingLeft:8}}>
                      <span style={{fontFamily:SANS,fontSize:11,color:N.tealMid}}>Q{q} · €{etsPrice.toFixed(1)}/t</span>
                      <span style={{fontFamily:SERIF,fontSize:12,color:N.teal400}}>{fmtM(qCost)}</span>
                    </div>
                  ))}
                </div>
              ))})()}
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
                <col style={{width:"22%"}}/>
                <col style={{width:"20%"}}/>
                <col style={{width:"20%"}}/>
                <col style={{width:"14%"}}/>
                <col style={{width:"24%"}}/>
              </colgroup>
              <thead>
                <tr style={{background:N.teal900,color:N.white,verticalAlign:"bottom"}}>
                  <th style={{padding:isMobile?"8px 8px":"8px 12px",textAlign:"left",fontWeight:700,fontSize:isMobile?13:16,borderLeft:`4px solid ${N.teal900}`}}>Sector</th>
                  <th style={{padding:"8px 8px",textAlign:"right",fontWeight:700,fontSize:isMobile?13:16,...colHl("tonnes","top")}}>{tonnesColumnLabel}</th>
                  <th style={{padding:"8px 8px",textAlign:"right",fontWeight:700,fontSize:isMobile?13:16,...colHl("dv","top")}}>Default value (tCO₂e/t, weighted avg.)</th>
                  <th style={{padding:"8px 8px",textAlign:"right",fontWeight:700,fontSize:isMobile?13:16,...colHl("markup","top")}}>Mark-up %</th>
                  <th style={{padding:"8px 8px",textAlign:"right",fontWeight:700,fontSize:isMobile?13:16,borderLeft:`3px solid rgba(125,206,218,0.3)`,background:"rgba(52,131,151,0.4)"}}>{cbamColumnLabel}</th>
                </tr>
              </thead>
              <tbody>
                {displayTableRows.map((r,i)=>{
                  const isLast=i===displayTableRows.length-1;
                  const pos=isLast?"bot":"mid";
                  return(
                  <tr key={r.sec} tabIndex={0} role="button" aria-label={`Open ${r.sec} sector detail`}
                    style={{background:i%2===0?N.white:N.tealPale,borderBottom:`1px solid ${N.tealLight}`,cursor:"pointer"}}
                    onClick={()=>setSelectedSector(r.sec)}
                    onMouseEnter={()=>{clearTimeout(rowLeaveTimer.current);setHoveredRow(i);}} onMouseLeave={()=>{rowLeaveTimer.current=setTimeout(()=>setHoveredRow(null),80);}}
                    onKeyDown={e=>(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),setSelectedSector(r.sec))}>
                    <td style={{padding:isMobile?"9px 8px":"9px 12px",fontSize:isMobile?14:17,fontWeight:800,color:SC[r.sec],borderLeft:`4px solid ${SC[r.sec]}`}}>
                      <span style={{display:"flex",alignItems:"center",overflow:"hidden",whiteSpace:"nowrap"}}>
                        <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{r.sec}</span>
                        <span style={{flexShrink:0,opacity:hoveredRow===i?1:0,transition:"opacity 0.15s",fontSize:10,lineHeight:1,marginLeft:5,color:SC[r.sec]}} aria-hidden="true">▶︎</span>
                      </span>
                    </td>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:isMobile?13:16,fontWeight:700,color:N.teal900,fontVariantNumeric:"tabular-nums",...colHl("tonnes",pos)}}>{fmtT(r.displayTonnes)}</td>
                    <td style={{padding:"9px 8px",color:N.teal800,textAlign:"right",...colHl("dv",pos)}}>
                      {isMobile?(
                        <span style={{fontSize:13,fontWeight:700,color:N.teal900,fontVariantNumeric:"tabular-nums"}}>{r.wDv>0?r.wDv.toFixed(3):"—"}</span>
                      ):(
                        <span style={{display:"inline-grid",gridTemplateColumns:"78px 52px",alignItems:"center",columnGap:4,whiteSpace:"nowrap"}}>
                          <DefaultValueMeter value={r.wDv} extreme={r.sec==="Hydrogen"}/>
                          <span style={{fontSize:16,fontWeight:700,color:N.teal900,fontVariantNumeric:"tabular-nums",textAlign:"right"}}>{r.wDv>0?r.wDv.toFixed(3):"—"}</span>
                        </span>
                      )}
                    </td>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:isMobile?13:16,fontWeight:700,color:N.teal800,...colHl("markup",pos)}}>{markupPct(r.sec)}</td>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:isMobile?13:16,fontWeight:800,color:N.teal800,borderLeft:`3px solid ${N.tealLight}`,background:"rgba(61,131,151,0.04)",fontVariantNumeric:"tabular-nums"}}>{fmtM(r.displayCbam)}</td>
                  </tr>
                  );
                })}
                <tr style={{background:N.teal900,color:N.white,fontWeight:700}}>
                  <td colSpan={4} style={{padding:"9px 12px",fontSize:16,textAlign:"right",color:N.tealMid,borderLeft:`4px solid ${N.teal900}`}}>Total</td>
                  <td style={{padding:"9px 8px",textAlign:"right",fontSize:16,borderLeft:`3px solid rgba(125,206,218,0.25)`,fontVariantNumeric:"tabular-nums"}}>{fmtM(displayTableCbamTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{padding:"6px 16px 8px",fontFamily:SANS,fontSize:12,color:N.tealMid}}>
            {confirmedViewActive&&<span style={{color:N.tealMid,fontWeight:600,marginRight:6}}>Confirmed Comext data: Jan 2026 – {confirmedMonthLabel}.</span>}
            Click any sector row for CN-code breakdown. Hover the line chart to shift the data display by year. Projected trade uses 2022–25 monthly averages where live data is unavailable.
          </div>
        </div>
        {/* FORMULA */}
        <div style={{background:N.teal900,padding:isMobile?"24px 16px 60px":"32px 28px 72px",position:"relative"}}>
          <div style={{fontFamily:SANS,fontSize:12,fontWeight:700,letterSpacing:"0.12em",color:N.teal400,textTransform:"uppercase",marginBottom:16}}>CBAM Cost Formula</div>
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"10px 8px",userSelect:"none"}}>
            <span style={{fontFamily:SERIF,fontSize:"clamp(14px,2vw,24px)",fontWeight:700,color:N.teal200}}>CBAM Cost ($)</span>
            <span style={{fontFamily:SANS,fontSize:18,color:N.tealMid,fontWeight:300}}>=</span>
            <Term id="tonnes" label="Exported Tonnes" hovered={hovered} setHovered={setHovered} pinnedTerm={pinnedTerm} setPinnedTerm={setPinnedTerm} color={N.teal400}/>
            <span style={{fontFamily:SANS,fontSize:18,color:N.tealMid,fontWeight:300}}>×</span>
            <Term id="dv" label="Default Value (tCO₂e/t)" hovered={hovered} setHovered={setHovered} pinnedTerm={pinnedTerm} setPinnedTerm={setPinnedTerm} color={N.teal400}/>
            <span style={{fontFamily:SANS,fontSize:18,color:N.tealMid,fontWeight:300}}>×</span>
            <Term id="markup" label="(1 + Mark-up)" hovered={hovered} setHovered={setHovered} pinnedTerm={pinnedTerm} setPinnedTerm={setPinnedTerm} color={N.teal400}/>
            <span style={{fontFamily:SANS,fontSize:18,color:N.tealMid,fontWeight:300}}>×</span>
            <span
              tabIndex={0} role="button" aria-pressed={hovered==="ets"||pinnedTerm==="ets"} aria-label="EU ETS carbon price"
              onMouseEnter={()=>setHovered("ets")} onMouseLeave={()=>setHovered(null)}
              onFocus={()=>setHovered("ets")} onBlur={()=>setHovered(null)}
              onClick={()=>setPinnedTerm(p=>p==="ets"?null:"ets")}
              style={{display:"inline-flex",alignItems:"center",minHeight:32,cursor:"pointer",fontFamily:SERIF,fontSize:"clamp(14px,2vw,24px)",fontWeight:700,lineHeight:1.1,color:(hovered==="ets"||pinnedTerm==="ets")?N.white:N.orange400,background:(hovered==="ets"||pinnedTerm==="ets")?"rgba(241,125,58,0.18)":"rgba(241,125,58,0.1)",borderRadius:4,padding:"4px 10px",border:`2px solid ${N.orange400}`}}>
              €{ets.toFixed(1)}/tCO₂e
            </span>
            <span style={{fontFamily:SANS,fontSize:18,color:N.tealMid,fontWeight:300}}>×</span>
            <Term id="fxrate" label="$1.13 / €" hovered={hovered} setHovered={setHovered} pinnedTerm={pinnedTerm} setPinnedTerm={setPinnedTerm} color={N.teal400}/>
          </div>
          <div style={{marginTop:16,borderTop:`1px solid rgba(255,255,255,0.1)`,paddingTop:12,minHeight:76,fontFamily:SANS}}>
            {(()=>{const active=hovered||pinnedTerm;return active&&TERM_DEFS[active]?(
              <div>
                <div style={{fontSize:11,color:N.teal400,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{TERM_DEFS[active].title}</div>
                <div style={{fontSize:13,color:N.tealLight,lineHeight:1.55,maxWidth:700}}>{TERM_DEFS[active].def}</div>
                <div style={{fontSize:11,color:N.tealMid,marginTop:6}}>{TERM_DEFS[active].source}</div>
              </div>
            ):(
              <div style={{fontSize:13,color:N.tealMid,fontStyle:"italic"}}>Hover a term to preview its definition. Click to keep it open.</div>
            );})()}
          </div>
        </div>

      </div>

      {selectedSector&&<SectorModal sec={selectedSector} ets={ets} liveEntries={mergedTrade} onClose={()=>setSelectedSector(null)}/>}
    </>
  );
}
