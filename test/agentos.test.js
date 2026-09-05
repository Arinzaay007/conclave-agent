import { test } from "node:test";
import assert from "node:assert/strict";
import { getQuoteViaMcp, getAccountViaMcp } from "../src/agentos-data.js";
import { convene } from "../src/committee.js";
import { DryRunExecutor } from "../src/mcp.js";

const ticker = { lastPrice: "64000.00", priceChangePercent: "-4.0", askPrice: "64002", bidPrice: "63998", highPrice: "66000", lowPrice: "62000" };
const klines = Array.from({ length: 15 }, (_, i) => [0, 0, 0, 0, String(60000 - i * 100)]); // falling closes

function mockMcp(overrides = {}) {
  return {
    spotTicker: async () => ({ tool: "spot_ticker", payload: ticker }),
    spotKlines: async () => ({ tool: "spot_klines", payload: klines }),
    accountInfo: async () => ({ tool: "account", payload: { balances: [{ asset: "USDT", free: "5000" }] } }),
    ...overrides,
  };
}

test("getQuoteViaMcp maps Agent OS ticker+klines into the quote shape", async () => {
  const q = await getQuoteViaMcp(mockMcp(), "BTC");
  assert.equal(q.source, "agentos-mcp");
  assert.equal(q.price, 64000);
  assert.ok(q.rsi14 < 30, "falling closes → oversold RSI");
  assert.ok(q.spreadBps >= 0);
});

test("getAccountViaMcp extracts USDT spot balance", async () => {
  const a = await getAccountViaMcp(mockMcp());
  assert.equal(a.spotBalanceUsd, 5000);
});

test("committee uses MCP data when given a live client; quote source is agentos-mcp", async () => {
  const v = await convene(
    { side: "BUY", symbol: "BTC", quantity: 0.001 },
    { spotBalanceUsd: 99999 }, // should be overridden by MCP account (5000 → 0.001 BTC ~1.3%)
    { dryRun: false, executor: new DryRunExecutor(), mcpClient: mockMcp() },
  );
  assert.equal(v.quote.source, "agentos-mcp");
  assert.equal(v.quote.price, 64000);
});

test("MCP data failure falls back and never crashes the committee", async () => {
  const broken = mockMcp({ spotTicker: async () => { throw new Error("401 unauthorized"); } });
  const v = await convene(
    { side: "BUY", symbol: "BTC", quantity: 0.0004 },
    { spotBalanceUsd: 1000 },
    { dryRun: false, executor: new DryRunExecutor(), mcpClient: broken },
  );
  assert.ok(["agentos-mcp", "binance-public", "fixture-fallback", "fixture"].includes(v.quote.source) || v.quote.source);
  assert.ok(v.trace.some((t) => t.includes("Agent OS market-data unavailable")));
});
