/**
 * LLM layer for the committee.
 *
 * OpenAI-compatible chat completions (OpenAI, OpenRouter, local vLLM, etc.).
 * The LLM ONLY produces a structured verdict for its persona; it cannot call
 * tools, set limits, or emit orders. Every response is strictly validated —
 * anything malformed fails closed (NO-GO) so a chatty model can never become
 * an accidental "buy".
 */
import { CONFIG } from "./config.js";

export class LLMClient {
  constructor({ baseUrl = CONFIG.LLM_BASE_URL, apiKey = CONFIG.LLM_API_KEY, model = CONFIG.LLM_MODEL } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.model = model;
    this.enabled = Boolean(apiKey);
  }

  async decide(persona, evidence) {
    const userPrompt = buildEvidencePrompt(evidence, { requireVeto: !!persona.veto });
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: persona.systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text().catch(() => "")}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const verdict = parseVerdict(content);
    return { ...verdict, model: this.model, raw: content };
  }
}

export function buildEvidencePrompt({ quote, notionalUsd, account, proposal }, { requireVeto = false } = {}) {
  const balanceUsd = account?.spotBalanceUsd ?? "unknown";
  return [
    "Proposal under review:",
    `- side: ${proposal.side || "BUY"}`,
    `- asset: ${quote.symbol}`,
    `- quantity: ${proposal.quantity} (~$${notionalUsd?.toFixed?.(2)})`,
    `- stated rationale: ${proposal.rationale ?? "(none)"}`,
    "",
    "Evidence:",
    `- spot price: $${quote.price}`,
    `- RSI(14): ${quote.rsi14.toFixed(1)}`,
    `- 24h change: ${quote.change24hPct.toFixed(2)}%`,
    `- 24h volatility: ${quote.volatility24hPct.toFixed(2)}%`,
    `- spread: ${quote.spreadBps} bps`,
    `- account spot balance: $${balanceUsd}`,
    `- trade size as % of balance: ${balanceUsd === "unknown" ? "?" : ((notionalUsd / balanceUsd) * 100).toFixed(1)}%`,
    "",
    "Reply with exactly one JSON object: " +
      '{"vote":"GO" or "NO-GO","confidence":0-100,"reason":"one concise sentence"}' +
      (requireVeto ? ' and "veto":true if you exercise your veto.' : ""),
  ].join("\n");
}

/** Strict validation; invalid → NO-GO fail closed. */
export function parseVerdict(raw) {
  let obj = {};
  try {
    obj = JSON.parse(extractJson(raw));
  } catch {
    return failClosed(raw);
  }
  const vote = String(obj.vote ?? "").toUpperCase().trim();
  const confidence = Number(obj.confidence);
  if (vote !== "GO" && vote !== "NO-GO") return failClosed(raw);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
    return { vote: "NO-GO", confidence: 0, reason: "invalid confidence — fail closed", model: null, veto: undefined, invalid: true };
  }
  return {
    vote,
    confidence: Math.round(confidence),
    reason: typeof obj.reason === "string" ? obj.reason.slice(0, 240) : "(no reason)",
    veto: obj.veto === true || undefined,
    invalid: false,
  };
}

function failClosed(raw) {
  return { vote: "NO-GO", confidence: 0, reason: "unparseable model response — fail closed", model: null, veto: undefined, invalid: true, raw };
}

function extractJson(s) {
  if (typeof s !== "string") return "{}";
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  return start >= 0 && end > start ? s.slice(start, end + 1) : s;
}
