import { test } from "node:test";
import assert from "node:assert/strict";
import { convene } from "../src/committee.js";
import { DryRunExecutor } from "../src/mcp.js";
import { parseVerdict } from "../src/llm.js";

const ACCOUNT = { spotBalanceUsd: 1000 };
const exec = new DryRunExecutor();
const goVerdict = { vote: "GO", confidence: 80, reason: "mock approves", model: "mock-llm" };

test("valid model JSON is parsed into a verdict", () => {
  const v = parseVerdict('Here is my take: {"vote":"NO-GO","confidence":92,"reason":"too big"} done');
  assert.equal(v.vote, "NO-GO");
  assert.equal(v.confidence, 92);
  assert.equal(v.invalid, false);
});

test("malformed / missing JSON fails closed to NO-GO", () => {
  const v = parseVerdict("I think you should definitely buy this one!!");
  assert.equal(v.vote, "NO-GO");
  assert.equal(v.invalid, true);
  const v2 = parseVerdict('{"vote":"MAYBE","confidence":50}');
  assert.equal(v2.vote, "NO-GO");
  assert.equal(v2.invalid, true);
});

test("LLM mode: three GO verdicts from the model produce white smoke and mark the source", async () => {
  const mockLLM = { enabled: true, decide: async () => ({ ...goVerdict }) };
  const v = await convene({ side: "BUY", symbol: "BTC", quantity: 0.002 }, ACCOUNT, { dryRun: true, executor: exec, llm: mockLLM });
  assert.equal(v.approved, true);
  assert.equal(v.smoke, "WHITE_SMOKE");
  assert.ok(v.ballots.every((b) => b.decision.source.startsWith("llm")));
});

test("LLM failure fails closed: a throwing client never approves a trade", async () => {
  const mockLLM = { enabled: true, decide: async () => { throw new Error("rate limited"); } };
  const v = await convene({ side: "BUY", symbol: "BTC", quantity: 0.002 }, ACCOUNT, { dryRun: true, executor: exec, llm: mockLLM });
  assert.equal(v.approved, false);
  // Risk persona failing closed carries a veto
  assert.equal(v.reason, "RISK_VETO");
});
