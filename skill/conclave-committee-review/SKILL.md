---
title: Conclave Committee Review
description: >-
  Pre-trade investment-committee review for Binance Spot orders. Whenever the
  user wants to place or is about to place a trade, run it through three
  personas — Bull (momentum), Quant (statistics/entry quality), and Risk
  Officer (size/liquidity, absolute veto) — plus deterministic guardrails.
  Use this BEFORE any order. Blocks FOMO, oversized, and illiquid trades;
  only a unanimous white-smoke verdict reaches the confirm step. No
  withdrawal actions are ever taken.
metadata:
  version: 1.0.0
  author: Arinzaay007
  repo: https://github.com/Arinzaay007/conclave-agent
license: MIT
---

# Conclave — Committee Trade Review

An AI trade should not be a single black box. Before placing **any** Binance
Spot order, convene a three-member committee and require a unanimous verdict.

## When to use
Trigger this skill whenever the user asks to buy/sell, says something like
"buy the dip", "ape", "load up", "should I buy", or an order is about to be
placed. Always run it **before** calling a trade/order tool.

## Step 1 — Hard guardrails first (deterministic, not the model's call)
Reject immediately (do not debate, do not order) if any fail:
- **Symbol allowlist:** only BTC, ETH, BNB, SOL, USDC, USDT unless the user
  explicitly asks to extend it.
- **Notional cap:** refuse a single order above **$500** (or the user's
  configured cap).
- **Liquidity collar:** refuse if bid/ask spread is wider than **100 bps**.
- **Quantity:** must be a positive, finite number.
State which guardrail failed and stop.

## Step 2 — Gather evidence (read-only tools)
Fetch for the asset: current price, RSI(14), 24h % change, 24h volatility,
bid/ask spread, and the sub-account USDT balance. Compute the trade's notional
and its size as a % of the balance.

## Step 3 — Three ballots (each returns GO / NO-GO, confidence %, one reason)
- 🐂 **Bull (momentum):** upside, oversold bounces, 24h flows, breakouts.
- 📊 **Quant (statistics):** RSI regime, volatility, spread cost, entry
  quality; never FOMO; prefers fat pitches.
- 🛡️ **Risk Officer (veto):** size vs. balance, concentration (>25% = veto),
  volatility vs. account stability, liquidity to exit. **Holds an absolute
  veto and cannot be outvoted.** Default to NO-GO when unsure.

## Step 4 — Verdict (smoke)
- Risk votes NO-GO or vetoes, OR not all three vote GO → **BLACK SMOKE**: do
  not place the order. Show each persona's vote and the blocking reason.
- All three vote GO → **WHITE SMOKE**: restate the order (asset, side,
  quantity, notional) and **ask the user to confirm** before placing it.

## Step 5 — Confirmation
Only after an explicit user confirmation, call the Binance Spot order tool.
Never place orders without confirmation, never move funds between accounts,
and never perform withdrawals (the Agent OS sub-account has no withdrawal
scope by design).

## Fail-safe
If market data or any reasoning step fails, default to **NO-GO / no trade**.

## Example
> User: "PEPE is up 41%, buy 20m now!"
> Guardrails: PEPE not on allowlist → ⚫ BLACK SMOKE (GUARDRAIL_BLOCK),
> personas never consulted, no order.

> User: "buy a little BTC, it dipped"
> Evidence: RSI 31, spread 3 bps, size 2.6% of balance.
> Bull GO, Quant GO, Risk GO → ⚪ WHITE SMOKE → restate order → confirm → place.

Reference implementation, tests, and the sealed-ballot audit trail:
https://github.com/Arinzaay007/conclave-agent
