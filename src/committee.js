/**
 * The Conclave loop.
 *
 *  1. Guardrails gate the proposal (hard block, no debate).
 *  2. Each persona casts a sealed ballot (hash-committed).
 *  3. Ballots are revealed and tallied. The Risk Officer holds a veto.
 *  4. Verdict: WHITE SMOKE (go) or BLACK SMOKE (vetoed).
 *  5. White smoke + human confirmation -> order via the MCP executor.
 *
 * The same orchestration runs in dry-run (fixtures, simulated order) and live
 * (Binance Agent OS MCP server).
 */
import { CONFIG } from "./config.js";
import { getQuote } from "./marketdata.js";
import { runGuardrails } from "./guardrails.js";
import { PERSONAS } from "./personas.js";
import { sealBallot, revealBallot } from "./ballots.js";
import { LLMClient } from "./llm.js";
import { createChainSealer } from "./chain.js";

export async function convene(proposal, account, { dryRun = CONFIG.DRY_RUN, executor, llm, chainSealer, confirmOrder } = {}) {
  const opts = { confirmOrder };
  const trace = [];
  const log = (msg) => trace.push(msg);

  // LLM mode resolution: a shared client for all personas. Rules are the
  // deterministic fallback so the loop stays reproducible without keys.
  const client = llm === undefined ? new LLMClient() : llm;
  const useLLM = CONFIG.LLM_MODE === "llm" || (CONFIG.LLM_MODE === "auto" && client?.enabled);

  const quote = await getQuote(proposal.symbol, { dryRun });
  log(`evidence: ${quote.symbol} @ $${quote.price} | RSI ${quote.rsi14.toFixed(0)} | 24h ${quote.change24hPct.toFixed(1)}% | vol ${quote.volatility24hPct.toFixed(1)}% | spread ${quote.spreadBps} bps (${quote.source})`);

  // ── 1. Guardrails ──────────────────────────────────────────────
  const gates = runGuardrails(proposal, quote);
  if (!gates.passed) {
    for (const b of gates.blocked) log(`🚫 guardrail ${b.code}: ${b.message}`);
    return verdict("BLACK_SMOKE", "GUARDRAIL_BLOCK", trace, { gates, quote });
  }
  log(`guardrails passed: $${gates.notionalUsd.toFixed(2)} notional, ${gates.checks.length} checks`);

  // ── 2. Deliberation — decide, then seal each ballot BEFORE the tally ─────
  const evidence = { quote, notionalUsd: gates.notionalUsd, account, proposal };
  const sealer = chainSealer === undefined ? createChainSealer() : chainSealer;

  const ballots = [];
  for (const p of Object.values(PERSONAS)) {
    const decision = await decide(p, evidence, { useLLM, client });
    const ballot = { persona: p.id, name: p.name, proposal, decision };

    // Commit the exact bytes we will later reveal — before any verdict/order.
    const sealed = sealBallot(ballot);
    if (sealer) {
      try {
        sealed.anchor = await sealer.seal(sealed.hash); // BSC testnet
        log(`⛓️  ${p.name} ballot anchored on-chain: ${sealed.anchor.txHash.slice(0, 12)}…`);
      } catch (err) {
        log(`⚠️  on-chain anchor failed for ${p.name} (${String(err.message).slice(0, 60)}); local seal stands`);
      }
    }
    revealBallot(sealed, ballot);
    ballots.push({ ...ballot, sealed });
    log(`${p.emoji} ${p.name} [${decision.source}]: ${decision.vote} (${decision.confidence}%) — ${decision.reason}`);
  }

  // ── 3. Tally ───────────────────────────────────────────────────
  const risk = ballots.find((b) => b.persona === "risk");
  const goVotes = ballots.filter((b) => b.decision.vote === "GO").length;
  const vetoed = risk?.decision?.veto === true || risk?.decision?.vote === "NO-GO";
  const unanimous = goVotes === ballots.length;

  let smoke, reason;
  if (vetoed) {
    smoke = "BLACK_SMOKE"; reason = "RISK_VETO";
  } else if (CONFIG.UNANIMOUS_TO_TRADE && !unanimous) {
    smoke = "BLACK_SMOKE"; reason = "NOT_UNANIMOUS";
  } else {
    smoke = "WHITE_SMOKE"; reason = "COMMITTEE_CONCURS";
  }

  const v = verdict(smoke, reason, trace, { gates, quote, ballots, goVotes });

  // ── 4. Human confirmation, then execute on white smoke ──────────
  if (smoke === "WHITE_SMOKE" && executor) {
    const approved = opts.confirmOrder ? await opts.confirmOrder({ proposal, notionalUsd: gates.notionalUsd, quote }) : true;
    if (!approved) {
      v.order = { status: "DECLINED_BY_HUMAN", mode: dryRun ? "DRY_RUN" : "LIVE" };
      log("order: declined by the human — nothing sent.");
    } else {
      v.order = await executor.execute(proposal, { dryRun, notionalUsd: gates.notionalUsd, quote });
      log(`order: ${v.order.status} ${v.order.side} ${v.order.quantity} ${v.order.symbol} (${v.order.mode})${v.order.id ? " id=" + v.order.id : ""}`);
    }
  }
  return v;
}

/**
 * Resolve a persona's verdict.
 *  - LLM mode  : ask the model; on error/malformed output fail closed to NO-GO.
 *  - rules mode: deterministic rule stand-in (reproducible, testable, no keys).
 * The Risk persona can veto via decision.veto or a NO-GO vote.
 */
async function decide(persona, evidence, { useLLM, client }) {
  if (useLLM && client) {
    try {
      const d = await client.decide(persona, evidence);
      return { ...d, veto: persona.veto ? d.veto === true || d.vote === "NO-GO" : undefined, source: `llm:${d.model || "?"}` };
    } catch (err) {
      // Fail closed: if LLM_MODE forces an LLM and it errors, the persona votes NO-GO.
      return { vote: "NO-GO", confidence: 0, reason: `LLM error (${err.message.slice(0, 80)}) — fail closed`, veto: persona.veto ? true : undefined, source: "llm-error", invalid: true };
    }
  }
  return { ...persona.decide(evidence), source: "rules" };
}

function verdict(smoke, reason, trace, extra) {
  return {
    smoke,
    reason,
    approved: smoke === "WHITE_SMOKE",
    trace,
    at: new Date().toISOString(),
    ...extra,
  };
}
