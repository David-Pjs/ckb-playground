import { ccc, Script } from "@ckb-ccc/core";
import { cccClient } from "./ccc-client";

type Account = {
  lockScript: Script;
  address: string;
  pubKey: string;
};

export type Recipient = {
  address: string;
  amount: string;
};

export const generateAccountFromPrivateKey = async (
  privKey: string
): Promise<Account> => {
  const signer = new ccc.SignerCkbPrivateKey(cccClient, privKey);
  const lock = await signer.getAddressObjSecp256k1();
  return {
    lockScript: lock.script,
    address: lock.toString(),
    pubKey: signer.publicKey,
  };
};

export async function capacityOf(address: string): Promise<bigint> {
  const addr = await ccc.Address.fromString(address, cccClient);
  let balance = await cccClient.getBalance([addr.script]);
  return balance;
}

export async function batchTransfer(
  recipients: Recipient[],
  signerPrivateKey: string
): Promise<string> {
  const signer = new ccc.SignerCkbPrivateKey(cccClient, signerPrivateKey);

  // Resolve all recipient addresses to lock scripts
  const outputs: { lock: Script }[] = [];
  for (const r of recipients) {
    const { script: toLock } = await ccc.Address.fromString(r.address, cccClient);
    outputs.push({ lock: toLock });
  }

  // Build transaction with multiple outputs
  const tx = ccc.Transaction.from({
    outputs,
    outputsData: recipients.map(() => "0x"),
  });

  // Set capacity for each output
  tx.outputs.forEach((output, i) => {
    output.capacity = ccc.fixedPointFrom(recipients[i].amount);
  });

  // Complete missing parts for transaction
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);
  const txHash = await signer.sendTransaction(tx);
  console.log(
    `Go to explorer to check the sent transaction https://pudge.explorer.nervos.org/transaction/${txHash}`
  );

  return txHash;
}

export function parseCSV(csvText: string): Recipient[] {
  const lines = csvText.trim().split('\n');
  const recipients: Recipient[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(',');
    if (parts.length < 2) continue;

    const address = parts[0].trim();
    const amount = parts[1].trim();

    if (!address || !amount) continue;
    if (isNaN(Number(amount)) || Number(amount) <= 0) continue;

    recipients.push({ address, amount });
  }

  return recipients;
}

export async function wait(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export function shannonToCKB(amount: bigint) {
  return amount / 100000000n;
}
