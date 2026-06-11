# Week 12 - Final Polish and Retrospective

**Name:** David
**Week Ending:** 2026-03-30

---

## Courses / Material Completed

- [x] Reviewed all weekly reports and code from Weeks 1-11
- [x] Polished the repository structure and README
- [x] Completed the full 12-week programme retrospective
- [x] Documented lessons learned and what to build next

---

## Programme Retrospective

### What I came in knowing

Before this programme I had a general understanding of how blockchains work - the idea of a distributed ledger, wallets, transactions, and tokens. I had done some reading on Ethereum smart contracts but never actually written one or deployed anything on any chain. CKB was completely new to me.

### What the first few weeks actually felt like

Weeks 1 and 2 were dense. The Cell Model does not map onto anything from Ethereum. There is no global state, no shared contract storage, no `msg.sender`. Every piece of state lives in a cell that is owned outright and consumed completely when you spend it. It took reading the same material a few times before it clicked that this is closer to Bitcoin UTXO than to Ethereum accounts, but with cells that can hold arbitrary data and run arbitrary scripts.

The scripts concept was the next hurdle. On Ethereum, the contract is the logic and the storage is inside it. On CKB, the script is just code that returns 0 or 1. The data it checks can be anywhere - in the cell it is attached to, in other cells in the same transaction, or in the transaction structure itself. Lock scripts and type scripts doing fundamentally different jobs (ownership vs. state rules) was a distinction that took hands-on work to properly understand.

### Building things

From Week 3 onward the learning became practical. Transferring CKB, storing data in a cell, and minting a fungible token were exercises that forced me to actually read the SDK rather than just the docs. Each one had at least one error that required going deeper - looking at actual type definitions, checking what the RPC returned versus what the documentation said it returned.

The application project in Weeks 6-8 was where the most real learning happened. Designing something from scratch, deciding what state goes where, figuring out how cell dependencies work across transactions - none of that is covered in any single tutorial. The ckb-airdrop project gave me a concrete use case to reason about the cell model with, rather than just following steps.

### The protocols

Weeks 9-11 covered three distinct advanced protocols built on top of CKB.

**Nervos DAO** is probably the most important protocol for any CKB holder to understand. The two-phase withdrawal exists because the protocol needs to enforce epoch alignment for interest calculations. Getting the block number encoded as little-endian bytes and added as a header dep was the practical part that made the RFC make sense. Without doing the actual transaction the header deps concept stays abstract.

**Spore Protocol** changed how I think about NFTs. Storing the content directly in the cell data field - not a URL, not an IPFS hash, the actual bytes - means the asset genuinely lives on-chain with no external dependency. The Cluster and Spore I minted on testnet will be there as long as CKB runs. That is a different guarantee from anything on Ethereum or Solana.

**RGB++** was the most conceptually ambitious. Isomorphically binding a CKB cell to a Bitcoin UTXO so that spending one requires spending the other - that is a fundamentally different approach to cross-chain than wrapping or bridging. The query script I wrote found 10 live RGB++ cells on mainnet, each with its lock args decoding to a specific Bitcoin TXID and VOUT. Seeing the actual binding data in the cell made the protocol concrete in a way that just reading the whitepaper did not.

### What I would do differently

The main thing I underestimated was how much the SDKs matter on CKB. CCC and the Spore SDK and the RGB++ SDK all wrap the same underlying CKB RPC, but they have different mental models and different levels of abstraction. Switching between them mid-programme (CCC for DAO, Lumos for Spore, raw RPC for RGB++) meant spending time on tooling differences rather than protocol differences. Starting with a single SDK and going deeper would have been more efficient.

I also underestimated the indexer dependency. Several transactions that I thought had failed had actually succeeded - the issue was waiting for the indexer to propagate the new state before the next call could find the updated cells. CKB is not like a single-machine database where writes are immediately visible to reads. The indexer is a separate system and it has its own latency.

### What this programme actually covered

Looking at the full list:

- Cell model and CKB-VM from first principles
- Lock scripts and type scripts (theory and hands-on)
- CKB transfers and on-chain data storage
- Fungible tokens with xUDT
- Digital objects (DOBs) with Spore Protocol - minting a Cluster and a Spore on testnet
- CCC (Common Chain Connector) - SDK deep dive and application development
- Built and deployed ckb-airdrop on testnet - a full application with token distribution logic
- Nervos DAO - deposit and two-phase withdrawal on testnet
- Spore Protocol - on-chain NFT with content stored directly in the cell
- RGB++ - queried live isomorphic bindings on CKB mainnet

That is significantly more ground than I expected to cover in 12 weeks.

### What comes next

The things I want to go deeper on from here:

- **Writing actual scripts in Rust** - everything in this programme used existing deployed scripts via SDK. Writing a custom lock or type script and deploying it is the next level.
- **RGB++ asset issuance** - the query showed the protocol working. Actually minting a new RGB++ asset requires owning Bitcoin UTXOs and running the full cross-chain flow.
- **iCKB** - liquid staking built on the Nervos DAO. Now that the DAO mechanics make sense, iCKB is the logical next step for understanding CKB's DeFi layer.

---

## Repository Summary

| Area | What was built |
|------|----------------|
| Simple transfer | CKB transfer script using CCC |
| On-chain data | Cell with arbitrary data stored in the data field |
| Fungible token | xUDT token minted and transferred on testnet |
| Application | ckb-airdrop - deployed on testnet, frontend on GitHub Pages |
| Nervos DAO | Deposit and Phase 1 withdrawal on testnet |
| Spore Protocol | Cluster and Spore minted on testnet with on-chain text content |
| RGB++ query | Mainnet cell query decoding live BTC-CKB isomorphic bindings |

---

## Final Note

CKB is genuinely different from other chains and it takes time to adjust to the Cell Model. The documentation has improved a lot but there is still a gap between reading the concepts and understanding them through building. This programme closed that gap. Everything clicked at some point during an actual transaction or an actual error.