/**
 * Binance Agent OS MCP client.
 *
 * Thin wrapper over the official @modelcontextprotocol/sdk, connecting to the
 * Agent OS Streamable-HTTP endpoint. Tools are discovered at runtime via
 * listTools() (names differ across server versions), and results are parsed
 * defensively. The SDK is imported lazily so the zero-dependency dry-run path
 * still works with nothing installed.
 *
 * Auth: Agent OS uses an OAuth bearer token — the same token your connected
 * client (Claude / Cursor / Codex) obtains during its connect flow. Provide it
 * via BINANCE_MCP_TOKEN. Verify a token + see the real tool list with:
 *   node scripts/check-agentos.mjs
 */
const DEFAULT_URL = "https://agent.binance.com/mcp/agentic";

export class BinanceMcpClient {
  constructor({ url = process.env.BINANCE_MCP_URL || DEFAULT_URL, token = process.env.BINANCE_MCP_TOKEN } = {}) {
    this.url = url;
    this.token = token;
    this._client = null;
    this._tools = null;
  }

  async connect() {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );
    const client = new Client({ name: "conclave-committee", version: "0.1.0" }, { capabilities: {} });
    const transport = new StreamableHTTPClientTransport(new URL(this.url), {
      requestInit: {
        headers: {
          Accept: "application/json, text/event-stream",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
      },
    });
    await client.connect(transport);
    this._client = client;
    return this;
  }

  /** Full tool descriptors (name/description/schema). Used by check-agentos. */
  async toolDescriptors() {
    if (!this._client) await this.connect();
    const { tools } = await this._client.listTools();
    this._tools = tools.map((t) => t.name);
    return tools;
  }

  async toolNames() {
    if (!this._tools) await this.toolDescriptors();
    return this._tools;
  }

  /** Call the first tool whose name includes any of `keywords`. */
  async callToolMatching(keywords, args) {
    const kws = Array.isArray(keywords) ? keywords : [keywords];
    const names = await this.toolNames();
    const match = names.find((n) => kws.some((k) => n.toLowerCase().includes(k.toLowerCase())));
    if (!match) throw new Error(`no MCP tool matching ${kws.join("/")} (have: ${names.join(", ")})`);
    const res = await this._client.callTool({ name: match, arguments: args });
    return { tool: match, result: res };
  }

  /** Extract the (best-effort JSON) payload from an MCP tool result. */
  static parseContent(res) {
    const text = (res?.content || []).map((c) => c.text ?? "").join("\n");
    try { return JSON.parse(text); } catch { return text; }
  }

  // ── Orders ──────────────────────────────────────────────────────────────
  async placeSpotOrder({ symbol, side, quantity, type = "MARKET" }) {
    const { tool, result } = await this.callToolMatching(["order", "trade"], {
      symbol: symbol.toUpperCase() + "USDT",
      side: side.toUpperCase(),
      quantity,
      type,
    });
    return { tool, payload: BinanceMcpClient.parseContent(result) };
  }

  // ── Market data (best-effort; shapes confirmed via check-agentos.mjs) ─────
  async spotTicker(symbol) {
    const sym = symbol.toUpperCase() + "USDT";
    const { tool, result } = await this.callToolMatching(
      ["ticker", "24hr", "price", "quote", "market"],
      { symbol: sym },
    );
    return { tool, payload: BinanceMcpClient.parseContent(result) };
  }

  async spotKlines(symbol, interval = "1h", limit = 15) {
    const { tool, result } = await this.callToolMatching(
      ["kline", "candle", "historical", "ohlc"],
      { symbol: symbol.toUpperCase() + "USDT", interval, limit },
    );
    return { tool, payload: BinanceMcpClient.parseContent(result) };
  }

  // ── Account (read-only) ──────────────────────────────────────────────────
  async accountInfo() {
    const { tool, result } = await this.callToolMatching(
      ["account", "balance", "asset", "portfolio"],
      {},
    );
    return { tool, payload: BinanceMcpClient.parseContent(result) };
  }

  async close() {
    await this._client?.close();
    this._client = null;
  }
}
