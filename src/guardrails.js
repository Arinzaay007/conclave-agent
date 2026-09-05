/**
 * Deterministic pre-trade guardrails.
 *
 * Runs before the committee is even convened. A FAIL here means the proposal
 * never reaches the personas — hard block, no debate. The model never touches
 * these values; they are code, not prompts.
 */
import { CONFIG } from "./config.js";

export function runGuardrails(proposal, quote) {
  const checks = [];
  const fail = (code, message) => checks.push({ code, message, pass: false });
  const pass = (code, message) => checks.push({ code, message, pass: true });

  // 1. Symbol allowlist — blocks hallucinated or unvetted assets.
  const symbol = proposal.symbol.toUpperCase();
  if (!CONFIG.ALLOWED_SYMBOLS.includes(symbol)) {
    fail("SYMBOL_NOT_ALLOWED", `${symbol} is not on the allowlist (${CONFIG.ALLOWED_SYMBOLS.join(", ")})`);
  } else {
    pass("SYMBOL_ALLOWED", `${symbol} is on the allowlist`);
  }

  // 2. Notional cap.
  const notional = proposal.quantity * quote.price;
  if (notional > CONFIG.MAX_NOTIONAL_USD) {
    fail("NOTIONAL_CAP", `$${notional.toFixed(2)} exceeds the $${CONFIG.MAX_NOTIONAL_USD} per-trade cap`);
  } else {
    pass("NOTIONAL_WITHIN_CAP", `$${notional.toFixed(2)} within the $${CONFIG.MAX_NOTIONAL_USD} cap`);
  }

  // 3. Slippage / spread collar (wide spreads = illiquid, reject).
  if (quote.spreadBps > CONFIG.MAX_SLIPPAGE_BPS) {
    fail("SPREAD_TOO_WIDE", `${quote.spreadBps} bps spread exceeds ${CONFIG.MAX_SLIPPAGE_BPS} bps collar`);
  } else {
    pass("SPREAD_WITHIN_COLLAR", `${quote.spreadBps} bps spread within collar`);
  }

  // 4. Only spot buys/sells of sane size (no zero / negatives / NaN).
  if (!(proposal.quantity > 0)) {
    fail("BAD_QUANTITY", `quantity ${proposal.quantity} is not a positive number`);
  } else {
    pass("QUANTITY_VALID", `quantity ${proposal.quantity} valid`);
  }

  const blocked = checks.filter((c) => !c.pass);
  return {
    passed: blocked.length === 0,
    notionalUsd: notional,
    checks,
    blocked,
  };
}
