import { ccc } from '@ckb-ccc/core';
import { cccClient } from './ccc-client';
import type { Recipient } from './utils';

// secp256k1 lock (53) + xUDT type (65) + 16 bytes data + 8 bytes capacity field = 142 bytes minimum.
// 162 CKB gives headroom for lock script args that are longer than the secp256k1 standard.
const MIN_XUDT_CAPACITY = 162n * 100_000_000n;

export type WalletInfo = {
  address: string;
  lock: ccc.Script;
  signer: ccc.SignerCkbPrivateKey;
};

function uint128LE(value: bigint): Uint8Array {
  const buf = new Uint8Array(16);
  let v = value;
  for (let i = 0; i < 16; i++) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return buf;
}

function readUint128LE(hex: string): bigint {
  const bytes = ccc.bytesFrom(hex);
  let result = 0n;
  for (let i = Math.min(bytes.length - 1, 15); i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

function toHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function loadWallet(privKey: string): Promise<WalletInfo> {
  const signer = new ccc.SignerCkbPrivateKey(cccClient, privKey);
  const addrObj = await signer.getAddressObjSecp256k1();
  return { address: addrObj.toString(), lock: addrObj.script, signer };
}

export async function getCKBBalance(address: string): Promise<bigint> {
  const addr = await ccc.Address.fromString(address, cccClient);
  return cccClient.getBalance([addr.script]);
}

export async function getTokenBalance(
  address: string,
  xudtArgs: string,
): Promise<bigint> {
  const addr = await ccc.Address.fromString(address, cccClient);
  const xudtType = await ccc.Script.fromKnownScript(
    cccClient,
    ccc.KnownScript.XUdt,
    xudtArgs,
  );

  let total = 0n;
  for await (const cell of cccClient.findCells({
    script: addr.script,
    scriptType: 'lock',
    filter: { script: xudtType },
    scriptSearchMode: 'exact',
  })) {
    if (cell.outputData && cell.outputData.length >= 34) {
      total += readUint128LE(cell.outputData);
    }
  }
  return total;
}

export async function batchTransferCKB(
  recipients: Recipient[],
  signer: ccc.SignerCkbPrivateKey,
): Promise<string> {
  const outputs = await Promise.all(
    recipients.map(async r => {
      const { script: lock } = await ccc.Address.fromString(r.address, cccClient);
      return { lock, capacity: ccc.fixedPointFrom(r.amount) };
    }),
  );

  const tx = ccc.Transaction.from({
    outputs,
    outputsData: recipients.map(() => '0x'),
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);
  return signer.sendTransaction(tx);
}

export async function batchTokenAirdrop(
  recipients: Recipient[],
  xudtArgs: string,
  decimals: number,
  signer: ccc.SignerCkbPrivateKey,
): Promise<string> {
  const xudtType = await ccc.Script.fromKnownScript(
    cccClient,
    ccc.KnownScript.XUdt,
    xudtArgs,
  );
  const senderLock = (await signer.getAddressObjSecp256k1()).script;

  const factor = 10 ** decimals;
  const amounts = recipients.map(r => BigInt(Math.round(parseFloat(r.amount) * factor)));
  const totalOut = amounts.reduce((a, b) => a + b, 0n);

  const outputs: ccc.CellOutputLike[] = [];
  const outputsData: string[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const { script: lock } = await ccc.Address.fromString(recipients[i].address, cccClient);
    outputs.push({ lock, type: xudtType, capacity: MIN_XUDT_CAPACITY });
    outputsData.push(toHex(uint128LE(amounts[i])));
  }

  const tx = ccc.Transaction.from({ outputs, outputsData });
  await tx.addCellDepsOfKnownScripts(cccClient, ccc.KnownScript.XUdt);

  let inputUdt = 0n;
  for await (const cell of cccClient.findCells({
    script: senderLock,
    scriptType: 'lock',
    filter: { script: xudtType },
    scriptSearchMode: 'exact',
  })) {
    tx.inputs.push(ccc.CellInput.from({ previousOutput: cell.outPoint }));
    if (cell.outputData && cell.outputData.length >= 34) {
      inputUdt += readUint128LE(cell.outputData);
    }
    if (inputUdt >= totalOut) break;
  }

  if (inputUdt < totalOut) {
    throw new Error(
      `Insufficient token balance. Need ${totalOut}, available ${inputUdt}.`,
    );
  }

  if (inputUdt > totalOut) {
    tx.outputs.push(ccc.CellOutput.from({ lock: senderLock, type: xudtType, capacity: MIN_XUDT_CAPACITY }));
    tx.outputsData.push(toHex(uint128LE(inputUdt - totalOut)));
  }

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);
  return signer.sendTransaction(tx);
}
