# Week 11 - RGB++ Protocol

**Name:** David
**Week Ending:** 2026-03-23

---

## Courses / Material Completed

- [x] Read the [RGB++ Protocol whitepaper](https://github.com/ckb-cell/RGBPlusPlus-design/blob/main/docs/light-paper-en.md)
- [x] Studied the RGB++ SDK source and constants (`@rgbpp-sdk/ckb`)
- [x] Read the isomorphic binding design and lock args specification
- [x] Wrote a TypeScript script to query live RGB++ cells on CKB mainnet
- [x] Decoded lock args to extract bound Bitcoin TXIDs and VOUTs

---

## Key Learnings

### What RGB++ is

RGB++ is a protocol that extends Bitcoin UTXOs with programmability by binding them isomorphically to cells on CKB. The core idea is that every RGB++ asset on Bitcoin has a corresponding cell on CKB. The two are linked one-to-one. To transfer the asset, you have to spend both the Bitcoin UTXO and the matching CKB cell in a coordinated transaction.

On most chains, bridging from Bitcoin involves wrapping: you lock BTC somewhere and mint a synthetic token on the other chain. RGB++ works differently. The Bitcoin UTXO itself becomes the ownership proof. The CKB cell holds the asset state and contract logic. The BTC chain provides the security and settlement.

### Isomorphic binding

The binding between a Bitcoin UTXO and a CKB cell lives in the CKB cell's lock script. Every RGB++ cell uses the RGB++ lock, and the lock args encode exactly which Bitcoin UTXO owns that cell:

```
lock args = VOUT (4 bytes, little-endian) + BTC TXID (32 bytes, little-endian)
```

Total: 36 bytes per cell. The RGB++ lock script verifies during any spend that the corresponding Bitcoin transaction was committed on-chain and that the new CKB cell state matches the outputs declared in that Bitcoin transaction.

The lock code hash on mainnet is:

```
0xbc6c568a1a0d0a09f6844dc9d74ddb4343c32143ff25f727c59edf4fb72d6936
```

This is a type-ID deployment, so the code hash is a type identifier rather than a raw hash of the script bytecode. That means the lock can be upgraded while keeping the same code hash, as long as the type ID cell is controlled by the right authority.

### The commitment scheme

When you transfer an RGB++ asset, the Bitcoin transaction contains an `OP_RETURN` output with a hash that commits to the new CKB cell state. The RGB++ lock on CKB reads that commitment from the Bitcoin block header chain (via CKB's light client) and verifies that the cell being created matches what was committed on Bitcoin.

This is what makes the protocol trustless. You do not need to trust a bridge operator. The CKB lock script performs the verification directly using Bitcoin block data.

### Shadow cells

During a transfer, the old CKB cell (bound to the input BTC UTXO) is consumed and a new CKB cell is created (bound to the output BTC UTXO). The old and new CKB cells are called shadow cells because they shadow the Bitcoin UTXO they are bound to. If you know the Bitcoin TXID and output index, you can always derive which CKB cell corresponds to it.

### Why 254 CKB per cell

Every cell on CKB requires a minimum amount of CKB proportional to its storage. RGB++ token cells are sized so that the minimum capacity works out to 254 CKB. This is the amount the queried cells all held. The CKB is not the value being transferred - it is the rent paid to store the cell's state on-chain. When the asset is bridged back to Bitcoin, the 254 CKB is released back to the user.

---

## Practical Progress

### RGB++ cell query - CKB mainnet

Wrote a TypeScript script using `@rgbpp-sdk/ckb` to get the correct lock script constants, then called the CKB indexer's `get_cells` RPC directly to search for live RGB++ cells on mainnet.

The query uses prefix matching on the lock code hash to find all cells regardless of their args. Each result is then decoded to extract the bound Bitcoin TXID and VOUT from the 36-byte lock args.

```typescript
const lock = getRgbppLockScript(true); // mainnet

const result = await rpc("get_cells", [
  {
    script: {
      code_hash: lock.codeHash,
      hash_type: lock.hashType,
      args: "0x",
    },
    script_type: "lock",
    script_search_mode: "prefix",
  },
  "asc",
  "0xa",
]);
```

**Results:**

- **Cells found:** 10 live RGB++ cells
- **Capacity per cell:** 254 CKB (standard RGB++ minimum)
- **Token type:** all 10 share the same type script (`0x50bd8d6680b8b9cf...`) - the same RGB++ native token across all cells
- **BTC binding:** each cell's lock args decode to a unique Bitcoin TXID at VOUT = 0

Example cell (Cell 2):

- **CKB outpoint:** `0xc42b859a...ca:285`
- **BTC TXID:** `a4a078ff5ff42f2b9c12423f4266b5cad1bbb16663e6d2ed11a58cc0bf230100`
- **BTC VOUT:** 0

Cell 1 had non-standard args (`0x00000000`, 4 bytes only) - this is a genesis or pool cell not bound to a standard BTC UTXO in the same way as user-facing cells.

---

## Screenshots

![RGB++ query header and first cells](/screenshots/week-11/rgbpp-query-header.png)

*Query output showing the RGB++ lock code hash and cells 1-2 with decoded BTC bindings.*

![RGB++ cells 3-5](/screenshots/week-11/rgbpp-query-cells.png)

*Cells 3-5 showing unique BTC TXIDs for each cell.*

![RGB++ cells 6-8](/screenshots/week-11/rgbpp-query-cells-2.png)

*Cells 6-8 - all holding 254 CKB with the same token type script.*

![Protocol summary](/screenshots/week-11/rgbpp-query-summary.png)

*Cells 9-10 and the protocol summary explaining the isomorphic binding structure.*

---

## Blockers / Questions

Creating a new RGB++ asset requires owning a Bitcoin UTXO and running the full cross-chain transaction flow through both Bitcoin and CKB. That is outside the scope of a read-only exploration, so this week focused on observing and decoding existing mainnet state rather than issuing new assets. The query script demonstrates the core concept clearly - the lock args are the whole protocol in 36 bytes.

One thing worth noting: the `@rgbpp-sdk/ckb` package was needed to get the correct mainnet lock code hash. My initial attempt had a 63-character hex string (one character short of the required 32 bytes), which the indexer rejected. The SDK gave the correct hash: `0xbc6c568a1a0d0a09f6844dc9d74ddb4343c32143ff25f727c59edf4fb72d6936`.

---

## Plan for Next Week

- Week 12: Final project polish and programme retrospective
