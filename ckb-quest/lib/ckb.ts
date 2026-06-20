import { ccc } from "@ckb-ccc/core";
import { findSpore } from "@ckb-ccc/spore";
import { avatarSvg } from "./avatar";

const TESTNET_RPC = process.env.CKB_TESTNET_RPC ?? "https://testnet.ckb.dev/rpc";
const SHANNONS_PER_CKB = BigInt(100_000_000);
const QUEST_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3elzk7jkwdf7yw5q4ek";

function getClient() {
  return new ccc.ClientPublicTestnet({ url: TESTNET_RPC });
}

// Checkpoint 1: verify address has >= 100 CKB

export async function verifyBalance(address: string): Promise<{ ok: boolean; balance: number; error?: string }> {
  try {
    const client = getClient();
    const addr = await ccc.Address.fromString(address, client);
    const balance = await client.getBalance([addr.script]);
    const ckb = Number(balance / SHANNONS_PER_CKB);
    if (ckb < 100) {
      return { ok: false, balance: ckb, error: `Balance is ${ckb.toFixed(2)} CKB. Need at least 100 CKB.` };
    }
    return { ok: true, balance: ckb };
  } catch (e) {
    return { ok: false, balance: 0, error: `Could not query address: ${String(e)}` };
  }
}

// Checkpoint 2: verify tx sends 100 CKB to quest address with change

export async function verifyTransfer(txHash: string, senderAddress: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getClient();
    const txWithStatus = await client.getTransaction(txHash);
    if (!txWithStatus) return { ok: false, error: "Transaction not found on testnet" };

    const tx = txWithStatus.transaction;
    const outputs = tx.outputs;

    const questAddr = await ccc.Address.fromString(QUEST_ADDRESS, client);
    const senderAddr = await ccc.Address.fromString(senderAddress, client);

    const questLockHash = questAddr.script.hash();
    const senderLockHash = senderAddr.script.hash();

    let sentToQuest = false;
    let hasChangeOutput = false;

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const lockHash = output.lock.hash();
      const capacity = output.capacity;

      if (lockHash === questLockHash) {
        const sentCKB = Number(capacity / SHANNONS_PER_CKB);
        if (sentCKB >= 99 && sentCKB <= 101) sentToQuest = true;
      }
      if (lockHash === senderLockHash) {
        hasChangeOutput = true;
      }
    }

    if (!sentToQuest) return { ok: false, error: "Transaction does not send ~100 CKB to the quest address" };
    if (!hasChangeOutput) return { ok: false, error: "No change output found. You sent all your CKB. This is the lesson: always include a change output." };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not verify transaction: ${String(e)}` };
  }
}

// Checkpoint 3: verify xUDT issuance

export async function verifyToken(typeScriptHash: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getClient();
    const cells = await client.findCells({
      script: { codeHash: typeScriptHash, hashType: "type", args: "0x" },
      scriptType: "type",
      scriptSearchMode: "prefix",
    });

    let totalAmount = BigInt(0);
    let count = 0;
    for await (const cell of cells) {
      if (cell.outputData && cell.outputData.length >= 34) {
        const amountHex = cell.outputData.slice(2, 34);
        const le = amountHex.match(/.{2}/g)!.reverse().join("");
        totalAmount += BigInt("0x" + le);
      }
      count++;
      if (count > 50) break;
    }

    if (count === 0) return { ok: false, error: "No cells found with this type script hash on testnet" };
    if (totalAmount < BigInt(1000)) return { ok: false, error: `Total supply found: ${totalAmount}. Need at least 1,000 units.` };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not verify token: ${String(e)}` };
  }
}

// Checkpoint 4: verify Fiber channel

export async function verifyFiberChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  const fiberRpc = process.env.FIBER_NODE_RPC_URL;
  if (!fiberRpc) {
    return { ok: false, error: "Fiber node not configured on the quest server yet. Check back soon or DM @david on Nervos Talk." };
  }

  try {
    const res = await fetch(fiberRpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "get_channel", params: [{ channel_id: channelId }] }),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    if (json.error) return { ok: false, error: `Channel not found: ${json.error.message}` };

    const channel = json.result;
    const capacityCKB = Number(BigInt(channel.local_balance ?? "0x0") / SHANNONS_PER_CKB);
    if (capacityCKB < 100) return { ok: false, error: `Channel capacity is ${capacityCKB} CKB. Need at least 100 CKB.` };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not reach Fiber node: ${String(e)}` };
  }
}

// Checkpoint 5: verify Fiber payment

export async function verifyFiberPayment(paymentHash: string): Promise<{ ok: boolean; error?: string }> {
  const fiberRpc = process.env.FIBER_NODE_RPC_URL;
  if (!fiberRpc) {
    return { ok: false, error: "Fiber node not configured on the quest server yet." };
  }

  try {
    const res = await fetch(fiberRpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "get_payment", params: [{ payment_hash: paymentHash }] }),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    if (json.error) return { ok: false, error: `Payment not found: ${json.error.message}` };
    if (json.result?.status !== "Success") return { ok: false, error: `Payment status: ${json.result?.status ?? "unknown"}. Must be Success.` };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not verify payment: ${String(e)}` };
  }
}

