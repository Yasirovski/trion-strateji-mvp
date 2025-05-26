// netlify/functions/get-greed-usa.js
const yahooFinance = require('yahoo-finance2').default;

exports.handler = async () => {
  try {
    // VXN volatilite endeksi yok, QQQ üzerinden proxy hesaplayacağız
    const hist = await yahooFinance.historical('QQQ', { period1: '1y', interval: '1d' });
    const closes = hist.map(d => d.close);
    // Günlük getiri volatilitesi (30 günlük rolling)
    const returns = closes.map((v,i,arr) => i>0 ? (v/arr[i-1] - 1) : 0).slice(1);
    const rollingStd = [];
    for (let i = 29; i < returns.length; i++) {
      const window = returns.slice(i-29, i+1);
      const mean = window.reduce((a,b)=>a+b,0)/window.length;
      const variance = window.reduce((a,b)=>a+Math.pow(b-mean,2),0)/window.length;
      rollingStd.push(Math.sqrt(variance));
    }
    const lastVol = rollingStd[rollingStd.length - 1] * Math.sqrt(252) * 100;
    const score = Math.round(lastVol * 10) / 10;
    return { statusCode: 200, body: JSON.stringify({ value: score }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
