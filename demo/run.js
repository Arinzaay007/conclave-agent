#!/usr/bin/env node
/**
 * Conclave demo runner — nine scenarios, no funds touched.
 *   npm run demo       (deterministic rule personas)
 *   npm run demo:llm   (real LLM personas via .env)
 *
 *  1. Disciplined small BTC dip buy -> committee concurs -> WHITE SMOKE
 *  2. Memecoin FOMO (PEPE)           -> guardrail block (symbol)
 *  3. Oversized SOL chase            -> Risk veto
 *  4. Mid-range ETH, no edge         -> not unanimous -> no trade
 *  5. Small BNB diversification      -> reviewed, denied
 *  6. Trade over the notional cap     -> guardrail block ($ cap)
 *  7. Rushed sell of BNB              -> Risk veto (concentration)
 *  8. Zero-quantity order             -> guardrail block (bad quantity)
 *  9. Second tiny BTC tranche         -> committee concurs -> WHITE SMOKE
 *  Then: sealed-ballot audit trail summary + verdict summary.
 */
import fs from "node:fs";
import { convene } from "../src/committee.js";
import { DryRunExecutor } from "../src/mcp.js";
import { CONFIG } from "../src/config.js";

const ACCOUNT = { spotBalanceUsd: 1000 };
const executor = new DryRunExecutor();

const SCENARIOS = [
  {
    title: "Scenario 1 — A disciplined dip buy (small size)",
    proposal: { side: "BUY", symbol: "BTC", quantity: 0.0004, rationale: "BTC pulled back 4%, RSI oversold; small tranche" },
  },
  {
    title: "Scenario 2 — The memecoin FOMO",
    proposal: { side: "BUY", symbol: "PEPE", quantity: 20_000_000, rationale: "PEPE is up 41%, everyone says moon" },
  },
  {
    title: "Scenario 3 — The oversized chase",
    proposal: { side: "BUY", symbol: "SOL", quantity: 2.5, rationale: "SOL breaking out, load up" },
  },
  {
    title: "Scenario 4 — A mid-range trade with no edge",
    proposal: { side: "BUY", symbol: "ETH", quantity: 0.05, rationale: "ETH looks fine, maybe buy" },
  },
  {
    title: "Scenario 5 — A small, uneventful alt buy",
    proposal: { side: "BUY", symbol: "BNB", quantity: 0.2, rationale: "diversify with a little BNB" },
  },
  {
    title: "Scenario 6 — A trade that blows past the size cap",
    proposal: { side: "BUY", symbol: "BTC", quantity: 1, rationale: "go big on BTC" },
  },
  {
    title: "Scenario 7 — A rushed sell into a dip",
    proposal: { side: "SELL", symbol: "BNB", quantity: 0.5, rationale: "panic sell, market's crashing" },
  },
  {
    title: "Scenario 8 — A malformed order (zero quantity)",
    proposal: { side: "BUY", symbol: "ETH", quantity: 0, rationale: "maybe buy some ETH?" },
  },
  {
    title: "Scenario 9 — A second, disciplined tiny tranche",
    proposal: { side: "BUY", symbol: "BTC", quantity: 0.0003, rationale: "add one more small BTC tranche" },
  },
];

const line = "─".repeat(72);

async function main() {
  console.log(`\n${"=".repeat(72)}
   CONCLAVE — three agents, locked room, one verdict.
   Binance Agent OS Mini Hackathon · Track A
   mode: ${CONFIG.DRY_RUN ? "DRY RUN (no funds touched)" : "LIVE"} · personas: ${CONFIG.LLM_MODE}
${"=".repeat(72)}\n`);

  const outcomes = [];
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
    outcomes.push({ title: s.title, smoke: v.smoke, reason: v.reason });
  }

  // ── Audit trail summary ────────────────────────────────────────────────
  console.log("=".repeat(72));
  console.log("   SEALED-BALLOT AUDIT TRAIL (commit–reveal)");
  console.log("=".repeat(72));
  try {
    const reveals = fs.readFileSync(`${CONFIG.ATTEST_DIR}/reveals.jsonl`, "utf8").trim().split("\n").map(JSON.parse);
    console.log(`   ballots sealed & revealed: ${reveals.length}`);
    for (const r of reveals.slice(0, 6)) {
      console.log(`   ${r.verified ? "✅" : "❌"} ${r.ballot.persona.padEnd(6)} ${r.sealed.hash.slice(0, 22)}…  vote=${r.ballot.decision.vote}`);
    }
    if (reveals.length > 6) console.log(`   …and ${reveals.length - 6} more`);
    const allVerified = reveals.every((r) => r.verified);
    console.log(`   every revealed ballot matches its pre-verdict seal: ${allVerified ? "YES ✅" : "NO ❌"}`);
  } catch {
    console.log("   (no ballot file found)");
  }
  console.log("\n   In live mode these seal hashes are emitted to BSC testnet BEFORE");
  console.log("   the order, so every decision is independently reconstructable.\n");

  console.log("=".repeat(72));
  console.log("   SUMMARY");
  console.log("=".repeat(72));
  for (const o of outcomes) console.log(`   ${o.smoke === "WHITE_SMOKE" ? "⚪" : "⚫"} ${o.title.replace(/Scenario \d+ — /, "")}  →  ${o.reason}`);
  console.log("");
}

main().catch((e) => { console.error(e); process.exit(1); });
