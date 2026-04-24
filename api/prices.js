const TICKERS = ["GOOGL","AAPL","CIFR","IREN","NVDA","HOOD","LMND","IAU","TATT","QQQM","CIBR","USDILS=X"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300");
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${TICKERS.join(",")}&fields=regularMarketPrice,regularMarketChangePercent`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = await response.json();
    const results = {};
    (data?.quoteResponse?.result || []).forEach(q => {
      const sym = q.symbol === "USDILS=X" ? "USDILS" : q.symbol;
      results[sym] = q.regularMarketPrice || null;
      results[sym + "_chg"] = q.regularMarketChangePercent || 0;
    });
    results["_updated"] = new Date().toISOString();
    results["_source"] = "Yahoo Finance";
    const T = process.env.TELEGRAM_TOKEN, C = process.env.TELEGRAM_CHAT_ID;
    if (T && C) await checkAndAlert(results, T, C);
    return res.status(200).json(results);
  } catch (err) {
    return res.status(200).json({ GOOGL:330.47,AAPL:266.17,CIFR:18.04,IREN:45.17,NVDA:199.88,HOOD:86.43,LMND:66.06,IAU:88.04,TATT:35.84,QQQM:265.31,CIBR:68.04,USDILS:3.65,_source:"fallback",_updated:new Date().toISOString() });
  }
}

const ENTRIES = { GOOGL:174.46,AAPL:223.9,CIFR:14.76,IREN:36.63,NVDA:126.98,HOOD:86.86,LMND:42.93,IAU:66.0,TATT:39.51 };
const ETFS = ["IAU","QQQM","CIBR"];

async function checkAndAlert(prices, token, chatId) {
  const alerts = [];
  for (const [sym, entry] of Object.entries(ENTRIES)) {
    const cur = prices[sym]; if (!cur) continue;
    const chg = ((cur - entry) / entry) * 100;
    const thr = ETFS.includes(sym) ? 5 : 8;
    if (Math.abs(chg) >= thr) alerts.push(`${chg>0?"🟢":"🔴"} *${sym}* ${chg>0?"📈 עלה":"📉 ירד"} ${Math.abs(chg).toFixed(1)}% מהכניסה\nכניסה: $${entry} | נוכחי: $${cur.toFixed(2)}\n👉 שקול פעימה הבאה`);
  }
  if (!alerts.length) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ chat_id:chatId, text:`🔔 *התראות תיק — ${new Date().toLocaleDateString("he-IL")}*\n\n${alerts.join("\n\n")}`, parse_mode:"Markdown" }) });
}
