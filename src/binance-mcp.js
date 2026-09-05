/**
 * Binance Agent OS MCP client.
 *
 * Thin wrapper over the official @modelcontextprotocol/sdk, connecting to the
 * Agent OS Streamable-HTTP endpoint. The SDK is imported lazily so the
 * dependency-free dry-run path (and `npm test`) still works with nothing
 * installed.
 *
 * Auth: Agent OS uses an OAuth bearer token (the same token your connected
 * client — Claude / Cursor / Codex — obtains during its connect flow). Provide
 * it via BINANCE_MCP_TOKEN. Tool names are discovered at runtime via
 * listTools() rather than hard-coded, so a rename server-side doesn't break us.
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
    const client = new Client(
      { name: "conclave-committee", version: "0.1.0" },
      { capabilities: {} },
    );
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

  /** Discover the tools Agent OS exposes (market data, account, spot orders). */
  async listTools() {
    if (!this._client) await this.connect();
    const { tools } = await this._client.listTools();
    this._tools = tools.map((t) => t.name);
    return tools;
  }

  /** Call a tool by a loose keyword (e.g. "spot", "order", "ticker", "account"). */
  async callToolMatching(keyword, args) {
    const tools = this._tools || (await this.listTools()).map((t) => t.name);
    const match = tools.find((n) => n.toLowerCase().includes(keyword.toLowerCase()));
    if (!match) throw new Error(`no MCP tool matching "${keyword}" (have: ${tools.join(", ")})`);
    const res = await this._client.callTool({ name: match, arguments: args });
    return { tool: match, result: res };
  }

  async close() {
    await this._client?.close();
    this._client = null;
  }
}