// Checkpoint 6: verify Nervos DAO deposit

const MAINNET_RPC = process.env.CKB_MAINNET_RPC ?? "https://mainnet.ckb.dev/rpc";

export async function verifyDaoDeposit(txHash: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getClient();
    const txWithStatus = await client.getTransaction(txHash);
    if (!txWithStatus) return { ok: false, error: "Transaction not found on testnet" };

    const daoScript = await client.getKnownScript(ccc.KnownScript.NervosDao);
    const daoCodeHash = daoScript.codeHash;
    const daoHashType = daoScript.hashType;

    const tx = txWithStatus.transaction;
    for (let i = 0; i < tx.outputs.length; i++) {
      const output = tx.outputs[i];
      if (
        output.type &&
        output.type.codeHash === daoCodeHash &&
        output.type.hashType === daoHashType &&
        tx.outputsData[i] === "0x0000000000000000"
      ) {
        const capacityCKB = Number(output.capacity / SHANNONS_PER_CKB);
        if (capacityCKB < 100) {
          return { ok: false, error: `DAO deposit found but only ${capacityCKB} CKB. Need at least 100 CKB.` };
        }
        return { ok: true };
      }
    }

    return { ok: false, error: "No Nervos DAO deposit output found in this transaction. Check that the data field is 0x0000000000000000 and the NervosDAO type script is attached." };
  } catch (e) {
    return { ok: false, error: `Could not verify transaction: ${String(e)}` };
  }
}

// Checkpoint 7: verify Spore mint

const SPORE_CODE_HASH = "0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d";
const SPORE_HASH_TYPE = "data1";

export async function verifySpore(sporeId: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(sporeId)) {
    return { ok: false, error: "Invalid Spore ID: must be 0x followed by 64 hex characters." };
  }

  try {
    const client = getClient();
    const cells = client.findCells({
      script: { codeHash: SPORE_CODE_HASH, hashType: SPORE_HASH_TYPE, args: sporeId },
      scriptType: "type",
      scriptSearchMode: "exact",
    });

    for await (const cell of cells) {
      if (!cell.outputData || cell.outputData === "0x" || cell.outputData.length <= 2) {
        return { ok: false, error: "Spore cell found but has no content. The data field should contain your molecule-encoded content." };
      }
      return { ok: true };
    }

    return { ok: false, error: "No Spore found with this ID on testnet. Make sure the transaction is confirmed and the Spore ID is the type.args of the output cell." };
  } catch (e) {
    return { ok: false, error: `Could not verify Spore: ${String(e)}` };
  }
}

// Checkpoint 8: verify RGB++ binding

const RGBPP_CODE_HASH = "0xbc6c568a1a0d0a09f6844dc9d74ddb4343c32143ff25f727c59edf4fb72d6936";
const RGBPP_HASH_TYPE = "type";

function encodeLockArgs(btcTxid: string, btcVout: number): string {
  const voutLE = btcVout.toString(16).padStart(8, "0").match(/../g)!.reverse().join("");
  const txidLE = btcTxid.match(/../g)!.reverse().join("");
  return "0x" + voutLE + txidLE;
}

