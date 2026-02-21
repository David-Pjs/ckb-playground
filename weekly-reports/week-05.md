# Week 5 - Lock Scripts & CCC Exploration

**Name:** David
**Week Ending:** 2026-03-06

---

## Courses / Material Completed

- [x] Read the [Build a Simple Lock](https://docs.nervos.org/docs/dapp/simple-lock) tutorial end-to-end
- [x] Cloned and studied the simple-lock example code
- [x] Understood the hash_lock contract logic
- [ ] Successfully deployed hash_lock to devnet (blocked - see below)
- [x] Explored CCC Playground at live.ckbccc.com
- [x] Reviewed CCC SDK documentation and examples

## Key Learnings

### How the hash_lock Script Works

The simple-lock tutorial introduces writing your own Lock Script from scratch. Instead of the standard secp256k1 signature lock, `hash_lock` uses a simpler mechanism:

1. When creating the lock, you store a **hash** (e.g. blake2b hash of the word "hello") in the script args
2. To unlock and spend the cell, you provide the **preimage** (the original word "hello") in the transaction witness
3. The script hashes the preimage and checks it matches the stored hash
4. If they match - cell is unlocked. If not - transaction rejected.

This is like a combination lock. Instead of needing a private key signature, you just need to know the secret word.

The script logic in TypeScript:
```typescript
// Read expected hash from script args
const expectedHash = Script.args;
// Read preimage from witness
const preimage = Transaction.witness[0];
// Hash the preimage
const computedHash = blake2b(preimage);
// Compare
if (computedHash !== expectedHash) throw Error("hash mismatch");
```

**Important:** This is a toy example - NOT for production. It's vulnerable to miner front-running (once you broadcast the preimage in a transaction, miners can copy it and steal the funds before your tx confirms).

### How Custom Scripts Get Deployed

This tutorial is fundamentally different from Weeks 3-4. Instead of using pre-deployed system scripts (xUDT, Spore), you deploy your own script:

1. Write the script logic in TypeScript
2. Compile it to RISC-V bytecode using ckb-js-vm + ckb-debugger
3. Deploy the bytecode as a Cell on devnet (the code lives in the cell's data field)
4. Create a `scripts.json` file with the deployment OutPoint
5. Your frontend references that OutPoint to use the script

This is how ALL scripts on CKB work - even the system ones. They're just cells containing RISC-V bytecode.

### CCC - Common Chain Connector

CCC is the official JavaScript/TypeScript SDK for building on CKB. It abstracts away the low-level transaction building we've been doing manually. Key things I explored:

- **CCC Playground** (live.ckbccc.com) - interactive environment to test CCC code in the browser
- **Signer abstraction** - CCC supports multiple wallet types (private key, JoyID, MetaMask via RGB++) through a unified interface
- **Transaction building** - `completeInputsByCapacity`, `completeFeeBy` handle UTXO selection and fee calculation automatically
- **Known Scripts** - CCC has built-in support for xUDT, Spore, NervosDAO and other system scripts

## Practical Progress

### Simple Lock - Blocker

- Cloned `simple-lock` project into `projects/simple-lock/`
- Installed dependencies (`npm install`)
- Installed `ckb-debugger v1.0.0` (required tool for compiling scripts)
- Ran `npm run deploy` - failed with `Error: MemOutOfBound`

**Root cause:** Version incompatibility between `ckb-testtool@0.1.4` (which bundles a specific `ckb-js-vm` RISC-V binary) and the available `ckb-debugger` versions. The tutorial toolchain appears to have breaking changes that haven't been resolved in the example repo.

**Impact:** Could not compile or deploy the hash_lock script. The conceptual understanding of how custom Lock Scripts work was gained from reading the source code directly.

### CCC Exploration

- Visited CCC Playground at live.ckbccc.com
- Reviewed CCC GitHub examples
- Understood the signer/client architecture

## Screenshots

[Screenshots stored in /screenshots/week-05/]

## Blockers / Questions

- simple-lock tutorial broken due to `ckb-debugger` / `ckb-js-vm` version mismatch — raised as a potential issue to flag with DevRel
- Question: Is there a working version of the simple-lock tutorial with the current toolchain?

## Plan for Next Week

- CCC deep dive - study all SDK methods and examples in detail
- Brainstorm 2-3 application ideas to discuss with Neon
- Start thinking about app architecture
