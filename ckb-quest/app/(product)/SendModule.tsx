"use client";

import { useState } from "react";
import { ccc } from "@ckb-ccc/core";
import { QUEST_ADDRESS, TRANSFER_CKB } from "@/lib/checkpoints";

// Checkpoint 2 used to send the player to CCC Playground, a code editor, and ask them to
// write a transfer by hand. Someone who knows CKB well tried it and could not get the
// transaction out. The checkpoint is supposed to teach the change output; what it actually
// tested was whether you could write TypeScript against an unfamiliar SDK. So the app
// builds the transaction and the player signs it, and the breakdown below is where the
// lesson now lives. The Playground link stays in the steps for anyone who wants the hard
// path, but it no longer gates the checkpoint.

type Phase = "idle" | "building" | "sent";

function readableError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/reject|denied|cancel/i.test(raw)) {
    return "You dismissed the wallet prompt. Nothing was sent. Click Build and Sign to try again.";
  }
  if (/insufficient|capacity/i.test(raw)) {
    return `Not enough CKB. You need a little over ${TRANSFER_CKB} CKB: ${TRANSFER_CKB} for the transfer, at least 61 to form the change cell, and a small fee. Claim more from the faucet in checkpoint 1.`;
  }
  return raw;
}

export function SendModule({
  signer,
  onSent,
}: {
  signer: ccc.Signer;
  onSent: (txHash: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function buildAndSign() {
    setError(null);
    setPhase("building");
    try {
      const quest = await ccc.Address.fromString(QUEST_ADDRESS, signer.client);

      const tx = ccc.Transaction.from({
        outputs: [{ lock: quest.script, capacity: ccc.fixedPointFrom(TRANSFER_CKB) }],
      });

      // Picks enough of your cells to cover the output. Those cells are consumed, not debited.
      await tx.completeInputsByCapacity(signer);
      // Creates the change cell back to you and takes the fee out of it. This is the step
      // the checkpoint is about: without it the entire remainder would be left to the miner.
      await tx.completeFeeBy(signer, 1000);

      const hash = await signer.sendTransaction(tx);
      setTxHash(hash);
      setPhase("sent");
      onSent(hash);
    } catch (e) {
      setError(readableError(e));
      setPhase("idle");
    }
  }

  return (
    <div style={{
      backgroundColor: "var(--color-surface)",
      border: "1px solid var(--color-border-strong)",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "28px",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        color: "var(--color-faint)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "14px",
      }}>
        What this transaction does
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
        <Row label="Consumed" value={`enough of your cells to cover ${TRANSFER_CKB} CKB`} />
        <Row label="Output 1" value={`${TRANSFER_CKB} CKB to the quest address`} mono />
        <Row label="Output 2" value="the remainder back to you, minus the fee" accent />
      </div>

      <p style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.6, marginBottom: "18px" }}>
        Output 2 is the change cell. Leave it out and the remainder is not returned, it is
        paid to the miner. That is the mistake this checkpoint exists to show you, which is
        why the verifier checks for it on chain rather than taking your word for it.
      </p>

      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--color-muted)",
        wordBreak: "break-all",
        marginBottom: "18px",
      }}>
        to: {QUEST_ADDRESS}
      </div>

      <button
        onClick={buildAndSign}
        disabled={phase === "building"}
        style={{
          backgroundColor: phase === "building" ? "var(--color-border)" : "var(--color-ink)",
          color: phase === "building" ? "var(--color-faint)" : "var(--color-paper)",
          border: "none",
          borderRadius: "6px",
          padding: "10px 20px",
          fontFamily: "var(--font-ui)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: phase === "building" ? "wait" : "pointer",
        }}
      >
        {phase === "building" ? "Waiting for your wallet…" : phase === "sent" ? "Send again" : "Build and Sign →"}
      </button>

      {txHash && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-green)", marginBottom: "6px" }}>
            Sent. The hash is filled in below, ready to verify.
          </p>
          <a
            href={`https://pudge.explorer.nervos.org/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--color-muted)",
              wordBreak: "break-all",
              textDecoration: "none",
            }}
          >
            {txHash} ↗
          </a>
        </div>
      )}

      {error && (
        <p style={{ fontSize: "13px", color: "var(--color-red)", lineHeight: 1.6, marginTop: "16px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--color-faint)",
        minWidth: "72px",
        flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
        fontSize: "13px",
        color: accent ? "var(--color-green)" : "var(--color-ink)",
        lineHeight: 1.5,
      }}>
        {value}
      </span>
    </div>
  );
}
