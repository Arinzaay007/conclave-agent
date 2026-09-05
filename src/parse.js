/**
 * Tiny natural-language proposal parser for the interactive CLI.
 * Not an LLM — deterministic keyword/number extraction so `npm run chat`
 * works offline with the same shape as a typed proposal.
 */
const SYNONYMS = {
  btc: "BTC", bitcoin: "BTC",
  eth: "ETH", ethereum: "ETH", ether: "ETH",
  bnb: "BNB",
  sol: "SOL", solana: "SOL",
  usdc: "USDC", usdt: "USDT", tether: "USDT",
};

export function parseProposal(text) {
  const t = text.toLowerCase();
  const side = /\b(sell|dump|short)\b/.test(t) ? "SELL" : "BUY";

  let symbol = null;
  for (const [word, sym] of Object.entries(SYNONYMS)) {
    if (new RegExp(`\\b${word}\\b`).test(t)) { symbol = sym; break; }
  }

  // Extract the first number (quantity). Handle "0.005 btc", "buy 2 eth".
  const numMatch = t.match(/(\d+(?:\.\d+)?)/);
  const quantity = numMatch ? parseFloat(numMatch[1]) : null;

  if (!symbol) return { ok: false, error: "I didn't catch an asset I know (try BTC, ETH, BNB, SOL, USDC)." };
  if (quantity === null || quantity <= 0) return { ok: false, error: `How much ${symbol}? e.g. "buy 0.01 ${symbol}"` };

  return { ok: true, proposal: { side, symbol, quantity, rationale: text.slice(0, 140) } };
}
