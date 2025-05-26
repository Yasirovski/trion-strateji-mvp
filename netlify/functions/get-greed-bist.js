// netlify/functions/get-greed-bist.js
const yahooFinance = require('yahoo-finance2').default;

exports.handler = async () => {
  // BIST30 sembolleri
  const symbols = [
    "AKBNK.IS","ARCLK.IS","ASELS.IS","ASTOR.IS","BIMAS.IS",
    "EKGYO.IS","EUPWR.IS","FROTO.IS","GARAN.IS","GUBRF.IS",
    "HEKTS.IS","ISCTR.IS","KCHOL.IS","KONTR.IS","KRDMD.IS",
    "ODAS.IS","PETKM.IS","SAHOL.IS","SASA.IS","SISE.IS",
    "SMRTG.IS","TCELL.IS","THYAO.IS","TOASO.IS","TTKOM.IS",
    "TUPRS.IS","VAKBN.IS","YKBNK.IS","ZOREN.IS"
  ];

  // 1 yıl kapanış fiyatlarını çek
  const data = {};
  await Promise.all(symbols.map(async s => {
    try {
      const hist = await yahooFinance.historical(s, { period1: '1y', interval: '1d' });
      data[s] = hist.map(d => d.close);
    } catch (err) {
      console.warn(`Veri alınamadı: ${s}`, err.message);
    }
  }));

  // Son kapanış / bir önceki kapanış
  const last = symbols.map(s => data[s]?.slice(-1)[0] ?? 0);
  const prev = symbols.map(s => data[s]?.slice(-2, -1)[0] ?? 0);

  // Breadth (bugün yükselen hisse yüzdesi)
  const breadth = last.filter((v, i) => v > prev[i]).length / symbols.length * 100;

  // 52 haftalık en yükseklerin %99’unun üzerindeki hisse yüzdesi
  const highs = symbols.map(s => Math.max(...(data[s] || [0]).slice(-252)));
  const onHigh = last.filter((v, i) => v >= highs[i] * 0.99).length / symbols.length * 100;

  // Greed skoru
  const score = Math.round((breadth + onHigh) / 2 * 10) / 10;

  return {
    statusCode: 200,
    body: JSON.stringify({ value: score })
  };
};
