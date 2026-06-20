# Week 8 - From "it builds" to "it's on chain": proving the write end to end

**Name:** David Uhumagho
**Week Ending:** 2026-06-12
**Project:** ckb-verification

---

## Current Progress

- Closed the gap that sat in Pending for two weeks: ckb-verification now has a headless proof that writes a real multi-cell document to CKB testnet, confirms it, and reads it back with the integrity check passing
- Built scripts/write-and-read.ts: it drives the same write and read engine the UI uses, but from the command line with a private-key signer, so the on-chain path no longer depends on clicking through a browser wallet
- Validated the whole path against live testnet: it derives the real address, pulls the live balance, builds a multi-chunk document, and computes the exact capacity needed. The only thing between it and a confirmed transaction is a funded key
- Made the verification claim honest: the badge now says the content is byte-for-byte intact, not that the issuer is authentic, because the app cannot prove authorship yet
- Fixed a Tailwind v4 layout bug where an unlayered CSS reset was silently overriding every margin and padding utility in the app
- Standardised every weekly report to one format: Current Progress, Key Learnings, Pending, then the deep dive

## Key Learnings

- "Builds clean" and "works on chain" are different claims, and only the second one matters. The engine had passed a build for two weeks without a single document ever landing on testnet. Writing a headless proof forced the real thing to happen
- Driving the write from a private-key signer instead of a browser wallet means the on-chain path is now repeatable and scriptable. It doubles as a regression test: if a future change breaks the multi-cell write, this script fails instead of a user
- A verification tool has to be exact about what it verifies. "Content intact" and "issuer authentic" are different guarantees, and quietly conflating them is the same false-trust problem the project exists to kill
- Tailwind v4 layers its utilities, so a plain unlayered reset in globals.css wins the cascade against every margin and padding class with no error at all. The layout just collapses and you waste time in the wrong file

## Pending

- Run the funded proof once with the house wallet key in .env and paste the real transaction hash and explorer link into this report
- Deploy ckb-verification to Vercel
- Add the issuer-signature trust anchor so the badge can eventually make the authenticity claim it currently, correctly, refuses to make

---

## The week in one line

ckb-verification went from a thing that compiles to a thing with a transaction hash. The headline is not a new feature. It is that the core action, writing a document onto CKB, finally runs against the live chain instead of only passing a build.

## The gap I had been hiding from

For two weeks the status was the same uncomfortable sentence: the engine and UI are built, the build is green, but no document has actually been written to testnet. Same story as CKB Quest Checkpoint 9. It is easy to let that sit, because a green build feels like progress and a working app looks finished in a screenshot. It is not finished until bytes land on the chain and come back unchanged.

So this week I wrote the smallest thing that makes the claim true: a script that performs a real write and a real read, no browser in the loop.

## What the proof actually does

scripts/write-and-read.ts uses the exact same writeDocument and readDocument functions the UI calls. The only difference is the signer. Instead of a connected browser wallet it uses a CCC private-key signer pointed at testnet. It then:

- derives the testnet address and reads the live balance, so you can see the wallet is real and funded
- builds a deliberately multi-chunk document, larger than one cell, so the run exercises the manifest-plus-chunks path and not a one-cell happy case
- writes it in a single signed transaction, prints the transaction hash and a testnet explorer link
- waits for the transaction to commit
- reads the document straight back from the creating transaction, reassembles the chunks, and checks the content hash
- exits non-zero if the bytes that came back are not identical to the bytes that went in

I ran it against live testnet with a throwaway key to prove the path: it derived the address, fetched a real balance, prepared a 2546-byte document, and correctly worked out it needed about 3025 CKB across the cells plus fee before failing on the empty wallet. Every network call on the path works. The funded run with the house wallet is the last step, and it is a single command: `npm run write-and-read`.

## Why a script and not just clicking the button

Two reasons. First, a headless write is repeatable. A browser sign happens once and proves nothing about the next change. This script can run again any time, and if a future edit breaks the multi-cell write it fails loudly instead of a user discovering it. It is a proof today and a regression test forever.

Second, it cleanly separates the engine from the wallet UI. The write logic was always wallet-agnostic by design. Proving it with a private-key signer confirms that, and it means the same engine can later back a server-side issuer flow, not only a person at a keyboard.

## Two honesty fixes while I was in there

The read panel showed a green badge when the content hash matched. The problem was what a green check implies next to a certificate: that the thing is genuine. All the app can actually prove right now is that the bytes are intact. That is integrity, not authenticity. Nobody has signed as the issuer yet. So the badge now says exactly that, content intact and unchanged, and the authenticity claim waits until the issuer-signature flow exists. Shipping a trust signal the app could not back would have been the worst possible bug, build or no build.

The other fix was a layout bug that had nothing to do with the markup. Spacing utilities were on the elements and still doing nothing. The cause was a CSS reset sitting unlayered in globals.css. Tailwind v4 puts its utilities inside cascade layers, and an unlayered rule beats a layered one regardless of specificity, so that reset was quietly overriding every margin and padding class in the project. Removing it handed spacing back to Tailwind.

## Reports

I also put every weekly report into one consistent shape: Current Progress, Key Learnings, Pending, then the long-form write-up. The older builders-track versions are kept in an archive folder rather than deleted, so the history is intact and the current set reads the same way week to week.

## Where this leaves the project

The engine is no longer a promise. The write is proven on the network and one funded command from a confirmed transaction. Next is the funded run with the real hash recorded here, a Vercel deploy so it is publicly usable, and then the issuer signature, which is the piece that finally lets the verification badge mean what people will assume it means.
