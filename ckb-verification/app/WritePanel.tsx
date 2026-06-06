"use client";

import { useState } from "react";
import { ccc } from "@ckb-ccc/core";
import { writeDocument, type WriteResult } from "../lib/codex/write";
import { DEFAULT_CHUNK_SIZE } from "../lib/codex/document";
import { CellStrip } from "./CellStrip";

const EXPLORER_TX = "https://testnet.explorer.nervos.org/transaction/";

function estimate(content: string, chunkSize: number) {
  const bytes = new TextEncoder().encode(content).length;
  const chunkCount = bytes === 0 ? 0 : Math.ceil(bytes / chunkSize);
  const cells = chunkCount + 1;
  const capacityCKB = 61 * cells + bytes + 240;
  return { bytes, chunkCount, cells, capacityCKB };
}

type Props = {
  signer?: ccc.Signer;
  onConnect: () => void;
};

export function WritePanel({ signer, onConnect }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [encrypt, setEncrypt] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WriteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const est = estimate(content, DEFAULT_CHUNK_SIZE);
  const ready = content.trim().length > 0 && (!encrypt || passphrase.length > 0);
  const disabled = busy || (!!signer && !ready);

  async function handleWrite() {
    if (!signer) {
      onConnect();
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await writeDocument(signer, content, {
        title: title.trim() || "Untitled",
        passphrase: encrypt ? passphrase : undefined,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function copyHash() {
    if (!result) return;
    await navigator.clipboard.writeText(result.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-7">
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input
          id="title"
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Certificate of completion"
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label className="label" htmlFor="content">Document</label>
          <span className="text-xs text-faint font-mono">{est.bytes.toLocaleString()} bytes</span>
        </div>
        <textarea
          id="content"
          className="field font-mono text-[13px] leading-relaxed min-h-[240px] resize-y"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste or write the document. Markdown is fine."
        />
      </div>

      <label htmlFor="encrypt" className="flex items-start gap-3 cursor-pointer">
        <input
          id="encrypt"
          type="checkbox"
          className="mt-1 accent-[#16773d] w-4 h-4"
          checked={encrypt}
          onChange={(e) => setEncrypt(e.target.checked)}
        />
        <span className="flex-1">
          <span className="text-sm text-ink">Encrypt before writing</span>
          <span className="block text-xs text-muted mt-0.5">
            The chain stores ciphertext. The passphrase never leaves your browser and is never stored.
            Lose it and the document is unrecoverable.
          </span>
        </span>
      </label>
      {encrypt && (
        <input
          type="password"
          className="field"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Passphrase"
        />
      )}

      <div className="bg-raised border border-border px-4 py-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="label mb-0">Transaction preview</span>
          <span className="text-xs text-muted font-mono">{est.cells} cells</span>
        </div>
        <CellStrip chunkCount={est.chunkCount} />
        <p className="text-xs text-muted mt-3 leading-relaxed">
          {est.chunkCount} {est.chunkCount === 1 ? "chunk cell" : "chunk cells"} plus 1 manifest cell,
          written in one transaction. Roughly {est.capacityCKB.toLocaleString()} CKB of capacity, a
          refundable deposit rather than a fee.
        </p>
      </div>

      <button onClick={handleWrite} disabled={disabled} className="btn btn-primary w-full">
        {busy ? "Writing to CKB..." : signer ? "Write to CKB" : "Connect a wallet to write"}
      </button>

      {error && (
        <div className="border border-red bg-red-bg text-red text-sm px-3.5 py-2.5">{error}</div>
      )}

      {result && (
        <div className="border border-green bg-green-bg px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green inline-block" />
            <span className="text-sm font-medium text-green">
              Written to testnet, {result.cellCount} cells in one transaction
            </span>
          </div>
          <CellStrip chunkCount={result.chunkCount} />
          <div className="flex items-center gap-2 pt-1">
            <code className="flex-1 font-mono text-xs text-ink break-all">{result.txHash}</code>
            <button onClick={copyHash} className="btn-quiet shrink-0">{copied ? "Copied" : "Copy"}</button>
          </div>
          <a
            className="inline-block text-xs text-green underline underline-offset-2"
            href={`${EXPLORER_TX}${result.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on testnet explorer
          </a>
        </div>
      )}
    </div>
  );
}
