#!/usr/bin/env node
/**
 * CONCLAVE — full demo (greens + reds together).
 *   npm run demo       (deterministic rules)
 *   npm run demo:llm   (real LLM personas)
 * For themed clips use: demo/greens.js and demo/reds.js.
 */
import { runScenarios } from "./_runner.js";

await runScenarios({
  title: "CONCLAVE — three agents, locked room, one verdict.",
  subtitle: "full session: disciplined trades approved, reckless ones stopped",
  scenarios: [
    { title: "Small BTC dip tranche", proposal: { side: "BUY", symbol: "BTC", quantity: 0.0004, rationale: "BTC pulled back 4%, RSI oversold; small tranche" } },
    { title: "Memecoin FOMO (PEPE)", proposal: { side: "BUY", symbol: "PEPE", quantity: 20_000_000, rationale: "PEPE is up 41%, everyone says moon" } },
    { title: "Oversized SOL chase", proposal: { side: "BUY", symbol: "SOL", quantity: 2.5, rationale: "SOL breaking out, load up" } },
    { title: "Mid-range ETH, no edge", proposal: { side: "BUY", symbol: "ETH", quantity: 0.05, rationale: "ETH looks fine, maybe buy" } },
    { title: "Small BNB diversifier", proposal: { side: "BUY", symbol: "BNB", quantity: 0.2, rationale: "diversify with a little BNB" } },
    { title: "Trade over the size cap", proposal: { side: "BUY", symbol: "BTC", quantity: 1, rationale: "go big on BTC" } },
    { title: "Panic sell into a dip", proposal: { side: "SELL", symbol: "BNB", quantity: 0.5, rationale: "dump it, market's crashing" } },
    { title: "Zero-quantity malformed order", proposal: { side: "BUY", symbol: "ETH", quantity: 0, rationale: "maybe buy some ETH?" } },
    { title: "Second disciplined tranche", proposal: { side: "BUY", symbol: "BTC", quantity: 0.0003, rationale: "add one more small BTC tranche" } },
  ],
});
