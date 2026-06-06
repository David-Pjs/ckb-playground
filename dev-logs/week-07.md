# Week 7 - Permanent Documents on CKB: the concept I am building next

**Week Ending:** 2026-06-05

---

## The Idea

This week I locked the concept for the next thing I am shipping on CKB. The build starts right after this log. This entry is the spec and the reasoning behind it, written before the first line of code so I am honest about what I am walking into.

The starting point was the toy from the builders track. Back in Week 3 I wrote the smallest possible store-data-on-a-cell demo: type one line, it goes into the data field of a single cell, you read it back by transaction hash. It is the blockchain version of carving your initials into a tree. Cute, and useless past one sentence.

The question that has been sitting with me: what happens when you stop carving initials and store something real. A whole document. A certificate.

## The Concept

One cell cannot hold a book. A cell's data field will take plenty of bytes, but you pay one CKB of capacity per byte and the whole transaction still has to fit inside a block. So a real document is not one giant cell. It is many cells, structured.

The shape I am building: split the document into chunks, give each chunk its own cell, and write one manifest cell that records the title, the total length, the chunk count, and a hash of the full content. All of it lands in a single signed transaction, so it is atomic. Either the whole document is written or none of it is. Reading walks the manifest, pulls each chunk by index, concatenates the bytes, checks the hash against the manifest, and decodes back to text.

One cell cannot hold a book, so the book is made of cells.

## The Use Case That Makes It Matter

Storage for its own sake is boring. The use case that gives this teeth is verifiable documents, and specifically certificates. Diplomas, course completions, professional licenses. Things that are forged constantly and verified painfully, through phone calls and PDF attachments that anyone with an afternoon and a copy of Photoshop can fake.

The pipeline I am after: take the original certificate, run it through Microsoft's MarkItDown to convert the PDF or image into clean, canonical Markdown, then lock that content on CKB as an owned cell. Later, anyone can pull the on-chain record and check it against what they were handed. No issuer phone call. No trusting the attachment in the email.

## The Fork That Decided Everything

There is exactly one decision that determines whether this is interesting or just noise: do you store a hash of the document, or the document itself.

Storing a hash is notarization. It is old, it is commoditized, and every chain on earth does it. CKB has no edge there, and the market has spent a decade proving people barely pay for it.

Storing the content is where CKB is actually different. Most chains physically cannot hold a document, so they point at IPFS or Arweave and hope the file is still there in five years. The CKB cell model lets the content be the on-chain object, and an owned one, with a lock script and a real holder. That is the same argument Spore makes for digital objects, pointed at paperwork instead of pixel art. So: content on-chain, not a hash. That is the only version worth building.

## The Three Hard Problems

The engineering is the easy part. Three things are harder than the code, and I would rather name them now than discover them later.

**Adoption is the moat, and the graveyard is full.** MIT shipped Blockcerts on Bitcoin in 2016. Dozens of blockchain diploma startups followed. The tech was never the blocker. Getting issuers to mint and employers to actually check is the entire game. Any honest version of this leads with a real issuer, not a clever data structure.

**The AI cannot be the source of truth.** MarkItDown is roughly deterministic, but the moment you let a language model decide "the name is X, the date is Y," it can hallucinate, and then the canonical record is ambiguous, which is fatal for a verification tool. Trust has to come from an issuer signature, a known key on the cell. The AI is a convenience layer for structuring fields, never the authority.

**Permanence fights privacy, head on.** Certificates carry personal data. An immutable public chain and a person's right to be forgotten cannot both win. The answer is to store encrypted content with the holder holding the key, or a commitment instead of plaintext. This is a real constraint, not a footnote, and the Nigerian market I keep coming back to has its own data law (NDPR) that makes it concrete.

## The Architecture

The design that survives all three problems:

- **Storage:** a manifest cell plus chunk cells in one atomic transaction. The manifest holds the title, length, chunk count, and content hash.
- **Privacy:** content is encrypted client side before chunking. The chain stores ciphertext. The holder, or whoever they share the key with, can decrypt and re-verify.
- **Trust:** the cell is signed by the issuer's key. Verification checks the signature and the content hash, not an AI's opinion.
- **Economics:** capacity is a deposit, not a burn. The CKB locked to hold a document comes back when the cell is consumed. A few kilobytes of Markdown is a small, refundable amount, which is a far better story than "pay forever to store forever."

MarkItDown sits at the front as the normalization layer, turning messy real-world files into byte-stable Markdown that is small enough to store and exact enough to re-verify. It is plumbing, not the headline.

## Why This Is Worth Building

It gives Spore a real-world job beyond profile pictures, and credential fraud is a real, painful, paid problem. The tech is the easy twenty percent. The issuer and verifier adoption is the hard eighty, the same wall every credential project has hit. I am building it knowing exactly where that wall is, which is the only way to build it without lying to myself.

## What's Next

- Build the chunked storage engine: encrypt client side, chunk, manifest, single atomic write, then walk-and-reassemble read. This is the foundation, and it is enough for a real working artifact.
- Wire a certificate as the demo on top of the engine, with the issuer signature as the trust anchor.
- Hold the AI and MarkItDown parsing for the following week, so the foundation ships as something that actually runs rather than a half-wired pipeline.
- Working title for the project is Codex. It will change.
