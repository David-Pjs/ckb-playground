"use client";

import { useState } from "react";

// The header shows the connected address truncated to twelve characters. A reviewer who
// knows CKB well still missed it for several minutes, and checkpoint 1 cannot be completed
// without it: the faucet needs the full ckt1 string. So the address gets its own panel
// inside the checkpoint that depends on it, full length, with the EVM confusion named
// out loud rather than left for the player to discover at the faucet.
export function AddressPanel({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied outright. The address is on screen in full and
      // selectable, so failing quietly here still leaves the player a way through.
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
        marginBottom: "10px",
      }}>
        Your CKB testnet address
      </div>

      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        color: "var(--color-ink)",
        lineHeight: 1.6,
        wordBreak: "break-all",
        marginBottom: "14px",
      }}>
        {address}
      </div>

      <button
        onClick={copy}
        style={{
          backgroundColor: copied ? "var(--color-green-bg)" : "var(--color-ink)",
          color: copied ? "var(--color-green)" : "var(--color-paper)",
          border: "none",
          borderRadius: "6px",
          padding: "9px 18px",
          fontFamily: "var(--font-ui)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {copied ? "Copied" : "Copy address"}
      </button>

      <p style={{
        fontSize: "12px",
        color: "var(--color-muted)",
        lineHeight: 1.6,
        marginTop: "14px",
      }}>
        This is the CKB testnet address controlled by the wallet you just connected. It is
        the address the faucet needs. If you came from MetaMask you may also see an address
        starting with <span style={{ fontFamily: "var(--font-mono)" }}>0x</span>: that is
        your Ethereum address, and pasting it into the faucet will not work. CKB testnet
        addresses always start with <span style={{ fontFamily: "var(--font-mono)" }}>ckt1</span>.
      </p>
    </div>
  );
}
