/**
 * On-chain ballot anchoring (BSC testnet).
 *
 * When configured (BSC_PRIVATE_KEY + CONCLAVE_BALLOT_EMITTER), each sealed
 * ballot hash is also committed to the BallotEmitter contract BEFORE the
 * verdict exists. ethers is imported lazily so the default dry-run flow stays
 * dependency-free and works offline.
 *
 * Not configured  → createChainSealer() returns null → local JSONL hashing only.
 * Network failure → the committee logs a warning; it never fabricates an
 *                   on-chain anchor (the sealed record simply lacks a txHash).
 */
import { CONFIG } from "./config.js";

export const BSC_TESTNET_RPC = process.env.BSC_RPC_URL || "https://bsc-testnet.publicnode.com";

export const BALLOT_EMITTER_ABI = [
  "event BallotSealed(uint64 indexed id, bytes32 indexed commitHash, address indexed committer, uint64 sealedAt)",
  "event BallotRevealed(uint64 indexed id, bytes32 revealHash)",
  "function seal(bytes32 commitHash) external returns (uint64 id)",
  "function ballots(uint64) external view returns (bytes32 commitHash, address committer, uint64 sealedAt, bool revealed, bytes32 revealHash)",
  "function nonce() external view returns (uint64)",
];

export function createChainSealer() {
  const key = process.env.BSC_PRIVATE_KEY;
  const emitter = CONFIG.BALLOT_EMITTER;
  if (!key || !emitter) return null;
  return new BallotChainSealer({ rpc: BSC_TESTNET_RPC, key, emitter });
}

export class BallotChainSealer {
  constructor({ rpc, key, emitter }) {
    this.rpc = rpc;
    this.key = key;
    this.emitter = emitter;
  }

  async _wallet() {
    const ethers = await import("ethers");
    const provider = new ethers.JsonRpcProvider(this.rpc, 97);
    return new ethers.Wallet(this.key, provider);
  }

  /** Commit a 0x-prefixed bytes32 ballot hash. Returns the transaction hash. */
  async seal(commitHash) {
    const ethers = await import("ethers");
    const wallet = await this._wallet();
    const contract = new ethers.Contract(this.emitter, BALLOT_EMITTER_ABI, wallet);
    const tx = await contract.seal(commitHash);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, block: receipt.blockNumber };
  }

  /** Read-only: return the set of commitHashes ever sealed by the emitter. */
  async sealedHashes({ fromBlock = 0 } = {}) {
    const ethers = await import("ethers");
    const provider = new ethers.JsonRpcProvider(this.rpc, 97);
    const contract = new ethers.Contract(this.emitter, BALLOT_EMITTER_ABI, provider);
    const logs = await contract.queryFilter(contract.filters.BallotSealed(), fromBlock);
    return logs.map((l) => ({ hash: l.args.commitHash, id: Number(l.args.id), txHash: l.transactionHash, block: l.blockNumber }));
  }
}
