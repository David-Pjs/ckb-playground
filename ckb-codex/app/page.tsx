"use client";

import { useEffect, useState } from "react";
import { useCcc } from "@ckb-ccc/connector-react";
import { WritePanel } from "./WritePanel";
import { ReadPanel } from "./ReadPanel";

function truncate(addr: string): string {
  return addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
}

export default function Page() {
  const { open, disconnect, client, signerInfo } = useCcc();
  const signer = signerInfo?.signer;
  const [address, setAddress] = useState<string | null>(null);
  const [tab, setTab] = useState<"write" | "read">("write");

  useEffect(() => {
    if (!signer) {
      setAddress(null);
      return;
    }
    let active = true;
    signer
      .getRecommendedAddress()
      .then((a) => active && setAddress(a))
      .catch(() => active && setAddress(null));
    return () => {
      active = false;
    };
  }, [signer]);

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-10">
        <header className="flex items-start justify-between border-b border-border pb-6 mb-8">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Codex</h1>
            <p className="text-sm text-muted mt-1">Documents that live on CKB.</p>
          </div>
          {address ? (
            <div className="text-right">
              <p className="font-mono text-xs text-ink break-all max-w-[180px]">{truncate(address)}</p>
              <button
                onClick={() => disconnect()}
                className="text-xs text-muted hover:text-ink underline mt-1"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => open()}
              className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-white"
            >
              Connect wallet
            </button>
          )}
        </header>

        <p className="font-display text-xl leading-snug mb-8 max-w-md">
          One cell cannot hold a book, so the book is made of cells.
        </p>

        <nav className="flex gap-6 border-b border-border mb-8">
          {(["write", "read"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm -mb-px border-b-2 ${
                tab === t ? "border-green text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t === "write" ? "Write" : "Read"}
            </button>
          ))}
        </nav>

        {tab === "write" ? (
          <WritePanel signer={signer} onConnect={() => open()} />
        ) : (
          <ReadPanel client={client} />
        )}

        <footer className="mt-16 pt-6 border-t border-border text-xs text-faint">
          Testnet only. Encrypted client side, hash verified, and stored across CKB cells in one transaction.
        </footer>
      </div>
    </main>
  );
}
