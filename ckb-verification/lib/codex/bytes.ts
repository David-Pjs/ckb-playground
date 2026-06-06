import { ccc } from "@ckb-ccc/core";

export function utf8ToBytes(text: string): Uint8Array {
  return ccc.bytesFrom(text, "utf8");
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return ccc.bytesTo(bytes, "utf8");
}

export function bytesToHex(bytes: Uint8Array): string {
  return ccc.hexFrom(bytes);
}

export function hexToBytes(hex: string): Uint8Array {
  return ccc.bytesFrom(hex);
}

export function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function chunkBytes(bytes: Uint8Array, size: number): Uint8Array[] {
  if (size <= 0) throw new Error("Chunk size must be a positive number of bytes");
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += size) {
    chunks.push(bytes.slice(i, i + size));
  }
  return chunks;
}
