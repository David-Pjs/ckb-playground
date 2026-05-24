# Week 5 - CKB Quest Phase 2: DAO, Spore, RGB++

**Week Ending:** 2026-05-15

---

## What I Built

Shipped Phase 2 of CKB Quest — three new checkpoints drawn directly from the advanced topics in my 13-week builders track. The original five checkpoints covered the basics: wallet, transfers, xUDT tokens, Fiber channels, Fiber payments. Phase 2 goes into the parts of CKB that most developers never reach.

Total reward pool is now 1,325 CKB across 8 checkpoints.

## The 3 New Checkpoints

**Checkpoint 6 — Lock Your CKB (150 CKB reward)**  
Nervos DAO deposit on testnet. The concept I wanted to land here is the distinction between staking and inflation protection. The DAO is not proof-of-stake. You are not securing the network. You are opting in to your share of secondary issuance — the inflation that would otherwise dilute your position every block. The deposit itself is one transaction: a cell with the NervosDAO type script and exactly `0x0000000000000000` in the data field.

Verification: fetch the submitted TX hash, use CCC's `getKnownScript(KnownScript.NervosDao)` to get the correct type script (no hardcoded hashes), then check that an output cell has that type script attached and 8 zero bytes of data. Minimum 100 CKB.

**Checkpoint 7 — Write Something Permanent (200 CKB reward)**  
Spore Protocol mint on testnet. The framing here: most NFTs are a pointer to a URL that might disappear. Spore stores the content — the actual bytes — directly in the cell's data field. As long as CKB runs, the content runs. No external dependency.

Verification: user submits the Spore ID (the type args of the output cell). Query testnet for a cell with the Spore type script at that exact args, confirm the data field is non-empty. The Spore ID is unique per mint — there is no way to fake it.

**Checkpoint 8 — Find the Bitcoin Ghost (250 CKB reward)**  
RGB++ isomorphic binding query on CKB mainnet. Every RGB++ cell announces which Bitcoin UTXO owns it — encoded in 36 bytes of lock args: VOUT (4 bytes, little-endian) + TXID (32 bytes, little-endian). The task is to query mainnet, find a live cell, reverse the byte order, and submit the human-readable `txid:vout` pair.

This came directly from Week 11 of the builders track, where I wrote the query script that found 10 live mainnet cells and decoded each binding. The checkpoint makes someone else do that same work.

Verification: re-encode the submitted `txid:vout` back into lock args, call `get_cells` on the CKB mainnet indexer with exact match, confirm at least one cell exists.

## Technical Notes

**NervosDAO via CCC KnownScript**: Using `client.getKnownScript(ccc.KnownScript.NervosDao)` rather than hardcoding the code hash. This is correct — the known script resolves to the right deployment per network (testnet vs mainnet) without me maintaining constants.

**Spore type script**: Spore is not a CCC known script, so the code hash is hardcoded: `0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d`, hash_type `data1`. This is the official testnet deployment.

**RGB++ lock args encoding**: The byte order is easy to get wrong. TXID is stored little-endian in the lock args, meaning the bytes are reversed from the human-readable big-endian TXID you see in a Bitcoin explorer. VOUT is also little-endian as a uint32. The verification re-encodes both before querying — so if a user reverses correctly, it matches; if they submit big-endian, it won't find anything and the error message tells them to check byte order.

**Completion state**: The page was checking `completedCount === 5` as the finish condition. Updated to `completedCount === CHECKPOINTS.length` so it scales with future phases.

## Deployment

Deployed to production on Vercel. Build passed clean — types checked on the build server, zero errors.

## What's Next

- Get users through checkpoints 6-8 and see where they get stuck
- Checkpoint 4/5 Fiber verification still needs a live node connected — this is the one outstanding blocker across both CKB Quest and Fiber-402
- Consider Phase 3 once real user feedback comes in from Phase 2
