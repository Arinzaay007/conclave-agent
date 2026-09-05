#!/usr/bin/env node
/**
 * CONCLAVE — BLACK SMOKE clip.
 * Reckless trades the committee / guardrails stop.
 *   npm run demo:reds      (rules)
 *   npm run demo:reds:llm  (real LLM)
 */
import { runScenarios } from "./_runner.js";

await runScenarios({
  title: "CONCLAVE — BLACK SMOKE",
  subtitle: "reckless trades the committee stops",
  scenarios: [
    { title: "Memecoin FOMO (PEPE)", proposal: { side: "BUY", symbol: "PEPE", quantity: 20_000_000, rationale: "PEPE up 41%, everyone says moon" } },
    { title: "Oversized SOL chase", proposal: { side: "BUY", symbol: "SOL", quantity: 2.5, rationale: "SOL breaking out, load up" } },
    { title: "Trade over the size cap", proposal: { side: "BUY", symbol: "BTC", quantity: 1, rationale: "go big on BTC" } },
    { title: "Panic sell into a dip", proposal: { side: "SELL", symbol: "BNB", quantity: 0.5, rationale: "dump it, market's crashing" } },
    { title: "Zero-quantity malformed order", proposal: { side: "BUY", symbol: "ETH", quantity: 0, rationale: "maybe buy some ETH?" } },
  ],
});
