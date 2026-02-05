# Week 1 - Environment Setup & Core Concepts

**Week Ending:** 2026-02-04

---

## What I Did

- Reviewed the CKB Builder Handbook and mapped out a 12-week study plan
- Set up my development environment in GitHub Codespaces with OffCKB
- Ran `offckb node` to start a local CKB devnet
- Studied the official [How CKB Works](https://docs.nervos.org/docs/getting-started/how-ckb-works) documentation
- Read through [CKB Academy - Basic Theory](https://academy.ckb.dev/courses/basic-theory)
- Set up this dev log repository with structured weekly reporting

## Key Learnings

### The Cell Model

CKB uses a **Cell Model** instead of Ethereum's account model. Cells are the fundamental units of state on the blockchain - like containers that hold both value and data. Each Cell requires a minimum of 61 CKBytes to exist, and CKBytes serve a dual purpose: they are both the native currency and a representation of on-chain storage capacity. 1 CKByte = 1 byte of storage.

The critical thing to understand is that Cells are **immutable**. You cannot update a Cell in place. Instead, you consume (spend) the existing Cell and create a new one with the updated data. This is similar to Bitcoin's UTXO model but more flexible since Cells can store arbitrary data, not just token amounts.

- **Live Cell** = unspent, available for use
- **Dead Cell** = consumed/spent, no longer usable

### Transactions

A CKB transaction follows this flow:
1. Select input Cells (Live Cells to consume)
2. Define output Cells (new Cells to create)
3. Sign with private key
4. Broadcast to the network
5. Nodes validate and propagate to mempool
6. Miner confirms by including in a block

The inputs are destroyed and outputs are created atomically. Transaction fees are the difference between total input capacity and total output capacity.

### Scripts

Scripts are CKB's smart contracts - binary executables that run on CKB-VM (RISC-V based). Every Cell has:
- A **Lock Script** (mandatory) - controls ownership. Only the right key holder can spend the Cell.
- A **Type Script** (optional) - enforces rules about how Cells can be created or modified.

### OffCKB

OffCKB provides a complete local development environment with one command. It starts a devnet with 20 pre-funded accounts (42M CKB each), has common Scripts pre-deployed in the genesis block (Omnilock, xUDT, Spore), and includes debugging tools.

## Environment

- GitHub Codespaces (Linux)
- Node.js v20+ LTS
- OffCKB CLI (latest)
- CKB devnet running locally via `offckb node`

## Plan for Next Week

- Deep dive into Script architecture (code_hash, hash_type, args)
- Study Lock Script vs Type Script execution flow
- Understand CKB-VM and the RISC-V execution model
- Compare CKB's model with Bitcoin UTXO and Ethereum accounts
