import { ccc } from "@ckb-ccc/core";
import { prepareDocument, estimateCapacityCKB, PrepareOptions } from "./document";

export type WriteResult = {
  txHash: string;
  chunkCount: number;
  cellCount: number; // manifest cell + chunk cells
  capacityCKB: number;
};

// The whole document is written in one transaction: a manifest cell first, then one
// cell per chunk, all locked to the writer. CCC fills each cell's minimal capacity
// from its real lock-script size plus data length, so this is correct for JoyID,
// MetaMask, or any other connected wallet. completeFeeBy appends the change cell.
export async function writeDocument(
  signer: ccc.Signer,
  content: string,
  opts: PrepareOptions,
): Promise<WriteResult> {
  const { manifest, manifestBytes, chunks } = await prepareDocument(content, opts);

  const { script: lock } = await signer.getRecommendedAddressObj();
  const cellData = [manifestBytes, ...chunks];

  const tx = ccc.Transaction.from({
    outputs: cellData.map(() => ({ lock })),
    outputsData: cellData.map((data) => ccc.hexFrom(data)),
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);
  const txHash = await signer.sendTransaction(tx);

  return {
    txHash,
    chunkCount: manifest.chunkCount,
    cellCount: cellData.length,
    capacityCKB: estimateCapacityCKB(manifestBytes, chunks),
  };
}
