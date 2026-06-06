import { ccc } from "@ckb-ccc/core";
import { utf8ToBytes, bytesToUtf8, bytesToHex, hexToBytes, concatBytes, chunkBytes } from "./bytes";
import { encryptBytes, decryptBytes } from "./crypto";
import { CodexManifest, MAGIC, CODEX_VERSION, serializeManifest } from "./manifest";

export const DEFAULT_CHUNK_SIZE = 1024;
export const DEFAULT_MIME = "text/markdown";

// Minimal occupied capacity of a standard secp256k1 cell, before any data bytes:
// 8 (capacity field) + 53 (lock script) = 61 CKB. Each data byte adds 1 CKB.
const CELL_BASE_CKB = 61;

export type PrepareOptions = {
  title: string;
  mime?: string;
  chunkSize?: number;
  passphrase?: string;
};

export type PreparedDocument = {
  manifest: CodexManifest;
  manifestBytes: Uint8Array;
  chunks: Uint8Array[];
};

// Text in, a manifest cell and N chunk cells out. The plaintext is hashed before
// any encryption so the hash is a fingerprint of the real content, not the ciphertext.
export async function prepareDocument(content: string, opts: PrepareOptions): Promise<PreparedDocument> {
  const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const plaintext = utf8ToBytes(content);
  const hash = ccc.hashCkb(plaintext);

  let stored = plaintext;
  let enc: CodexManifest["enc"];
  if (opts.passphrase) {
    const result = await encryptBytes(plaintext, opts.passphrase);
    stored = result.ciphertext;
    enc = {
      cipher: "AES-GCM",
      kdf: "PBKDF2-SHA256",
      iter: result.iter,
      salt: bytesToHex(result.salt),
      iv: bytesToHex(result.iv),
    };
  }

  const chunks = chunkBytes(stored, chunkSize);
  const manifest: CodexManifest = {
    v: CODEX_VERSION,
    magic: MAGIC,
    title: opts.title,
    mime: opts.mime ?? DEFAULT_MIME,
    length: plaintext.length,
    chunkCount: chunks.length,
    chunkSize,
    hash,
    enc,
    createdAt: Date.now(),
  };

  return { manifest, manifestBytes: serializeManifest(manifest), chunks };
}

export type AssembledDocument = {
  content: string;
  verified: boolean;
};

// Walk the chunks back into the original text, decrypt if needed, and check the
// content hash against the manifest. verified === false means the bytes on-chain
// do not match the fingerprint the author recorded.
export async function assembleDocument(
  manifest: CodexManifest,
  chunkBytesArr: Uint8Array[],
  passphrase?: string,
): Promise<AssembledDocument> {
  const stored = concatBytes(chunkBytesArr);

  let plaintext: Uint8Array;
  if (manifest.enc) {
    if (!passphrase) {
      throw new Error("This document is encrypted. Enter the passphrase to read it.");
    }
    try {
      plaintext = await decryptBytes(
        stored,
        passphrase,
        hexToBytes(manifest.enc.salt),
        hexToBytes(manifest.enc.iv),
        manifest.enc.iter,
      );
    } catch {
      throw new Error("Could not decrypt. The passphrase is wrong, or the data is corrupted.");
    }
  } else {
    plaintext = stored;
  }

  const verified = ccc.hashCkb(plaintext) === manifest.hash;
  return { content: bytesToUtf8(plaintext), verified };
}

// Rough estimate of the CKB capacity locked by the document cells (manifest + chunks).
// Excludes transaction fee and any change cell. Capacity is a refundable deposit,
// recovered when the cells are later consumed, not a fee that is spent.
export function estimateCapacityCKB(manifestBytes: Uint8Array, chunks: Uint8Array[]): number {
  const cells = [manifestBytes, ...chunks];
  return cells.reduce((sum, cell) => sum + CELL_BASE_CKB + cell.length, 0);
}
