# Week 6 - CCC Deep Dive & Application Design

**Name:** David
**Week Ending:** 2026-03-13

---

## Courses / Material Completed

- [x] Studied CCC SDK documentation and source examples
- [x] Explored CCC Playground (live.ckbccc.com) - ran transaction examples
- [x] Reviewed existing batch-transfer project as foundation for app
- [x] Designed application architecture
- [x] Chose application concept and defined scope

## Key Learnings

### CCC Architecture

CCC (Common Chain Connector) is built around three core concepts:

**Client** — connects to the network (devnet, testnet, mainnet). Created once and reused:
```typescript
const client = new ccc.ClientPublicTestnet();
```

**Signer** — wraps a private key or wallet and handles signing. The signer knows which network to use via its client:
```typescript
const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
```

**Transaction** — built declaratively by describing desired outputs, then completed by CCC:
```typescript
const tx = ccc.Transaction.from({ outputs: [...], outputsData: [...] });
await tx.completeInputsByCapacity(signer);  // CCC picks which cells to consume
await tx.completeFeeBy(signer, 1000);       // CCC calculates the fee
await signer.sendTransaction(tx);           // Sign and broadcast
```

### Key CCC Methods Used

| Method | What it does |
|--------|-------------|
| `ccc.fixedPointFrom(amount)` | Converts human CKB amount to Shannons |
| `ccc.numLeToBytes(amount, 16)` | Encodes token amount as 16-byte little-endian (for xUDT) |
| `ccc.Script.fromKnownScript(client, KnownScript.XUdt, args)` | Gets the xUDT type script for a given token |
| `tx.addCellDepsOfKnownScripts(client, KnownScript.XUdt)` | Adds the xUDT script cell dependency to the tx |
| `cccClient.findCellsByType(typeScript, true)` | Finds all live cells with a given type script |

### Why CCC over raw RPC

Without CCC you would need to manually:
- Query UTXOs (cells) one by one via RPC
- Calculate exact capacities for each output
- Manually select input cells to cover the total
- Serialize the transaction in the correct binary format
- Compute the transaction hash
- Sign it with the private key
- Broadcast via RPC

CCC handles all of this. `completeInputsByCapacity` alone replaces about 50 lines of manual UTXO selection code.

## Application Concept

### Token Airdrop Tool

**What it does:** A dApp that lets you issue a custom xUDT token and airdrop it to multiple addresses in a single transaction.

**Why this:** I already built a batch CKB transfer tool (`projects/batch-transfer`). This extends that work by adding xUDT token support — combining everything learned in Weeks 3, 4, and 5 into one useful tool.

**Core features:**
1. Issue a new xUDT token (set name + total supply)
2. Paste a list of recipient addresses + token amounts
3. Send tokens to all recipients in one transaction
4. View transaction on testnet explorer

**How it differs from the existing batch-transfer:**
- Current batch-transfer sends CKB only
- New app sends custom xUDT tokens
- Adds token issuance step before distribution
- Uses xUDT Type Script on each output cell

### Architecture Plan

```
projects/token-airdrop/
  lib.ts          - issueToken(), airdropToken(), parseRecipients()
  ccc-client.ts   - testnet client config
  index.tsx       - React UI
  index.html
  package.json
```

**Transaction flow for airdrop:**
1. For each recipient, create an output cell with:
   - Lock Script = recipient's address
   - Type Script = xUDT script with token ID as args
   - Data = token amount encoded as 16-byte little-endian
2. Complete inputs (sender's existing token cells + CKB for capacity)
3. Add xUDT cell dep
4. Sign and send

### Comparison of App Ideas Considered

| Idea | Pros | Cons | Decision |
|------|------|------|----------|
| Token Airdrop Tool | Extends existing work, practical, uses xUDT | Requires understanding token cells | **Chosen** |
| On-chain Guestbook | Simple, easy to build | Already done in Week 3 (store data) | Skip |
| NFT Collection | Uses Spore, creative | More complex, Spore SDK overhead | Later |

## Plan for Next Week

- Set up `projects/token-airdrop/` project structure
- Implement `issueToken()` and `airdropToken()` functions in lib.ts
- Build basic UI with React
- Test token issuance on testnet
