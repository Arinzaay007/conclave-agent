import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, "..", "contracts", "BallotEmitter.sol");

let solc = null;
try {
  const mod = await import(pathToFileURL(path.join(here, "..", "node_modules", "solc", "index.js")).href);
  solc = mod.default ?? mod;
} catch {
  solc = null; // optional dependency absent in zero-dep mode
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
