# Architecture

```
                 ┌──────────────────────────────────────────────┐
   user / AI  ──▶│  convene(proposal, account)   committee.js    │
 client (MCP)    └───────────────┬──────────────────────────────┘
                                 │
            ┌────────────────────▼────────────────────┐
            │  marketdata.js                          │
            │  price · RSI · vol · spread             │
            │  (dry-run fixture | Binance public/MCP) │
            └────────────────────┬────────────────────┘
                                 │
            ┌────────────────────▼────────────────────┐
            │  guardrails.js   (code, not prompts)    │
            │  allowlist · notional cap · spread      │
            │  FAIL → BLACK_SMOKE, no debate          │
            └────────────────────┬────────────────────┘
                                 │ pass
            ┌────────────────────▼────────────────────┐
            │  personas.js                            │
            │  🐂 Bull   📊 Quant   🛡️ Risk(veto)     │
            │  each returns {vote,confidence,reason}  │
            └────────────────────┬────────────────────┘
                                 │
            ┌────────────────────▼────────────────────┐
            │  ballots.js  commit–reveal              │
            │  SHA-256 seal BEFORE verdict            │
            │  → BSC testnet BallotEmitter (live)     │
            └────────────────────┬────────────────────┘
                                 │
                     tally ⚪/⚫  │
                                 ▼
            human confirm → mcp.js LiveMcpExecutor
                             (spot order, no withdrawal scope)
```

## Design principles
1. **Determinism where it matters.** Guardrails and ballot hashing are pure
   functions; tests assert exact outcomes. LLM reasoning is the only
   non-deterministic layer, and it is sandboxed behind the deterministic
   gates and the Risk veto.
2. **Fail closed.** Any missing/!passing guardrail, any Risk NO-GO, any
   non-unanimous vote = no trade.
3. **Verify, don't trust.** Ballot hashes commit before the verdict; the BSC
   emitter lets a third party reconstruct decisions without our server.
4. **Dry-run is a first-class target.** The full loop runs offline with no
   keys, so judges can reproduce every claim (`npm run demo` / `npm test`).

## Live vs dry-run
| Concern | Dry-run | Live |
|---|---|---|
| Market data | deterministic fixture | Binance public / MCP tools |
| Persona decision | deterministic rule stand-in | LLM via MCP client |
| Ballot anchoring | local SHA-256 JSONL | BSC testnet `BallotEmitter` |
| Order | simulated id | spot order tool + human confirm |

## Roadmap beyond the hackathon
- Wire persona prompts to real LLM calls in `LiveMcpExecutor`.
- On-chain emitter deploy + verify script (`scripts/verify-ballot.js`).
- DCA mandate mode (recurring white-smoke tranches) and a web transcript view.
