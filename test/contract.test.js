import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, "..", "contracts", "BallotEmitter.sol");

// solc is CommonJS and an optional dev dependency — load via createRequire so
// it works in both ESM and zero-dep (skip) environments.
let solc = null;
try {
  solc = createRequire(import.meta.url)("solc");
} catch {
  solc = null;
}

const fn = solc ? test : test.skip;

fn("BallotEmitter compiles to valid bytecode + ABI", () => {
  const source = fs.readFileSync(sourcePath, "utf8");
  const out = JSON.parse(
    solc.compile(JSON.stringify({
      language: "Solidity",
      sources: { "BallotEmitter.sol": { content: source } },
      settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
    })),
  );
  assert.equal(Boolean(out.errors?.some((e) => e.severity === "error")), false, "no compile errors");
  const { abi, evm } = out.contracts["BallotEmitter.sol"]["BallotEmitter"];
  assert.ok(evm.bytecode.object.length > 100, "produces bytecode");
  const fns = abi.filter((a) => a.type === "function").map((a) => a.name);
  for (const f of ["seal", "reveal", "verify", "ballots"]) assert.ok(fns.includes(f), `has ${f}`);
});
