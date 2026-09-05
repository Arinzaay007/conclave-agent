/**
 * Execution layer.
 *
 * DryRunExecutor simulates an order and returns a deterministic fake order id
 * — used for tests, demos, and the judge video without touching funds.
 *
 * LiveMcpExecutor routes orders through the official MCP client
 * (src/binance-mcp.js) to the Binance Agent OS endpoint. The spot-order tool
 * is discovered by keyword, and Agent OS enforces its own human-confirmation
 * step in the connected client; the Agentic sub-account has no withdrawal
 * scope by design.
 */
import { createHash } from "node:crypto";

export class DryRunExecutor {
  async execute(proposal, ctx) {
    const id = "sim_" + createHash("sha256").update(JSON.stringify({ proposal, at: Date.now() })).digest("hex").slice(0, 12);
    return {
      id,
      status: "SIMULATED",
      mode: "DRY_RUN",
      side: proposal.side || "BUY",
      symbol: proposal.symbol.toUpperCase(),
      quantity: proposal.quantity,
      notionalUsd: ctx.notionalUsd,
      at: new Date().toISOString(),
    };
  }
}

export class LiveMcpExecutor {
  constructor({ mcpClient } = {}) {
    // Accept an injected client (tests) or connect lazily from env.
    this.mcpClient = mcpClient || null;
  }

  async _client() {
    if (!this.mcpClient) {
      const { BinanceMcpClient } = await import("./binance-mcp.js");
      this.mcpClient = await new BinanceMcpClient().connect();
    }
    return this.mcpClient;
  }

  async execute(proposal, ctx) {
    const mcp = await this._client();
    // NOTE: the exact tool name is discovered at runtime; "order" matches the
    // spot order tool on the Agent OS server regardless of version naming.
    const { tool, result } = await mcp.callToolMatching("order", {
      symbol: proposal.symbol.toUpperCase() + "USDT",
      side: (proposal.side || "BUY").toUpperCase(),
      quantity: proposal.quantity,
      type: "MARKET",
    });
    return {
      status: "LIVE_ORDER_PLACED",
      mode: "LIVE",
      tool,
      side: proposal.side || "BUY",
      symbol: proposal.symbol.toUpperCase(),
      quantity: proposal.quantity,
      notionalUsd: ctx.notionalUsd,
      result,
    };
  }
}
