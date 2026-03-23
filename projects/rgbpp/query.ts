// RGB++ cell query
// Uses @rgbpp-sdk/ckb for the correct lock script constants
// Queries CKB mainnet read-only - no wallet, no spending

import { getRgbppLockScript } from "@rgbpp-sdk/ckb";

const INDEXER_URL = "https://mainnet.ckb.dev/rpc";
const IS_MAINNET = true;

// RGB++ lock args format:
//   VOUT (4 bytes, little-endian) + BTC TXID (32 bytes, little-endian) = 36 bytes
const RGBPP_ARGS_BYTES = 36;

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
  if (hex.length !== RGBPP_ARGS_BYTES * 2) return null;

  // First 4 bytes = VOUT (little-endian)
  const vout = parseInt(
    (hex.slice(0, 8).match(/../g) as string[]).reverse().join(""),
    16
  );

  // Next 32 bytes = BTC TXID (stored little-endian, display as big-endian)
  const txid = (hex.slice(8, 72).match(/../g) as string[]).reverse().join("");

  return { txid, vout };
}

async function main() {
  const lock = getRgbppLockScript(IS_MAINNET);

  console.log("=== RGB++ Cell Query ===");
  console.log("Network:        CKB Mainnet (read-only)");
  console.log("RGB++ Lock:     " + lock.codeHash);
  console.log("Hash type:      " + lock.hashType);
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

  console.log(`Found ${cells.length} live RGB++ cell(s) on mainnet\n`);

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const args: string = cell.output.lock.args;
    const decoded = decodeLockArgs(args);
    const ckb = (Number(BigInt(cell.output.capacity)) / 1e8).toFixed(4);

    console.log(`--- Cell ${i + 1} ---`);
    console.log(`CKB outpoint:    ${cell.out_point.tx_hash}:${parseInt(cell.out_point.index, 16)}`);

    if (decoded) {
      console.log(`BTC TXID:        ${decoded.txid}`);
      console.log(`BTC VOUT:        ${decoded.vout}`);
    } else {
      console.log(`Lock args (raw): ${args}  [non-standard length, likely genesis cell]`);
    }

    console.log(`Capacity:        ${ckb} CKB`);

    if (cell.output.type) {
      console.log(`Token type:      ${cell.output.type.code_hash.slice(0, 18)}...`);
    } else {
      console.log(`Token type:      none`);
    }
    console.log("");
  }

  console.log("=== Protocol Summary ===");
  console.log("Each cell above is isomorphically bound to a Bitcoin UTXO.");
  console.log("Lock args encode:  VOUT (4B LE) + BTC TXID (32B LE)");
  console.log("To spend the CKB cell, the matching BTC UTXO must be spent");
  console.log("in the same RGB++ transaction commitment on Bitcoin.");
}

main().catch(console.error);
