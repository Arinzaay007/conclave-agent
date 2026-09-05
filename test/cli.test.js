import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProposal } from "../src/parse.js";
import { convene } from "../src/committee.js";
import { DryRunExecutor } from "../src/mcp.js";

const ACCOUNT = { spotBalanceUsd: 1000 };
const exec = new DryRunExecutor();

test("parses plain-English buy/sell with quantity and asset", () => {
  const a = parseProposal("yo buy 0.002 btc now");
  assert.equal(a.ok, true);
  assert.deepEqual(a.proposal.side, "BUY");
  assert.equal(a.proposal.symbol, "BTC");
  assert.equal(a.proposal.quantity, 0.002);

  const b = parseProposal("sell 1 ethereum");
  assert.equal(b.ok, true);
  assert.equal(b.proposal.side, "SELL");
  assert.equal(b.proposal.symbol, "ETH");
});

test("rejects unknown asset and missing quantity", () => {
  assert.equal(parseProposal("buy 5 dogecoin").ok, false);
  assert.equal(parseProposal("buy btc").ok, false);
});

test("human declining white-smoke means no order is sent", async () => {
  let executed = false;
  const decline = async () => false;
  const countingExecutor = {
    async execute(...args) { executed = true; return exec.execute(...args); },
  };
  const v = await convene({ side: "BUY", symbol: "BTC", quantity: 0.002 }, ACCOUNT, {
    dryRun: true, executor: countingExecutor, confirmOrder: decline,
  });
  assert.equal(v.approved, true);
  assert.equal(v.order.status, "DECLINED_BY_HUMAN");
  assert.equal(executed, false);
});

test("human accepting white smoke sends the simulated order", async () => {
  const accept = async () => true;
  const v = await convene({ side: "BUY", symbol: "BTC", quantity: 0.002 }, ACCOUNT, {
    dryRun: true, executor: exec, confirmOrder: accept,
  });
  assert.equal(v.order.status, "SIMULATED");
});
