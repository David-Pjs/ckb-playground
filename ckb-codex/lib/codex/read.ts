import { ccc } from "@ckb-ccc/core";
import { hexToBytes } from "./bytes";
import { parseManifest, CodexManifest } from "./manifest";
import { assembleDocument } from "./document";

export type ReadResult = {
  manifest: CodexManifest;
  content: string;
  verified: boolean;
  cellCount: number;
};

// Read straight from the creating transaction, not from live cells. The document is
// readable forever this way, even if the cells are later spent: the chain never
// forgets a transaction's output data.
export async function readDocument(
  client: ccc.Client,
  txHash: string,
  passphrase?: string,
): Promise<ReadResult> {
  const res = await client.getTransaction(txHash);
  if (!res?.transaction) {
    throw new Error("Transaction not found on testnet. Check the hash, or wait for it to confirm.");
  }

  const data = res.transaction.outputsData;
  if (!data || data.length === 0) {
    throw new Error("This transaction has no output data. Nothing to read.");
  }

  const manifest: CodexManifest = parseManifest(hexToBytes(data[0]));
  const expectedCells = manifest.chunkCount + 1;
  if (data.length < expectedCells) {
    throw new Error(
      `The manifest expects ${manifest.chunkCount} chunk cells but the transaction only has ${data.length - 1}.`,
    );
  }

  const chunkBytesArr = data.slice(1, 1 + manifest.chunkCount).map((d) => hexToBytes(d));
  const { content, verified } = await assembleDocument(manifest, chunkBytesArr, passphrase);

  return { manifest, content, verified, cellCount: expectedCells };
}
