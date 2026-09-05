#!/usr/bin/env node
/**
 * CONCLAVE — GREEN SMOKE clip.
 * Disciplined, small, well-sized trades the committee unanimously approves —
 * a patient dollar-cost-averaging sequence on an oversold dip.
 *   npm run demo:greens      (rules)
 *   npm run demo:greens:llm  (real LLM)
 */
import { runScenarios } from "./_runner.js";

await runScenarios({
  title: "CONCLAVE — GREEN SMOKE",
  subtitle: "disciplined trades the committee approves",
  scenarios: [
    { title: "Starter BTC tranche", proposal: { side: "BUY", symbol: "BTC", quantity: 0.0003, rationale: "BTC dipped, RSI oversold; start a small position" } },
    { title: "Add on further weakness", proposal: { side: "BUY", symbol: "BTC", quantity: 0.0002, rationale: "price dipped again; add a second small tranche" } },
    { title: "Scale in a little more", proposal: { side: "BUY", symbol: "BTC", quantity: 0.00025, rationale: "continue the DCA plan, modest size" } },
    { title: "Slightly larger tranche", proposal: { side: "BUY", symbol: "BTC", quantity: 0.0004, rationale: "conviction is higher here; still well within risk limits" } },
    { title: "Final small top-up", proposal: { side: "BUY", symbol: "BTC", quantity: 0.00015, rationale: "top up with a tiny tranche, keep powder dry" } },
  ],
});
