import { test } from "node:test";
import assert from "node:assert/strict";
import { getQuote, rsi } from "../src/marketdata.js";

test("dry-run returns the deterministic fixture", async () => {
  const q = await getQuote("btc", { dryRun: true });
  assert.equal(q.source, "fixture");
  assert.equal(q.symbol, "BTC");
  assert.ok(q.price > 0);
});

test("live fetch degrades to fixture-fallback on geo-block / bad shape (never crashes)", async () => {
  // Force a live call; in a geo-fenced environment it must fall back, not throw.
  const q = await getQuote("ETH", { dryRun: false });
  assert.equal(q.symbol, "ETH");
  assert.ok(["binance-public", "fixture-fallback"].includes(q.source));
  if (q.source === "fixture-fallback") assert.ok(typeof q.warning === "string");
});

test("rsi is bounded and deterministic", () => {
  const down = Array.from({ length: 20 }, (_, i) => 100 - i);
  const up = Array.from({ length: 20 }, (_, i) => 100 + i);
  assert.ok(rsi(down) < 30);
  assert.equal(rsi(up), 100);
});
