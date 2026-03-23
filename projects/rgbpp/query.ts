import { ccc } from "@ckb-ccc/core";

// RGB++ Lock script on CKB mainnet
// https://github.com/ckb-cell/rgbpp-sdk
const RGBPP_LOCK_CODE_HASH =
  "0x61ca7a4796a4eb19ca4f0d065cb9b10ddcf002f10f7cbb2a55e352423c99082";
const RGBPP_LOCK_HASH_TYPE = "type";

// RGB++ lock args = BTC TXID (32 bytes, reversed/LE) + BTC VOUT (4 bytes, LE)
// Total: 36 bytes = 72 hex chars (plus "0x" prefix)
function decodeLockArgs(args: string): { txid: string; vout: number } | null {
  const hex = args.replace("0x", "");
  if (hex.length !== 72) return null;

  // BTC TXID is stored in reversed byte order
  const txidLE = hex.slice(0, 64);
  const txid = (txidLE.match(/../g) as string[]).reverse().join("");

  // VOUT is 4-byte little-endian
  const voutBytes = (hex.slice(64, 72).match(/../g) as string[]).reverse().join("");
  const vout = parseInt(voutBytes, 16);

  return { txid, vout };
}

function formatCKB(capacity: bigint): string {
  return (Number(capacity) / 1e8).toFixed(2) + " CKB";
}

async function main() {
  const client = new ccc.ClientPublicMainnet();

  console.log("=== RGB++ Cell Query ===");
  console.log("Network:    CKB Mainnet (read-only)");
  console.log("Lock hash:  " + RGBPP_LOCK_CODE_HASH);
  console.log("Hash type:  " + RGBPP_LOCK_HASH_TYPE);
  console.log("");
  console.log("Searching for RGB++ cells...");
  console.log("");

  let count = 0;
  const results: Array<{
    ckbOutpoint: string;
    btcTxid: string;
    btcVout: number;
    capacity: string;
    hasType: boolean;
    typeCodeHash?: string;
  }> = [];

  for await (const cell of client.findCells(
    {
      script: {
        codeHash: RGBPP_LOCK_CODE_HASH,
        hashType: RGBPP_LOCK_HASH_TYPE,
        args: "0x",
      },
      scriptType: "lock",
      scriptSearchMode: "prefix",
    },
    "asc",
    10
  )) {
    const decoded = decodeLockArgs(cell.cellOutput.lock.args);
    if (!decoded) continue;

    count++;
    results.push({
      ckbOutpoint: `${cell.outPoint.txHash}:${cell.outPoint.index}`,
      btcTxid: decoded.txid,
      btcVout: decoded.vout,
      capacity: formatCKB(cell.cellOutput.capacity),
      hasType: !!cell.cellOutput.type,
      typeCodeHash: cell.cellOutput.type?.codeHash,
    });
  }

  if (count === 0) {
    console.log("No RGB++ cells found with this configuration.");
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`--- Cell ${i + 1} ---`);
    console.log(`CKB outpoint:  ${r.ckbOutpoint}`);
    console.log(`BTC TXID:      ${r.btcTxid}`);
    console.log(`BTC VOUT:      ${r.btcVout}`);
    console.log(`Capacity:      ${r.capacity}`);
    if (r.hasType && r.typeCodeHash) {
      console.log(`Type script:   ${r.typeCodeHash.slice(0, 20)}...`);
    } else {
      console.log(`Type script:   none`);
    }
    console.log("");
  }

  console.log(`=== Summary ===`);
  console.log(`RGB++ cells found: ${count}`);
  console.log(``);
  console.log(`Each cell above is a CKB cell bound to a specific Bitcoin UTXO.`);
  console.log(`The lock args encode: BTC TXID (32 bytes) + VOUT index (4 bytes).`);
  console.log(`Spending these cells on CKB requires spending the matching BTC UTXO.`);
}

main().catch(console.error);
