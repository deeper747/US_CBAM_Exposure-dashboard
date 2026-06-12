import React, { useCallback, useMemo, useRef, useState } from "react";
import { N, SANS, SERIF } from "../styles/tokens.js";
import {
  CBAM_IDX,
  CUT_IDX,
  MONTH_NAMES,
  TODAY_FRAC_IDX,
  getQtrEts,
} from "../lib/cbamCalculations.js";

export default function LineChart({
  points,
  onChartHover,
  onChartLeave,
  onChartClick,
  cutIdx = CUT_IDX,
  viewStartYm = "2024-07",
  viewEndYm = "2028-06",
  q1Ets,
  forecastEts = 75,
  onConfirmedClick,
  confirmedPinned = false,
  cbamIdx = CBAM_IDX,
  todayFracIdx = TODAY_FRAC_IDX,
  padLeft = 12,
  maxY = 400,
  chartHeight = 360,
  isMobile: isMobileProp,
}) {
  const [hov, setHov] = useState(null);
  const [q1LinkHov, setQ1LinkHov] = useState(false);
  const svgRef = useRef(null);
  const chartLeaveTimer = useRef(null);

  const W = 820;
  const H = chartHeight;
  const pad = { l: padLeft, r: 12, t: 50, b: 41 };
  const visibleStartIdx = Math.max(0, points.findIndex(p => p.ym >= viewStartYm));
  const afterEndIdx = points.findIndex(p => p.ym > viewEndYm);
  const visibleEndIdx = afterEndIdx === -1 ? points.length - 1 : Math.max(visibleStartIdx, afterEndIdx - 1);
  const visiblePoints = points.slice(visibleStartIdx, visibleEndIdx + 1);
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  const n = visiblePoints.length;

  const cumValues = useMemo(() => {
    const arr = new Array(points.length).fill(0);
    let running = 0;
    for (let i = cbamIdx; i < points.length; i++) {
      running += points[i].v;
      arr[i] = running;
    }
    return arr;
  }, [points, cbamIdx]);

  const xp = i => pad.l + (n <= 1 ? 0 : i / (n - 1) * cW);
  const yp = v => pad.t + cH * (1 - Math.min(v / maxY, 1));
  const ypRaw = v => pad.t + cH * (1 - v / maxY);

  const idxFromClientX = useCallback((clientX) => {
    const svg = svgRef.current;
    if (!svg || !n) return null;
    const rect = svg.getBoundingClientRect();
    const svgX = (clientX - rect.left) / rect.width * W;
    const rawI = (svgX - pad.l) / cW * (n - 1);
    return visibleStartIdx + Math.max(0, Math.min(n - 1, Math.round(rawI)));
  }, [cW, n, pad.l, visibleStartIdx]);

  const annualTotals = useMemo(() => {
    const totals = {};
    for (const p of points) {
      const year = parseInt(p.ym.slice(0, 4));
      totals[year] = (totals[year] || 0) + p.v;
    }
    return totals;
  }, [points]);

  // Dynamic year marks derived from points array — works for any date range
  const yearMarks = useMemo(() => {
    const marks = [];
    const seen = new Set();
    for (let i = visibleStartIdx; i <= visibleEndIdx; i++) {
      const yr = parseInt(points[i].ym);
      if (!seen.has(yr)) {
        seen.add(yr);
        const mo = parseInt(points[i].ym.slice(5, 7));
        const label = (seen.size === 1 && mo > 6) ? `'${String(yr).slice(2)}` : String(yr);
        marks.push({ label, idx: i });
      }
    }
    return marks;
  }, [points, visibleStartIdx, visibleEndIdx]);

  const getTooltip = useCallback((idx) => {
    const p = points[idx];
    const [yr, mo] = p.ym.split("-");
    const moName = MONTH_NAMES[parseInt(mo) - 1];
    const label = `${moName} ${yr}`;
    const val = `$${p.v.toFixed(2)}M`;
    const year = parseInt(yr);
    const annual = annualTotals[year] || 0;
    const annualAmt = `$${annual.toFixed(1)}M`;
    const isConfirmed = idx >= cbamIdx && idx <= cutIdx;
    const cumRaw = idx >= cbamIdx ? cumValues[idx] : null;
    const cumulative = cumRaw != null ? (cumRaw >= 1000 ? `$${(cumRaw / 1000).toFixed(2)}B` : `$${cumRaw.toFixed(0)}M`) : null;
    if (idx < cbamIdx) {
      const qEts = getQtrEts(p.ym, q1Ets);
      return { label, sub: `Pre-CBAM · hypothetical · €${qEts.toFixed(2)}/tCO₂e`, value: val, note: `${year} annual estimate: ${annualAmt}`, hlTime: `In ${year}`, hlVerb: "would have lost", hlAmt: annualAmt, year, isConfirmed: false, cumulative };
    }
    if (isConfirmed) {
      return { label: `${label} (confirmed)`, sub: "Actual Comext trade vol.", value: val, note: `${year} annual estimate: ${annualAmt}`, hlTime: `In ${year}`, hlVerb: "loses an estimated", hlAmt: annualAmt, year, isConfirmed: true, cumulative };
    }
    const markup = year >= 2028 ? 30 : year === 2027 ? 20 : 10;
    return { label, sub: `Projected (2022–25 avg trade · ${markup}% mark-up)`, value: val, note: `Est. monthly · ${year} total: ${annualAmt}`, hlTime: `In ${year}`, hlVerb: "is projected to lose", hlAmt: annualAmt, year, isConfirmed: false, cumulative };
  }, [points, annualTotals, cutIdx, cumValues, q1Ets, cbamIdx]);

  const handleMouseMove = useCallback((e) => {
    if (chartLeaveTimer.current) {
      clearTimeout(chartLeaveTimer.current);
      chartLeaveTimer.current = null;
    }
    const idx = idxFromClientX(e.clientX);
    if (idx == null) return;
    setHov({ idx, sx: e.clientX, sy: e.clientY });
    if (onChartHover) {
      const t = getTooltip(idx);
      onChartHover({ hlTime: t.hlTime, hlVerb: t.hlVerb, hlAmt: t.hlAmt, year: t.year, isConfirmed: t.isConfirmed, ym: points[idx].ym });
    }
  }, [idxFromClientX, getTooltip, onChartHover, points]);

  const handleClick = useCallback((e) => {
    const idx = idxFromClientX(e.clientX);
    if (idx == null || !onChartClick) return;
    const t = getTooltip(idx);
    setHov({ idx, sx: e.clientX, sy: e.clientY });
    onChartClick(t.year, t);
  }, [idxFromClientX, getTooltip, onChartClick]);

  const pathFrom = (startIdx, endIdx) => {
    const s = Math.max(startIdx, visibleStartIdx);
    const e = Math.min(endIdx, visibleEndIdx);
    if (e < s) return null;
    return points.slice(s, e + 1).map((p, i) => {
      const idx = s + i;
      return `${i === 0 ? "M" : "L"}${xp(idx - visibleStartIdx).toFixed(1)},${yp(p.v).toFixed(1)}`;
    }).join(" ");
  };

  const histD = pathFrom(visibleStartIdx, cbamIdx);
  const solidD = pathFrom(cbamIdx, cutIdx);
  const foreD = pathFrom(cutIdx, visibleEndIdx);
  const cumStart = Math.max(cbamIdx, visibleStartIdx);
  const cumD = cumStart <= visibleEndIdx ? points.slice(cumStart, visibleEndIdx + 1).map((p, i) => {
    const idx = cumStart + i;
    return `${i === 0 ? "M" : "L"}${xp(idx - visibleStartIdx).toFixed(1)},${ypRaw(cumValues[idx]).toFixed(1)}`;
  }).join(" ") : null;

  const cbamX = cbamIdx >= visibleStartIdx && cbamIdx <= visibleEndIdx ? xp(cbamIdx - visibleStartIdx) : null;
  const todayX = todayFracIdx >= visibleStartIdx && todayFracIdx <= visibleEndIdx ? xp(todayFracIdx - visibleStartIdx) : null;

  const lineLabel = (idx, text, color, dx = 0, dy = -14, anchor = "middle") => idx >= visibleStartIdx && idx <= visibleEndIdx
    ? { x: xp(idx - visibleStartIdx) + dx, y: yp(points[idx].v) + dy, text, color, anchor }
    : null;
  const graphLabels = [
    lineLabel(Math.min(cbamIdx - 4, visibleStartIdx + 9), "hypothetical exposure", N.tealMid, -20, -25),
    lineLabel(Math.min(Math.max(cbamIdx, visibleStartIdx), Math.min(cutIdx, visibleEndIdx)), "confirmed exposure", "#F4DA91", 5, 22, "start"),
    lineLabel(Math.min(Math.max(cutIdx + 18, cbamIdx + 9), visibleEndIdx - 5), "projected exposure", N.teal600, 90, -12),
  ].filter(Boolean);
  const tip = hov ? getTooltip(hov.idx) : null;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
  const isMobileView = isMobileProp ?? viewportWidth < 640;
  const mfs = n => isMobileView ? Math.round(n * 2.1) : n;

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
        role="img" aria-label="Line chart showing estimated monthly CBAM costs for US exports to the EU. On-chart labels distinguish estimates based on historic trade, confirmed trade, and projected data. Hover or click to explore by month or year."
        onMouseMove={handleMouseMove} onMouseLeave={() => { chartLeaveTimer.current = setTimeout(() => { setHov(null); if (onChartLeave) onChartLeave(); }, 80); }} onClick={handleClick}>
        <defs><clipPath id="cum-clip"><rect x={pad.l} y={pad.t} width={cW} height={cH}/></clipPath></defs>
        {(() => {
          const lineY = isMobileView ? 36 : 24;
          const tickH = 5;
          const inV = i => i >= visibleStartIdx && i <= visibleEndIdx;
          const q1sX = inV(cbamIdx) ? xp(cbamIdx - visibleStartIdx) : null;
          const q1eX = cbamIdx + 3 <= visibleEndIdx ? xp(Math.min(cbamIdx + 3, visibleEndIdx) - visibleStartIdx) : null;
          const q2sX = inV(cbamIdx + 3) ? xp((cbamIdx + 3) - visibleStartIdx) : null;
          const q2eX = xp(visibleEndIdx - visibleStartIdx);
          return (<>
            {q1sX != null && q1eX != null && (<>
              <line x1={q1sX} y1={lineY} x2={q1eX} y2={lineY} stroke="#F4DA91" strokeWidth={1.5} strokeDasharray="5,3"/>
              <line x1={q1sX} y1={lineY - tickH} x2={q1sX} y2={lineY + tickH} stroke="#F4DA91" strokeWidth={1.5}/>
              <line x1={q1eX} y1={lineY - tickH} x2={q1eX} y2={lineY + tickH} stroke="#F4DA91" strokeWidth={1.5}/>
              <a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en" target="_blank" rel="noreferrer"
                onMouseEnter={() => setQ1LinkHov(true)} onMouseLeave={() => setQ1LinkHov(false)} style={{ cursor: "pointer" }}>
                <text x={(q1sX + q1eX) / 2} y={lineY - (isMobileView ? 13 : 7)} textAnchor="middle" fill="#F4DA91" fontSize={mfs(10)} fontFamily={SANS} fontWeight={700}
                  stroke={N.teal900} strokeWidth={isMobileView ? 5 : 3} paintOrder="stroke">€{q1Ets.toFixed(2)}/tCO<tspan dy="2" fontSize={mfs(8)}>2</tspan></text>
                {q1LinkHov && <line x1={(q1sX + q1eX) / 2 - 30} y1={lineY - 5} x2={(q1sX + q1eX) / 2 + 30} y2={lineY - 5} stroke="#F4DA91" strokeWidth={1}/>}
              </a>
            </>)}
            {q2sX != null && (<>
              <line x1={q2sX} y1={lineY} x2={q2eX} y2={lineY} stroke={N.teal400} strokeWidth={1.5} strokeDasharray="5,3"/>
              <line x1={q2sX} y1={lineY - tickH} x2={q2sX} y2={lineY + tickH} stroke={N.teal400} strokeWidth={1.5}/>
              <line x1={q2eX} y1={lineY - tickH} x2={q2eX} y2={lineY + tickH} stroke={N.teal400} strokeWidth={1.5}/>
              <text x={(q2sX + q2eX) / 2} y={lineY - (isMobileView ? 13 : 7)} textAnchor="middle" fill={N.teal400} fontSize={mfs(10)} fontFamily={SANS} fontWeight={700}
                stroke={N.teal900} strokeWidth={isMobileView ? 5 : 3} paintOrder="stroke">€{Math.round(forecastEts)}/tCO<tspan dy="2" fontSize={mfs(8)}>2</tspan></text>
            </>)}
          </>);
        })()}
        {cbamX != null && (
          <>
            <line x1={cbamX} y1={pad.t} x2={cbamX} y2={H - pad.b} stroke={N.orange400} strokeWidth={2.2} opacity={0.7}/>
            <text x={cbamX - (isMobileView ? 190 : 90)} y={pad.t + 30} fill={N.orange400} fontSize={mfs(16)} fontFamily={SANS} fontWeight={700}>CBAM start</text>
            {!isMobileView && <text x={cbamX - 8} y={yp(maxY) - 10} textAnchor="end" fill={N.tealMid} fontSize={12} fontFamily={SANS} opacity={0.6}>monthly cost</text>}
            {Array.from({length: 4}, (_, i) => (i + 1) * maxY / 4).map(v => (
              <g key={v}>
                <line x1={cbamX - 5} y1={yp(v)} x2={cbamX} y2={yp(v)} stroke={N.tealMid} strokeWidth={1} opacity={0.5}/>
                <text x={cbamX - 8} y={yp(v) + 3} textAnchor="end" fill={N.tealMid} fontSize={mfs(12)} fontFamily={SANS} opacity={0.6}>${v}M</text>
              </g>
            ))}
          </>
        )}
        {todayX != null && (
          <>
            <line x1={todayX} y1={pad.t} x2={todayX} y2={H - pad.b} stroke={N.teal400} strokeWidth={2.2} strokeDasharray="6,5" opacity={0.7}/>
            <text x={todayX + 7} y={pad.t + 34} fill={N.teal400} fontSize={mfs(16)} fontFamily={SANS} fontWeight={700}>Today</text>
          </>
        )}
        {cumD && <path d={cumD} fill="none" stroke={N.teal200} strokeWidth={4} strokeLinejoin="round" opacity={0.35} clipPath="url(#cum-clip)"/>}
        {!isMobileView && cumD && (() => {
          const labelIdx = Math.min(cbamIdx + 15, visibleEndIdx);
          return labelIdx >= visibleStartIdx ? (
            <text x={xp(labelIdx - visibleStartIdx) + 58} y={pad.t + 14}
              fill={N.teal200} fontSize={14} fontFamily={SANS} fontWeight={700} opacity={0.6}
              stroke={N.teal900} strokeWidth={4} paintOrder="stroke" pointerEvents="none">Cumulative CBAM cost</text>
          ) : null;
        })()}
        {foreD && <path d={foreD} fill="none" stroke={N.teal600} strokeWidth={3.4} strokeLinejoin="round" strokeDasharray="7,8" opacity={0.75}/>}
        {histD && <path d={histD} fill="none" stroke={N.tealMid} strokeWidth={3.4} strokeLinejoin="round" strokeDasharray="7,8"/>}
        {solidD && <path d={solidD} fill="none" stroke={confirmedPinned ? "#ffe88a" : "#F4DA91"} strokeWidth={confirmedPinned ? 6 : 5} strokeLinejoin="round"/>}
        {solidD && <path d={solidD} fill="none" stroke="transparent" strokeWidth={22} strokeLinejoin="round" style={{ cursor: "pointer" }}
          onClick={e => { e.stopPropagation(); onConfirmedClick?.(); }}
        />}
        {yearMarks.map(({ label, idx }) => (
          <text key={label} x={xp(idx - visibleStartIdx)} y={H - 8} textAnchor="middle" fill={label === "2026" ? N.teal200 : N.tealMid} fontSize={mfs(16)} fontFamily={SANS} fontWeight={label === "2026" ? 700 : 500}>{label}</text>
        ))}
        {!isMobileView && graphLabels.map(({ x, y, text, color, anchor }) => {
          if (text === "confirmed exposure") {
            return (
              <g key={text}>
                <text x={x} y={y} textAnchor={anchor} fill={confirmedPinned ? "#ffe88a" : color} stroke={N.teal900} strokeWidth={5} paintOrder="stroke" fontSize={15} fontFamily={SANS} fontWeight={800} letterSpacing={0} pointerEvents="none">{text}{confirmedPinned ? " ✖︎" : ""}</text>
                {confirmedPinned && <line x1={x} y1={y + 2} x2={x + 137} y2={y + 2} stroke="#ffe88a" strokeWidth={1} opacity={0.7} pointerEvents="none"/>}
              </g>
            );
          }
          return <text key={text} x={x} y={y} textAnchor={anchor} fill={color} stroke={N.teal900} strokeWidth={5} paintOrder="stroke" fontSize={15} fontFamily={SANS} fontWeight={800} letterSpacing={0} pointerEvents="none">{text}</text>;
        })}
        {hov != null && (
          <circle cx={xp(hov.idx - visibleStartIdx)} cy={yp(points[hov.idx].v)} r={7.8} fill={N.teal600} stroke={N.white} strokeWidth={2.4}/>
        )}
        {hov != null && hov.idx >= cbamIdx && cumValues[hov.idx] > 0 && (
          <circle cx={xp(hov.idx - visibleStartIdx)} cy={ypRaw(cumValues[hov.idx])} r={6} fill={N.teal200} stroke={N.white} strokeWidth={2} opacity={0.85} clipPath="url(#cum-clip)"/>
        )}
      </svg>
      {isMobileView && (
        <div style={{ position: "absolute", top: "14%", right: "2%", background: "rgba(8,35,40,0.78)", borderRadius: 3, padding: "5px 8px", display: "flex", flexDirection: "column", gap: 4, pointerEvents: "none" }}>
          {[
            { label: "hypothetical", color: N.tealMid, dashed: true },
            { label: "confirmed",    color: "#F4DA91",  dashed: false },
            { label: "projected",    color: N.teal600,  dashed: true },
          ].map(({ label, color, dashed }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="18" height="8" viewBox="0 0 18 8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth={dashed ? 1.8 : 2.5} strokeDasharray={dashed ? "4,3" : undefined}/>
              </svg>
              <span style={{ fontFamily: SANS, fontSize: 10, color, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
            </div>
          ))}
        </div>
      )}
      {tip && hov && (
        <div style={{ position: "fixed", left: Math.min(hov.sx + 16, viewportWidth - 195), top: Math.max(hov.sy - 70, 10),
          background: N.teal900, color: N.white, borderRadius: 4, padding: "10px 14px",
          boxShadow: "0 4px 12px rgba(12,42,48,0.28)", border: `1px solid ${N.teal600}`,
          fontFamily: SANS, pointerEvents: "none", zIndex: 60, minWidth: 180 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: N.teal400, textTransform: "uppercase", letterSpacing: "0.08em" }}>{tip.label}</div>
          <div style={{ fontSize: 11, color: N.tealMid, marginTop: 2 }}>{tip.sub}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: N.white, marginTop: 6, fontFamily: SERIF }}>{tip.value}</div>
          <div style={{ fontSize: 11, color: N.tealMid, marginTop: 3 }}>{tip.note}</div>
          {tip.cumulative && <div style={{ fontSize: 11, color: N.teal200, marginTop: 5, borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: 4 }}>Cumulative since Jan '26 → {tip.cumulative}</div>}
          {onChartClick && <div style={{ fontSize: 10, color: N.teal400, marginTop: 5, borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: 4 }}>Click to select year</div>}
        </div>
      )}
    </div>
  );
}
