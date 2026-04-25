const US_TICKERS = ["GOOGL","AAPL","CIFR","IREN","NVDA","HOOD","LMND","IAU","TATT","QQQM","CIBR"];
const IL_TICKERS = ["1213594.TA","1159250.TA","1168723.TA","1235985.TA","310324.TA","USDILS=X"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300");
  try {
    const all = [...US_TICKERS, ...IL_TICKERS].join(",");
    const cookieRes = await fetch("https://finance.yahoo.com/", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    const cookies = cookieRes.headers.get("set-cookie") || "";
    const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": "Mozilla/5.0", "Cookie": cookies.split(";")[0] }
    });
    const crumb = await crumbRes.text();
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${all}&crumb=${encodeURIComponent(crumb)}`;
    const quoteRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Cookie": cookies.split(";")[0], "Accept": "application/json" }
    });
    const data = await quoteRes.json();
    const quotes = data?.quoteResponse?.result || [];
    if (quotes.length === 0) throw new Error("empty");
    const results = {};
    quotes.forEach(q => {
      let sym = q.symbol;
      if (sym === "USDILS=X") sym = "USDILS";
      else if (sym.endsWith(".TA")) sym = sym.replace(".TA","_IL");
      results[sym] = q.regularMarketPrice || null;
      results[sym + "_chg"] = q.regularMarketChangePercent || 0;
    });
    // Fix USD/ILS — Yahoo sometimes returns inverted rate
    if (results["USDILS"] && results["USDILS"] < 2) results["USDILS"] = 1 / results["USDILS"];
    if (!results["USDILS"] || results["USDILS"] < 3) results["USDILS"] = 3.65;
    results["_updated"] = new Date().toISOString();
    results["_source"] = "Yahoo Finance";
    const T = process.env.TELEGRAM_TOKEN, C = process.env.TELEGRAM_CHAT_ID;
    if (T && C) await checkAndAlert(results, T, C);
    return res.status(200).json(results);
  } catch (err) {
    return res.status(200).json({
      GOOGL:330.47,AAPL:266.17,CIFR:18.04,IREN:45.17,NVDA:199.88,
      HOOD:86.43,LMND:66.06,IAU:88.04,TATT:35.84,QQQM:265.31,CIBR:68.04,
      USDILS:3.65,"1213594_IL":4143,"1159250_IL":228250,"1168723_IL":2055,
      "1235985_IL":8380,"310324_IL":2100,
      _source:"fallback",_error:err.message,_updated:new Date().toISOString()
    });
  }
}

const ENTRIES = {
  GOOGL:174.46,AAPL:223.9,CIFR:14.76,IREN:36.63,NVDA:126.98,
  HOOD:86.86,LMND:42.93,IAU:66.0,TATT:39.51,
  "1213594_IL":3843.66,"1159250_IL":213400,"1168723_IL":1026,
  "1235985_IL":0,"310324_IL":0
};
const ETFS = ["IAU","QQQM","CIBR","1213594_IL","1159250_IL","1168723_IL","1235985_IL","310324_IL"];

async function checkAndAlert(prices, token, chatId) {
  const alerts = [];
  for (const [sym, ent
