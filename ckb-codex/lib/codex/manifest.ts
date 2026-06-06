import { utf8ToBytes, bytesToUtf8 } from "./bytes";

// A four-byte tag in the manifest cell so a reader can recognise a Codex document
// instead of any other cell that happens to carry JSON.
export const MAGIC = "CDX1";
export const CODEX_VERSION = 1;

export type CodexEncryption = {
  cipher: "AES-GCM";
  kdf: "PBKDF2-SHA256";
  iter: number;
  salt: string; // 0x-prefixed hex
  iv: string; // 0x-prefixed hex
};

export type CodexManifest = {
  v: number;
  magic: string;
  title: string;
  mime: string;
  length: number; // plaintext byte length, before any encryption
  chunkCount: number;
  chunkSize: number;
  hash: string; // 0x-prefixed blake2b (ccc.hashCkb) of the plaintext bytes
  enc?: CodexEncryption;
  createdAt: number; // unix ms
};

export function serializeManifest(manifest: CodexManifest): Uint8Array {
  return utf8ToBytes(JSON.stringify(manifest));
}

export function parseManifest(bytes: Uint8Array): CodexManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytesToUtf8(bytes));
  } catch {
    throw new Error("The first cell is not valid Codex JSON. This transaction was not written by Codex.");
  }

  const manifest = parsed as CodexManifest;
  if (!manifest || manifest.magic !== MAGIC) {
    throw new Error("Magic mismatch. The first output cell is not a Codex manifest.");
  }
  if (typeof manifest.chunkCount !== "number" || typeof manifest.hash !== "string") {
    throw new Error("Malformed Codex manifest: missing chunkCount or hash.");
  }
  return manifest;
}
