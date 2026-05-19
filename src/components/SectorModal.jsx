import React, { useEffect, useMemo, useRef, useState } from "react";
import { RELEVANT } from "../data/cbamDefaultValues.js";
import { EUR_USD, YTD_YEAR } from "../config/publicationConfig.js";
import { fmtKt, fmtM, fmtT, pct } from "../lib/formatters.js";
import {
  MONTH_NAMES,
  Q1_ETS,
  SECTOR_STATS,
  YTD_LABEL,
  avgMonthTonnes,
  getTradeRecord,
  trKey,
  ytdAvgEur,
  ytdCostFactorsForRows,
  ytdTonnesForRows,
} from "../lib/cbamCalculations.js";
import { N, SANS, SERIF, SECTOR_COLORS as SC, SECTOR_LIGHT_COLORS as SCL } from "../styles/tokens.js";

const SECTOR_INFO = {
  "Iron & Steel": {
    desc: "The largest CBAM sector by US export volume. Covers iron ore products, pig iron, ferro-alloys, flat and long steel products (HR/CR/coated), tubes, sections, and fabricated steel articles.",
    extra: "US steelmakers are predominantly EAF-based (electric arc furnace), which typically produces lower emissions than the blast furnace route assumed in EU default values — so actual costs may be lower for verified reporters.",
  },
  Aluminum: {
    desc: "Covers unwrought aluminium, semi-finished products (rods, wire, profiles, plates, foil), tubes, fabricated articles, and containers. The US is a significant primary and secondary aluminium producer.",
    extra: "Aluminum default values include upstream smelting and power generation emissions. The US power mix used in smelting will affect whether actual emissions are above or below the EU default.",
  },
  Cement: {
    desc: "Includes Portland and hydraulic cement, clinker, white and grey variants, and calcined clay. US–EU cement trade is limited by high freight costs relative to product value.",
    extra: "Cement is one of the most carbon-intensive sectors by tCO₂e/t. Even at low trade volumes, the per-tonne CBAM charge can be significant.",
  },
  Fertilizers: {
    desc: "Nitrogen-based fertilizers including anhydrous ammonia, urea, ammonium nitrate, and compound fertilizers (NPK/NK/DAP/MAP). The US is a major global ammonia and urea producer.",
    extra: "Fertilizers have a special phase-in rate of 1% throughout 2026–2028 (vs. 10–30% for other sectors) due to high carbon leakage risk and food security concerns.",
  },
  Hydrogen: {
    desc: "Covers hydrogen gas (CN 2804 10 00). CBAM applies based on the hydrogen's production emissions intensity — electrolytic, SMR, or by-product routes have very different default values.",
    extra: "At 26.64 tCO₂e/t, hydrogen has the highest default value of any CBAM product. Even small trade volumes can carry a large CBAM cost.",
  },
};

