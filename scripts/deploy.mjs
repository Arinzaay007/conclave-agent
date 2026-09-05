#!/usr/bin/env node
/**
 * Deploy BallotEmitter to BSC testnet.
 *
 *   npm install ethers solc          # one-time, deploy-only deps
 *   export BSC_PRIVATE_KEY=0x...     # a testnet-funded wallet
 *   export BSC_RPC_URL=https://bsc-testnet.publicnode.com
 *   node scripts/deploy.mjs
 *
 * Prints the deployed address and writes it to .conclave-emitter.addr.
 */
import fs from "node:fs";
import solc from "solc";
import { ethers } from "ethers";

const RPC = process.env.BSC_RPC_URL || "https://bsc-testnet.publicnode.com";
const KEY = process.env.BSC_PRIVATE_KEY;

if (!KEY) {
  console.error("Set BSC_PRIVATE_KEY (a BSC testnet-funded wallet).");
  process.exit(1);
}

const source = fs.readFileSync(new URL("../contracts/BallotEmitter.sol", import.meta.url), "utf8");
const input = {
  language: "Solidity",
  sources: { "BallotEmitter.sol": { content: source } },
  settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
};
const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
if (compiled.errors?.some((e) => e.severity === "error")) {
  console.error(compiled.errors.filter((e) => e.severity === "error").map((e) => e.formattedMessage).join("\n"));
  process.exit(1);
}
const { abi, evm } = compiled.contracts["BallotEmitter.sol"]["BallotEmitter"];

const provider = new ethers.JsonRpcProvider(RPC, 97);
const wallet = new ethers.Wallet(KEY, provider);
console.log(`Deploying from ${wallet.address} to BSC testnet (${RPC})…`);

const factory = new ethers.ContractFactory(abi, evm.bytecode.object, wallet);
const contract = await factory.deploy();
await contract.waitForDeployment();
const address = await contract.getAddress();

console.log(`\n✅ BallotEmitter deployed: ${address}`);
console.log(`   tx: ${contract.deploymentTransaction().hash}`);
console.log(`   verify: https://testnet.bscscan.com/address/${address}`);
fs.writeFileSync(new URL("../.conclave-emitter.addr", import.meta.url), address + "\n");
console.log(`\nNext: export CONCLAVE_BALLOT_EMITTER=${address}`);
