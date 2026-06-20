import { NextRequest, NextResponse } from "next/server";
import {
  verifyBalance,
  verifyTransfer,
  verifyToken,
  verifyFiberChannel,
  verifyFiberPayment,
  verifyDaoDeposit,
  verifySpore,
  verifyRgbppBinding,
  verifyQuester,
  sendReward,
  alreadyRewarded,
} from "@/lib/ckb";
import { CHECKPOINTS } from "@/lib/checkpoints";

// Fast in-deploy cache so repeated verifies of the same checkpoint don't re-scan the chain.
// It is only a cache: the authoritative "already paid?" check is alreadyRewarded(), which
// reads the chain, so a redeploy clearing this Map can never cause a double payout.
const claimed = new Map<string, Set<number>>();

function hasClaimed(address: string, checkpointId: number) {
  return claimed.get(address)?.has(checkpointId) ?? false;
}

function markClaimed(address: string, checkpointId: number) {
  if (!claimed.has(address)) claimed.set(address, new Set());
  claimed.get(address)!.add(checkpointId);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    checkpointId: number;
    input: string;
    address: string;
  };

  const { checkpointId, input, address } = body;
  const checkpoint = CHECKPOINTS.find((c) => c.id === checkpointId);
  if (!checkpoint) return NextResponse.json({ ok: false, error: "Unknown checkpoint" }, { status: 400 });
  if (!address) return NextResponse.json({ ok: false, error: "Wallet address required" }, { status: 400 });

  // Run verification
  let result: { ok: boolean; error?: string; balance?: number };

  switch (checkpointId) {
    case 1:
      result = await verifyBalance(input.trim());
      break;
    case 2:
      result = await verifyTransfer(input.trim(), address);
      break;
    case 3:
      result = await verifyToken(input.trim());
      break;
    case 4:
      result = await verifyFiberChannel(input.trim());
      break;
    case 5:
      result = await verifyFiberPayment(input.trim());
      break;
    case 6:
      result = await verifyDaoDeposit(input.trim());
      break;
    case 7:
      result = await verifySpore(input.trim());
      break;
    case 8:
      result = await verifyRgbppBinding(input.trim());
      break;
    case 9:
      result = await verifyQuester(input.trim(), address);
      break;
    default:
      return NextResponse.json({ ok: false, error: "Unknown checkpoint" }, { status: 400 });
  }

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, balance: result.balance });
  }

  // Send reward, once per address per checkpoint. The chain is the source of truth: if a
  // tagged reward for this checkpoint already exists on-chain, we never pay again.
  let rewardTxHash: string | null = null;
  if (!hasClaimed(address, checkpointId)) {
    try {
      const paidBefore = await alreadyRewarded(address, checkpointId, checkpoint.reward);
      if (paidBefore) {
        markClaimed(address, checkpointId);
      } else {
        const { txHash } = await sendReward(address, checkpoint.reward, checkpointId);
        rewardTxHash = txHash;
        markClaimed(address, checkpointId);
      }
    } catch (e) {
      // Don't fail verification if the reward send fails; leave it unmarked so a later
      // verify can retry the payout.
      console.error("Reward send failed:", e);
    }
  }

  return NextResponse.json({ ok: true, rewardTxHash, reward: checkpoint.reward });
}
