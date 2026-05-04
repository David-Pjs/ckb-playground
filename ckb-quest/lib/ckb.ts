import { ccc } from "@ckb-ccc/core";

const TESTNET_RPC = process.env.CKB_TESTNET_RPC ?? "https://testnet.ckb.dev/rpc";
const SHANNONS_PER_CKB = BigInt(100_000_000);
const QUEST_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3elzk7jkwdf7yw5q4ek";

function getClient() {
  return new ccc.ClientPublicTestnet({ url: TESTNET_RPC });
}

// ─── Checkpoint 1: verify address has >= 100 CKB ────────────────────────────

export async function verifyBalance(address: string): Promise<{ ok: boolean; balance: number; error?: string }> {
  try {
    const client = getClient();
    const addr = await ccc.Address.fromString(address, client);
    const balance = await client.getBalance([addr.script]);
    const ckb = Number(balance / SHANNONS_PER_CKB);
    if (ckb < 100) {
      return { ok: false, balance: ckb, error: `Balance is ${ckb.toFixed(2)} CKB — need at least 100 CKB` };
    }
    return { ok: true, balance: ckb };
  } catch (e) {
    return { ok: false, balance: 0, error: `Could not query address: ${String(e)}` };
  }
}

// ─── Checkpoint 2: verify tx sends 100 CKB to quest address with change ─────

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
    if (!hasChangeOutput) return { ok: false, error: "No change output found — you sent all your CKB. This is the lesson: always include a change output." };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not verify transaction: ${String(e)}` };
  }
}

// ─── Checkpoint 3: verify xUDT issuance ─────────────────────────────────────

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
    if (totalAmount < BigInt(1000)) return { ok: false, error: `Total supply found: ${totalAmount} — need at least 1,000 units` };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not verify token: ${String(e)}` };
  }
}

// ─── Checkpoint 4: verify Fiber channel ─────────────────────────────────────

export async function verifyFiberChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  const fiberRpc = process.env.FIBER_NODE_RPC_URL;
  if (!fiberRpc) {
    return { ok: false, error: "Fiber node not configured on the quest server yet. Check back soon — or DM @david on Nervos Talk." };
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
    if (capacityCKB < 100) return { ok: false, error: `Channel capacity is ${capacityCKB} CKB — need at least 100 CKB` };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not reach Fiber node: ${String(e)}` };
  }
}

// ─── Checkpoint 5: verify Fiber payment ─────────────────────────────────────

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
    if (json.result?.status !== "Success") return { ok: false, error: `Payment status: ${json.result?.status ?? "unknown"} — must be Success` };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not verify payment: ${String(e)}` };
  }
}

// ─── Reward: send CKB from house wallet ──────────────────────────────────────

export async function sendReward(toAddress: string, amountCKB: number): Promise<{ txHash: string }> {
  const privateKey = process.env.HOUSE_PRIVATE_KEY;
  if (!privateKey) throw new Error("HOUSE_PRIVATE_KEY not configured");

  const client = getClient();
  const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
  const { script: toLock } = await ccc.Address.fromString(toAddress, client);

  const tx = ccc.Transaction.from({
    outputs: [{ lock: toLock, capacity: ccc.fixedPointFrom(amountCKB.toString()) }],
    outputsData: ["0x"],
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);
  const txHash = await signer.sendTransaction(tx);
  return { txHash };
}
