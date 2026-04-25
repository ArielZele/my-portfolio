export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).json({
    GOOGL:330.47, AAPL:266.17, CIFR:18.04, IREN:45.17,
    NVDA:199.88, HOOD:86.43, LMND:66.06, IAU:88.04,
    TATT:35.84, QQQM:265.31, CIBR:68.04, USDILS:3.65,
    "1213594_IL":4143, "1159250_IL":228250, "1168723_IL":2055,
    _source:"baseline", _updated:new Date().toISOString()
  });
}
