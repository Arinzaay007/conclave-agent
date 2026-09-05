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
| 1:12–1:25 | Closing card: safety checklist (no withdrawal scope · human confirm · dry-run default · risk veto) + GitHub URL. | "No withdrawal scope, human confirmation on every order, dry-run by default, and a Risk Officer with a veto. Conclave: three agents, locked room, one verdict." |

## Recording notes
- Use a terminal with 72-char width for the banner to render cleanly.
- `npm run demo` is deterministic (fixtures) — safe to record take after take.
- Cut to `ballots/ballots.jsonl` quickly; the `0x…` hashes are the money shot.
