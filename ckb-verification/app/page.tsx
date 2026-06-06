"use client";

import { useEffect, useState } from "react";
import { useCcc } from "@ckb-ccc/connector-react";
import { WritePanel } from "./WritePanel";
import { ReadPanel } from "./ReadPanel";

function truncate(addr: string): string {
  return addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
}

const STEPS = [
  { n: "01", title: "Write", body: "Paste a document. It is hashed, optionally encrypted in your browser, and split into byte-sized chunks." },
  { n: "02", title: "Stored as cells", body: "A manifest cell plus one cell per chunk, all in a single signed transaction. One cell cannot hold a book." },
  { n: "03", title: "Verify", body: "Anyone reads it back from the transaction and checks every byte against the manifest hash." },
];

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
      <div className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 bg-ink inline-block" />
            <span className="font-display text-base tracking-tight">CKB Verification</span>
          </div>
          {address ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-flex items-center gap-2 text-xs text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                <span className="font-mono">{truncate(address)}</span>
              </span>
              <button onClick={() => disconnect()} className="btn-quiet">Disconnect</button>
            </div>
          ) : (
            <button onClick={() => open()} className="btn btn-outline">Connect wallet</button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        <section className="pt-20 md:pt-28 pb-4">
          <p className="label text-green">On-chain document verification &middot; CKB testnet</p>
          <h1 className="font-display text-[2.5rem] md:text-[3.5rem] leading-[1.03] tracking-tight mt-4 max-w-[15ch]">
            Put a document on chain. Prove every byte of it later.
          </h1>
          <p className="text-muted mt-7 text-base leading-relaxed max-w-[60ch]">
            A whole document is written across CKB cells, encrypted client side and sealed with a content
            hash. Anyone can read it back from the transaction and prove it has not been altered. One cell
            cannot hold a book, so the book is made of cells.
          </p>
        </section>

        <section className="mt-24 border-t border-border pt-12">
          <div className="grid gap-y-10 sm:grid-cols-3 sm:gap-x-12">
            {STEPS.map((s) => (
              <div key={s.n} className="max-w-[32ch]">
                <div className="font-mono text-xs text-green tracking-wider">{s.n}</div>
                <h3 className="font-display text-xl mt-3">{s.title}</h3>
                <p className="text-sm text-muted mt-2.5 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 border border-border">
          <div className="flex border-b border-border">
            {(["write", "read"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  tab === t
                    ? "bg-ink text-white"
                    : "text-muted hover:text-ink hover:bg-raised"
                }`}
              >
                {t === "write" ? "Write a document" : "Read and verify"}
              </button>
            ))}
          </div>
          <div className="p-6 sm:p-9 md:p-10">
            {tab === "write" ? (
              <WritePanel signer={signer} onConnect={() => open()} />
            ) : (
              <ReadPanel client={client} />
            )}
          </div>
        </section>

        <footer className="mt-24 pb-16 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-faint">
          <span>Testnet only. Encrypted client side, hash verified, stored across CKB cells.</span>
          <span className="font-mono">Nervos CKB</span>
        </footer>
      </div>
    </main>
  );
}
