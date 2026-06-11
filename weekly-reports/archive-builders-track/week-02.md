# Week 2 - Scripts Deep Dive & CKB-VM

**Week Ending:** 2026-02-04

---

## What I Did

- Read the full [Introduction to Script](https://docs.nervos.org/docs/script/intro-to-script) documentation
- Studied the CKB-VM architecture and RISC-V execution model
- Revisited the Cell Model with a focus on how Scripts attach to Cells
- Studied the default Lock Script (`secp256k1_blake160_sighash_all`) in detail
- Compared CKB's programming model with Ethereum and Bitcoin

## Key Learnings

### Script Structure

Every Script on CKB has three fields:
- **code_hash** - a hash that identifies which executable code the CKB-VM should load
- **hash_type** - tells the VM how to locate the Script code (can be `data`, `data1`, `data2`, or `type`)
- **args** - arbitrary parameters that customize the Script instance. This is what makes one person's Lock Script different from another's - same code, different args (e.g., different public key hashes)

### Lock Scripts vs Type Scripts - Execution Rules

This was an important distinction I had to wrap my head around:

- **Lock Scripts on input Cells** - always execute (you must prove you can spend)
- **Type Scripts on input Cells** - execute (validate that consumption rules are followed)
- **Type Scripts on output Cells** - execute (validate that creation rules are followed)
- **Lock Scripts on output Cells** - do NOT execute (they'll run when someone tries to spend those Cells later)

This means Lock Scripts guard spending, while Type Scripts guard both creation and consumption of Cells.

### The Default Lock Script

CKB ships with `secp256k1_blake160_sighash_all` as the standard Lock Script:
1. It takes a signature from the transaction witness data
2. Recovers the public key from the signature
3. Hashes that public key using Blake2b (truncated to 160 bits = "Blake160")
4. Compares the hash against the value stored in the Script's `args` field
5. If they match, the signature is valid and the transaction is authorized

This uses the same elliptic curve as Bitcoin (secp256k1), which is one reason CKB is considered "Bitcoin-isomorphic."

### CKB-VM and Cycles

CKB-VM runs RISC-V instructions - an open-source instruction set that gives low-level CPU access. When a transaction is submitted:

1. The VM loads Script code using syscalls
2. It reads Cell data and witness data via syscalls like `ckb_load_cell_data()`
3. The Script executes its validation logic
4. Return `0` = valid, anything else = transaction rejected

**Cycles** measure computational cost. Each instruction costs cycles, and there's a block-level cap (3.5 billion cycles on mainnet). Individual transactions have no limit - they just need to fit within the block budget.

### CKB vs Ethereum vs Bitcoin

| | Bitcoin | CKB | Ethereum |
|--|---------|-----|----------|
| Model | UTXO | Cell (generalized UTXO) | Account |
| State | amounts only | arbitrary data | contract storage |
| Smart contracts | limited (Script) | full (RISC-V Scripts) | full (EVM bytecode) |
| Consensus | PoW | PoW | PoS |
| VM | Bitcoin Script | CKB-VM (RISC-V) | EVM |
| Crypto | secp256k1 | any (VM-level flexibility) | secp256k1 |

The big insight: CKB generalizes Bitcoin's UTXO model. A Bitcoin UTXO can only hold a value. A CKB Cell can hold arbitrary data with programmable rules - making it as flexible as Ethereum but built on a UTXO foundation.

## Blockers / Questions

- Ready to start hands-on exercises next week (Transfer CKB tutorial)
- Want to understand how CCC (Common Chain Connector) abstracts the raw transaction building

## Plan for Next Week

- Begin the beginner exercises starting with Transfer CKB
- Complete Store Data on Cell tutorial
- Take screenshots as proof of completion
- Start learning CCC SDK basics alongside the tutorials
