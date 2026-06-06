"use client";

import { useState } from "react";
import { ccc } from "@ckb-ccc/core";
import { readDocument, type ReadResult } from "../lib/codex/read";
import { CellStrip } from "./CellStrip";

type Props = {
  client: ccc.Client;
};

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
    <div className="space-y-8">
      <div>
        <label className="label" htmlFor="txhash">Transaction hash</label>
        <input
          id="txhash"
          className="field font-mono text-xs"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <div>
        <label className="label" htmlFor="rpass">Passphrase</label>
        <input
          id="rpass"
          type="password"
          className="field"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Only needed for encrypted documents"
        />
      </div>

      <button
        onClick={handleRead}
        disabled={busy || txHash.trim().length === 0}
        className="btn btn-primary w-full"
      >
        {busy ? "Reading from CKB..." : "Read and verify"}
      </button>

      {error && (
        <div className="border border-red bg-red-bg text-red text-sm px-3.5 py-2.5">{error}</div>
      )}

      {!result && !error && !busy && (
        <div className="bg-raised border border-border px-5 py-4 text-sm text-faint leading-relaxed">
          Paste the transaction hash of a document written with this tool. It is read straight from the
          transaction, so it stays readable even after the cells are spent.
        </div>
      )}

      {result && (
        <article className="border border-border">
          <div className="border-b border-border px-4 py-3.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-lg leading-tight">{result.manifest.title}</h2>
              <p className="text-xs text-muted mt-1">
                {result.manifest.length.toLocaleString()} bytes &middot; {result.manifest.chunkCount} chunk
                cells &middot; {result.manifest.enc ? "encrypted" : "public"} &middot;{" "}
                {new Date(result.manifest.createdAt).toLocaleDateString()}
              </p>
            </div>
            {result.verified ? (
              <span className="shrink-0 inline-flex items-center gap-1.5 text-xs text-green border border-green px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green" /> Integrity verified
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1.5 text-xs text-red border border-red px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red" /> Integrity failed
              </span>
            )}
          </div>
          <div className="px-4 pt-3 pb-1 border-b border-border">
            <CellStrip chunkCount={result.manifest.chunkCount} />
          </div>
          <pre className="px-4 py-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words max-h-[440px] overflow-auto">
            {result.content}
          </pre>
        </article>
      )}
    </div>
  );
}
