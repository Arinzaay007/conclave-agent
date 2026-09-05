import { test } from "node:test";
import assert from "node:assert/strict";
import { convene } from "../src/committee.js";
import { DryRunExecutor } from "../src/mcp.js";
import { runGuardrails } from "../src/guardrails.js";
import { hashBallot, canonical } from "../src/ballots.js";

const ACCOUNT = { spotBalanceUsd: 1000 };
const exec = new DryRunExecutor();

test("oversold BTC dip reaches white smoke and places a simulated order", async () => {
  const v = await convene({ side: "BUY", symbol: "BTC", quantity: 0.002 }, ACCOUNT, { dryRun: true, executor: exec });
  assert.equal(v.approved, true);
  assert.equal(v.smoke, "WHITE_SMOKE");
  assert.equal(v.order.status, "SIMULATED");
});

test("memecoin outside allowlist is blocked at the guardrail — never debated", async () => {
  const v = await convene({ side: "BUY", symbol: "PEPE", quantity: 1e7 }, ACCOUNT, { dryRun: true, executor: exec });
  assert.equal(v.approved, false);
  assert.equal(v.reason, "GUARDRAIL_BLOCK");
  assert.ok(v.gates.blocked.some((b) => b.code === "SYMBOL_NOT_ALLOWED"));
  assert.equal(v.ballots, undefined); // personas were never convened
});

test("oversized SOL position is vetoed by the Risk Officer", async () => {
  const v = await convene({ side: "BUY", symbol: "SOL", quantity: 2.5 }, ACCOUNT, { dryRun: true, executor: exec });
  assert.equal(v.approved, false);
  assert.equal(v.reason, "RISK_VETO");
  const risk = v.ballots.find((b) => b.persona === "risk");
  assert.equal(risk.decision.vote, "NO-GO");
});

test("notional cap guardrail rejects trades above $500", async () => {
  const g = runGuardrails({ symbol: "BTC", quantity: 1 }, { price: 64200, spreadBps: 3 });
  assert.equal(g.passed, false);
  assert.ok(g.blocked.some((b) => b.code === "NOTIONAL_CAP"));
});

test("ballot hashes are deterministic and tamper-evident", () => {
  const ballot = { persona: "risk", decision: { vote: "NO-GO", confidence: 92 } };
  const h1 = hashBallot(ballot);
  const h2 = hashBallot({ ...ballot });
  const h3 = hashBallot({ ...ballot, decision: { ...ballot.decision, confidence: 91 } });
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
  // canonical form is key-order independent
  assert.equal(canonical({ a: 1, b: 2 }), canonical({ b: 2, a: 1 }));
});
