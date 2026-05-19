import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import ETS_PRICES from "./data/ets_prices.json";
import LineChart from "./components/LineChart.jsx";
import SectorModal from "./components/SectorModal.jsx";
import { DATA_CUTOFF_YM, DEFAULT_FORECAST_ETS, EUR_USD, FORECAST_FROM } from "./config/publicationConfig.js";
import { RELEVANT, SECTORS_LIST } from "./data/cbamDefaultValues.js";
import { fmtM, fmtT, dvLevel } from "./lib/formatters.js";
import {
  CHART_DATA,
  CURRENT_YM,
  CUT_IDX,
  ETS_5Y_HIGH,
  ETS_5Y_HIGH_QTR,
  ETS_5Y_LOW,
  ETS_5Y_LOW_QTR,
  MONTH_NAMES,
  Q1_ETS,
  REPORT_AS_OF_LABEL,
  SECTOR_STATS,
  YTD_LABEL,
  avgMonthTonnes,
  fmtQtr,
  getQtrEts,
  sectorYearCost,
  sectorYearTonnes,
  trKey,
  ytdCostFactorsForRows,
  ytdTonnesForRows,
} from "./lib/cbamCalculations.js";
import { useComextData } from "./context/ComextDataContext.jsx";
import { useIframeHeight } from "./hooks/useIframeHeight.js";
import { N, SANS, SERIF, SECTOR_COLORS as SC, SECTOR_LIGHT_COLORS as SCL } from "./styles/tokens.js";

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
  const [ets,setEts]=useState(ETS_PRICES.default||DEFAULT_FORECAST_ETS);
  const [hovered,setHovered]=useState(null);
  const [pinnedTerm,setPinnedTerm]=useState(null);
  const [rangeStart,setRangeStart]=useState(2026);
  const [rangeEnd,setRangeEnd]=useState("today");
  const [vw,setVw]=useState(typeof window!=="undefined"?window.innerWidth:1280);
  useEffect(()=>{const h=()=>setVw(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  useIframeHeight();
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

  const {liveData,fetchStatus}=useComextData();

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
  const isHoverPreToday=!!(chartHover?.ym&&latestConfirmedYm&&chartHover.ym>latestConfirmedYm&&chartHover.ym<=CURRENT_YM);
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
      <style>{`*{box-sizing:border-box;}html,body,#root{margin:0;min-height:100%;width:100%;max-width:100%;}body{background:${N.teal900};overflow-x:hidden;}:focus-visible{outline:2px solid ${N.teal400};outline-offset:2px;}svg a:hover text{text-decoration:underline;}`}</style>

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
              <span style={{color:N.teal400}}>{confirmedViewActive?"owes an estimated":(chartHover&&!showYtdForHover)?chartHover.hlVerb:hlVerb}</span>{" "}
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
                    Estimated monthly CBAM cost ($M) · <span style={{color:N.tealLight,fontWeight:600}}>Trade</span> (<a href="https://ec.europa.eu/eurostat/databrowser/view/ds-045409__custom_21409230/default/table" target="_blank" rel="noreferrer" style={{color:"inherit",textDecoration:"underline"}}>Comext</a>): confirmed 2022 – {latestLabel}, projected {nextLabel} – 2028 · <span style={{color:N.tealLight,fontWeight:600}}>EU carbon price</span> (<a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en" target="_blank" rel="noreferrer" style={{color:"inherit",textDecoration:"underline"}}>EU Commission</a>): Q1 2026 confirmed at €{Q1_ETS.toFixed(2)}/tCO₂e, assumed from {FORECAST_FROM} · Data current as of {REPORT_AS_OF_LABEL}{fetchStatus==="loading"&&<span style={{color:N.teal400}}> · Fetching…</span>}{fetchStatus==="fallback"&&<span style={{color:N.orange400}}> · Live Comext fetch unavailable; using static baseline and bundled confirmed data.</span>}
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
              <div style={{fontSize:13,color:N.tealMid,fontStyle:"italic"}}>{isMobile?"Tap":"Hover"} a term to preview its definition. Click to keep it open.</div>
            );})()}
          </div>
        </div>

      </div>

      {selectedSector&&<SectorModal sec={selectedSector} ets={ets} liveEntries={mergedTrade} onClose={()=>setSelectedSector(null)}/>}
    </>
  );
}
