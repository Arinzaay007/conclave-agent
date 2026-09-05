# Security model

## Hard "never" constraints (each enforced in code)
| # | Constraint | Enforcer |
|---|---|---|
| 1 | Never trade a symbol off the allowlist | `runGuardrails` → `SYMBOL_NOT_ALLOWED` |
| 2 | Never place a trade over the notional cap | `runGuardrails` → `NOTIONAL_CAP` |
| 3 | Never trade into a spread wider than the collar | `runGuardrails` → `SPREAD_TOO_WIDE` |
| 4 | Never let a persona override a guardrail | Guardrails run before personas; personas receive no cap config |
| 5 | Never trade on a Risk NO-GO/veto | tally → `RISK_VETO` (veto cannot be outvoted) |
| 6 | Never withdraw funds | Agent OS sub-account has no withdrawal scope (platform-level) |
| 7 | Never auto-fire an order | human confirmation required in the Agent OS client; `REQUIRE_HUMAN_CONFIRM` defaults true |
| 8 | Never alter a ballot after the fact | commit-before-verdict SHA-256 / on-chain emitter |

## Prompt-injection considerations
- Persona outputs are parsed as structured verdicts; free-text `reason` is
  never interpreted as instructions.
- Personas cannot call tools — they only return a vote over provided evidence.
  Tool execution lives in `mcp.js`, outside the model's reach.
- Allowlist/caps are read from `config.js`, never from model output.

## Blast radius
- The Agent OS sub-account is funded by the user with a small, bounded balance;
- no withdrawal scope means the worst case is an unwanted *spot* trade within
  the $500 cap and allowlist, and even that requires white smoke + a human
  click;
- dry-run (`DRY_RUN=true`, the default) touches no funds at all.

## Known gaps (stated, not hidden)
- BSC emitter compiles and its deploy/verify scripts are ready; it must be
  deployed to BSC testnet (`npm run deploy:chain`) before anchors land
  on-chain. Until then, ballots hash to local JSONL. An anchor RPC failure is
  logged and does not fabricate an on-chain reference.
- The three personas default to deterministic rules unless `LLM_MODE`/keys are
  set; model disagreement or abstention fails to NO-GO.
- No authentication layer of its own — Conclave relies on the Agent OS OAuth /
  client confirmation for identity.
