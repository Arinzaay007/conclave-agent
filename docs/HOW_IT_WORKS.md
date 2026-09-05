# How Conclave works

A plain-English walkthrough of one trade. Every claim cites the file that
implements it.

## 1. A proposal arrives
A proposal is `{ side, symbol, quantity, rationale }`. It can come from the
user typing in the terminal or from an agentic client (Claude/Cursor/Codex)
connected to Agent OS. Entry point: `convene()` in [`src/committee.js`](../src/committee.js).

## 2. Evidence is gathered
`getQuote()` in [`src/marketdata.js`](../src/marketdata.js) returns price,
RSI(14), 24h change, realized volatility and spread. In dry-run this is a
deterministic fixture; live it reads Binance public spot data (the same data
the Agent OS market-data tools expose).

## 3. Guardrails gate first — before any AI
`runGuardrails()` in [`src/guardrails.js`](../src/guardrails.js) runs four
hard checks: symbol allowlist, $500 notional cap, spread collar, valid
quantity. Any failure ends the session with `BLACK_SMOKE / GUARDRAIL_BLOCK`
and the personas are **never convened**. These numbers live in
[`src/config.js`](../src/config.js) and are code, not prompts.

## 4. The committee deliberates (sealed ballots)
Each persona in [`src/personas.js`](../src/personas.js) sees the same evidence
and returns `{ vote, confidence, reason }`:
- 🐂 **The Bull** — momentum/narrative.
- 📊 **The Quant** — RSI, vol, spread, entry quality.
- 🛡️ **The Risk Officer** — concentration vs. balance, liquidity, stability;
  holds an absolute **veto**.

Every ballot is canonical-JSON serialised and SHA-256 hashed **before** the
verdict exists (`sealBallot()` in [`src/ballots.js`](../src/ballots.js)). In
live mode that hash is emitted to the BSC testnet `BallotEmitter` contract
([`contracts/BallotEmitter.sol`](../contracts/BallotEmitter.sol)). The ballot
is then revealed and re-hashed to prove it wasn't altered.

## 5. The verdict
Tally in [`src/committee.js`](../src/committee.js):
- Risk veto (or Risk NO-GO) → ⚫ **BLACK_SMOKE / RISK_VETO**
- Not all three GO (and unanimity required) → ⚫ **BLACK_SMOKE / NOT_UNANIMOUS**
- All three GO → ⚪ **WHITE_SMOKE / COMMITTEE_CONCURS**

## 6. Human confirmation, then execution
White smoke only **presents** the order. The user confirms in the Agent OS
client; then `LiveMcpExecutor` ([`src/mcp.js`](../src/mcp.js)) calls the spot
order tool over Streamable HTTP. The sub-account has no withdrawal scope. In
dry-run, `DryRunExecutor` returns a simulated order id and touches no funds.

## Run it yourself
```bash
npm run demo   # three proposals, three verdicts, ballots written to ./ballots/
npm test       # asserts white-smoke, guardrail-block, risk-veto, cap, ballot hash
```
