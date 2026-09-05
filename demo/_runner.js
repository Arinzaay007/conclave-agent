/**
 * Shared scenario runner for the demo clips.
 *  - clears the ballot dir so each clip's audit trail counts only its ballots
 *  - runs each scenario through the committee (dry-run, simulated orders)
 *  - prints per-scenario verdicts, the sealed-ballot audit trail, and summary
 */
import fs from "node:fs";
import path from "node:path";
import { convene } from "../src/committee.js";
import { DryRunExecutor } from "../src/mcp.js";
import { CONFIG } from "../src/config.js";

const line = "─".repeat(72);

export async function runScenarios({ title, subtitle, scenarios, account = { spotBalanceUsd: 1000 } }) {
  // Fresh audit trail per clip.
  fs.rmSync(CONFIG.ATTEST_DIR, { recursive: true, force: true });

  console.log(`\n${"=".repeat(72)}
   ${title}
   ${subtitle}
   Binance Agent OS Mini Hackathon · Track A
   mode: ${CONFIG.DRY_RUN ? "DRY RUN (no funds touched)" : "LIVE"} · personas: ${CONFIG.LLM_MODE}
${"=".repeat(72)}\n`);

  const executor = new DryRunExecutor();
  const outcomes = [];

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    console.log(line);
    console.log(`  Proposal ${i + 1} — ${s.title}`);
    console.log(`  ${s.proposal.side} ${s.proposal.quantity} ${s.proposal.symbol} — "${s.proposal.rationale}"`);
    console.log(line);

    const v = await convene(s.proposal, account, { dryRun: true, executor });
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

  // Audit trail
  console.log("=".repeat(72));
  console.log("   SEALED-BALLOT AUDIT TRAIL (commit–reveal)");
  console.log("=".repeat(72));
  try {
    const reveals = fs.readFileSync(path.join(CONFIG.ATTEST_DIR, "reveals.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
    console.log(`   ballots sealed & revealed: ${reveals.length}`);
    for (const r of reveals.slice(0, 9)) {
      console.log(`   ${r.verified ? "✅" : "❌"} ${r.ballot.persona.padEnd(6)} ${r.sealed.hash.slice(0, 22)}…  vote=${r.ballot.decision.vote}`);
    }
    if (reveals.length > 9) console.log(`   …and ${reveals.length - 9} more`);
    console.log(`   every revealed ballot matches its pre-verdict seal: ${reveals.every((r) => r.verified) ? "YES ✅" : "NO ❌"}`);
  } catch {
    console.log("   (no ballot file found)");
  }
  console.log("\n   In live mode these seal hashes are emitted to BSC testnet BEFORE");
  console.log("   the order, so every decision is independently reconstructable.\n");

  console.log("=".repeat(72));
  console.log("   SUMMARY");
  console.log("=".repeat(72));
  for (const o of outcomes) console.log(`   ${o.smoke === "WHITE_SMOKE" ? "⚪" : "⚫"} ${o.title}  →  ${o.reason}`);
  console.log("");
}
