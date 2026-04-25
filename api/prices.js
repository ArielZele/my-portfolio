export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300");
  
  try {
    const symbols = "GOOGL,AAPL,CIFR,IREN,NVDA,HOOD,LMND,IAU,TATT,QQQM,CIBR,USDILS=X,1213594.TA,1159250.TA,1168723.TA";
    const url = `https://query2.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=1d&interval=1d`;
    
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    
    const d = await r.json();
    const results = {};
    
    for (const [sym, val] of Object.entries(d.spark?.result || {})) {
      const price = val?.response?.[0]?.meta?.regularMarketPrice;
      const clean = sym === "USDILS=X" ? "USDILS" : sym.replace(".TA", "_IL");
      if (price) results[clean] = price;
    }
    
    if (!results.USDILS || results.USDILS < 3) results.USDILS = 3.65;
    results._source = "Yahoo Finance";
    results._updated = new Date().toISOString();
    
    const T = process.env.TELEGRAM_TOKEN;
    const C = process.env.TELEGRAM_CHAT_ID;
    if (T && C && Object.keys(results).length > 3) {
      await sendAlerts(results, T, C);
    }
    
    return res.status(200).json(results);
    
  } catch(e) {
    return res.status(200).json({
      GOOGL:330.47, AAPL:266.17, CIFR:18.04, IREN:45.17,
      NVDA:199.88, HOOD:86.43, LMND:66.06, IAU:88.04,
      TATT:35.84, QQQM:265.31, CIBR:68.04, USDILS:3.65,
      "1213594_IL":4143, "1159250_IL":228250, "1168723_IL":2055,
      _source:"fallback", _error:e.message, _updated:new Date().toISOString()
    });
  }
}

const ENTRIES = {
  GOOGL:174.46, AAPL:223.9, CIFR:14.76, IREN:36.63,
