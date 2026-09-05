/**
 * The three members of the Conclave.
 *
 * Each persona sees the same evidence (proposal + guardrail result + quote +
 * account snapshot) and returns a STRUCTURED verdict: vote GO/NO-GO, a
 * confidence score, and a one-paragraph reason. The Risk persona holds a veto.
 *
 * In live mode these same system prompts are sent to the model over the MCP
 * client (src/mcp.js). The deterministic rules below stand in for the model in
 * dry-run so the whole loop is testable, demoable, and reproducible without
 * keys — and so tests don't depend on LLM weather.
 */

export const PERSONAS = {
  bull: {
    id: "bull",
    name: "The Bull",
    emoji: "🐂",
    systemPrompt:
      "You are The Bull, a momentum-and-narrative trader on a three-member investment committee. " +
      "You look for upside: breakouts, oversold bounces, strong 24h flows, and regime shifts. " +
      "You are optimistic but must ground every GO in the numbers provided. " +
      "Return JSON: { vote: 'GO'|'NO-GO', confidence: 0-100, reason: string }.",
    decide({ quote }) {
      // Oversold bounce or strong momentum = the Bull leans GO.
      if (quote.rsi14 < 35) return vote("GO", 72, `RSI ${quote.rsi14.toFixed(0)} says deeply oversold — mean-reversion bounce setup, buy the fear.`);
      if (quote.change24hPct > 5 && quote.rsi14 < 80) return vote("GO", 65, `+${quote.change24hPct.toFixed(1)}% on 24h with room before overbought — momentum is on.`);
      if (quote.rsi14 > 82) return vote("NO-GO", 58, `RSI ${quote.rsi14.toFixed(0)} is euphoric — even I don't chase this high.`);
      return vote("NO-GO", 40, `No momentum edge: RSI ${quote.rsi14.toFixed(0)}, ${quote.change24hPct.toFixed(1)}% 24h. Nothing to run with.`);
    },
  },

  quant: {
    id: "quant",
    name: "The Quant",
    emoji: "📊",
    systemPrompt:
      "You are The Quant, a systematic analyst on a three-member investment committee. " +
      "You care only about RSI, volatility, spread cost, and entry quality. You never FOMO. " +
      "You size positions against volatility and reject illiquid or overheated markets. " +
      "Return JSON: { vote: 'GO'|'NO-GO', confidence: 0-100, reason: string }.",
    decide({ quote }) {
      if (quote.volatility24hPct > 15) return vote("NO-GO", 80, `Realized vol ${quote.volatility24hPct.toFixed(1)}% is too high for a sized spot entry — edge is noise.`);
      if (quote.spreadBps > 25) return vote("NO-GO", 75, `Spread ${quote.spreadBps} bps is a hidden tax — entry quality is poor.`);
      if (quote.rsi14 < 40 && quote.volatility24hPct < 8) return vote("GO", 68, `RSI ${quote.rsi14.toFixed(0)} with controlled vol ${quote.volatility24hPct.toFixed(1)}% — statistically favorable entry zone.`);
      if (quote.rsi14 > 70) return vote("NO-GO", 70, `RSI ${quote.rsi14.toFixed(0)} is overbought; expected forward return at this level is poor.`);
      return vote("NO-GO", 45, `Mid-range RSI ${quote.rsi14.toFixed(0)}, no statistical edge. Wait for a fat pitch.`);
    },
  },

  risk: {
    id: "risk",
    name: "The Risk Officer",
    emoji: "🛡️",
    veto: true,
    systemPrompt:
      "You are The Risk Officer on a three-member investment committee and you hold an absolute veto. " +
      "Your only job is to protect capital: notional size relative to the account, liquidity, and " +
      "whether this trade threatens the account's stability. When in doubt, veto. " +
      "You answer to the user's long-term goals, not to the other two members. " +
      "Return JSON: { vote: 'GO'|'NO-GO', confidence: 0-100, reason: string, veto: boolean }.",
    decide({ quote, notionalUsd, account }) {
      const balanceUsd = account?.spotBalanceUsd ?? 1000;
      const concentration = notionalUsd / balanceUsd;
      if (concentration > 0.25) return vote("NO-GO", 92, `This trade is ${(concentration * 100).toFixed(0)}% of the spot balance — concentration risk. VETO.`, true);
      if (quote.volatility24hPct > 10) return vote("NO-GO", 85, `Vol ${quote.volatility24hPct.toFixed(1)}% threatens account stability at this size. VETO.`, true);
      if (quote.spreadBps > 40) return vote("NO-GO", 88, `Illiquid market (${quote.spreadBps} bps spread); we could not exit cleanly. VETO.`, true);
      if (concentration > 0.1 && quote.rsi14 > 75) return vote("NO-GO", 80, `Sizing into overbought conditions (RSI ${quote.rsi14.toFixed(0)}) — poor risk/reward. VETO.`, true);
      return vote("GO", 70, `Size is ${(concentration * 100).toFixed(1)}% of balance, liquidity acceptable, risk within mandate.`, false);
    },
  },
};

function vote(vote, confidence, reason, veto = false) {
  return { vote, confidence, reason, veto: veto || undefined };
}
