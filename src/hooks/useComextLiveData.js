import { useCallback, useEffect, useRef, useState } from "react";
import { CN_MAP } from "../data/cbamDefaultValues.js";
import { TRADE } from "../data/tradeData.js";
import {
  LIVE_COMEXT_END_PERIOD,
  LIVE_COMEXT_START_PERIOD,
} from "../config/publicationConfig.js";

const COMEXT_BASE = "https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/data/DS-045409";
const COMEXT_QUERIES = {
  "Iron & Steel": "2601+7201+7202+7203+7205+7206+7208+7209+7210+7211+7212+7213+7214+7215+7216+7217+7218+7219+7221+7223+7224+7225+7301+7302+7303+7304+7305+7306+7307+7308+7309+7310+7311+7318+7326",
  Aluminum: "7601+7603+7604+7605+7606+7607+7608+7609+7610+7611+7612+7613+7614+7616",
  Fertilizers: "2808+2814+2834+3102+3105",
  Hydrogen: "28041000",
  Cement: "2507+2523",
};

function timeoutSignal(ms) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export function useComextLiveData() {
  const [liveData, setLiveData] = useState(null);
  const [fetchStatus, setFetchStatus] = useState("idle");
  const fetchedRef = useRef(false);

  const fetchComext = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setFetchStatus("loading");
    const raw = {};
    let gotAny = false;

    for (const codes of Object.values(COMEXT_QUERIES)) {
      try {
        const url = `${COMEXT_BASE}/M.EU27_2020.US.${codes}.1./?format=SDMX-CSV&startPeriod=${LIVE_COMEXT_START_PERIOD}&endPeriod=${LIVE_COMEXT_END_PERIOD}`;
        const r = await fetch(url, { signal: timeoutSignal(15000) });
        if (!r.ok) continue;
        const txt = await r.text();
        const lines = txt.split("\n").filter(l => l.trim());
        const hdrLine = lines.find(l => l.startsWith("DATAFLOW"));
        if (!hdrLine) continue;
        const hdrs = hdrLine.split(",").map(h => h.trim().replace(/"/g, "").toLowerCase());
        const iInd = hdrs.indexOf("indicators");
        const iVal = hdrs.indexOf("obs_value");
        const iPer = hdrs.indexOf("time_period");
        const iProd = hdrs.indexOf("product");
        if (iInd < 0 || iVal < 0 || iPer < 0 || iProd < 0) continue;
        for (const line of lines.filter(l => !l.startsWith("DATAFLOW"))) {
          const c = line.split(",").map(x => x.trim().replace(/"/g, ""));
          const ind = c[iInd];
          const ym = c[iPer];
          const cn = c[iProd];
          const val = parseFloat(c[iVal]);
          if (!cn || !ym || isNaN(val) || val <= 0) continue;
          const norm = cn.replace(/\s/g, "");
          let key = CN_MAP[norm] || norm;
          if (!TRADE[key]) {
            const k4 = norm.slice(0, 4);
            if (TRADE[k4]) key = k4;
          }
          if (!raw[key]) raw[key] = {};
          if (!raw[key][ym]) raw[key][ym] = [0, 0];
          if (ind === "QUANTITY_IN_100KG") {
            raw[key][ym][0] += val / 10;
            gotAny = true;
          }
          if (ind === "VALUE_IN_EUROS") raw[key][ym][1] += val;
        }
      } catch {
        // Optional live data should never block the static publication build.
      }
    }

    setLiveData({ entries: raw, gotAny });
    setFetchStatus(gotAny ? "done" : "fallback");
  }, []);

  useEffect(() => {
    const id = window.setTimeout(fetchComext, 0);
    return () => window.clearTimeout(id);
  }, [fetchComext]);

  return { liveData, fetchStatus };
}
