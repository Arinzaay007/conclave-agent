/**
 * Conclave hard guardrails.
 * These are deterministic, code-enforced limits that run BEFORE any persona
 * is even consulted — the same pattern NeuroDegen calls "hard never-X
 * constraints". An AI persona cannot override, edit, or bypass these.
 *
 * Modes:
 *  - DRY_RUN=true  : every order is simulated, no network calls to Binance.
 *  - DRY_RUN=false : orders route to the Binance Agent OS MCP server and STILL
 *                    require explicit human confirmation in the terminal.
 */
export const CONFIG = {
  // Execution
  MCP_URL: process.env.BINANCE_MCP_URL || "https://agent.binance.com/mcp/agentic",
  DRY_RUN: process.env.DRY_RUN !== "false", // default: safe
  REQUIRE_HUMAN_CONFIRM: process.env.CONCLAVE_AUTO_CONFIRM !== "true", // default: true

  // Hard guardrails (enforced in src/guardrails.js)
  MAX_NOTIONAL_USD: 500,        // cap on a single trade
  MAX_SLIPPAGE_BPS: 100,        // 1.00% vs reference price
  ALLOWED_SYMBOLS: ["BTC", "ETH", "BNB", "SOL", "USDC", "USDT"],

  // Committee
  UNANIMOUS_TO_TRADE: true,     // all three personas must vote GO
  ATTEST_DIR: process.env.CONCLAVE_ATTEST_DIR || "ballots",

  // Persona decisions
  //  LLM_MODE=rules : deterministic rule stand-ins only (default, reproducible)
  //  LLM_MODE=auto  : use an LLM when LLM_API_KEY is set, else rules
  //  LLM_MODE=llm   : require an LLM (a failed call fails closed to NO-GO)
  LLM_MODE: process.env.LLM_MODE || "auto",
  LLM_BASE_URL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  LLM_API_KEY: process.env.LLM_API_KEY || "",
  LLM_MODEL: process.env.LLM_MODEL || "gpt-4o-mini",

  // Attestation
  // BSC testnet emitter — deployed contract address lands here after deploy.
  BALLOT_CHAIN: "bsc-testnet",
  BALLOT_EMITTER: process.env.CONCLAVE_BALLOT_EMITTER || null,
};
