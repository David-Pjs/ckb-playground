"use client";

import { useState } from "react";
import { ccc } from "@ckb-ccc/core";
import { writeDocument, type WriteResult } from "../lib/codex/write";
import { DEFAULT_CHUNK_SIZE } from "../lib/codex/document";

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

const labelCls = "block text-xs uppercase tracking-wide text-muted mb-2";
const inputCls = "w-full border border-border px-3 py-2 text-ink placeholder:text-faint focus:border-ink";

export function WritePanel({ signer, onConnect }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [encrypt, setEncrypt] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WriteResult | null>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <label className={labelCls} htmlFor="title">Title</label>
        <input
          id="title"
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Certificate of completion"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="content">Document</label>
        <textarea
          id="content"
          className={`${inputCls} font-mono text-[13px] leading-relaxed min-h-[260px] resize-y`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste or write the document. Markdown is fine."
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="encrypt"
          type="checkbox"
          className="mt-1 accent-[#16773d]"
          checked={encrypt}
          onChange={(e) => setEncrypt(e.target.checked)}
        />
        <div className="flex-1">
          <label htmlFor="encrypt" className="text-sm text-ink">Encrypt before writing</label>
          <p className="text-xs text-muted">
            The chain stores ciphertext. The passphrase never leaves your browser and is never stored.
            Lose it and the document is unrecoverable.
          </p>
          {encrypt && (
            <input
              type="password"
              className={`${inputCls} mt-2`}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Passphrase"
            />
          )}
        </div>
      </div>

      <div className="border-l-2 border-border pl-4 text-xs text-muted space-y-1">
        <p>
          {est.bytes.toLocaleString()} bytes, split into {est.chunkCount}{" "}
          {est.chunkCount === 1 ? "chunk cell" : "chunk cells"} plus 1 manifest cell.
        </p>
        <p>
          Estimated locked capacity, roughly {est.capacityCKB.toLocaleString()} CKB.
          Capacity is a refundable deposit, not a fee.
        </p>
      </div>

      <button
        onClick={handleWrite}
        disabled={disabled}
        className="w-full bg-ink text-white py-3 text-sm font-medium disabled:opacity-40"
      >
        {busy ? "Writing to CKB..." : signer ? "Write to CKB" : "Connect a wallet to write"}
      </button>

      {error && (
        <div className="border border-red bg-red-bg text-red text-sm px-3 py-2">{error}</div>
      )}

      {result && (
        <div className="border border-green bg-green-bg px-4 py-3 text-sm space-y-2">
          <p className="text-green font-medium">
            Written. {result.cellCount} cells in one transaction ({result.chunkCount}{" "}
            {result.chunkCount === 1 ? "chunk" : "chunks"} plus the manifest).
          </p>
          <p className="text-muted text-xs break-all font-mono">{result.txHash}</p>
          <a
            className="text-green underline text-xs"
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
