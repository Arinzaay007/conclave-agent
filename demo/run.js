#!/usr/bin/env node
/**
 * Conclave demo runner — three scenarios, no keys required.
 *   npm run demo
 *
 *  1. Disciplined buy  : BTC dip      -> committee concurs  -> WHITE SMOKE
 *  2. Memecoin chase   : PEPE FOMO    -> guardrail + veto   -> BLACK SMOKE
 *  3. Oversized chase  : SOL too big  -> Risk veto          -> BLACK SMOKE
 */
import { convene } from "../src/committee.js";
import { DryRunExecutor } from "../src/mcp.js";
import { CONFIG } from "../src/config.js";

const ACCOUNT = { spotBalanceUsd: 1000 };
const executor = new DryRunExecutor();

const SCENARIOS = [
  {
    title: "Scenario 1 — A disciplined dip buy (small size)",
    proposal: { side: "BUY", symbol: "BTC", quantity: 0.002, rationale: "BTC pulled back 4%, RSI oversold; small tranche" },
  },
  {
    title: "Scenario 2 — The memecoin FOMO",
    proposal: { side: "BUY", symbol: "PEPE", quantity: 20_000_000, rationale: "PEPE is up 41%, everyone says moon" },
  },
  {
    title: "Scenario 3 — The oversized chase",
    proposal: { side: "BUY", symbol: "SOL", quantity: 2.5, rationale: "SOL breaking out, load up" },
  },
];

const line = "─".repeat(72);

async function main() {
  console.log(`\n${"=".repeat(72)}
   CONCLAVE — three agents, locked room, one verdict.
   Binance Agent OS Mini Hackathon · Track A
   mode: ${CONFIG.DRY_RUN ? "DRY RUN (no funds touched)" : "LIVE"}
${"=".repeat(72)}\n`);

  for (const s of SCENARIOS) {
    console.log(line);
    console.log(`  ${s.title}`);
    console.log(`  proposal: ${s.proposal.side} ${s.proposal.quantity} ${s.proposal.symbol} — "${s.proposal.rationale}"`);
    console.log(line);

    const v = await convene(s.proposal, ACCOUNT, { dryRun: true, executor });

    for (const t of v.trace) console.log(`   ${t}`);

    console.log("");
    if (v.approved) {
      console.log("   ⚪ WHITE SMOKE — the committee concurs. Order presented for human confirmation.");
      if (v.order) console.log(`      → ${v.order.status}: ${v.order.side} ${v.order.quantity} ${v.order.symbol} (~$${v.order.notionalUsd.toFixed(2)}) [${v.order.id}]`);
    } else {
      console.log(`   ⚫ BLACK SMOKE — no trade. (${v.reason})`);
    }
    console.log("");
  }

  console.log(`${"=".repeat(72)}
   Sealed ballots written to ./ballots/ (commit-reveal audit trail).
   In live mode the ballot hashes are emitted to BSC testnet before the order.
${"=".repeat(72)}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
