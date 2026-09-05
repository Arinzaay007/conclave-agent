import { test } from "node:test";
import assert from "node:assert/strict";
import { convene } from "../src/committee.js";
import { DryRunExecutor } from "../src/mcp.js";
import { createChainSealer } from "../src/chain.js";

const ACCOUNT = { spotBalanceUsd: 1000 };
const exec = new DryRunExecutor();

test("without keys configured, no chain sealer is created (local hashing only)", () => {
  delete process.env.BSC_PRIVATE_KEY;
  assert.equal(createChainSealer(), null);
});

test("committee anchors each sealed ballot with the chain sealer", async () => {
  const sealed = [];
  const mockSealer = { seal: async (hash) => { sealed.push(hash); return { txHash: "0xmock" + sealed.length, block: 100 }; } };
  const v = await convene({ side: "BUY", symbol: "BTC", quantity: 0.002 }, ACCOUNT, { dryRun: true, executor: exec, chainSealer: mockSealer });
  assert.equal(v.approved, true);
  assert.equal(sealed.length, 3, "one anchor per persona");
  // Anchored hash must equal the revealed ballot hash
  for (const b of v.ballots) assert.ok(sealed.includes(b.sealed.hash));
  assert.ok(v.trace.some((t) => t.includes("anchored on-chain")));
});

test("a failing chain anchor does not block the committee", async () => {
  const flakySealer = { seal: async () => { throw new Error("rpc unreachable"); } };
  const v = await convene({ side: "BUY", symbol: "BTC", quantity: 0.002 }, ACCOUNT, { dryRun: true, executor: exec, chainSealer: flakySealer });
  assert.equal(v.approved, true);
  assert.ok(v.trace.some((t) => t.includes("on-chain anchor failed")));
});
