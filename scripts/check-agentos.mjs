#!/usr/bin/env node
/**
 * Verify your Agent OS MCP connection and discover the real tool surface.
 *
 *   export BINANCE_MCP_TOKEN="..."      # from the Agent OS connect flow
 *   node scripts/check-agentos.mjs
 *
 * Connects to https://agent.binance.com/mcp/agentic, lists every tool, then
 * probes the read-only paths (spot ticker, klines, account). It NEVER places
 * an order. Use this to confirm a token and to map exact tool names/shapes —
 * the data layer matches tools by keyword and parses defensively.
 */
import { BinanceMcpClient } from "../src/binance-mcp.js";

const mcp = new BinanceMcpClient();
if (!mcp.token) {
  console.error("Set BINANCE_MCP_TOKEN (from the Binance Agent OS connect flow).");
  process.exit(1);
}

try {
  await mcp.connect();
  console.log(`\n✅ Connected to ${mcp.url}\n`);

  const tools = await mcp.toolDescriptors();
  console.log(`Tools exposed by Agent OS (${tools.length}):`);
  for (const t of tools) {
    const params = t.inputSchema?.properties ? Object.keys(t.inputSchema.properties) : [];
    console.log(`  • ${t.name}${params.length ? "(" + params.join(", ") + ")" : ""}`);
    if (t.description) console.log(`      ${t.description.slice(0, 120)}`);
  }

  console.log("\nRead-only probes:");
  const tryProbe = async (label, fn) => {
    try {
      const r = await fn();
      console.log(`  ✅ ${label} via "${r.tool}"`);
    } catch (e) {
      console.log(`  ⚠️  ${label}: ${String(e.message).slice(0, 100)}`);
    }
  };
  await tryProbe("ticker (BTCUSDT)", () => mcp.spotTicker("BTC"));
  await tryProbe("klines (BTCUSDT 1h)", () => mcp.spotKlines("BTC"));
  await tryProbe("account info", () => mcp.accountInfo());

  console.log("\nOrder placement is NOT probed here. It runs only on white smoke +");
  console.log("human confirmation in live mode (LiveMcpExecutor.placeSpotOrder).\n");
} catch (e) {
  console.error("\n❌ Agent OS connection failed:", String(e.message).slice(0, 300));
  process.exit(1);
} finally {
  await mcp.close();
}
