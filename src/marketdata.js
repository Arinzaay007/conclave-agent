/**
 * Market data layer.
 *
 * In DRY_RUN this returns a deterministic fixture (fallback) so the full
 * committee flow can be demoed with no API keys and no network.
 *
 * In live mode it pulls public spot data from Binance — the same data the
 * Agent OS MCP market-data tools expose. Live MCP wiring lives in mcp.js.
 */

const FALLBACK_QUOTES = {
  BTC: { price: 64200, rsi14: 31.0, change24hPct: -4.2, volatility24hPct: 2.8, spreadBps: 3 },
  ETH: { price: 3050, rsi14: 48.0, change24hPct: -0.6, volatility24hPct: 3.4, spreadBps: 5 },
  BNB: { price: 604, rsi14: 55.0, change24hPct: 1.2, volatility24hPct: 2.1, spreadBps: 6 },
  SOL: { price: 148, rsi14: 72.0, change24hPct: 6.8, volatility24hPct: 5.9, spreadBps: 12 },
  PEPE: { price: 0.0000118, rsi14: 88.0, change24hPct: 41.0, volatility24hPct: 22.0, spreadBps: 85 },
  USDC: { price: 1.0, rsi14: 50.0, change24hPct: 0.0, volatility24hPct: 0.05, spreadBps: 1 },
  USDT: { price: 1.0, rsi14: 50.0, change24hPct: 0.0, volatility24hPct: 0.05, spreadBps: 1 },
};

export async function getQuote(symbol, { dryRun = true } = {}) {
  if (dryRun) {
    const q = FALLBACK_QUOTES[symbol.toUpperCase()];
    if (!q) throw new Error(`No fixture for ${symbol}`);
    return { symbol: symbol.toUpperCase(), source: "fixture", ...q };
  }
  // Live: public Binance spot data (no auth needed for klines/ticker).
  const sym = symbol.toUpperCase() + "USDT";
  const [ticker, klines] = await Promise.all([
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`).then((r) => r.json()),
    fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1h&limit=15`).then((r) => r.json()),
  ]);
  const closes = klines.map((k) => parseFloat(k[4]));
  return {
    symbol: symbol.toUpperCase(),
    source: "binance-public",
    price: parseFloat(ticker.lastPrice),
    rsi14: rsi(closes, 14),
    change24hPct: parseFloat(ticker.priceChangePercent),
    volatility24hPct: parseFloat(ticker.priceChangePercent) < 0
      ? Math.abs(parseFloat(ticker.priceChangePercent)) * 0.7
      : parseFloat(ticker.priceChangePercent),
    spreadBps: Math.round(((parseFloat(ticker.askPrice) - parseFloat(ticker.bidPrice)) / parseFloat(ticker.lastPrice)) * 10000),
  };
}

/** Standard 14-period RSI (Wilder). Deterministic; used by the Quant persona. */
export function rsi(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
