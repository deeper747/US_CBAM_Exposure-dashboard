const _now = new Date();
const _todayYm = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

export const PUBLICATION_CONFIG = {
  reportAsOf: _todayYm,
  iframeParentOrigin: "https://www.niskanencenter.org",
  dataCutoffYm: "2026-01",
  baselineYears: ["2022", "2023", "2024", "2025"],
  ytdYear: "2026",
  forecastFrom: "Jul 2026",
  etsConfirmedThrough: "2026-06",
  eurUsd: 1.13,
  defaultForecastEts: 75.28,
  liveComextStartPeriod: "2026-01",
  liveComextEndPeriod: "2026-12",
};

export const REPORT_AS_OF = PUBLICATION_CONFIG.reportAsOf;
export const IFRAME_PARENT_ORIGIN = PUBLICATION_CONFIG.iframeParentOrigin;
export const DATA_CUTOFF_YM = PUBLICATION_CONFIG.dataCutoffYm;
export const BASELINE_YEARS = PUBLICATION_CONFIG.baselineYears;
export const YTD_YEAR = PUBLICATION_CONFIG.ytdYear;
export const FORECAST_FROM = PUBLICATION_CONFIG.forecastFrom;
export const ETS_CONFIRMED_THROUGH = PUBLICATION_CONFIG.etsConfirmedThrough;
export const EUR_USD = PUBLICATION_CONFIG.eurUsd;
export const DEFAULT_FORECAST_ETS = PUBLICATION_CONFIG.defaultForecastEts;
export const LIVE_COMEXT_START_PERIOD = PUBLICATION_CONFIG.liveComextStartPeriod;
export const LIVE_COMEXT_END_PERIOD = PUBLICATION_CONFIG.liveComextEndPeriod;
