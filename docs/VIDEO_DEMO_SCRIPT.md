# Conclave — demo video script (extended, ~2.5–3 min)

**Format:** terminal recording. Run `npm run demo:llm` (real LLM debate) or
`npm run demo` (deterministic rules). Dry-run — zero funds touched. The demo
now plays six scenarios and prints its own sealed-ballot audit trail + summary,
so one continuous command fills the whole video.

**Recording:** clear with `cls`, start capture (`Win + G` → ●), run
`npm run demo:llm`, let it run to the final SUMMARY, stop.

| Time | On screen | What to say |
|---|---|---|
| 0:00–0:12 | Banner: **CONCLAVE — three agents, locked room, one verdict.** | "An AI trading agent shouldn't be one black box. Conclave runs three agents on Binance Agent OS — a Bull, a Quant, and a Risk Officer with a veto. Nothing trades unless they agree." |
| 0:12–0:32 | Scenario 1: small BTC dip buy → three GO votes → **⚪ WHITE SMOKE** → simulated order. | "A small, disciplined dip buy. The guardrails pass, all three agents vote GO. White smoke — and the order still goes to the human for confirmation before anything executes." |
| 0:32–0:48 | Scenario 2: PEPE FOMO → 🚫 `SYMBOL_NOT_ALLOWED` → **⚫ GUARDRAIL_BLOCK**. | "The classic memecoin FOMO trade. It never even reaches the agents — code-level guardrails block anything off the allowlist. The model can't argue with hard limits." |
| 0:48–1:08 | Scenario 3: oversized SOL → Bull GO, Quant NO-GO, Risk **VETO** → **⚫ RISK_VETO**. | "A breakout the Bull loves and the Quant hates — and the Risk Officer vetoes it outright at 37% of the account. Risk cannot be outvoted." |
| 1:08–1:24 | Scenario 4: mid-range ETH, no edge → mixed votes → **⚫ NOT_UNANIMOUS**. | "A nothing-burger trade where the agents disagree. No consensus, no trade — the committee is allowed to just say 'do nothing.'" |
| 1:24–1:38 | Scenario 5: small BNB diversification → reviewed, denied. | "Even a small altcoin buy has to clear all three — capital protection over activity." |
| 1:38–1:54 | Scenario 6: 1 BTC, over the cap → 🚫 **⚫ GUARDRAIL_BLOCK (notional cap)**. | "And an order past the per-trade size cap is rejected by the guardrails before any AI is consulted." |
| 1:54–2:20 | **SEALED-BALLOT AUDIT TRAIL** block: 12 ballots, each ✅ with a `0x…` hash, "every ballot matches its pre-verdict seal: YES". | "Here's the part I care about: every single vote is hash-committed *before* the verdict exists, then revealed and verified. On a real deployment those hashes are committed to BSC testnet before the order fires — so anyone can reconstruct why each trade did or didn't happen." |
| 2:20–2:40 | SUMMARY block: six verdicts listed with reasons. | "Six proposals — one approved, five blocked, each with a clear reason. The design goal: an AI that's useful but structurally unable to do something reckless." |
| 2:40–2:55 | Closing: repo URL. | "No withdrawal scope, human confirmation on every order, fail-closed AI, dry-run by default. Conclave — three agents, locked room, one verdict. Repo and demo are open source." |

## Notes
- `npm run demo:llm` shows the **real** Groq debate (`[llm:openai/gpt-oss-120b]`)
  but wording/votes vary run to run; scenario 5 may flip to a veto — that's
  fine, just describe what's on screen.
- `npm run demo` (rules) is fully deterministic — same verdicts every take, and
  always ends with scenario 1 white smoke.
- The audit-trail + summary sections print automatically — no extra commands.
- Terminal width ~72 chars renders the banner cleanly; maximize the window.
- Runtime ~2.5–3 min. If you prefer a tight 90s cut, show scenarios 1, 2, 3 and
  the audit-trail block only.
