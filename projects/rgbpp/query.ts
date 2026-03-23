// RGB++ cell query - uses raw CKB indexer RPC, no SDK required
// Queries CKB mainnet read-only to find isomorphically bound cells

const INDEXER_URL = "https://mainnet.ckb.dev/rpc";

// RGB++ Lock on CKB mainnet (type ID deployment)
// Source: https://github.com/ckb-cell/rgbpp-sdk
const RGBPP_LOCK_CODE_HASH =
  "0x61ca7a4796a4eb19ca4f0d065cb9b10ddcf002f10f7cbb2a55e352423c99082";

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

// RGB++ lock args = BTC TXID (32 bytes reversed) + VOUT (4 bytes LE) = 36 bytes
function decodeLockArgs(args: string): { txid: string; vout: number } | null {
  const hex = args.replace("0x", "");
  if (hex.length !== 72) return null;
  const txid = (hex.slice(0, 64).match(/../g) as string[]).reverse().join("");
  const vout = parseInt(
    (hex.slice(64, 72).match(/../g) as string[]).reverse().join(""),
    16
  );
  return { txid, vout };
}

async function main() {
  console.log("=== RGB++ Cell Query ===");
  console.log("Network:   CKB Mainnet (read-only observation)");
  console.log("Endpoint:  " + INDEXER_URL);
  console.log("Lock hash: " + RGBPP_LOCK_CODE_HASH);
  console.log("");

  // get_cells via CKB indexer with prefix search on the RGB++ lock code hash
  const result = await rpc("get_cells", [
    {
      script: {
        code_hash: RGBPP_LOCK_CODE_HASH,
        hash_type: "type",
        args: "0x",
      },
      script_type: "lock",
      script_search_mode: "prefix",
    },
    "asc",
    "0xa", // fetch 10 cells
  ]);

  const cells: any[] = result?.objects ?? [];

  if (cells.length === 0) {
    console.log("No RGB++ cells returned. Trying without search mode...");

    // fallback: try without script_search_mode
    const result2 = await rpc("get_cells", [
      {
        script: {
          code_hash: RGBPP_LOCK_CODE_HASH,
          hash_type: "type",
          args: "0x",
        },
        script_type: "lock",
      },
      "asc",
      "0xa",
    ]);
    const cells2: any[] = result2?.objects ?? [];
    console.log("Fallback result count:", cells2.length);
    if (cells2.length > 0) {
      console.log("First cell raw:", JSON.stringify(cells2[0], null, 2));
    }
    return;
  }

  console.log(`Found ${cells.length} RGB++ cell(s). Decoding...\n`);

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const args: string = cell.output.lock.args;
    const decoded = decodeLockArgs(args);

    console.log(`--- Cell ${i + 1} ---`);
    console.log(`CKB outpoint:  ${cell.out_point.tx_hash}:${parseInt(cell.out_point.index, 16)}`);
    console.log(`Lock args:     ${args}`);
    if (decoded) {
      console.log(`BTC TXID:      ${decoded.txid}`);
      console.log(`BTC VOUT:      ${decoded.vout}`);
    }
    const capacityCKB = (BigInt(cell.output.capacity) / BigInt(1e8)).toString();
    console.log(`Capacity:      ${capacityCKB} CKB`);
    if (cell.output.type) {
      console.log(`Type script:   ${cell.output.type.code_hash.slice(0, 22)}...`);
    } else {
      console.log(`Type script:   none`);
    }
    console.log("");
  }

  console.log("=== What this shows ===");
  console.log("Each cell is locked with the RGB++ lock script.");
  console.log("The lock args encode a specific Bitcoin UTXO (TXID + VOUT).");
  console.log("Unlocking the CKB cell requires spending the matching BTC UTXO.");
  console.log("This is the isomorphic binding at the core of RGB++.");
}

main().catch(console.error);
