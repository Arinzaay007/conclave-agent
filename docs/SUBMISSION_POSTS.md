# Submission assets — Binance Agent OS Mini Hackathon, Track A

> Fill `<GH_URL>`, `<VIDEO_URL>` before posting. Entry steps: follow @Binance,
> repost the announcement, reply/quote-repost with the submission, complete
> the survey. Eligibility per hackathon rules (not US/UK/EEA/HK/SG or a
> prohibited jurisdiction).

---

## 1. X reply to @binance (the official entry post)

🛰️ Introducing **CONCLAVE** — three agents, locked room, one verdict.

An AI trade shouldn't be one black box. On #BinanceAgentOS I built a multi-agent investment committee:

🐂 The Bull — momentum
📊 The Quant — stats & entry quality
🛡️ The Risk Officer — holds an absolute veto

🔒 Hard guardrails in code (allowlist, $ cap, spread collar)
⚪ ⚫ White smoke = human confirms → order; black smoke = no trade
🔏 Every vote sealed (hash) BEFORE the verdict, anchored on BSC testnet

No withdrawal scope · human confirm · dry-run by default · 20 tests

🎥 demo: <VIDEO_URL>
💻 repo: <GH_URL>

---

## 2. Quote-repost / thread version (longer, for a standalone post)

1/
Built **Conclave** for the Binance Agent OS Mini Hackathon.

Instead of one trading agent that's either reckless or timid, three single-purpose agents deliberate every trade — and the Risk Officer can veto the other two.

Three agents. Locked room. One verdict.

2/ How a trade flows:
1️⃣ Deterministic guardrails gate it FIRST (allowlist, $500 notional cap, spread collar) — fail = agents never even convene
2️⃣ Bull / Quant / Risk each cast a ballot
3️⃣ Each ballot is SHA-256 sealed BEFORE the verdict exists
4️⃣ Unanimous + Risk GO ⚪ white smoke → human confirms → spot order via Agent OS
Anything else ⚫ black smoke, no trade.

3/ The verifiability bit I care about:
Sealed ballot hashes are committed to a BallotEmitter contract on BSC testnet before the order fires. A verifier script recomputes every hash and checks it on-chain. You can reconstruct why every trade did or didn't happen — no trusting our server.

4/ Safety is the product:
- code-level guardrails the model can't touch
- LLM output strictly validated; errors fail CLOSED to NO-GO
- agents can't withdraw, can't call tools, can't set limits
- human confirms every order; dry-run by default

No alpha claims — the point is guarded, verifiable agentic trading.

🎥 <VIDEO_URL>
💻 <GH_URL>
#BinanceAgentOS #MCP

---

## 3. Survey / form blurb (short project description)

**Project name:** Conclave

**One-liner:** Three agents, locked room, one verdict — a multi-agent investment
committee for Binance Agent OS where an order only fires on unanimous white
smoke, with sealed, on-chain-verifiable ballots.

**What it does (3–4 sentences):**
Conclave routes every trade proposal through three AI personas acting over the
Binance MCP server — the Bull (momentum), the Quant (statistics and entry
quality), and the Risk Officer, who holds an absolute veto. Deterministic
guardrails (asset allowlist, notional cap, spread collar) gate proposals before
any model is consulted; every persona ballot is hash-committed before the
verdict and anchored to a BSC testnet contract for a tamper-evident audit
trail. White smoke still requires explicit human confirmation before the spot
order is placed, and the Agent OS sub-account has no withdrawal scope.

**Why it's novel:** The field is full of single-agent "risk bots." Conclave
splits the trading mind into deliberately disagreeing roles, makes one of them
an un-overridable veto, and makes the whole decision process independently
verifiable on-chain.

**Tech:** Node.js, Model Context Protocol (Streamable HTTP) over Agent OS,
OpenAI-compatible LLM layer with fail-closed validation, ethers/solc for BSC
testnet attestation. Zero-dependency core; 20 tests; runs offline in dry-run.

**Repo:** <GH_URL>  ·  **Demo:** <VIDEO_URL>

---

## 4. Video title / caption

**Title:** Conclave — Three AI Agents Must Agree Before a Binance Trade
**Caption:** Three agents debate every trade on Binance Agent OS. Risk can veto.
Ballots are sealed on BSC before the verdict. No trade without white smoke.
