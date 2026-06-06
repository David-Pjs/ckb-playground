# Week 7 - Documents you can prove on CKB: shipping ckb-verification

**Week Ending:** 2026-06-05

---

## What I Shipped

ckb-verification, a working app that writes a whole document onto Nervos CKB and reads it back with a byte-for-byte integrity check. It builds clean and runs on testnet.

The starting point was the toy from the builders track. Back in Week 3 I wrote the smallest possible store-data-on-a-cell demo: type one line, it lands in the data field of a single cell, you read it back by transaction hash. The blockchain version of carving your initials into a tree. This week I made it hold something real.

The engine is the part I care about. Text goes in, gets hashed, optionally encrypted in the browser, and split into byte-sized chunks. Each chunk becomes its own cell. A manifest cell records the title, the length, the chunk count, and the content hash. All of it is written in one signed transaction, so it is atomic: the whole document lands or none of it does. Reading walks the manifest, pulls each chunk by index, concatenates the bytes, decrypts if needed, and checks the hash. One cell cannot hold a book, so the book is made of cells.

Stack is the same as CKB Quest: Next.js 15, TypeScript, Tailwind, and @ckb-ccc for both the chain and the wallet. JoyID and MetaMask both connect on testnet. The interface is deliberately plain, white with black and one green. A document tool should look like a document tool, not a casino.

## Why It Matters: certificates

Storing text for its own sake is boring. The use case with teeth is verifiable documents, certificates first of all. Diplomas, course completions, licenses. Things that are forged constantly and verified painfully, through phone calls and PDF attachments that anyone with an afternoon and a copy of Photoshop can fake. The plan is to take the original certificate, run it through Microsoft's MarkItDown to get clean canonical Markdown, and lock that content on CKB. Later anyone pulls the on-chain record and checks it against what they were handed. That parsing layer is next week. This week is the foundation it stands on.

## The Fork That Decided Everything

There is exactly one decision that determines whether this is interesting or just noise: do you store a hash of the document, or the document itself.

Storing a hash is notarization. It is old, it is commoditized, and every chain on earth does it. CKB has no edge there, and the market has spent a decade proving people barely pay for it.

Storing the content is where CKB is actually different. Most chains physically cannot hold a document, so they point at IPFS or Arweave and hope the file is still there in five years. The CKB cell model lets the content be the on-chain object, and an owned one, with a lock script and a real holder. That is the same argument Spore makes for digital objects, pointed at paperwork instead of pixel art. So: content on-chain, not a hash. That is the only version worth building, and it is what shipped.

## The Three Hard Problems

The engineering is the easy part. Three things are harder than the code, and I would rather name them now than discover them later.

**Adoption is the moat, and the graveyard is full.** MIT shipped Blockcerts on Bitcoin in 2016. Dozens of blockchain diploma startups followed. The tech was never the blocker. Getting issuers to mint and employers to actually check is the entire game. Any honest version of this leads with a real issuer, not a clever data structure.

**The AI cannot be the source of truth.** MarkItDown is roughly deterministic, but the moment you let a language model decide "the name is X, the date is Y," it can hallucinate, and then the canonical record is ambiguous, which is fatal for a verification tool. Trust has to come from an issuer signature, a known key on the cell. The AI is a convenience layer for structuring fields, never the authority.

**Permanence fights privacy, head on.** Certificates carry personal data. An immutable public chain and a person's right to be forgotten cannot both win. The answer is to store encrypted content with the holder holding the key, or a commitment instead of plaintext. This is a real constraint, not a footnote, and the Nigerian market I keep coming back to has its own data law (NDPR) that makes it concrete. This is why encryption went into the very first version rather than being bolted on later.

## What I Built, and What Is Still Design

The architecture, marked by what actually runs today:

- **Storage (shipped):** a manifest cell plus chunk cells in one atomic transaction. The manifest holds the title, length, chunk count, and content hash. The reader keys off the chunk count, so a trailing change cell never confuses reassembly.
- **Privacy (shipped):** content is encrypted client side with AES-GCM and a passphrase-derived key before chunking. The chain stores ciphertext. The passphrase never leaves the browser and is never stored.
- **Permanence (shipped):** documents are read straight from the creating transaction, not from live cells, so they stay readable even after the cells are spent.
- **Trust (next):** the cell signed by the issuer's key, with verification checking the signature, not an AI's opinion. The engine is ready for it; the issuer flow is not built yet.
- **Economics:** capacity is a deposit, not a burn. The CKB locked to hold a document comes back when the cell is consumed. A few kilobytes of Markdown is a small, refundable amount, a far better story than "pay forever to store forever."

## What's Next

- Run the live signed write end to end with a funded testnet wallet. The build is verified and the dev server runs, but I have not signed a multi-cell write from the app yet, the same situation as CKB Quest Checkpoint 9.
- Deploy to Vercel.
- Add the MarkItDown layer: PDF and image to Markdown, then optional AI field extraction, with an issuer signature as the trust anchor so a certificate's authority comes from a key, not from a model's guess.
- The working title Codex became ckb-verification.
