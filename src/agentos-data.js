/**
 * Agent OS MCP data adapter.
 *
 * Pulls market data and read-only account info through the connected Agent OS
 * MCP server (the intended live data source — public REST is geo-fenced in
 * some regions). Mapping is defensive: exact tool result shapes are confirmed
 * with `node scripts/check-agentos.mjs`, and any number we can't extract stays
 * undefined so the caller can fall back.
 */
import { rsi } from "./marketdata.js";

const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v !== "" ? parseFloat(v) : NaN);
const numOr = (v, d) => (Number.isFinite(num(v)) ? num(v) : d);

/** Convert a MCP ticker payload (object or array row) into our quote shape. */
function mapTicker(symbol, payload) {
  const t = Array.isArray(payload) ? payload[0] : payload;
  if (!t || typeof t !== "object") return null;
  const price = numOr(t.lastPrice ?? t.price ?? t.closePrice ?? t.c, NaN);
  if (!Number.isFinite(price)) return null;

  let vol = num(t.volatility24hPct);
  if (!Number.isFinite(vol)) {
    const hi = num(t.highPrice), lo = num(t.lowPrice);
    if (Number.isFinite(hi) && Number.isFinite(lo) && price > 0) vol = ((hi - lo) / price) * 100;
  }
  let spread = num(t.spreadBps);
  if (!Number.isFinite(spread)) {
    const ask = num(t.askPrice), bid = num(t.bidPrice);
    if (Number.isFinite(ask) && Number.isFinite(bid) && price > 0) spread = ((ask - bid) / price) * 10000;
  }

  return {
    symbol: symbol.toUpperCase(),
    source: "agentos-mcp",
    price,
    rsi14: NaN, // computed from klines below when available
    change24hPct: numOr(t.priceChangePercent ?? t.change24hPct ?? t.priceChange, 0),
    volatility24hPct: Number.isFinite(vol) ? vol : NaN,
    spreadBps: Number.isFinite(spread) ? spread : NaN,
  };
}

function closesFromKlines(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.klines ?? payload?.data ?? [];
  return rows
    .map((k) => (Array.isArray(k) ? num(k[4]) : num(k.close ?? k.closePrice ?? k.c)))
    .filter(Number.isFinite);
}

export async function getQuoteViaMcp(client, symbol) {
  const { tool: tTool, payload: ticker } = await client.spotTicker(symbol);
  const quote = mapTicker(symbol, ticker);
  if (!quote) throw new Error(`ticker from ${tTool} had no parseable price`);

  // Try klines for a real RSI; tolerate absence.
  try {
    const { payload: klines } = await client.spotKlines(symbol);
    const closes = closesFromKlines(klines);
    if (closes.length >= 15) quote.rsi14 = rsi(closes, 14);
  } catch { /* kline tool may not exist — fall through */ }

  // Fill any metric we couldn't derive with neutral-but-safe values.
  quote.rsi14 = numOr(quote.rsi14, 50);
  quote.volatility24hPct = numOr(quote.volatility24hPct, 4);
  quote.spreadBps = numOr(quote.spreadBps, 10);
  quote.change24hPct = numOr(quote.change24hPct, 0);
  return quote;
}

/** Extract total spot (USDT) balance from an account payload. */
export async function getAccountViaMcp(client) {
  const { payload } = await client.accountInfo();
  const balances = Array.isArray(payload) ? payload : payload?.balances ?? payload?.assets ?? [];
  let usdt = NaN;
  for (const b of balances) {
    const asset = b.asset ?? b.coin ?? b.symbol;
    const free = num(b.free ?? b.available ?? b.balance);
    if (asset === "USDT" && Number.isFinite(free)) usdt = free;
  }
  return { spotBalanceUsd: Number.isFinite(usdt) ? usdt : undefined, source: "agentos-mcp", raw: payload };
}