export default function SectorModal({ sec, ets, liveEntries, onClose }) {
  const info = SECTOR_INFO[sec] || { desc: "", extra: "" };
  const color = SC[sec] || N.teal600;
  const lightColor = SCL[sec] || N.teal400;
  const closeRef = useRef(null);
  const [sortCol, setSortCol] = useState("taxToday");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  useEffect(() => {
    if (closeRef.current) closeRef.current.focus();
  }, []);

  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const latestConfirmedYm = useMemo(() => {
    if (!liveEntries) return null;
    const yms = Object.values(liveEntries).flatMap(m => Object.keys(m)).filter(ym => ym >= "2026-01");
    return yms.length ? yms.sort().at(-1) : null;
  }, [liveEntries]);

  const cnRows = useMemo(() => {
    if (!sec) return [];
    const latestMo = latestConfirmedYm ? parseInt(latestConfirmedYm.split("-")[1]) : 0;
    const confirmedMos = Array.from({ length: latestMo }, (_, i) => String(i + 1).padStart(2, "0"));
    return RELEVANT.filter(d => d.sector === sec).map(d => {
      const annT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((s, m) => s + avgMonthTonnes(d.cn, String(m).padStart(2, "0")), 0);
      const ytdAvgUsd = ytdAvgEur(d.cn) * EUR_USD;
      const mvFn = mvk => RELEVANT.find(x => x.cn === d.cn)?.[mvk] || 0;
      const traj = mvk => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((s, m) => s + avgMonthTonnes(d.cn, String(m).padStart(2, "0")) * mvFn(mvk), 0) * ets * EUR_USD;
      const _k = trKey(d.cn);
      const ytdTonnes = ytdTonnesForRows([d], liveEntries);
      let cum2026 = 0;
      let cum2025 = 0;
      let hasCum = false;
      const tradeRecord = getTradeRecord(d.cn);
      for (const mo of confirmedMos) {
        const liveT = liveEntries?.[_k]?.["2026-" + mo]?.[0];
        const t26 = liveT != null ? liveT : 0;
        const t25 = tradeRecord?.["2025-" + mo]?.[0] ?? 0;
        if (t26 > 0 || t25 > 0) hasCum = true;
        cum2026 += t26;
        cum2025 += t25;
      }
      const cumGrowth = hasCum && cum2025 > 0 ? (cum2026 - cum2025) / cum2025 * 100 : null;
      const { cfQ1, cfApr } = ytdCostFactorsForRows([d], liveEntries);
      const taxQ1 = cfQ1 * Q1_ETS * EUR_USD;
      const taxToday = (cfQ1 * Q1_ETS + cfApr * ets) * EUR_USD;
      let pCfQ1 = 0;
      let pCfRest = 0;
      const mv = d.mv2026 || 0;
      for (let m = 1; m <= 12; m++) {
        const mo = String(m).padStart(2, "0");
        const ym = `${YTD_YEAR}-${mo}`;
        const liveT = liveEntries?.[_k]?.[ym]?.[0];
        const tonnes = liveT != null && liveT > 0 ? liveT : avgMonthTonnes(d.cn, mo);
        if (mo <= "03") pCfQ1 += tonnes * mv;
        else pCfRest += tonnes * mv;
      }
      const proj2026Cbam = (pCfQ1 * Q1_ETS + pCfRest * ets) * EUR_USD;
      return { cn: d.cn, desc: d.desc, total: d.total, mv2026: d.mv2026, annT, ytdAvgUsd, ytdTonnes, cumGrowth, taxQ1, taxToday, proj2026Cbam, c2026: traj("mv2026"), c2027: traj("mv2027"), c2028: traj("mv2028") };
    });
  }, [sec, ets, liveEntries, latestConfirmedYm]);

  const totT = cnRows.reduce((s, r) => s + r.annT, 0);
  const totYtdTonnes = cnRows.reduce((s, r) => s + r.ytdTonnes, 0);
  const totToday = cnRows.reduce((s, r) => s + r.taxToday, 0);
  const totProj2026 = cnRows.reduce((s, r) => s + r.proj2026Cbam, 0);
  const tot26 = cnRows.reduce((s, r) => s + r.c2026, 0);
  const tot27 = cnRows.reduce((s, r) => s + r.c2027, 0);
  const tot28 = cnRows.reduce((s, r) => s + r.c2028, 0);
  const _latestMo = latestConfirmedYm ? parseInt(latestConfirmedYm.split("-")[1]) : 0;
  const growthColLabel = _latestMo === 0 ? "2026 vs 2025" : _latestMo === 1 ? "Jan 2026 vs 2025" : `Jan–${MONTH_NAMES[_latestMo - 1]} 2026 vs 2025`;

  const sortedRows = useMemo(() => {
    const dir = sortDir === "desc" ? -1 : 1;
    return [...cnRows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") return dir * (av.localeCompare(bv));
      return dir * (av - bv);
    });
  }, [cnRows, sortCol, sortDir]);

  if (!sec) return null;

  return (
    <>
      <div onClick={onClose} aria-hidden="true" style={{ position: "fixed", inset: 0, background: "rgba(12,42,48,0.75)", zIndex: 300 }}/>
      <div role="dialog" aria-modal="true" aria-label={`${sec} sector detail`}
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "min(920px,96vw)", maxHeight: "88vh", background: N.teal900, borderRadius: 4,
          overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 301,
          boxShadow: "0 12px 32px rgba(12,42,48,0.55)", border: `1px solid ${color}44` }}>
        <div style={{ background: `${color}1a`, borderBottom: `2px solid ${color}`, padding: "18px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: lightColor, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Sector Detail</div>
            <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: N.white }}>{sec}</div>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close sector detail" style={{ background: "none", border: "none", color: N.tealLight, fontSize: 24, cursor: "pointer", lineHeight: 1, padding: "10px 12px", minWidth: 44, minHeight: 44 }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 16px 24px" }}>
          <p style={{ fontFamily: SANS, fontSize: 14, color: N.tealLight, lineHeight: 1.65, margin: "0 0 6px" }}>{info.desc}</p>
          <p style={{ fontFamily: SANS, fontSize: 13, color: N.tealMid, lineHeight: 1.6, margin: "0 0 20px", fontStyle: "italic" }}>{info.extra}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Proj. Annual Tonnes", val: fmtKt(totT), sub: "2022–25 avg basis" },
              { label: "Annual Avg Trade Value", val: fmtM(SECTOR_STATS[sec]?.annUsd || 0), sub: "2022–25 avg basis" },
              { label: "CBAM Exposure YTD", val: fmtM(totToday), sub: `${YTD_LABEL} · Q1 price + assumed` },
            ].map(({ label, val, sub }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "12px 14px", border: `1px solid rgba(255,255,255,0.08)` }}>
                <div style={{ fontFamily: SANS, fontSize: 10, color: N.tealMid, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: N.teal200 }}>{val}</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: N.tealMid, marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: N.teal400, textTransform: "uppercase", marginBottom: 10 }}>Projected Annual Cost Trajectory (at €{ets.toFixed(0)}/tCO₂e)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[
                { year: "2026", cost: tot26, markup: sec === "Fertilizers" ? "1%" : "10%", col: N.orange400 },
                { year: "2027", cost: tot27, markup: sec === "Fertilizers" ? "1%" : "20%", col: N.orange500 },
                { year: "2028", cost: tot28, markup: sec === "Fertilizers" ? "1%" : "30%", col: "#c0392b" },
              ].map(({ year, cost, markup, col }) => (
                <div key={year} style={{ flex: "1 1 120px", background: "rgba(255,255,255,0.04)", borderRadius: 4, padding: "12px 14px", borderTop: `3px solid ${col}` }}>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: N.tealMid, marginBottom: 4 }}>{year} · {markup} mark-up</div>
                  <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: N.white }}>{fmtM(cost)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: N.teal400, textTransform: "uppercase", marginBottom: 10 }}>
            CN Code Breakdown · {cnRows.length} product code{cnRows.length !== 1 ? "s" : ""}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                  {[
                    { col: "cn", label: "CN Code", align: "left" },
                    { col: "desc", label: "Description", align: "left" },
                    { col: "total", label: <>Default Value<br/>(tCO₂e/t)</>, align: "right" },
                    { col: "ytdTonnes", label: <>YTD Avg Trade<br/>Volume (t)</>, align: "right" },
                    { col: "cumGrowth", label: growthColLabel, align: "right" },
                    { col: "taxToday", label: <>Proj. YTD<br/>CBAM exposure</>, align: "right" },
                    { col: "proj2026Cbam", label: <>Proj. 2026<br/>CBAM exposure</>, align: "right" },
                  ].map(({ col, label, align }) => {
                    const active = sortCol === col;
                    const arrow = active ? (sortDir === "desc" ? " ↓" : " ↑") : "";
                    return (
                      <th key={col} onClick={() => handleSort(col)}
                        style={{ padding: "8px 10px", textAlign: align, color: active ? N.white : N.teal400, fontWeight: 700,
                          whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
                          background: active ? "rgba(255,255,255,0.1)" : "transparent",
                          transition: "background 0.15s, color 0.15s" }}>
                        {label}{arrow}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r, i) => {
                  const gr = r.cumGrowth;
                  const gCol = gr == null ? N.tealMid : gr > 2 ? N.teal400 : gr < -2 ? N.orange400 : N.tealMid;
                  const gArr = gr == null ? "" : gr > 2 ? "↑" : gr < -2 ? "↓" : "→";
                  return (
                    <tr key={r.cn} style={{ borderBottom: `1px solid rgba(255,255,255,0.06)`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "8px 10px", color: lightColor, fontWeight: 700, fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>{r.cn}</td>
                      <td style={{ padding: "8px 10px", color: N.tealLight, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.desc}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: N.tealMid }}>{r.total != null ? r.total.toFixed(2) : "—"}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: N.white }}>{fmtT(Math.round(r.ytdTonnes))}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: gCol }}>{gr == null ? "—" : `${gArr} ${pct(gr)}`}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: N.white }}>{fmtM(r.taxToday)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: N.teal200 }}>{fmtM(r.proj2026Cbam)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "rgba(255,255,255,0.08)", fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: "8px 10px", color: N.teal400 }}>Total</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: N.white }}>{fmtT(Math.round(totYtdTonnes))}</td>
                  <td/>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: N.white }}>{fmtM(totToday)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: N.teal200 }}>{fmtM(totProj2026)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 11, color: N.tealMid }}>
            Sorted by CBAM exposure YTD. YTD = {YTD_LABEL}, 2026. YTD trade volume and Proj. 2026 use actual Comext data for confirmed months; remaining months use 2022–25 avg. Growth comparison uses confirmed Comext tonnes only. ETS price: Q1 official + €{ets.toFixed(0)}/tCO₂e assumed thereafter.
          </div>
        </div>
      </div>
    </>
  );
}
