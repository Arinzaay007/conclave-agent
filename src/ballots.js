/**
 * Sealed ballots.
 *
 * Every persona vote is serialised to canonical JSON and SHA-256 hashed
 * BEFORE the verdict (and any order) exists. The transcript later reveals the
 * full ballot alongside the pre-committed hash — a commit-reveal audit trail.
 *
 * In production these hashes are emitted to a BSC testnet contract
 * (contracts/BallotEmitter.sol) via the Agent OS sub-account flow; locally
 * they are appended to a JSONL file so the trail is inspectable without keys.
 */
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { CONFIG } from "./config.js";

export function canonical(obj) {
  // Stable key ordering -> deterministic hash.
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonical).join(",") + "]";
  return "{" + Object.keys(obj).sort().map((k) => JSON.stringify(k) + ":" + canonical(obj[k])).join(",") + "}";
}

export function hashBallot(ballot) {
  return "0x" + createHash("sha256").update(canonical(ballot)).digest("hex");
}

export function sealBallot(ballot) {
  const sealed = {
    hash: hashBallot(ballot),
    sealedAt: new Date().toISOString(),
    chain: CONFIG.BALLOT_CHAIN,
    emitter: CONFIG.BALLOT_EMITTER,
  };
  if (!existsSync(CONFIG.ATTEST_DIR)) mkdirSync(CONFIG.ATTEST_DIR, { recursive: true });
  appendFileSync(`${CONFIG.ATTEST_DIR}/ballots.jsonl`, JSON.stringify({ sealed, ballot: null }) + "\n");
  return sealed;
}

export function revealBallot(sealed, ballot) {
  const revealHash = hashBallot(ballot);
  const verified = revealHash === sealed.hash;
  const record = { revealedAt: new Date().toISOString(), verified, sealed, ballot };
  appendFileSync(`${CONFIG.ATTEST_DIR}/reveals.jsonl`, JSON.stringify(record) + "\n");
  return record;
}
