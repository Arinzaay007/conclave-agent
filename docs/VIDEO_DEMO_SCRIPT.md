# Conclave — 90-second demo video script

**Format:** terminal recording + voiceover. No slides. Everything shown is real
output from `npm run demo` (dry-run, zero funds touched).

| Time | Visual | Voiceover |
|---|---|---|
| 0:00–0:08 | Title card: **CONCLAVE — three agents, locked room, one verdict.** | "An AI trading agent shouldn't be a single black box. On Binance Agent OS, we built a committee." |
| 0:08–0:22 | Scenario 1: small BTC dip buy. Guardrails pass → Bull GO, Quant GO, Risk GO → **⚪ WHITE SMOKE** → simulated order with id. | "A disciplined dip buy: the guardrails pass, the Bull likes the oversold bounce, the Quant likes the entry zone, and Risk approves the size. White smoke — the order goes to the human for confirmation." |
| 0:22–0:40 | Scenario 2: PEPE FOMO. 🚫 `SYMBOL_NOT_ALLOWED` → **⚫ BLACK SMOKE**. Note "personas never convened." | "Now the classic FOMO trade. It never even reaches the agents — the deterministic guardrails hard-block anything off the allowlist. The model can't argue with code." |
| 0:40–0:58 | Scenario 3: oversized SOL. Bull GO, Quant NO-GO, Risk **VETO** → **⚫ BLACK SMOKE (RISK_VETO)**. | "A breakout the Bull loves and the Quant hates — and the Risk Officer vetoes regardless: it's 37% of the account. Risk cannot be outvoted." |
| 0:58–1:12 | `cat ballots/ballots.jsonl` — sealed hashes; show hash matches revealed ballot. | "Every vote is hashed and committed *before* the verdict exists — sealed ballots, revealed later. In live mode these hashes go to BSC testnet before the order fires. You can reconstruct every decision." |
| 1:12–1:20 | **Live BscScan** — the `BallotSealed` events for the three ballots, then `verify:ballots` printing ✅ ON-CHAIN for each. | "And those ballots are real: each hash is committed to BSC testnet *before* the trade exists. A verifier recomputes and checks them on-chain." |
| 1:20–1:30 | Closing card: safety checklist (no withdrawal scope · human confirm · dry-run default · risk veto) + GitHub URL. | "No withdrawal scope, human confirmation on every order, dry-run by default, and a Risk Officer with a veto. Conclave: three agents, locked room, one verdict." |

## Recording notes
- Terminal at ~72-char width for clean banner; record `npm run chat` for an
  interactive feel (type "buy 0.002 btc" live) or `npm run demo` for the
  deterministic three-scenario run.
- `npm run demo` is deterministic (fixtures) — safe to record take after take.
- The `verify:ballots` + BscScan event view is the "trust it" money shot; the
  `0x…` hashes in `ballots/` are the local equivalent if not deployed yet.
- Total runtime target ~90–100s.
