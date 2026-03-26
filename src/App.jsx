import { useState, useEffect, useCallback, useRef } from "react";

const N = {
  teal900:"#0c2a30",teal800:"#194852",teal600:"#348397",teal400:"#7dceda",
  teal200:"#b7f6fc",tealMid:"#78a0a3",tealLight:"#d0dbdd",tealPale:"#edf1f2",
  white:"#ffffff",yellow900:"#52482a",yellow600:"#bca45e",yellow400:"#f4da91",
  yellow200:"#fef0c7",orange900:"#411b08",orange700:"#8d381c",orange500:"#da5831",
  orange400:"#f17d3a",green900:"#2c3811",green600:"#709628",green400:"#b5d955",
  green200:"#D7f881",purple900:"#503961",purple600:"#8655b2",purple200:"#e0c6fc",
};
const SERIF="'Neuton',Georgia,serif";
const SANS="'Hanken Grotesk','Inter',sans-serif";
const EUR_USD=1.08;

const fmt=(n,d=0)=>n==null?"—":Number(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtM=n=>{
  if(!n)return"—";
  const u=n*EUR_USD;
  if(u>=1e9)return`$${(u/1e9).toFixed(2)}B`;
  if(u>=1e6)return`$${(u/1e6).toFixed(1)}M`;
  return`$${fmt(u)}`;
};
function tickingNum(val,asterisk=false){
  if(val==null)return"Loading…";
  const u=val*EUR_USD;
  const s=asterisk?"*":"";
  if(u>=1e9)return`$${(u/1e9).toFixed(3)}B${s}`;
  if(u>=1e6)return`$${(u/1e6).toFixed(2)}M${s}`;
  return`$${u.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,",")}${s}`;
}
function eu(v){
  if(v==null||v==="–"||v===""||v==="see below"||v==="N/A")return null;
  const s=String(v).trim().replace(/\s/g,"");
  if(!s||s==="–")return null;
  return parseFloat(s.replace(",","."));
}

// ── TRADE DATA — from data/raw/comext_us_cbam_trade_by_year.csv ──────────────
// Keyed by CN code exactly as listed in the regulation (no spaces).
// Each entry: [t2022, e2022, t2023, e2023, t2024, e2024, t2025, e2025]
const TRADE = {
  "25070080":[20678.152,9007217,15861.983,6853748,6487.241,4410229,3074.059,2171004],
  "25231000":[28.702,44869,57.514,23892,5.44,15597,102.675,44715],
  "25232100":[337.923,284728,184.213,157515,176.116,135708,85.223,138944],
  "25232900":[55.587,133052,233.533,240756,188.087,176980,258.822,206507],
  "25233000":[136.781,167871,20.431,34514,50.295,81942,52.962,114645],
  "25239000":[1048.747,775391,344.972,361063,519.484,461766,362.127,315203],
  "26011200":[2062848.717,375330875,2047966.599,321829492,2302766.352,305952437,1402443.234,153568047],
  "28041000":[0.274,11893,2.872,64245,30.967,306119,57152.224,3675669],
  "28080000":[141.095,668746,110.734,521844,101.615,793017,123.555,858505],
  "28141000":[148564.608,176663750,218237.653,119420360,140026.217,66316804,267983.97,114814376],
  "28142000":[2053.373,3385981,1053.567,2191982,1803.462,3312877,2265.648,4165361],
  "28342100":[57.603,344822,37.614,344795,19.64,256188,40.125,333840],
  "31021012":[0,0,0,0,0,0,0.022,808],
  "31021015":[0,0,0,0,0,0,0.03,1409],
  "31021019":[0,0,0,0,0,0,5.548,55603],
  "31021090":[7922.79,9535520,2928.944,3152722,3610.963,3587360,6673.517,6939200],
  "31022100":[123.918,1388265,184.347,1434265,221.223,2429606,184.605,1687183],
  "31022900":[11.908,35897,9.54,29359,27.066,70824,38.564,81487],
  "31023010":[0.1,373,0,0,18.643,12705,9.197,6269],
  "31023090":[52105.244,33327673,98558.671,28243615,3007.99,801591,33027.926,7535631],
  "31024010":[0.03,494,0,0,0,0,0,0],
  "31024090":[0.084,1607,0.003,87,0.009,424,0,0],
  "31025000":[27.235,17951,20.769,17902,33.386,27409,27.615,38642],
  "31026000":[0.152,433,0.191,2163,0.196,1201,17.195,92748],
  "31028000":[853262.562,477046106,764610.174,244461461,501513.654,95347742,490505.794,124898675],
  "31029000":[741.112,1274523,580.811,1162923,1074.901,1553334,1246.976,1781990],
  "31051000":[745.839,4569098,617.805,3453271,553.363,3453425,876.702,3486940],
  "31052010":[2014.058,4066636,1084.988,3080309,1655.664,3460032,1941.292,3876477],
  "31052090":[2034.772,5268429,1248.949,3593451,1524.299,4781393,1655.062,4109405],
  "31053000":[4412.973,4042029,2200.692,1509417,2252.756,1534353,2205.834,1520343],
  "31054000":[321.372,457938,17926.767,5675390,12521.737,4335651,27995.906,10065792],
  "31055100":[2.725,10680,3.97,16740,0.628,495,0.224,4364],
  "31055900":[398.238,666747,434.55,742532,207.445,299093,518.116,643603],
  "31059020":[367.051,1593113,366.362,2002728,422.251,2318215,482.338,4263716],
  "31059080":[696.072,2830702,629.727,2778596,983.645,4769340,1295.75,5451075],
  // Aluminium
  "7601":[8090.447,47497433,11395.317,50755749,14587.56,58970549,8177.684,39978575],
  "7603":[455.428,7168845,184.753,7509178,1154.368,10538382,747.958,8996456],
  "76041010":[31.812,749231,33.655,1019060,18.559,576007,34.726,1221072],
  "76041090":[108.74,1449795,33.855,879056,66.521,1155333,22.797,1006012],
  "76042100":[258.591,4540400,145.951,2290434,255.907,2953420,212.698,2374039],
  "76042910":[1745.524,25421651,2487.674,40778091,2299.889,34259138,2125.146,28382497],
  "76042990":[1013.431,25620689,1236.905,28375603,1581.245,35177854,1205.83,33754883],
  "7605":[5231.483,30533854,2635.195,14210640,3148.431,16108496,2584.78,13194638],
  "7606":[21765.057,168936684,25545.016,200633739,24548.139,201033739,21043.313,165985827],
  "7607":[2597.345,32793278,2033.069,31330460,2199.899,30510001,1887.48,25092772],
  "7608":[471.028,11206020,568.302,12130617,515.379,11486440,832.996,15059802],
  "76090000":[284.172,20820521,304.964,24743793,236.61,29279929,231.819,31970733],
  "76101000":[430.601,2704942,168.409,2805479,104.536,1907327,270.72,3581426],
  "76110000":[44.363,1337778,245.092,7033615,49.671,1866201,24.057,526503],
  "7612":[1721.73,24663277,1186.936,23422525,1458.86,25257934,1605.758,11501433],
  "76130000":[285.698,22300503,270.812,23915202,425.54,32769796,478.987,32956758],
  "7614":[704.643,14628850,30.277,1285396,552.431,2699155,26.476,267176],
  "76161000":[314.738,40098658,331.017,44468817,362.808,52145256,314.715,61402014],
  "76169100":[166.412,2509923,71.808,1635042,123.293,2215884,107.418,2232513],
  "76169910":[308.041,17322647,385.534,21640596,478.978,21410120,508.666,27160011],
  "76169990":[3236.597,162987086,3393.905,179468775,3154.754,176167525,2965.562,181545107],
  // Hydrogen
  // Iron & Steel
  "7201":[10.824,164721,2.919,76905,11.837,14724,0.003,246],
  "720211":[0.801,25304,0.002,600,19.675,56264,0.234,2787],
  "720241":[1.12,23088,0.638,20054,0.34,289228,15.13,34211],
  "72026000":[0.595,9312,0.057,15220,1.665,33494,12.768,55901],
  "7203":[517453.235,200151289,393536.008,143973267,368627.449,127118842,494361.262,171598274],
  "7205":[8575.407,36815328,7765.092,29021436,8923.26,27882849,7542.564,19486901],
  "72061000":[389.54,1035145,325.434,748841,2.731,47342,16.855,32602],
  "7208":[2351.79,2005136,134.231,417195,612.528,1302100,2116.307,2263729],
  "7209":[324.442,1777794,122.065,791237,208.178,740311,137.466,593845],
  "7210":[7395.216,18256817,5479.313,10285652,5564.636,8988397,3453.528,19495344],
  "72111300":[0.079,1216,0.513,579,1.812,2422,0.129,1383],
  "7212":[7265.278,51445406,6072.152,41586304,6787.765,45001968,5216.127,33782777],
  "7213":[458.447,499932,39.097,99860,88.517,637458,35.805,62234],
  "72142000":[11.168,129514,6.807,119697,1.817,3072,0.717,13421],
  "7215":[767.938,3106848,366.395,3049798,492.779,2184127,388.864,1809161],
  "7216":[333.21,3569920,262.272,1539057,854.248,1761263,510.228,1365502],
  "721710":[1235.061,3867573,1256.226,3636825,1113.515,3472678,1036.066,3174661],
  "721720":[480.87,793391,197.158,306205,715.089,1182158,276.459,493758],
  "72181000":[3680.29,11351908,4058.922,13796424,4325.355,15268696,647.786,3776128],
  "72191100":[3.486,114961,5.405,161196,10.292,348350,7.25,244442],
  "72193100":[46.517,1493397,32.05,1445144,60.916,1083944,27.38,646661],
  "7221":[538.945,6633642,594.358,6059187,223.693,5461155,180.151,4134921],
  "722300":[1015.576,31756952,915.372,33192724,802.875,37795103,671.635,31061703],
  "722410":[357.695,1819675,226.705,1964132,612.465,3507911,285.697,2603112],
  "72251100":[1521.267,5381487,2098.271,6799900,4702.551,14184583,4613.313,13609099],
  "722530":[225.894,620896,286.24,309534,318.882,568318,106.48,161185],
  "722550":[153.511,1071910,136.381,632986,65.936,334526,32.789,296873],
  "7301":[154.368,1380938,98.266,2281963,60.56,2128688,69.795,2526687],
  "7302":[110.528,534052,168.838,744898,290.354,1110568,69.323,486626],
  "7303":[145.66,809023,14.986,495486,65.24,654196,29.742,241861],
  "730419":[4642.673,4817871,3903.527,3493156,876.284,2188238,5918.214,6144690],
  "730439":[1387.431,2195085,1791.846,2775583,3124.285,3142885,2723.339,2602996],
  "7305":[100.918,1158013,211.85,1601084,200.215,404927,406.809,1347516],
  "73061900":[28.698,425876,12.781,210224,15.935,82912,87.79,280568],
  "73063080":[35.302,202779,41.791,223145,29.138,162910,18.624,66179],
  "73072100":[222.39,14181216,175.741,15568047,120.538,15008766,92.123,11186062],
  "73079100":[177.585,4011223,112.049,3959827,184.322,4413238,174.875,5452146],
  "7308":[3751.565,28025045,4727.008,30502206,5143.606,33792851,8065.579,67124588],
  "7309":[2891.569,17603410,1993.575,20192578,1439.038,11234651,925.154,21025077],
  "7310":[4198.621,25604890,8475.394,39402539,7569.721,30132884,6237.726,31124343],
  "731100":[1345.303,29784775,4186.941,26248725,5438.801,33340063,2753.657,27662585],
  "731815":[8494.474,224468153,7856.983,241832284,6772.928,244063363,6067.611,259336399],
  "731816":[2289.913,109558173,2155.808,120737641,1707.606,144477649,1585.096,160109243],
  "73182200":[927.102,53218051,837.573,54849199,908.136,60072016,568.473,67152471],
  "73182300":[353.61,18420572,130.816,15806430,148.594,24216535,151.479,35682279],
  "73269098":[17452.509,495062328,18048.268,500779229,17008.709,493372195,15900.414,515683532],
};

// Derive avg from year data
function tradeAvg(cn){ const d=TRADE[cn.replace(/\s/g,"")]; if(!d)return null; const has2025=d[6]!=null; return has2025?{t:(d[0]+d[2]+d[4]+d[6])/4,e:(d[1]+d[3]+d[5]+d[7])/4}:{t:(d[0]+d[2]+d[4])/3,e:(d[1]+d[3]+d[5])/3}; }
function tradeYr(cn,yr){ const d=TRADE[cn.replace(/\s/g,"")]; if(!d)return null; const i=yr==="2022"?0:yr==="2023"?2:yr==="2024"?4:6; return {t:d[i]??0,e:d[i+1]??0}; }

// ── REGULATION DATA ──────────────────────────────────────────────────────────
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

// Trade key map: regulation CN (no spaces) → TRADE key
// Handles cases where regulation uses spaces or different formatting than TRADE keys
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

function getTrade(regCN, yr="avg"){
  const key = regCN.replace(/\s/g,"");
  const tradeKey = CN_MAP[key] || key;
  if(yr==="avg") return tradeAvg(tradeKey);
  return tradeYr(tradeKey, yr);
}

const CBAM_DATA = RAW.map(r=>({
  cn:r[0], desc:r[1], sector:r[2],
  direct:eu(r[3]), indirect:eu(r[4]), total:eu(r[5]),
  mv2026:eu(r[6]), mv2027:eu(r[7]), mv2028:eu(r[8]), route:r[9],
}));

const SECTORS=["All",...new Set(CBAM_DATA.map(d=>d.sector))];
const YEARS=["2026","2027","2028+"];
const MV={"2026":"mv2026","2027":"mv2027","2028+":"mv2028"};
const MKPCT={"2026":"10%","2027":"20%","2028+":"30%"};

const SC={"Iron & Steel":"#0c2a30","Aluminium":N.teal600,"Cement":N.teal800,"Fertilisers":N.green600,"Hydrogen":N.purple600};
const SCL={"Iron & Steel":"#78a0a3","Aluminium":N.teal200,"Cement":N.yellow200,"Fertilisers":N.green200,"Hydrogen":N.purple200};

// Sector avg default value (for clock tab)
const SECTOR_AVG_DV={};
["Iron & Steel","Aluminium","Fertilisers","Hydrogen","Cement"].forEach(sec=>{
  const rows=CBAM_DATA.filter(d=>d.sector===sec&&d.mv2026!=null);
  if(!rows.length){SECTOR_AVG_DV[sec]=0;return;}
  // Weighted average by avg trade tonnage
  let sumWT=0,sumW=0;
  rows.forEach(d=>{
    const tr=getTrade(d.cn,"avg");
    const w=tr?.t||0;
    sumWT+=w*(d.mv2026||0);
    sumW+=w;
  });
  SECTOR_AVG_DV[sec]=sumW>0?sumWT/sumW:(rows.reduce((s,d)=>s+(d.mv2026||0),0)/rows.length);
});

// Historical sectoral tonnage — same getTrade logic
const HIST_YEARS=["2023","2024","2025"];
function calcHistSector(yr){
  const out={};
  ["Iron & Steel","Aluminium","Fertilisers","Hydrogen","Cement"].forEach(sec=>{
    // Sum tonnage × default_value per row, then divide by default_value to get effective tonnes
    // Actually: store {tonnes, cbam} directly so we can sum cost correctly
    const rows=CBAM_DATA.filter(d=>d.sector===sec&&d.mv2026!=null);
    let totalCost=0;
    rows.forEach(d=>{
      const tr=getTrade(d.cn,yr);
      const t=tr?.t||0;
      totalCost+=t*(d.mv2026||0);
    });
    out[sec]=totalCost; // in tCO2e·tonnes — multiply by ETS price later
  });
  return out;
}
const HIST_COST_FACTOR={
  "2023":calcHistSector("2023"),
  "2024":calcHistSector("2024"),
  "2025":calcHistSector("2025"),
};

// Baseline annual tonnage for clock tab
const BASELINE_ANNUAL={};
["Iron & Steel","Aluminium","Fertilisers","Hydrogen","Cement"].forEach(sec=>{
  const rows=CBAM_DATA.filter(d=>d.sector===sec&&d.mv2026!=null);
  const tonnes=rows.reduce((s,d)=>{const tr=getTrade(d.cn,"avg");return s+(tr?.t||0);},0);
  BASELINE_ANNUAL[sec]={tonnes};
});

const NiskanenLogo=()=>(
  <span style={{fontFamily:"'Neuton', Georgia, serif",fontSize:26,fontWeight:700,color:N.white,lineHeight:1}}>Niskanen Center</span>
);

const FOOTER_LINKS=[
  {url:"https://www.niskanencenter.org/where-u-s-carbon-policy-is-being-decided-in-2026/",title:"Where U.S. Carbon Policy Is Being Decided in 2026",desc:"An overview of the key legislative and regulatory venues shaping U.S. carbon policy this year."},
  {url:"https://www.niskanencenter.org/reforming-carbon-accounting-for-a-new-era-of-competition/",title:"Reforming Carbon Accounting for a New Era of Competition",desc:"The case for updating the Greenhouse Gas Protocol to reflect trade competitiveness realities."},
  {url:"https://www.niskanencenter.org/carbon-border-adjustment-bills-how-do-the-u-s-proposals-compare-to-the-eu-one/",title:"Carbon Border Adjustment Bills: How Do the U.S. Proposals Compare to the EU One?",desc:"A comparative analysis of U.S. CBAM legislative proposals against the EU's implemented mechanism."},
];

const FAQ_ITEMS=[
  {
    q:"When are CBAM prices set, and when do importers actually pay?",
    a:<>CBAM certificate prices are based on the <b>weekly average auction price of EU ETS allowances</b>, so they fluctuate with the carbon market. Importers must purchase and surrender certificates annually; for goods imported in 2026, the deadline is <b>September 30, 2027</b>. The obligation accrues from <b>January 1, 2026</b>.</>,
  },
  {
    q:"Why does the fertilizer sector have a lower phase-in rate than other sectors?",
    a:<>Fertilizers have a lower initial phase-in rate, starting at <b>1%</b>, due to their <b>high exposure to carbon leakage and global competition</b>, as well as their importance for agricultural supply chains. The EU adopted a more gradual adjustment to avoid disruption during the transition.</>,
  },
  {
    q:"Why does the mark-up increase over time?",
    a:<>The mark-up applied to CBAM default values increases over time to ensure emissions estimates remain <b>conservative</b> and reflect variability across production processes. It is designed to discourage reliance on default values and encourage importers to report verified, installation-level emissions data.</>,
  },
  {
    q:"How should I read the numbers at the top of the page?",
    a:<>The figures show an <b>upper-bound estimate</b> of CBAM costs on US exports, based on EU default emissions values and current ETS prices. Exporters that report <b>verified, installation-level emissions</b>, especially lower-emitting processes, would likely face lower costs. The effective tariff rate expresses this cost as a share of total CBAM-covered trade value.</>,
  },
  {
    q:"What has the EU carbon price been in recent years?",
    a:<>EU ETS allowance prices peaked near <b>€100/tCO₂ in early 2023</b>, then declined and fluctuated between <b>€50–70/tCO₂ through 2024</b>. As of early 2026, prices are roughly <b>€70–85/tCO₂</b>, depending on market conditions.</>,
  },
  {
    q:"Are other countries implementing their own CBAM?",
    a:<>The UK has announced plans to introduce a CBAM starting in <b>2027</b>, broadly aligned with the EU's approach. Canada has explored similar mechanisms, but no other major economy has fully implemented a CBAM to date.</>,
  },
];

const KEY_TERMS=[
  {
    term:"CBAM (Carbon Border Adjustment Mechanism)",
    def:<>A policy requiring importers of certain carbon-intensive goods to purchase certificates reflecting the carbon cost under EU climate rules. It is designed to prevent <b>carbon leakage</b> — the relocation of production to jurisdictions with weaker climate policies.</>,
  },
  {
    term:"EU ETS (Emissions Trading System)",
    def:"The EU's cap-and-trade carbon market, in operation since 2005. It sets a cap on total emissions from covered sectors and allows companies to buy and sell allowances. The ETS price directly determines the cost of CBAM certificates.",
  },
  {
    term:"Allowance",
    def:<>One EU ETS allowance equals the right to emit <b>one tonne of CO₂-equivalent</b>. Companies must surrender allowances to cover their verified emissions. CBAM certificate prices are linked to the weekly average auction price of these allowances.</>,
  },
  {
    term:"CN Code (Combined Nomenclature)",
    def:<>The EU's <b>8-digit product classification system</b>, building on the global 6-digit HS system. CBAM applies to specific CN codes covering steel, aluminium, cement, fertilizers, hydrogen, and electricity. The number of digits (4, 6, or 8) indicates the level of product specificity.</>,
  },
  {
    term:"Default Value",
    def:<>An EU-assigned emissions intensity (tCO₂e per tonne of product) used when verified emissions data is unavailable. Default values are typically <b>conservative and may exceed actual emissions</b>, incentivizing firms to report installation-level data.</>,
  },
  {
    term:"Mark-up",
    def:<>An additional percentage applied to CBAM default emissions values to ensure they are <b>conservative and do not underestimate actual emissions</b>. The mark-up increases over time (e.g. 10–30%) and is designed to reflect variation across installations and incentivize the reporting of verified emissions data.</>,
  },
  {
    term:"Benchmark Value",
    def:"The emissions intensity of the most efficient EU installations, used to determine free allocation levels under the EU ETS. It differs from default values, which are conservative estimates applied when actual data is unavailable.",
  },
  {
    term:"Free Allocation Adjustment",
    def:"A factor reflecting the gradual phase-out of free EU ETS allowances. As free allocation declines from 2026 to 2034, CBAM obligations increase correspondingly.",
  },
  {
    term:"Electric Arc Furnace (EAF)",
    def:<>A steelmaking process that melts scrap steel or direct reduced iron using electricity. It is significantly less carbon-intensive than the blast furnace route. The US produces roughly <b>70–75% of its steel via EAF</b>, but CBAM default values for the US do not explicitly reflect this, potentially overstating emissions.</>,
  },
  {
    term:"BF/BOF (Blast Furnace / Basic Oxygen Furnace)",
    def:"The traditional coal-based steelmaking route, where iron ore is reduced in a blast furnace and converted to steel in a basic oxygen furnace. This process produces significantly higher CO₂ emissions per tonne than EAF.",
  },
];

export default function App(){
  const [year,setYear]=useState("2026");
  const [sector,setSector]=useState("All");
  const [ets,setEts]=useState(70);
  const [search,setSearch]=useState("");
  const [tab,setTab]=useState("clock");
  const [sk,setSk]=useState("cbamCost");
  const [sd,setSd]=useState("desc");
  const [clockSector,setClockSector]=useState("All");
  const [etsLive,setEtsLive]=useState(null);
  const [etsStatus,setEtsStatus]=useState("idle");
  const [comext2026,setComext2026]=useState(null);
  const [comextStatus,setComextStatus]=useState("idle");
  const [tick,setTick]=useState(0);
  const tickRef=useRef(null);
  const clockInitRef=useRef(false);
  const [menuOpen,setMenuOpen]=useState(false);

  const mvf=MV[year];

  const filtered=CBAM_DATA.filter(d=>{
    if(sector!=="All"&&d.sector!==sector)return false;
    if(search){const q=search.toLowerCase();if(!d.cn.toLowerCase().includes(q)&&!d.desc.toLowerCase().includes(q))return false;}
    return true;
  });
  const enriched=filtered.map(d=>{
    const tr=getTrade(d.cn,"avg");
    const tonnes=tr?.t||null,tradeEur=tr?.e||null,dv=d[mvf];
    return{...d,tonnes,tradeEur,cbamCost:tonnes&&dv?tonnes*dv*ets:null,cbamPerTonne:dv?dv*ets:null};
  });
  const sorted=[...enriched].sort((a,b)=>{const av=a[sk]??-Infinity,bv=b[sk]??-Infinity;return sd==="desc"?bv-av:av-bv;});
  const totExp=enriched.reduce((s,d)=>s+(d.cbamCost||0),0);
  const totT=enriched.reduce((s,d)=>s+(d.tonnes||0),0);
  const totE=enriched.reduce((s,d)=>s+(d.tradeEur||0),0);
  const chartData=[...enriched].filter(d=>d.cbamCost).sort((a,b)=>b.cbamCost-a.cbamCost).slice(0,14);
  const maxC=chartData[0]?.cbamCost||1;
  const hs=k=>{if(sk===k)setSd(d=>d==="desc"?"asc":"desc");else{setSk(k);setSd("desc");}};
  const Th=({k,label})=>(
    <th onClick={()=>hs(k)} style={{padding:"9px 10px",textAlign:"left",whiteSpace:"pre-line",fontFamily:SANS,fontSize:11,fontWeight:600,cursor:"pointer",userSelect:"none",background:sk===k?N.teal900:"transparent",borderRight:"1px solid rgba(255,255,255,0.12)",color:sk===k?N.teal200:N.tealLight}}>
      {label}{sk===k?(sd==="desc"?" ↓":" ↑"):""}
    </th>
  );

  const fetchEts=useCallback(async()=>{
    setEtsStatus("loading");
    try{
      const r=await fetch("https://query1.finance.yahoo.com/v8/finance/chart/C02.DE?interval=1d&range=5d");
      const d=await r.json();
      const p=d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if(p&&p>20&&p<200){setEtsLive(p);setEtsStatus("ok");return;}
      throw new Error();
    }catch{setEtsLive(71.5);setEtsStatus("fallback");}
  },[]);

  const fetchComext=useCallback(async()=>{
    setComextStatus("loading");
    const BASE="https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/data/DS-045409";
    const queries={"Iron & Steel":"7208+7209+7210+7213+7216+7304+7306+7308+7318","Aluminium":"7601+7604+7606+7607+7608","Fertilisers":"2814+3102+3105","Hydrogen":"2804","Cement":"2523"};
    const sectorTonnes={};const monthsCovered=new Set();let gotAny=false;
    for(const[sec,codes]of Object.entries(queries)){
      try{
        const r=await fetch(`${BASE}/M.EU27_2020.US.${codes}.1./?format=SDMX-CSV&startPeriod=2026-01&endPeriod=2026-12`,{signal:AbortSignal.timeout(10000)});
        if(!r.ok){sectorTonnes[sec]=null;continue;}
        const txt=await r.text();
        const lines=txt.split("\n").filter(l=>l.trim()&&!l.startsWith("DATAFLOW"));
        if(lines.length<2){sectorTonnes[sec]=null;continue;}
        const hdrs=lines[0].split(",").map(h=>h.trim().replace(/"/g,""));
        const iInd=hdrs.indexOf("INDICATORS"),iVal=hdrs.indexOf("OBS_VALUE"),iPer=hdrs.indexOf("TIME_PERIOD");
        if(iInd<0){sectorTonnes[sec]=null;continue;}
        let tonnes=0;const months=new Set();
        for(let i=1;i<lines.length;i++){
          const c=lines[i].split(",").map(x=>x.trim().replace(/"/g,""));
          if(c[iInd]==="QUANTITY_IN_100KG"){const v=parseFloat(c[iVal]);if(!isNaN(v)){tonnes+=v/10;months.add(c[iPer]);monthsCovered.add(c[iPer]);}}
        }
        if(months.size>0){sectorTonnes[sec]={live:true,tonnes:(tonnes/months.size)*12,monthsObserved:months.size};gotAny=true;}
        else sectorTonnes[sec]=null;
      }catch{sectorTonnes[sec]=null;}
    }
    Object.keys(BASELINE_ANNUAL).forEach(sec=>{if(!sectorTonnes[sec])sectorTonnes[sec]={live:false,tonnes:BASELINE_ANNUAL[sec].tonnes,monthsObserved:0};});
    setComext2026({sectorTonnes,monthsCovered:[...monthsCovered],gotAny});
    setComextStatus("done");
  },[]);

  useEffect(()=>{if(tab==="clock"&&!clockInitRef.current){clockInitRef.current=true;fetchEts();fetchComext();}},[tab,fetchEts,fetchComext]);
  useEffect(()=>{
    if(tab!=="clock"){clearInterval(tickRef.current);return;}
    tickRef.current=setInterval(()=>setTick(t=>t+1),1000);
    return()=>clearInterval(tickRef.current);
  },[tab]);

  const etsPriceEur=etsLive||ets;
  const SECS_PER_YEAR=365.25*24*3600;
  const secsPassed=Math.max(0,(Date.now()-new Date("2026-01-01T00:00:00Z").getTime())/1000);
  const noLiveData=comextStatus==="done"&&!comext2026?.gotAny;

  function getClockCost(sf){
    if(!comext2026)return null;
    const sectors=sf==="All"?Object.keys(BASELINE_ANNUAL):[sf];
    let annualRate=0;
    sectors.forEach(sec=>{const e=comext2026.sectorTonnes[sec];if(e)annualRate+=e.tonnes*(SECTOR_AVG_DV[sec]||0)*etsPriceEur;});
    const perSec=annualRate/SECS_PER_YEAR;
    return{accrued:perSec*secsPassed,perSec,annualRate,perDay:perSec*86400,perHour:perSec*3600};
  }
  const clockData=getClockCost(clockSector);

  // Historical tab — cost = sum(tonnes_yr × mv2026 × ets) per sector
  const histByYear=HIST_YEARS.map(yr=>({
    year:yr,
    rows:["Iron & Steel","Aluminium","Fertilisers","Hydrogen","Cement"].map(sec=>({
      sector:sec,
      cbam:(HIST_COST_FACTOR[yr][sec]||0)*ets,
    })).filter(r=>r.cbam>0),
    total:["Iron & Steel","Aluminium","Fertilisers","Hydrogen","Cement"].reduce((s,sec)=>s+(HIST_COST_FACTOR[yr][sec]||0)*ets,0),
  }));

  const annualExpUSD=totExp*EUR_USD;
  const annualExpStr=annualExpUSD>=1e9?`$${(annualExpUSD/1e9).toFixed(2)}B`:annualExpUSD>=1e6?`$${(annualExpUSD/1e6).toFixed(1)}M`:`$${fmt(annualExpUSD)}`;

  return(
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Neuton:wght@400;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;}body{margin:0;}`}</style>
      <div style={{fontFamily:SANS,background:N.tealPale,minHeight:"100vh",color:N.teal900}}>



        {/* HEADER */}
        <div style={{background:N.teal800,color:N.white,padding:"18px 28px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div>
              <h1 style={{margin:0,fontFamily:SERIF,fontSize:24,fontWeight:700}}>US CBAM Exposure Dashboard (Beta)</h1>
              <p style={{margin:"4px 0 0",fontSize:12,color:N.tealLight,maxWidth:520}}>Maximum carbon costs for US exporters under the EU CBAM default values<br/>A.K.A. Forgone revenue for the federal government</p>
            </div>
            <div style={{fontSize:11,color:N.tealMid,textAlign:"right",lineHeight:1.9}}>
              <div>EU IR 2025/2621 · <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2621&qid=1773675297476#:~:text=United%20States" target="_blank" rel="noopener noreferrer" style={{color:N.tealMid,textDecoration:"underline"}}>Annex I (US)</a></div>
              <div>Trade: <a href="https://ec.europa.eu/eurostat/databrowser/product/view/ds-045409?category=ext_go.ext_go_detail" target="_blank" rel="noopener noreferrer" style={{color:N.tealMid,textDecoration:"underline"}}>Eurostat Comext DS-045409</a></div>
              <div style={{color:N.tealMid,fontWeight:600}}>Last updated: March 16, 2026</div>
            </div>
          </div>
          <div style={{display:"flex",gap:12,marginTop:14,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",borderRadius:6,overflow:"hidden",border:`1px solid ${N.tealMid}`}}>
              {YEARS.map(y=><button key={y} onClick={()=>setYear(y)} style={{padding:"7px 15px",border:"none",cursor:"pointer",fontFamily:SANS,fontSize:13,fontWeight:600,background:year===y?N.teal400:"transparent",color:year===y?N.teal900:N.tealLight}}>{y}</button>)}
            </div>
            <div style={{display:"flex",borderRadius:6,overflow:"hidden",border:`1px solid ${N.tealMid}`}}>
              {SECTORS.map(s=><button key={s} onClick={()=>setSector(s)} style={{padding:"7px 10px",border:"none",cursor:"pointer",fontFamily:SANS,fontSize:12,fontWeight:600,background:sector===s?N.teal600:"transparent",color:sector===s?N.white:N.tealLight}}>{s}</button>)}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.08)",padding:"7px 14px",borderRadius:6,border:`1px solid ${N.tealMid}`}}>
              <span style={{fontSize:12,color:N.tealLight}}>EU allowance prices:</span>
              <input type="range" min={30} max={130} value={ets} onChange={e=>setEts(+e.target.value)} style={{width:80,accentColor:N.teal400}}/>
              <span style={{fontSize:14,fontWeight:800,color:N.teal400,minWidth:80}}>€{ets} / ${(ets*EUR_USD).toFixed(0)} per ton</span>
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(148px,1fr))",gap:10,padding:"12px 24px 8px",background:N.white}}>
          <div style={{padding:"11px 14px",borderRadius:8,background:N.teal800,borderLeft:`4px solid ${N.teal600}`}}>
            <div style={{fontFamily:SANS,fontSize:11,color:"#aac4e8",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Total CBAM Exposure</div>
            <div style={{fontFamily:SERIF,fontSize:22,fontWeight:800,color:N.teal400,marginTop:2,lineHeight:1.1}}>
              {annualExpStr}<span style={{fontFamily:SANS,fontSize:12,fontWeight:600,color:"#aac4e8"}}> / year</span>
            </div>
            <div style={{fontFamily:SANS,fontSize:11,color:"#aac4e8",marginTop:3}}>est. · 2022–25 avg · ${(ets*EUR_USD).toFixed(0)}/t · {MKPCT[year]}</div>
          </div>
          <div style={{padding:"11px 14px",borderRadius:8,background:N.tealPale,borderLeft:`4px solid ${N.teal600}`}}>
            <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>CN Codes w/ Trade Data</div>
            <div style={{fontFamily:SANS,fontSize:18,fontWeight:800,color:N.teal800,marginTop:2}}>{enriched.filter(d=>d.tonnes&&d.tonnes>0).length}</div>
            <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,marginTop:2}}>of {enriched.length} total codes</div>
          </div>
          <div style={{padding:"11px 14px",borderRadius:8,background:N.tealPale,borderLeft:`4px solid ${N.tealMid}`}}>
            <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>US Exports to EU under CBAM</div>
            <div style={{fontFamily:SANS,fontSize:18,fontWeight:800,color:N.teal800,marginTop:2}}>{fmtM(totE)}</div>
            <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,marginTop:2}}>vs. <a href="https://ustr.gov/countries-regions/europe-middle-east/europe/european-union" target="_blank" rel="noopener noreferrer" style={{color:N.tealMid,textDecoration:"underline"}}>$414.4B</a> total US–EU exports</div>
          </div>
          <div style={{padding:"11px 14px",borderRadius:8,background:N.tealPale,borderLeft:`4px solid ${N.orange400}`}}>
            <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Effective Tariff Rate</div>
            <div style={{fontFamily:SANS,fontSize:18,fontWeight:800,color:N.orange500,marginTop:2}}>{totE>0?`${((totExp/totE)*100).toFixed(1)}%`:"—"}</div>
            <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,marginTop:2}}>est. annual cost as % of export value</div>
          </div>
        </div>

        {/* PILLS */}
        <div style={{display:"flex",gap:8,padding:"0 24px 10px",background:N.white,borderBottom:`3px solid ${N.teal600}`,flexWrap:"wrap"}}>
          {[{label:"CBAM definitive period",value:"Since 1 Jan 2026"},{label:"Certificates due",value:"30 Sep 2027"}].map(k=>(
            <div key={k.label} style={{display:"flex",alignItems:"center",gap:6,background:N.tealPale,borderRadius:20,padding:"4px 12px",border:`1px solid ${N.tealLight}`}}>
              <span style={{fontFamily:SANS,fontSize:11,color:N.tealMid,fontWeight:600}}>{k.label}:</span>
              <span style={{fontFamily:SANS,fontSize:11,color:N.teal800,fontWeight:700}}>{k.value}</span>
            </div>
          ))}
        </div>

        <div style={{background:N.tealPale,borderLeft:`4px solid ${N.tealMid}`,padding:"6px 24px",fontFamily:SANS,fontSize:12,color:N.teal900}}>
          <b>Data:</b> Default values from EU IR 2025/2621 Annex I (US). Trade: Eurostat Comext DS-045409 — matched at exact CN digit level (CN4/CN6/CN8) as listed in the regulation. Converted at fixed $1.08/€. CBAM cost = tonnes × default value (tCO₂e/t, incl. mark-up) × ETS price.
        </div>

        {/* TABS */}
        <div style={{display:"flex",padding:"0 24px",background:N.white,borderBottom:`1px solid ${N.tealLight}`,overflowX:"auto"}}>
          {[["clock","🔴 Live Cost Clock"],["historical","📅 Historical Baseline"],["table","📋 CN Code Table"],["chart","📊 Exposure by Code"],["methodology","📖 Methodology"],["faq","❓ FAQ"]].map(([t,lbl])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"11px 16px",border:"none",cursor:"pointer",fontFamily:SANS,fontSize:13,whiteSpace:"nowrap",borderBottom:tab===t?`3px solid ${N.teal600}`:"3px solid transparent",background:"none",fontWeight:tab===t?700:500,color:tab===t?N.teal800:N.tealMid}}>{lbl}</button>
          ))}
        </div>

        <div style={{padding:"18px 24px"}}>

          {tab==="clock"&&(
            <div>
              <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"stretch"}}>
                <div style={{background:N.white,border:`1.5px solid ${N.tealLight}`,borderRadius:8,padding:"10px 16px",display:"flex",gap:16,alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>EU ETS Price</div>
                    <div style={{fontFamily:SERIF,fontSize:26,fontWeight:700,color:etsStatus==="ok"?N.teal600:N.tealMid}}>
                      ${((etsLive||ets)*EUR_USD).toFixed(1)}<span style={{fontFamily:SANS,fontSize:13,fontWeight:400,color:N.tealMid}}>/t</span>
                    </div>
                    <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid}}>{etsStatus==="ok"?`Live · €${(etsLive||ets).toFixed(1)} × $1.08`:etsStatus==="loading"?"Fetching…":"Fallback · €71.5 × $1.08"}</div>
                  </div>
                  <button onClick={fetchEts} style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${N.teal400}`,background:"transparent",color:N.teal600,fontFamily:SANS,fontSize:12,fontWeight:600,cursor:"pointer"}}>↻</button>
                </div>
                <div style={{background:N.white,border:`1.5px solid ${N.tealLight}`,borderRadius:8,padding:"10px 16px"}}>
                  <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:6}}>Filter by Sector</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {["All",...Object.keys(BASELINE_ANNUAL)].map(s=>(
                      <button key={s} onClick={()=>setClockSector(s)} style={{padding:"5px 11px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:SANS,fontSize:12,fontWeight:600,background:clockSector===s?(SC[s]||N.teal600):SCL[s]||N.tealPale,color:clockSector===s?N.white:(SC[s]||N.teal800)}}>{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{background:N.white,border:`1.5px solid ${N.tealLight}`,borderRadius:8,padding:"10px 16px"}}>
                  <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Data Currently Showing</div>
                  <div style={{fontFamily:SANS,fontSize:13,marginTop:4,fontWeight:600,color:comextStatus==="done"&&comext2026?.gotAny?N.green600:N.tealMid}}>
                    {comextStatus==="idle"?"Not loaded":comextStatus==="loading"?"⟳ Fetching Comext…":comext2026?.gotAny?`✓ Live: ${comext2026.monthsCovered.join(", ")}`:"2022–25 baseline"}
                  </div>
                </div>
              </div>

              <div style={{background:N.teal900,borderRadius:16,padding:"36px 40px",marginBottom:20,textAlign:"center",position:"relative"}}>
                <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",border:`2px solid ${N.teal600}`,opacity:0.2,pointerEvents:"none"}}/>
                <div style={{position:"absolute",top:-30,right:-30,width:180,height:180,borderRadius:"50%",border:`2px solid ${N.teal400}`,opacity:0.15,pointerEvents:"none"}}/>
                <div style={{fontFamily:SANS,fontSize:12,fontWeight:700,letterSpacing:"0.15em",color:N.teal400,textTransform:"uppercase",marginBottom:6}}>
                  Estimated forgone tax revenue to date{clockSector!=="All"&&<span style={{color:SC[clockSector]||N.teal400}}> · {clockSector}</span>}
                </div>
                <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,marginBottom:14}}>
                  Accruing since January 1, 2026 · based on {comext2026?.gotAny?`live Comext data (latest: ${comext2026.monthsCovered.slice(-1)[0]}, retrieved March 16, 2026)`:"2022–25 baseline trade volumes"}
                </div>
                <div style={{fontFamily:SERIF,fontSize:48,fontWeight:700,color:N.white,lineHeight:1.1,marginBottom:8,minHeight:60}}>
                  {clockData?tickingNum(clockData.accrued,noLiveData):"Loading…"}
                </div>
                <div style={{fontFamily:SANS,fontSize:13,color:N.teal400,marginBottom:24}}>
                  Jan 1 – today · at ${((etsLive||ets)*EUR_USD).toFixed(1)}/tonne ETS · 10% mark-up · 2026 liability
                </div>
                <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}>
                  {[{label:"Per second",val:clockData?`$${(clockData.perSec*EUR_USD).toFixed(2)}`:"-"},{label:"Per hour",val:clockData?fmtM(clockData.perHour):"-"},{label:"Per day",val:clockData?fmtM(clockData.perDay):"-"},{label:"Annual rate",val:clockData?fmtM(clockData.annualRate):"-"}].map(k=>(
                    <div key={k.label} style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 18px",minWidth:110}}>
                      <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{k.label}</div>
                      <div style={{fontFamily:SERIF,fontSize:18,fontWeight:700,color:N.teal200,marginTop:2}}>{k.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {clockData&&comext2026&&(
                <div style={{background:N.white,borderRadius:10,padding:"18px 20px",border:`1px solid ${N.tealLight}`}}>
                  <h4 style={{fontFamily:SERIF,color:N.teal800,fontSize:16,margin:"0 0 14px"}}>Annual Rate by Sector</h4>
                  {Object.entries(BASELINE_ANNUAL).map(([sec])=>{
                    const d=getClockCost(sec),allCost=getClockCost("All");
                    const pct=d&&allCost&&allCost.annualRate>0?d.annualRate/allCost.annualRate*100:0;
                    const isLive=comext2026.sectorTonnes[sec]?.live;
                    return(
                      <div key={sec} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                        <span style={{fontFamily:SANS,width:110,fontSize:13,fontWeight:600,color:SC[sec]}}>{sec}</span>
                        <div style={{flex:1,height:20,background:N.tealLight,borderRadius:4,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct.toFixed(1)}%`,background:SC[sec],borderRadius:4}}/>
                        </div>
                        <span style={{fontFamily:SANS,fontSize:13,fontWeight:800,color:N.teal800,minWidth:80,textAlign:"right"}}>{d?fmtM(d.annualRate):"—"}</span>
                        <span style={{fontFamily:SANS,fontSize:11,padding:"2px 7px",borderRadius:8,background:isLive?N.green200:N.tealPale,color:isLive?N.green900:N.tealMid,fontWeight:600,minWidth:48,textAlign:"center"}}>{isLive?"live":"est."}</span>
                      </div>
                    );
                  })}
                  <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,marginTop:10,paddingTop:10,borderTop:`1px solid ${N.tealLight}`}}>
                    "Live" = annualised from actual 2026 Comext data. "Est." = 2022–25 baseline. Cost = tonnes × sector avg default value (tonnage-weighted, incl. 10% mark-up) × ETS price × $1.08/€.
                  </div>
                </div>
              )}

              <div style={{fontFamily:SANS,fontSize:12,color:N.tealMid,marginTop:12,padding:"10px 14px",background:N.yellow200,borderLeft:`4px solid ${N.yellow600}`,borderRadius:4}}>
                <b style={{color:N.yellow900}}>Framing note:</b> This counter shows the CBAM liability US exporters are accruing in 2026 that they cannot offset against a domestic carbon price — because the US has no national carbon pricing mechanism. If the US had a carbon price equivalent to the EU ETS, exporters could claim a deduction under CBAM rules, potentially reducing this liability to zero.
              </div>
              {noLiveData&&(
                <div style={{fontFamily:SANS,fontSize:12,color:N.tealMid,marginTop:8,padding:"10px 14px",background:N.tealPale,borderLeft:`4px solid ${N.tealMid}`,borderRadius:4}}>
                  * Extrapolated figure. No 2026 Comext trade data is available yet. Projected from 2022–25 average monthly volumes from January 1, 2026.
                </div>
              )}
            </div>
          )}

          {tab==="historical"&&(
            <div>
              <h3 style={{marginTop:0,fontFamily:SERIF,color:N.teal800,fontWeight:700,fontSize:20}}>Hypothetical CBAM Exposure on US Exports, 2022–2025</h3>
              <p style={{fontFamily:SANS,color:N.tealMid,fontSize:13,marginTop:-8,marginBottom:18}}>
                <i>If CBAM had applied to US exports in these years</i> — calculated at ETS price of ${(ets*EUR_USD).toFixed(1)}/t with 2026 mark-up (10%). Real annual tonnage from Eurostat Comext DS-045409. Converted at $1.08/€.
              </p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:24}}>
                {histByYear.map(y=>(
                  <div key={y.year} style={{background:N.white,borderRadius:10,padding:"16px 18px",border:`1px solid ${N.tealLight}`,borderTop:`4px solid ${N.teal600}`}}>
                    <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{y.year}</div>
                    <div style={{fontFamily:SERIF,fontSize:28,fontWeight:700,color:N.teal800,marginTop:4}}>{fmtM(y.total)}</div>
                    <div style={{fontFamily:SANS,fontSize:12,color:N.tealMid,marginTop:2}}>hypothetical CBAM exposure</div>
                    <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:4}}>
                      {y.rows.sort((a,b)=>b.cbam-a.cbam).map(r=>(
                        <div key={r.sector} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontFamily:SANS,fontSize:12,color:SC[r.sector],fontWeight:600}}>{r.sector}</span>
                          <span style={{fontFamily:SANS,fontSize:12,color:N.teal900,fontWeight:700}}>{fmtM(r.cbam)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <h4 style={{fontFamily:SERIF,color:N.teal800,fontSize:16,marginBottom:12}}>By Year {"&"} Sector</h4>
              {histByYear.map(y=>(
                <div key={y.year} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:SANS,fontSize:13,fontWeight:700,color:N.teal800}}>{y.year}</span>
                    <span style={{fontFamily:SANS,fontSize:13,fontWeight:800,color:N.teal600}}>{fmtM(y.total)}</span>
                  </div>
                  <div style={{height:28,display:"flex",borderRadius:6,overflow:"hidden",background:N.tealLight}}>
                    {y.rows.sort((a,b)=>b.cbam-a.cbam).map(r=>(
                      <div key={r.sector} title={`${r.sector}: ${fmtM(r.cbam)}`} style={{height:"100%",width:`${(r.cbam/y.total*100).toFixed(1)}%`,background:SC[r.sector]}}/>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:12,marginTop:5,flexWrap:"wrap"}}>
                    {y.rows.sort((a,b)=>b.cbam-a.cbam).map(r=>(
                      <div key={r.sector} style={{display:"flex",alignItems:"center",gap:4}}>
                        <div style={{width:10,height:10,borderRadius:2,background:SC[r.sector]}}/>
                        <span style={{fontFamily:SANS,fontSize:11,color:N.tealMid}}>{r.sector}: {fmtM(r.cbam)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{fontFamily:SANS,fontSize:12,color:N.tealMid,marginTop:16,padding:"10px 14px",background:N.tealPale,borderLeft:`4px solid ${N.tealMid}`,borderRadius:4}}>
                CBAM financial obligations only began January 1, 2026. These figures show what US exporters would have owed had CBAM applied in each prior year, using 2026 default values and mark-ups. Each row uses the actual year's tonnage matched at exact CN digit level.
              </div>
            </div>
          )}

          {tab==="table"&&(
            <>
              <div style={{display:"flex",gap:10,marginBottom:8,alignItems:"center"}}>
                <input placeholder="Search CN code or description…" value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"8px 14px",borderRadius:6,border:`1.5px solid ${N.tealLight}`,fontFamily:SANS,fontSize:13,width:280,outline:"none",color:N.teal900,background:N.white}}/>
                <span style={{fontFamily:SANS,fontSize:12,color:N.tealMid}}>{sorted.length} codes</span>
              </div>
              <p style={{fontFamily:SANS,fontSize:12,color:N.tealMid,marginTop:0,marginBottom:12,lineHeight:1.6}}>
                <b style={{color:N.teal800}}>Export Vol. & Trade Value</b> are EU imports from the US averaged over 2022–2025, sourced from Eurostat Comext (DS-045409), matched at exact CN digit level. CBAM Exposure = Export Vol. × Default Value (incl. mark-up) × ETS price × $1.08/€.
              </p>
              <div style={{overflowX:"auto",borderRadius:8,boxShadow:`0 1px 6px rgba(25,72,82,0.10)`,border:`1px solid ${N.tealLight}`}}>
                <table style={{width:"100%",borderCollapse:"collapse",background:N.white,fontSize:12}}>
                  <thead>
                    <tr style={{background:N.teal800}}>
                      <Th k="cn" label="CN Code"/><Th k="desc" label="Description"/>
                      <Th k="sector" label="Sector"/><Th k="route" label="Route"/>
                      <Th k="total" label={"Default\n(tCO₂e/t)"}/><Th k={mvf} label={`+${MKPCT[year]}\nMark-up`}/>
                      <Th k="cbamPerTonne" label={"$/t\nExported"}/><Th k="tonnes" label={"Export Vol.\n(t, 2022–25 avg)"}/>
                      <Th k="tradeEur" label={"Trade Value\n(2022–25 avg)"}/><Th k="cbamCost" label={"CBAM\nExposure / yr"}/>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((d,i)=>(
                      <tr key={d.cn+d.desc} style={{background:i%2===0?N.white:N.tealPale,borderBottom:`1px solid ${N.tealLight}`}}>
                        <td style={{padding:"8px 10px",fontWeight:700,color:N.teal600,whiteSpace:"nowrap",fontSize:11,fontFamily:SANS}}>{d.cn}</td>
                        <td style={{padding:"8px 10px",color:N.teal900,maxWidth:200,fontSize:11,fontFamily:SANS}}>{d.desc}</td>
                        <td style={{padding:"8px 10px"}}><span style={{background:SCL[d.sector],color:SC[d.sector],padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:700,fontFamily:SANS,whiteSpace:"nowrap"}}>{d.sector}</span></td>
                        <td style={{padding:"8px 10px",fontSize:11,color:N.tealMid,fontFamily:SANS}}>{d.route||"—"}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontWeight:600,color:N.teal900,fontFamily:SANS}}>{d.total!=null?d.total.toFixed(3):"—"}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:N.teal600,fontFamily:SANS}}>{d[mvf]!=null?d[mvf].toFixed(3):"—"}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:N.orange500,fontWeight:600,fontFamily:SANS}}>{d.cbamPerTonne!=null?`$${(d.cbamPerTonne*EUR_USD).toFixed(2)}`:"—"}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:N.tealMid,fontFamily:SANS}}>{d.tonnes&&d.tonnes>0?fmt(d.tonnes):"—"}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:N.teal900,fontFamily:SANS}}>{d.tradeEur&&d.tradeEur>0?fmtM(d.tradeEur):"—"}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontWeight:800,color:d.cbamCost?N.orange700:N.tealLight,fontFamily:SANS}}>{d.cbamCost?fmtM(d.cbamCost):"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{background:N.teal800,color:N.white}}>
                      <td colSpan={7} style={{padding:"9px 10px",fontFamily:SANS,fontWeight:700,color:N.tealLight}}>TOTAL ({sector})</td>
                      <td style={{padding:"9px 10px",textAlign:"right",fontFamily:SANS,fontWeight:700}}>{fmt(totT)}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",fontFamily:SANS,fontWeight:700}}>{fmtM(totE)}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",fontFamily:SANS,fontWeight:800,color:N.teal400}}>{fmtM(totExp)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,marginTop:14,padding:"12px 16px",background:N.white,border:`1px solid ${N.tealLight}`,borderRadius:6,lineHeight:1.8}}>
                <b style={{color:N.teal800,display:"block",marginBottom:8}}>Production Route Key</b>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"4px 24px"}}>
                  {[
                    ["A","Grey clinker / cement"],
                    ["B","White clinker / cement"],
                    ["C","Carbon steel — BF/BOF"],
                    ["D","Carbon steel — DRI/EAF"],
                    ["E","Carbon steel — Scrap/EAF"],
                    ["F","Low alloy steel — BF/BOF"],
                    ["G","Low alloy steel — DRI/EAF"],
                    ["H","Low alloy steel — Scrap/EAF"],
                    ["J","High alloy steel — EAF"],
                    ["K","Primary aluminium"],
                    ["L","Secondary aluminium"],
                  ].map(([r,d])=>(
                    <div key={r}>
                      <b style={{color:N.teal800}}>{r}</b> — {d}
                    </div>
                  ))}
                </div>
                <div style={{marginTop:8,borderTop:`1px solid ${N.tealLight}`,paddingTop:8}}>Where a CN code has multiple routes, each carries a distinct default value. See Methodology tab for how this dashboard handles route ambiguity.</div>
              </div>
            </>
          )}

          {tab==="chart"&&(
            <div>
              <h3 style={{marginTop:0,fontFamily:SERIF,color:N.teal800,fontWeight:700,fontSize:20}}>Top CN Codes by Estimated CBAM Exposure — {year}</h3>
              <p style={{fontFamily:SANS,color:N.tealMid,fontSize:13,marginTop:-8}}>ETS: €{ets} / ${(ets*EUR_USD).toFixed(0)} per tonne · Mark-up: {MKPCT[year]}</p>
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {chartData.map(d=>(
                  <div key={d.cn+d.desc}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,alignItems:"baseline"}}>
                      <span style={{fontFamily:SANS,fontSize:12,fontWeight:600,color:N.teal800}}>{d.cn} <span style={{fontWeight:400,color:N.tealMid}}>— {d.desc}</span></span>
                      <span style={{fontFamily:SANS,fontSize:12,fontWeight:800,color:SC[d.sector]}}>{fmtM(d.cbamCost)}</span>
                    </div>
                    <div style={{height:18,background:N.tealLight,borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(d.cbamCost/maxC*100).toFixed(1)}%`,background:SC[d.sector],borderRadius:4,transition:"width 0.3s"}}/>
                    </div>
                    <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,marginTop:2}}>
                      {d.tonnes&&d.tonnes>0?fmt(d.tonnes):0} t · {d[mvf]?.toFixed(3)} tCO₂e/t · ${(d.cbamPerTonne*EUR_USD).toFixed(2)}/t
                      <span style={{marginLeft:8,background:SCL[d.sector],color:SC[d.sector],padding:"1px 7px",borderRadius:8,fontWeight:700,fontFamily:SANS}}>{d.sector}</span>
                    </div>
                  </div>
                ))}
              </div>
              <h3 style={{marginTop:26,fontFamily:SERIF,color:N.teal800,fontWeight:700,fontSize:20}}>By Sector</h3>
              {Object.entries(enriched.filter(d=>d.cbamCost).reduce((acc,d)=>{acc[d.sector]=(acc[d.sector]||0)+d.cbamCost;return acc;},{})).sort((a,b)=>b[1]-a[1]).map(([sec,cost])=>(
                <div key={sec} style={{display:"flex",alignItems:"center",gap:12,marginBottom:9}}>
                  <span style={{fontFamily:SANS,width:110,fontSize:13,fontWeight:600,color:SC[sec]}}>{sec}</span>
                  <div style={{flex:1,height:20,background:N.tealLight,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(cost/totExp*100).toFixed(1)}%`,background:SC[sec],borderRadius:4}}/>
                  </div>
                  <span style={{fontFamily:SANS,fontSize:13,fontWeight:800,color:N.teal800,minWidth:80,textAlign:"right"}}>{fmtM(cost)}</span>
                  <span style={{fontFamily:SANS,fontSize:12,color:N.tealMid,minWidth:40}}>{((cost/totExp)*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}

          {tab==="methodology"&&(
            <div style={{maxWidth:760,fontFamily:SANS,fontSize:13,lineHeight:1.75,color:N.teal900}}>
              <h3 style={{fontFamily:SERIF,color:N.teal800,fontWeight:700,fontSize:22,marginTop:0}}>Calculation Methodology</h3>
              <div style={{background:N.tealPale,padding:18,borderRadius:8,borderLeft:`4px solid ${N.teal600}`,marginBottom:20}}>
                <p style={{margin:0,fontFamily:"monospace",fontSize:13,color:N.teal800}}><b>CBAM Cost ($) = Exported Tonnes × Default Value (tCO₂e/t, incl. mark-up) × ETS Price (€/tCO₂e) × 1.08</b></p>
                <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    ["Exported Tonnes","Annual quantity of goods exported from the US to the EU27, sourced from Eurostat Comext DS-045409, matched at exact CN digit level (CN4, CN6, or CN8) as listed in the regulation."],
                    ["Default Value (tCO₂e/t, incl. mark-up)","The embedded carbon intensity assigned to each product by EU IR 2025/2621 Annex I, expressed in tonnes of CO₂-equivalent per tonne of product. The mark-up column is used (see schedule below), which scales the base default value upward by a fixed percentage to account for the phase-in of CBAM obligations. This determines the number of CBAM certificates required per tonne exported. Note: these are conservative default values — if a manufacturer provides verified carbon intensity data, the actual levy could be significantly lower."],
                    ["Mark-up","A percentage applied to the base default value as CBAM obligations ramp up. For most sectors the mark-up is 10% in 2026, 20% in 2027, and 30% from 2028 onward. For fertilisers it remains at 1% throughout. The mark-up reflects the share of free EU ETS allowances still in circulation: as free allocations phase out by 2034, the mark-up will eventually reach 100%."],
                    ["ETS Price (€/tCO₂e)","The prevailing market price of one EU Emissions Trading System allowance, which equals the right to emit one tonne of CO₂-equivalent. The live price is fetched from Trading Economics; the slider allows scenario analysis. This is the price US exporters would effectively face per tonne of embedded carbon."],
                    ["× 1.08","Fixed EUR/USD conversion rate based on the 2022–24 ECB average. Actual CBAM certificate payments are denominated in euros."],
                  ].map(([term,def])=>(
                    <div key={term} style={{display:"flex",gap:12}}>
                      <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:N.teal800,minWidth:220,flexShrink:0}}>{term}</span>
                      <span style={{fontFamily:SANS,fontSize:12,color:N.tealMid,lineHeight:1.6}}>{def}</span>
                    </div>
                  ))}
                </div>
              </div>
              <h4 style={{fontFamily:SERIF,color:N.teal800,fontSize:16}}>Production Route Assumptions</h4>
              <p>Some CN codes carry multiple default values depending on the production route. Eurostat Comext trade data records tonnage at the CN code level without distinguishing routes, so a route assumption must be applied. This dashboard uses the following approach:</p>
              <ul style={{paddingLeft:20,lineHeight:1.8}}>
                <li><b>Aluminium:</b> All US aluminium exports are assigned Route K (primary aluminium), as this is the only route listed in Annex I for the US.</li>
                <li><b>Iron & Steel:</b> Where a CN code has both a carbon steel (Route C, BF/BOF) and a low alloy steel (Route F, BF/BOF) default value, a weighted average is applied reflecting the approximate US production mix: <b>92% Route C</b> and <b>8% Route F</b>. This ratio is consistent with current US steelmaking composition, where carbon steel dominates output.</li>
                <li><b>Cement:</b> Both grey (Route A) and white (Route B) clinker/cement entries are retained as separate rows. Given the negligible volume of US cement exports to the EU, the route ambiguity has no material effect on aggregate results.</li>
              </ul>
              <p>Each regulation entry is matched to Comext trade data at exactly the digit level stated in the regulation — CN8, CN6, or CN4. No padding or fallback aggregation is used. When the regulation lists a CN4 code, the Comext API returns the aggregate of all sub-codes for that heading automatically.</p>
              <h4 style={{fontFamily:SERIF,color:N.teal800,fontSize:16}}>Mark-up Schedule (IR 2025/2621)</h4>
              <table style={{width:"100%",borderCollapse:"collapse",background:N.white,borderRadius:8,overflow:"hidden",marginBottom:20,border:`1px solid ${N.tealLight}`}}>
                <thead><tr style={{background:N.teal800,color:N.white,fontSize:12}}>{["Sector","2026","2027","2028+"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:h==="Sector"?"left":"right",fontFamily:SANS}}>{h}</th>)}</tr></thead>
                <tbody>{[["Iron & Steel","10%","20%","30%"],["Aluminium","10%","20%","30%"],["Cement","10%","20%","30%"],["Hydrogen","10%","20%","30%"],["Fertilisers","1%","1%","1%"]].map((r,i)=>(
                  <tr key={r[0]} style={{borderBottom:`1px solid ${N.tealLight}`,background:i%2===0?N.white:N.tealPale}}>
                    {r.map((v,j)=><td key={j} style={{padding:"8px 12px",fontFamily:SANS,textAlign:j>0?"right":"left",fontWeight:j===0?600:400,color:j===0?SC[r[0]]||N.teal800:N.teal900}}>{v}</td>)}
                  </tr>
                ))}</tbody>
              </table>
              <h4 style={{fontFamily:SERIF,color:N.teal800,fontSize:16}}>Key Assumptions</h4>
              <ul style={{paddingLeft:20,lineHeight:1.8}}>
                <li><b>Exchange rate assumption:</b> Uses fixed 2022–24 average ($1.08/€). Actual CBAM payments occur in EUR.</li>
                <li><b>No free allocation offset:</b> Costs shown are gross CBAM liability before deduction for remaining EU ETS free allocations (phasing out by 2034).</li>
              </ul>
              <h4 style={{fontFamily:SERIF,color:N.teal800,fontSize:16}}>Caveats</h4>
              <ul style={{paddingLeft:20,lineHeight:1.8}}>
                <li><b>These are default values:</b> Default values are designed to be punitive to importers that do not provide verified emissions data. If a manufacturer provides verified carbon intensity data along with the goods, the actual levy would be significantly lower.
                  <ul style={{paddingLeft:20,marginTop:6,lineHeight:1.8}}>
                    <li><b>US steel values contested:</b> US steel production is predominantly electric arc furnace (EAF)-based; however, Annex I provides only BF/BOF-based default values for the US, which are therefore applied. As a result, default-based estimates may overstate emissions for US steel exports. Verified facility data could significantly lower actual CBAM costs. See also: <a href="https://clcouncil.org/report/itc-values-as-basis-for-cbam-emissions-intensity-defaults/" target="_blank" rel="noopener noreferrer" style={{color:N.teal600}}>US ITC estimates</a>.</li>
                  </ul>
                </li>
                <li><b>Payment timing:</b> Manufacturers are not obligated to pay for emissions from 2026 imports until September 2027.</li>
                <li><b>No supply-side adjustment:</b> This is a first approximation based on observed 2022–25 trade volumes. It does not account for any reduction in US exports to the EU that may result from the CBAM itself — exporters facing higher costs may divert shipments to other markets, which would lower the actual liability below these estimates.</li>
              </ul>
              <h4 style={{fontFamily:SERIF,color:N.teal800,fontSize:16}}>Sources</h4>
              <ul style={{paddingLeft:20,lineHeight:1.8}}>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2621" target="_blank" rel="noopener noreferrer" style={{color:N.teal600}}>EU Commission Implementing Regulation (EU) 2025/2621</a>, 16 December 2025 — Annex I (US)</li>
                <li><a href="https://ec.europa.eu/eurostat/databrowser/product/view/ds-045409?category=ext_go.ext_go_detail" target="_blank" rel="noopener noreferrer" style={{color:N.teal600}}>Eurostat Comext DS-045409</a> — annual data 2022–2025, matched at CN4/CN6/CN8 level</li>
                <li><a href="https://tradingeconomics.com/commodity/carbon" target="_blank" rel="noopener noreferrer" style={{color:N.teal600}}>EU ETS price: Trading Economics</a> (EU Carbon Permits, EUR/tonne)</li>
              </ul>
            </div>
          )}

          {tab==="faq"&&(
            <div style={{maxWidth:880,fontFamily:SANS,fontSize:13,lineHeight:1.75,color:N.teal900}}>
              <h3 style={{fontFamily:SERIF,color:N.teal800,fontWeight:700,fontSize:22,marginTop:0}}>Frequently Asked Questions</h3>
              <p style={{color:N.tealMid,marginTop:-6,marginBottom:18}}>
                Quick answers to the most common questions about how to interpret the dashboard, how CBAM obligations work, and what the core terms mean.
              </p>

              <div style={{display:"grid",gap:12,marginBottom:28}}>
                {FAQ_ITEMS.map(item=>(
                  <div key={item.q} style={{background:N.white,border:`1px solid ${N.tealLight}`,borderLeft:`4px solid ${N.teal600}`,borderRadius:10,padding:"16px 18px"}}>
                    <h4 style={{margin:"0 0 8px",fontFamily:SERIF,fontSize:18,color:N.teal800}}>{item.q}</h4>
                    <p style={{margin:0,color:N.tealMid,lineHeight:1.7}}>{item.a}</p>
                  </div>
                ))}
              </div>

              <h3 style={{fontFamily:SERIF,color:N.teal800,fontWeight:700,fontSize:22,marginBottom:14}}>Key Terms</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
                {KEY_TERMS.map(item=>(
                  <div key={item.term} style={{background:N.white,border:`1px solid ${N.tealLight}`,borderRadius:10,padding:"16px 18px"}}>
                    <div style={{fontFamily:SERIF,fontSize:17,fontWeight:700,color:N.teal800,marginBottom:8}}>{item.term}</div>
                    <div style={{fontSize:12.5,color:N.tealMid,lineHeight:1.7}}>{item.def}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer style={{background:N.teal900,color:N.tealLight,borderTop:`3px solid ${N.teal600}`}}>
          <div style={{padding:"28px 28px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,paddingBottom:16,borderBottom:`1px solid rgba(125,206,218,0.2)`}}>
              <NiskanenLogo/>
              <div style={{borderLeft:`1px solid ${N.tealMid}`,paddingLeft:16}}>
                <div style={{fontFamily:SANS,fontSize:12,fontWeight:700,color:N.teal400,letterSpacing:"0.1em",textTransform:"uppercase"}}>Climate & Energy</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
              {FOOTER_LINKS.map((lnk,i)=>(
                <a key={i} href={lnk.url} target="_blank" rel="noopener noreferrer"
                  style={{display:"block",background:"rgba(255,255,255,0.05)",border:`1px solid rgba(125,206,218,0.18)`,borderRadius:8,padding:"14px 16px",textDecoration:"none"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(125,206,218,0.1)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}
                >
                  <div style={{fontFamily:SERIF,fontSize:14,fontWeight:700,color:N.white,lineHeight:1.4,marginBottom:8}}>{lnk.title}</div>
                  <div style={{fontFamily:SANS,fontSize:11,color:N.tealMid,lineHeight:1.5}}>{lnk.desc}</div>
                  <div style={{marginTop:10,fontFamily:SANS,fontSize:11,color:N.teal400,fontWeight:600}}>Read →</div>
                </a>
              ))}
            </div>
          </div>
          <div style={{borderTop:`1px solid rgba(125,206,218,0.15)`,padding:"12px 28px"}}>
            <span style={{fontFamily:SANS,color:N.tealMid,fontSize:11}}>
              Niskanen Center · Climate & Energy · <a href="https://www.niskanencenter.org/newsletter/" target="_blank" rel="noopener noreferrer" style={{color:N.tealMid,textDecoration:"underline"}}>Subscribe to our newsletter</a> · March 2026
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
