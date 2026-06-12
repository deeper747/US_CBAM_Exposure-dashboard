import { useEffect, useRef, useState } from "react";
import { DEFAULT_FORECAST_ETS, ETS_CONFIRMED_THROUGH, FORECAST_FROM } from "../config/publicationConfig.js";

const FALLBACK = {
  ets_confirmed_through: ETS_CONFIRMED_THROUGH,
  forecast_from: FORECAST_FROM,
  default_forecast_ets: DEFAULT_FORECAST_ETS,
  ets_quarterly_prices: {},
};

export function useCbamLiveConfig() {
  const [cbamConfig, setCbamConfig] = useState(FALLBACK);
  const [cbamConfigStatus, setCbamConfigStatus] = useState("loading");
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch(`/data/cbam_live_config.json?v=${Date.now()}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        setCbamConfig({ ...FALLBACK, ...data });
        setCbamConfigStatus("done");
      })
      .catch(() => setCbamConfigStatus("fallback"));
  }, []);

  return { cbamConfig, cbamConfigStatus };
}
