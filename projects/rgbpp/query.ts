// RGB++ cell query
// Uses @rgbpp/sdk for correct constants, queries CKB mainnet read-only

import { RGBPP_LOCK_ARGS_BYTES_LEN } from "@rgbpp-sdk/ckb";
import { getRgbppLockScript } from "@rgbpp-sdk/ckb";

const INDEXER_URL = "https://mainnet.ckb.dev/rpc";
const IS_MAINNET = true;

async function rpc(method: string, params: unknown[]): Promise<any> {
  const res = await fetch(INDEXER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });
  const json: any = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.result;
}

function decodeLockArgs(args: string): { txid: string; vout: number } | null {
  const hex = args.replace("0x", "");
  if (hex.length !== RGBPP_LOCK_ARGS_BYTES_LEN * 2) return null;
  const txid = (hex.slice(0, 64).match(/../g) as string[]).reverse().join("");
  const vout = parseInt(
    (hex.slice(64, 72).match(/../g) as string[]).reverse().join(""),
    16
  );
  return { txid, vout };
}

async function main() {
  const lock = getRgbppLockScript(IS_MAINNET);

  console.log("=== RGB++ Cell Query ===");
  console.log("Network:   CKB Mainnet (read-only)");
  console.log("Lock code_hash: " + lock.codeHash);
  console.log("Lock hash_type: " + lock.hashType);
  console.log("");

  const result = await rpc("get_cells", [
    {
      script: {
        code_hash: lock.codeHash,
        hash_type: lock.hashType,
        args: "0x",
      },
      script_type: "lock",
      script_search_mode: "prefix",
    },
    "asc",
    "0xa",
  ]);

  const cells: any[] = result?.objects ?? [];

  if (cells.length === 0) {
    console.log("No RGB++ cells found.");
    return;
  }

  console.log(`Found ${cells.length} RGB++ cell(s)\n`);

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const args: string = cell.output.lock.args;
    const decoded = decodeLockArgs(args);

    console.log(`--- Cell ${i + 1} ---`);
    console.log(`CKB outpoint:  ${cell.out_point.tx_hash}:${parseInt(cell.out_point.index, 16)}`);
    if (decoded) {
      console.log(`BTC TXID:      ${decoded.txid}`);
      console.log(`BTC VOUT:      ${decoded.vout}`);
    } else {
      console.log(`Lock args:     ${args}`);
    }
    const ckb = Number(BigInt(cell.output.capacity)) / 1e8;
    console.log(`Capacity:      ${ckb.toFixed(4)} CKB`);
    if (cell.output.type) {
      console.log(`Has type script: yes (${cell.output.type.code_hash.slice(0, 18)}...)`);
    } else {
      console.log(`Has type script: no`);
    }
    console.log("");
  }

  console.log("=== What this shows ===");
  console.log("Each RGB++ cell on CKB is bound to a specific Bitcoin UTXO.");
  console.log("Lock args = BTC TXID (32 bytes, reversed) + VOUT (4 bytes, LE).");
  console.log("Spending the CKB cell requires a matching BTC spend in the same tx.");
}

main().catch(console.error);
