# Week 10 - Spore Protocol / DOBs

**Name:** David
**Week Ending:** 2026-04-10

---

## Courses / Material Completed

- [x] Read the [Spore Protocol introduction](https://docs.spore.pro) and documentation
- [x] Studied Spore SDK source and API
- [x] Created a Cluster (on-chain NFT collection) on testnet
- [x] Minted a Spore (on-chain NFT) inside the cluster on testnet
- [x] Explored DOB Cookbook and content type options

## Key Learnings

### What Spore Protocol is

Spore is CKB's native NFT standard. The thing that makes it different from NFTs on Ethereum or Solana is where the content lives. On most chains, an NFT is just a pointer to a URL, and the actual image or file sits on IPFS or a centralised server. If that server goes down, the NFT is effectively blank.

With Spore, the content is stored directly inside the cell's data field on-chain. The cell holds a content-type string (like `text/plain` or `image/png`) and the raw bytes of the content itself. As long as CKB exists, the content exists. There is no external dependency.

The cell model makes this work. CKB cells can hold arbitrary data, so there is nothing special required to store file content on-chain. Spore just defines a standard encoding for how to pack the content-type and content bytes together.

### Clusters

A Cluster is a parent cell that groups Spores into a collection. It stores a name and description on-chain. When you create a Spore with a `clusterId`, the Spore type script verifies that the referenced Cluster cell exists and that you have authority over it. It is the equivalent of a collection or contract on Ethereum NFT platforms, except the collection itself is just another cell.

Creating a cluster produces a unique cluster ID, which is the type script args of the cluster cell. That ID is used as a foreign key when minting Spores into the collection.

### The Spore SDK vs CCC

This week used a different SDK from the previous weeks. Instead of CCC, Spore Protocol has its own SDK (`@spore-sdk/core`) built on top of `@ckb-lumos/lumos`. Lumos is the older lower-level CKB library that CCC was designed to replace for most use cases.

The main difference in practice: Lumos uses a `TransactionSkeleton` object that gets built up step by step, while CCC uses a more direct `Transaction.from()` approach. Signing with Lumos requires manually calling `prepareSigningEntries` and `sealTransaction`, whereas CCC wraps all of that in a single `signer.sendTransaction()` call.

Both produce the same on-chain result. The Spore SDK uses Lumos because it predates CCC's maturity.

### On-chain content encoding

The Spore data field is molecule-encoded. When you call `createSpore` with:

```typescript
data: {
  contentType: "text/plain",
  content: Buffer.from("My first on-chain NFT. - David"),
  clusterId: CLUSTER_ID,
}
```

The SDK encodes the contentType string and content bytes into a molecule struct and writes it into the cell's data field. Reading it back requires decoding the molecule format, which the SDK also handles. The raw bytes are permanently on-chain.

### Why the two-step process matters

Creating a Spore inside a Cluster requires the Cluster cell to already exist in the indexer before the Spore transaction can be built. The `createSpore` call fetches the live Cluster cell to verify it and include it as a cell dep. If the Cluster transaction has not been indexed yet, the call fails with "cannot find cluster."

This is different from Ethereum where you can batch setup transactions and rely on mempool ordering. On CKB you need to wait for confirmation and indexer propagation before building dependent transactions.

## Practical Progress

### Cluster created

- **Name:** David Collection
- **Description:** On-chain NFT collection - CKB testnet
- **Cluster ID:** `0x37b8b772852d45ed16f8a7a2cd0718c983eda34c0bf40963939f95694f624596`
- **Tx:** `0x4eb8799db6e4a7df7b54aa60a05d2d58d74251df2f69309a332214f7ccb3a95a`

### Spore minted

- **Content:** `My first on-chain NFT. - David` (text/plain, stored on-chain)
- **Spore ID:** `0x596f780bc2ab681aa1cf665e85363cf68f849f40606b9d00c34da3ec5deb0e8e`
- **Tx:** `0x5d5a061ebeb3c3d5b964a8f9dfce272453384f1acdacc21b152a0c66c596932e`

The `PoolRejectedDuplicatedTransaction` error on the second run confirmed the first submission went through successfully - the node already had the transaction.

## Screenshots

![Cluster transaction on testnet explorer](/screenshots/week-10/cluster-tx-explorer.png)

*Cluster creation tx - `0x4eb8799d` on testnet.*

![Spore mint transaction on testnet explorer](/screenshots/week-10/spore-tx-explorer.png)

*Spore mint tx - `0x5d5a061e` on testnet.*

![Terminal output showing cluster ID and spore ID](/screenshots/week-10/terminal-output.png)

*Terminal output - Cluster ID, Spore ID, and tx hashes confirmed.*

## Blockers / Questions

The CKB testnet explorer shows these transactions as "Untracked" - it does not fully decode Spore type scripts in its current version. The transactions are confirmed on-chain (the spore mint succeeded, which requires the cluster to be live in the indexer). A dedicated Spore explorer would show the full decoded content.

## Plan for Next Week

- Week 11: Advanced topics - RGB++ Protocol
