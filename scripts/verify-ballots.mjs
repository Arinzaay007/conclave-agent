#!/usr/bin/env node
/**
 * Verify the local ballot trail against the BSC testnet emitter.
 *
 *   export CONCLAVE_BALLOT_EMITTER=0x...
 *   node scripts/verify-ballots.mjs
 *
 * Reads ballots/reveals.jsonl, recomputes each ballot hash, and checks that
 * the hash exists among the commitHashes sealed on-chain. Exit code 0 only if
 * every revealed ballot is (a) locally consistent and (b) anchored on-chain.
 */
import fs from "node:fs";
import { CONFIG } from "../src/config.js";
import { hashBallot } from "../src/ballots.js";
import { BallotChainSealer, BSC_TESTNET_RPC } from "../src/chain.js";

const emitter = CONFIG.BALLOT_EMITTER;
if (!emitter) {
  console.error("Set CONCLAVE_BALLOT_EMITTER to the deployed BallotEmitter address.");
  process.exit(1);
}
const revealsPath = new URL("../ballots/reveals.jsonl", import.meta.url);
if (!fs.existsSync(revealsPath)) {
  console.error("No ballots/reveals.jsonl found — run `npm run demo` or a live session first.");
  process.exit(1);
}

const reveals = fs
  .readFileSync(revealsPath, "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

const sealer = new BallotChainSealer({ rpc: BSC_TESTNET_RPC, key: "0x" + "11".repeat(32), emitter });
const onChain = new Set((await sealer.sealedHashes()).map((e) => e.hash.toLowerCase()));

let ok = 0, bad = 0;
for (const r of reveals) {
  const recomputed = hashBallot(r.ballot);
  const consistent = recomputed === r.sealed.hash && r.verified === true;
  const anchored = onChain.has(r.sealed.hash.toLowerCase());
  const status = consistent && anchored ? "✅ ON-CHAIN" : consistent ? "⚠️  LOCAL ONLY" : "❌ MISMATCH";
  if (consistent && anchored) ok++; else bad++;
  console.log(`${status}  ${r.ballot.persona.padEnd(6)} ${r.sealed.hash.slice(0, 18)}… ${r.ballot.decision.vote}`);
}
console.log(`\n${ok} verified on-chain, ${bad} not fully anchored.`);
process.exit(bad === 0 ? 0 : 2);
