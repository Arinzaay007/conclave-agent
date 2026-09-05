#!/usr/bin/env node
/**
 * Conclave interactive session.
 *   npm run chat          (dry-run by default — no funds touched)
 *   DRY_RUN=false npm run chat   (live: needs BINANCE_MCP_TOKEN)
 *
 * Type a trade in plain English — "buy 0.002 btc" — watch the committee
 * debate, and confirm the order if the smoke turns white.
 */
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { convene } from "./committee.js";
import { DryRunExecutor, LiveMcpExecutor } from "./mcp.js";
import { CONFIG } from "./config.js";
import { parseProposal } from "./parse.js";

const BANNER = `
====================================================================
   CONCLAVE — three agents, locked room, one verdict.
   mode: ${CONFIG.DRY_RUN ? "DRY RUN (no funds touched)" : "LIVE (Agent OS)"} · personas: ${CONFIG.LLM_MODE}
   Type a trade, e.g.  buy 0.002 btc   |   sell 1 eth   |   quit
====================================================================`;

async function main() {
  console.log(BANNER);
  const rl = readline.createInterface({ input: stdin, output: stdout });

  // Buffered reader: readline only delivers a line to a question() listener
  // that is attached when the line arrives. Lines that arrive while we're
  // awaiting the committee would otherwise be dropped, so we queue them.
  const buffer = [];
  let waiters = [];
  rl.on("line", (l) => {
    const w = waiters.shift();
    if (w) w(l); else buffer.push(l);
  });
  rl.on("close", () => { for (const w of waiters) w(null); waiters = []; });
  const ask = (prompt) =>
    new Promise((resolve) => {
      stdout.write(prompt);
      if (buffer.length) return resolve(buffer.shift());
      waiters.push(resolve);
    });

  // Live: one shared Agent OS MCP client feeds both data (quote/account) and
  // order execution. Dry-run: simulated executor + default account.
  let mcpClient = null;
  let executor;
  if (CONFIG.DRY_RUN) {
    executor = new DryRunExecutor();
  } else {
    const { BinanceMcpClient } = await import("./binance-mcp.js");
    mcpClient = await new BinanceMcpClient().connect();
    executor = new LiveMcpExecutor({ mcpClient });
    console.log("   connected to Agent OS MCP.");
  }
  const account = { spotBalanceUsd: 1000 };

  // Human confirmation gate (only reached on white smoke).
  const confirmOrder = async ({ proposal, notionalUsd }) => {
    if (CONFIG.REQUIRE_HUMAN_CONFIRM) {
      const a = await ask(`\n   ⚪ WHITE SMOKE. Send ${proposal.side} ${proposal.quantity} ${proposal.symbol} (~$${notionalUsd.toFixed(2)})? [yes/no] `);
      return /^(y|yes)$/i.test((a ?? "").trim());
    }
    return true;
  };

  while (true) {
    const raw = await ask("\nconclave> ");
    if (raw == null) break; // EOF
    const line = raw.trim();
    if (!line) continue;
    if (/^(quit|exit|q)$/i.test(line)) break;

    const parsed = parseProposal(line);
    if (!parsed.ok) { console.log(`   ${parsed.error}`); continue; }

    const v = await convene(parsed.proposal, account, { dryRun: CONFIG.DRY_RUN, executor, confirmOrder, mcpClient });
    console.log("");
    for (const t of v.trace) console.log(`   ${t}`);
    console.log("");
    console.log(v.approved
      ? `   Verdict: ⚪ WHITE SMOKE (${v.reason})`
      : `   Verdict: ⚫ BLACK SMOKE — no trade (${v.reason})`);
    if (v.order) console.log(`   Order: ${v.order.status}${v.order.id ? " " + v.order.id : ""}`);
  }

  rl.close();
  console.log("\nSession ended. Ballots in ./ballots/.");
}

main().catch((e) => { console.error(e); process.exit(1); });
