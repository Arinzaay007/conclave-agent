# Setup & go-live checklist

Everything that needs *your* accounts/keys. Run from the repo root.

## 0. Sanity (no accounts)
```bash
node --version            # >= 20
npm run demo              # deterministic 3-scenario session, offline
npm test                  # 20 tests, all green, zero deps installed
```

## 1. Push to GitHub
```bash
gh repo create conclave-agent --public --source=. --remote=origin --push
# or manually: create an empty repo on github.com, then:
#   git remote add origin git@github.com:<you>/conclave-agent.git
#   git branch -M main && git push -u origin main
```
Then paste the repo URL into `docs/SUBMISSION_POSTS.md` (`<GH_URL>`).

## 2. (Optional but recommended) Real LLM personas
Get a key from OpenAI or OpenRouter (OpenRouter has cheap models):
```bash
export LLM_MODE=llm                       # force the model; errors fail closed
export LLM_BASE_URL="https://openrouter.ai/api/v1"
export LLM_API_KEY="sk-or-..."
export LLM_MODEL="openai/gpt-4o-mini"
npm run chat                              # the debate is now real
```
Leave `LLM_MODE=auto` to use the model when a key exists, rules otherwise.

## 3. (Optional, the verifiability money-shot) Deploy ballots to BSC testnet
```bash
# get testnet BNB from https://www.bnbchain.org/en/testnet-faucet
npm install                                # pulls ethers + solc (optionalDeps)
export BSC_RPC_URL="https://bsc-testnet.publicnode.com"
export BSC_PRIVATE_KEY=0x<your-testnet-key>
npm run deploy:chain                       # prints the emitter address
export CONCLAVE_BALLOT_EMITTER=0x<address>
npm run demo                               # ballots anchor on-chain per run
npm run verify:ballots                     # ✅ ON-CHAIN for each ballot
```
Open the printed `testnet.bscscan.com/address/…` to show `BallotSealed` events
in the video.

## 4. (Optional) Live Agent OS orders
Connect Claude / Cursor / Codex to Agent OS per Binance's MCP docs and grab the
OAuth bearer token:
```bash
export DRY_RUN=false
export BINANCE_MCP_URL="https://agent.binance.com/mcp/agentic"
export BINANCE_MCP_TOKEN="..."            # from the Agent OS connect flow
npm run chat                              # white smoke → confirm → real spot order
```
Fund only a small Agentic sub-account; it has no withdrawal scope.

## 5. Record & submit
- Record per `docs/VIDEO_DEMO_SCRIPT.md` (~90s), upload → `<VIDEO_URL>`.
- Follow @Binance, repost the announcement, post the reply from
  `docs/SUBMISSION_POSTS.md`, complete the survey
  (https://app.binance.com/uni-qr/user-survey/2913aa200aac462c89a737779393f3d4).
- **Deadline: Sept 8, 2026, 23:59 UTC.**

> Note: live public market data geo-falls back to fixtures in restricted
> regions (logged as `fixture-fallback`); the Agent OS MCP market-data tools
> are the intended live source when connected.
