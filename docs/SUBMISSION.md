# Submission package — Binance Agent OS Mini Hackathon, Track A

**Project:** Conclave — three agents, locked room, one verdict.
**Track:** A — build an AI agent with Binance Agent OS.
**Repo:** <github url> · **Demo video:** <url> · **Live/dry-run:** `npm run demo`

## One-paragraph pitch
Conclave is a multi-agent investment committee that debates every Binance
trade. Three personas — Bull (momentum), Quant (statistics), Risk Officer
(veto) — each cast a sealed ballot over the Binance MCP server. Deterministic
guardrails (allowlist, notional cap, spread collar) gate proposals before any
AI is consulted; the Risk Officer holds an absolute veto; white smoke still
requires the human to confirm. Every ballot hash is committed before the
verdict and attested to BSC testnet, giving a tamper-evident decision trail.

## How it uses Agent OS
- **Market data tools** — live spot price, RSI, 24h change, volatility, spread.
- **Account tools (read-only)** — spot balance for concentration checks.
- **Spot order tool** — placed only on white smoke + human confirmation.
- **No withdrawal scope** — sub-account funded by the user; agents cannot withdraw.
- MCP over Streamable HTTP at `https://agent.binance.com/mcp/agentic`.

## Judge evaluation map
| Criterion | Where |
|---|---|
| Novelty vs. typical single-agent bot | Three-persona debate + Risk veto (`src/personas.js`, `src/committee.js`) |
| Safety / responsible agentic trading | Hard guardrails in code (`src/guardrails.js`); no withdrawal scope; human confirm |
| Verifiability | Sealed ballots + BSC emitter (`src/ballots.js`, `contracts/BallotEmitter.sol`) |
| Works without trusting the team | `npm run demo` & `npm test` run offline, no keys; tests assert all three verdicts |
| Agent OS integration depth | Market data + account + spot scopes (`src/mcp.js`) |

## Pre-submission checklist
- [x] `npm run demo` runs clean, zero keys (deterministic fixtures)
- [x] `npm test` — 5/5 passing
- [x] Dry-run by default; live path documented
- [x] LLM persona layer with fail-closed validation (`src/llm.js`), 12 tests
- [x] BSC ballot anchoring: contract compiles, deploy + verify scripts ready
- [ ] Deploy `BallotEmitter.sol` to BSC testnet (`npm run deploy:chain`)
- [ ] Run a live-LLM session (`LLM_MODE=llm`) and `npm run verify:ballots`
- [ ] Record demo video per `docs/VIDEO_DEMO_SCRIPT.md`
- [ ] Follow @Binance, repost, reply with video + repo, complete survey

## Honesty / maturity statement
- Trading logic in dry-run uses **deterministic rules standing in for the
  model** so the loop is reproducible and testable; live mode sends the same
  persona prompts to an LLM over MCP. No profitability claim is made — the
  contribution is the guarded, verifiable *composition*.
- On-chain emitter is written and pending deploy; local ballots use SHA-256
  JSONL until the contract is live on BSC testnet.
