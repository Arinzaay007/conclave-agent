<p align="center">
  <img src="assets/logo.svg" width="140" alt="Conclave logo" />
</p>

# Conclave

**Three agents, locked room, one verdict. No trade without white smoke.**

Conclave is a multi-agent investment committee for [Binance Agent OS](https://www.binance.com/en/agent-os). Every
trade proposal is debated by three single-purpose AI personas acting over the
Binance MCP server. The order only goes through when the committee concurs,
the hard guardrails pass, and the human confirms.

> **Binance Agent OS Mini Hackathon — Track A submission.**
> The product is the *composition*, not the alpha. Conclave makes no
> profitability claim. It demonstrates guarded, verifiable agentic trading:
> deterministic guardrails, a sealed-ballot audit trail, and human
> confirmation on every order.

## Why three agents?

A single trading agent is a black box that is either over-confident or
over-cautious. Conclave splits the mind of a trading desk into three roles
that genuinely disagree:

| Persona | Job | Bias |
|---|---|---|
| 🐂 **The Bull** | momentum, narrative, oversold bounces | wants to trade |
| 📊 **The Quant** | RSI, volatility, spread, entry quality | waits for the fat pitch |
| 🛡️ **The Risk Officer** | size vs. balance, liquidity, stability | **holds an absolute veto** |

The Risk Officer cannot be outvoted. The Bull and Quant must both agree — and
the deterministic guardrails must pass — before any smoke turns white.

## The verdict metaphor

- ⚫ **Black smoke** — vetoed / not unanimous / guardrail failed. No order.
- ⚪ **White smoke** — committee concurs. The order is presented for **human
  confirmation**, then routed to Binance spot via Agent OS.

Every persona ballot is SHA-256 committed **before** the verdict exists
(commit–reveal). In live mode the ballot hashes are emitted to a BSC testnet
contract ([`contracts/BallotEmitter.sol`](contracts/BallotEmitter.sol)) before
the order is placed, so the decision-to-action chain is independently
reconstructable.

```bash
# On-chain anchoring (optional, deploy-only):
npm install ethers solc
export BSC_PRIVATE_KEY=0x<testnet-key>
npm run deploy:chain            # deploys BallotEmitter to BSC testnet
export CONCLAVE_BALLOT_EMITTER=0x<address>
# … run a session; each ballot is anchored before the verdict …
npm run verify:ballots          # recomputes hashes + confirms on-chain anchors
```

## Safety model

- **Hard guardrails in code, not prompts** — symbol allowlist, $500 notional
  cap, spread/slippage collar. A persona cannot edit or bypass these
  ([`src/guardrails.js`](src/guardrails.js)).
- **No withdrawal scope** — the Agent OS sub-account is funded by the user and
  has no withdrawal permission, by platform design.
- **Human in the loop** — white smoke only *presents* an order; the user
  confirms it in the Agent OS client.
- **Risk veto** — concentration, volatility and liquidity vetoes run on
  numbers, not on the model's mood.
- **Dry-run by default** — `DRY_RUN=true` unless explicitly set false.

## Quick start

```bash
# zero runtime dependencies — node >= 20, no npm install needed for the core
npm run demo       # scripted 3-scenario committee session, no keys, no network
npm test           # 20 tests covering all verdicts, LLM fail-closed, anchoring
npm run chat       # interactive: type "buy 0.002 btc", watch the debate, confirm
```

Live capabilities (real LLM personas, live MCP orders, on-chain ballots) pull in
optional deps on demand: `npm install` for `@modelcontextprotocol/sdk`,
`ethers`, and `solc`.

### Real LLM personas

By default the personas use deterministic rule stand-ins (so demos/tests are
reproducible with no keys). Point them at any OpenAI-compatible endpoint
(OpenAI, OpenRouter, a local model):

```bash
export LLM_MODE=auto           # use LLM if LLM_API_KEY set, else rules
export LLM_BASE_URL="https://api.openai.com/v1"
export LLM_API_KEY="sk-..."
export LLM_MODEL="gpt-4o-mini"
```

Model output is strictly validated; malformed responses or API errors fail
**closed to NO-GO** — a chatty model can never become an accidental buy.
The LLM only returns a verdict for its persona; it cannot call tools, set
limits, or place orders.

### Live Agent OS execution

```bash
export DRY_RUN=false
export BINANCE_MCP_URL="https://agent.binance.com/mcp/agentic"
# connect through a supported client (Claude / Cursor / Codex) with spot + account scopes
```

## How it works

See [`docs/HOW_IT_WORKS.md`](docs/HOW_IT_WORKS.md) for the full walkthrough,
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design, and
[`docs/SECURITY.md`](docs/SECURITY.md) for the threat model. Demo script:
[`docs/VIDEO_DEMO_SCRIPT.md`](docs/VIDEO_DEMO_SCRIPT.md).

**Taking it live / submitting** — GitHub push, LLM key, BSC testnet deploy,
live Agent OS token, and the entry checklist are all in
[`docs/SETUP.md`](docs/SETUP.md). Ready-to-paste X post and survey blurb:
[`docs/SUBMISSION_POSTS.md`](docs/SUBMISSION_POSTS.md).

## License

MIT
