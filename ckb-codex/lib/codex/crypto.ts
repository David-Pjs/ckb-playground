// Client-side encryption for Codex documents.
// The chain only ever sees ciphertext. The passphrase never leaves the browser,
// and no key material is stored anywhere. Lose the passphrase, lose the plaintext.

export const PBKDF2_ITERATIONS = 200_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export type EncryptResult = {
  ciphertext: Uint8Array;
  salt: Uint8Array;
  iv: Uint8Array;
  iter: number;
};

function subtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("WebCrypto is not available in this environment");
  return c.subtle;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const baseKey = await subtle().importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle().deriveKey(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptBytes(plaintext: Uint8Array, passphrase: string): Promise<EncryptResult> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const ciphertext = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv }, key, plaintext),
  );
  return { ciphertext, salt, iv, iter: PBKDF2_ITERATIONS };
}

export async function decryptBytes(
  ciphertext: Uint8Array,
  passphrase: string,
  salt: Uint8Array,
  iv: Uint8Array,
  iter: number,
): Promise<Uint8Array> {
  const key = await deriveKey(passphrase, salt, iter);
  const plaintext = await subtle().decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new Uint8Array(plaintext);
}
