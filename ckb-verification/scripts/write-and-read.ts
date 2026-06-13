// Headless proof that ckb-verification works on chain, not just in a build.
//
// It writes a real multi-cell document to CKB testnet with a private-key signer,
// waits for the transaction to confirm, then reads it straight back from the
// creating transaction and checks the content is byte-for-byte intact. No browser,
// no wallet extension. The same engine the UI calls, driven from the command line.
//
// Run:  npx tsx scripts/write-and-read.ts
// Needs CKB_TESTNET_PRIVATE_KEY in .env (a funded testnet key). See .env.example.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ccc } from "@ckb-ccc/core";
import { writeDocument } from "../lib/codex/write";
import { readDocument } from "../lib/codex/read";

const EXPLORER_TX = "https://testnet.explorer.nervos.org/transaction/";
const CONFIRM_TIMEOUT_MS = 180_000;
const CONFIRM_POLL_MS = 5_000;

// Minimal .env loader so the script has no runtime dependency. Only KEY=VALUE lines.
function loadEnv(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env file: fall back to the real environment.
  }
}

// A deliberately multi-chunk document. At the 1024-byte default chunk size this
// spans several cells, so the run exercises the manifest-plus-chunks path the
// single-line toy never did, not just a one-cell happy case.
function sampleDocument(): string {
  const para =
    "On-chain proof run. This document is stored on Nervos CKB by splitting it " +
    "across a manifest cell and one cell per chunk, written in a single signed " +
    "transaction. Reading walks the manifest, pulls each chunk back in order, and " +
    "checks the content hash. One cell cannot hold a book, so the book is made of cells. ";
  return `# ckb-verification on-chain proof\n\n${para.repeat(8)}\n\nWritten at ${new Date().toISOString()}.\n`;
}

async function waitForConfirmation(client: ccc.Client, txHash: string): Promise<void> {
  const deadline = Date.now() + CONFIRM_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const res = await client.getTransaction(txHash);
    const status = res?.status;
    if (status === "committed") return;
    process.stdout.write(`  status: ${status ?? "pending"} ...\n`);
    await new Promise((r) => setTimeout(r, CONFIRM_POLL_MS));
  }
  throw new Error("Transaction did not confirm within the timeout. Check the explorer.");
}

async function main(): Promise<void> {
  loadEnv();

  const privateKey = process.env.CKB_TESTNET_PRIVATE_KEY;
  if (!privateKey || privateKey === "0x...") {
    throw new Error("Set CKB_TESTNET_PRIVATE_KEY in .env to a funded testnet key. See .env.example.");
  }
  const passphrase = process.env.CKB_DOC_PASSPHRASE || undefined;

  const client = new ccc.ClientPublicTestnet();
  const signer = new ccc.SignerCkbPrivateKey(client, privateKey);

  const address = await signer.getRecommendedAddress();
  const balance = await signer.getBalance();
  console.log("Wallet:  ", address);
  console.log("Balance: ", `${ccc.fixedPointToString(balance)} CKB`);
  console.log("Encrypt: ", passphrase ? "yes (AES-GCM, passphrase set)" : "no (plaintext)");
  console.log("");

  const content = sampleDocument();
  console.log(`Writing a ${new TextEncoder().encode(content).length}-byte document ...`);

  const result = await writeDocument(signer, content, {
    title: "ckb-verification on-chain proof",
    passphrase,
  });

  console.log("");
  console.log("WRITE OK");
  console.log("  tx hash:   ", result.txHash);
  console.log("  cells:     ", `${result.cellCount} (1 manifest + ${result.chunkCount} chunks)`);
  console.log("  capacity:  ", `~${result.capacityCKB} CKB (refundable deposit)`);
  console.log("  explorer:  ", `${EXPLORER_TX}${result.txHash}`);
  console.log("");

  console.log("Waiting for the transaction to commit ...");
  await waitForConfirmation(client, result.txHash);
  console.log("Committed.");
  console.log("");

  console.log("Reading it back from the creating transaction ...");
  const readBack = await readDocument(client, result.txHash, passphrase);

  const matches = readBack.content === content;
  console.log("READ OK");
  console.log("  cells read:", readBack.cellCount);
  console.log("  integrity: ", readBack.verified ? "verified (hash matches)" : "FAILED (hash mismatch)");
  console.log("  round trip:", matches ? "exact (bytes identical)" : "MISMATCH");
  console.log("");

  if (!readBack.verified || !matches) {
    throw new Error("Proof failed: the document read back did not match what was written.");
  }
  console.log("PASS: document written, confirmed, and read back intact on CKB testnet.");
}

main().catch((err) => {
  console.error("");
  console.error("FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