export async function verifyRgbppBinding(input: string): Promise<{ ok: boolean; error?: string }> {
  const parts = input.trim().split(":");
  if (parts.length !== 2) {
    return { ok: false, error: 'Must be in format txid:vout, e.g. a4a078ff...00:0' };
  }
  const [btcTxid, voutStr] = parts;
  const btcVout = parseInt(voutStr, 10);

  if (!/^[0-9a-fA-F]{64}$/.test(btcTxid)) {
    return { ok: false, error: "Invalid Bitcoin TXID: must be 64 hex characters." };
  }
  if (isNaN(btcVout) || btcVout < 0) {
    return { ok: false, error: "Invalid VOUT: must be a non-negative integer." };
  }

  const lockArgs = encodeLockArgs(btcTxid.toLowerCase(), btcVout);

  try {
    const res = await fetch(MAINNET_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "get_cells",
        params: [
          {
            script: { code_hash: RGBPP_CODE_HASH, hash_type: RGBPP_HASH_TYPE, args: lockArgs },
            script_type: "lock",
            script_search_mode: "exact",
          },
          "asc",
          "0x1",
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    const json = await res.json() as { result?: { objects?: unknown[] }; error?: { message: string } };
    if (json.error) return { ok: false, error: `Mainnet RPC error: ${json.error.message}` };

    const cells = json.result?.objects ?? [];
    if (cells.length === 0) {
      return { ok: false, error: `No RGB++ cell found on CKB mainnet bound to BTC ${btcTxid.slice(0, 10)}…:${btcVout}. Check your byte-reversal. TXID and VOUT are both little-endian in the lock args.` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not query CKB mainnet: ${String(e)}` };
  }
}

// Checkpoint 9: verify the minted Quester Spore matches the address

export async function verifyQuester(sporeId: string, address: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(sporeId)) {
    return { ok: false, error: "Invalid Spore ID. Mint your Quester with the button above, then verify." };
  }

  try {
    const client = getClient();
    const found = await findSpore(client, sporeId);
    if (!found) {
      return { ok: false, error: "No Spore found with this ID on testnet yet. If you just minted, the indexer may still be catching up. Click Verify again in a few seconds." };
    }

    const { contentType, content } = found.sporeData;
    if (contentType !== "image/svg+xml") {
      return { ok: false, error: "This Spore is not an SVG avatar. Mint your Quester with the button above rather than pasting another Spore." };
    }

    const got = ccc.bytesTo(content, "utf8");
    const expected = avatarSvg(address);
    if (got !== expected) {
      return { ok: false, error: "This Spore's content is not your Quester. It must be the exact portrait generated for your address. Use the Mint button so the bytes match." };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not verify your Quester: ${String(e)}` };
  }
}

// Reward: send CKB from house wallet, idempotently.
//
// Rewards are paid as on-chain transactions, so the chain itself is the durable record of
// what we have already paid. We do not trust server memory for that (it resets on every
// redeploy, which would let an address re-claim from the funded wallet). Instead every
// reward output is tagged at shannon precision with its checkpoint id, making a paid reward
// a uniquely identifiable cell we can look up before paying again.

const MIN_CELL_CKB = BigInt(61); // occupied capacity of a standard secp256k1 lock cell
const REWARD_CELL_SCAN_LIMIT = 150;
const REWARD_TX_SCAN_LIMIT = 50;

// base CKB in the high digits, checkpoint id in the low shannons => collision-free per checkpoint
export function rewardCapacity(amountCKB: number, checkpointId: number): bigint {
  return ccc.fixedPointFrom(amountCKB.toString()) + BigInt(checkpointId);
}

// Has the house wallet already paid this exact checkpoint reward to this address?
// Checks the live wallet first (the reward usually sits unspent), then falls back to the
// address's receipt history in case the reward cell was already spent or consolidated.
export async function alreadyRewarded(
  toAddress: string,
  checkpointId: number,
  amountCKB: number,
): Promise<boolean> {
  const client = getClient();
  const { script: toLock } = await ccc.Address.fromString(toAddress, client);
  const tagged = rewardCapacity(amountCKB, checkpointId);

  let cellsScanned = 0;
  for await (const cell of client.findCellsByLock(toLock, null, false)) {
    if (cell.cellOutput.capacity === tagged) return true;
    if (++cellsScanned >= REWARD_CELL_SCAN_LIMIT) break;
  }

  let txScanned = 0;
  for await (const record of client.findTransactionsByLock(toLock, null, false, "desc")) {
    if (record.isInput) continue; // only outputs received by this lock are reward receipts
    if (++txScanned > REWARD_TX_SCAN_LIMIT) break;
    const txWithStatus = await client.getTransaction(record.txHash);
    const out = txWithStatus?.transaction.outputs[Number(record.cellIndex)];
    if (out && out.capacity === tagged) return true;
  }

  return false;
}

export async function sendReward(
  toAddress: string,
  amountCKB: number,
  checkpointId: number,
): Promise<{ txHash: string }> {
  const privateKey = process.env.HOUSE_PRIVATE_KEY;
  if (!privateKey) throw new Error("HOUSE_PRIVATE_KEY not configured");

  const client = getClient();
  const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
  const { script: toLock } = await ccc.Address.fromString(toAddress, client);

  const capacity = rewardCapacity(amountCKB, checkpointId);
  // A cell cannot hold less than its occupied capacity. Fail loudly on a misconfigured
  // sub-floor reward instead of silently dropping the payout cell.
  if (capacity < MIN_CELL_CKB * SHANNONS_PER_CKB) {
    throw new Error(`Reward of ${amountCKB} CKB is below the ${MIN_CELL_CKB} CKB cell-capacity floor`);
  }

  const tx = ccc.Transaction.from({
    outputs: [{ lock: toLock, capacity }],
    outputsData: ["0x"],
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);
  const txHash = await signer.sendTransaction(tx);
  return { txHash };
}
