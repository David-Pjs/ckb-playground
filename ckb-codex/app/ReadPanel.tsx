"use client";

import { useState } from "react";
import { ccc } from "@ckb-ccc/core";
import { readDocument, type ReadResult } from "../lib/codex/read";

type Props = {
  client: ccc.Client;
};

const labelCls = "block text-xs uppercase tracking-wide text-muted mb-2";
const inputCls = "w-full border border-border px-3 py-2 text-ink placeholder:text-faint focus:border-ink";

export function ReadPanel({ client }: Props) {
  const [txHash, setTxHash] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadResult | null>(null);

  async function handleRead() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await readDocument(client, txHash.trim(), passphrase || undefined);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className={labelCls} htmlFor="txhash">Transaction hash</label>
        <input
          id="txhash"
          className={`${inputCls} font-mono text-xs`}
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="rpass">Passphrase (only if encrypted)</label>
        <input
          id="rpass"
          type="password"
          className={inputCls}
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Leave blank for public documents"
        />
      </div>

      <button
        onClick={handleRead}
        disabled={busy || txHash.trim().length === 0}
        className="w-full bg-ink text-white py-3 text-sm font-medium disabled:opacity-40"
      >
        {busy ? "Reading from CKB..." : "Read from CKB"}
      </button>

      {error && (
        <div className="border border-red bg-red-bg text-red text-sm px-3 py-2">{error}</div>
      )}

      {result && (
        <article className="border border-border">
          <div className="border-b border-border px-4 py-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg leading-tight">{result.manifest.title}</h2>
              <p className="text-xs text-muted mt-1">
                {result.manifest.length.toLocaleString()} bytes &middot; {result.manifest.chunkCount} chunk
                cells &middot; {result.manifest.enc ? "encrypted" : "public"} &middot;{" "}
                {new Date(result.manifest.createdAt).toLocaleDateString()}
              </p>
            </div>
            {result.verified ? (
              <span className="shrink-0 text-xs text-green border border-green px-2 py-1">
                Integrity verified
              </span>
            ) : (
              <span className="shrink-0 text-xs text-red border border-red px-2 py-1">
                Integrity failed
              </span>
            )}
          </div>
          <pre className="px-4 py-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words max-h-[420px] overflow-auto">
            {result.content}
          </pre>
        </article>
      )}
    </div>
  );
}
