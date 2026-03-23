# Week 9 - Nervos DAO

**Name:** David
**Week Ending:** 2026-04-03

---

## Courses / Material Completed

- [x] Read the [Nervos DAO RFC](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md) in full
- [x] Read the [Nervos DAO introduction](https://docs.nervos.org/docs/dao/intro-to-dao) on docs.nervos.org
- [x] Studied NervDAO browser implementation on GitHub
- [x] Completed deposit transaction on testnet
- [x] Completed Phase 1 withdrawal (withdraw request) on testnet
- [ ] Phase 2 unlock - pending epoch lock period

## Key Learnings

### Why the DAO exists

CKB has two issuance schedules. Primary issuance is a fixed block reward that halves on schedule, miners get this. Secondary issuance is proportional to how much of the total CKB supply is used for state storage. If 30% of all CKB is used to store cells, 30% of secondary issuance goes to miners securing that state. The rest goes to Nervos DAO depositors and a treasury.

The consequence without the DAO: long-term holders get diluted by secondary issuance without receiving anything for it. The DAO lets you opt in to receiving your share. Your deposit earns back the inflation that would otherwise reduce your purchasing power. It is not staking in any proof-of-stake sense. You are not securing the network. You are protecting your share of the supply.

### The deposit

Depositing is a single transaction. You create a new cell with the NervosDAO type script attached, and put `0x0000000000000000` (8 zero bytes) in the data field. The 8 zero bytes act as a placeholder that gets replaced with the deposit block number when you initiate withdrawal later. CCC has the NervosDAO script built in as a known script, so setup is minimal:

```typescript
const daoScript = await client.getKnownScript(ccc.KnownScript.NervosDao);

const tx = ccc.Transaction.from({
  outputs: [{
    lock,
    type: ccc.Script.from({ ...daoScript, args: "0x" }),
    capacity: ccc.fixedPointFrom("1000"),
  }],
  outputsData: ["0x0000000000000000"],
});

await tx.addCellDepsOfKnownScripts(client, ccc.KnownScript.NervosDao);
await tx.completeInputsByCapacity(signer);
await tx.completeFeeBy(signer, 1000);
```

### The two-phase withdrawal

Withdrawing from the DAO is a two-step process. You cannot do it in one transaction. This is by design: the protocol needs to enforce a minimum lock period aligned to epoch boundaries.

**Phase 1 - withdraw request.** You spend the deposit cell and create a new "withdrawing" cell in its place. The key difference is the data field: instead of 8 zero bytes, you write the block number of the block your deposit was confirmed in, encoded as a little-endian uint64. This stamps the cell with when the deposit started so the protocol can calculate interest later.

```typescript
const depositBlockHash = depositTx.blockHash;
const depositHeader = await client.getHeaderByHash(depositBlockHash);

const blockNum = BigInt(depositHeader.number);
const blockNumLE = blockNum.toString(16).padStart(16, "0").match(/../g)!.reverse().join("");
```

The output cell looks identical to the deposit cell on the surface (same lock, same type script) but the data is now the encoded block number instead of zeros. The CKB explorer shows it as "Nervos DAO Withdraw" to distinguish it from a deposit.

**Phase 2 - unlock and claim.** After a lock period (minimum 180 epochs, aligned to epoch boundaries, roughly 30 days on mainnet), you submit a second transaction that returns the CKB plus interest. This transaction needs both the deposit block header and the withdrawal-request block header in its `headerDeps`, so the DAO script can calculate interest using the accumulation rate stored in each header:

```
interest = deposit_capacity x (AR_withdraw_block - AR_deposit_block) / AR_deposit_block
```

The accumulation rate (`AR`) is a value stored in every block header that tracks the compounding growth of secondary issuance over time. You do not calculate it yourself. The DAO script reads it from the header deps you provide.

### Epoch alignment

The lock period is not just "wait 180 epochs from when you deposited." It is measured from when you submitted the Phase 1 withdrawal request and rounded up to the next epoch boundary. If you submitted the request mid-epoch, you do not unlock until the end of epoch N+180, not the beginning. Getting this wrong keeps your funds locked for an extra full epoch cycle. NervDAO shows you the exact earliest unlock time before you confirm.

### What I had to handle manually

CCC's `getKnownScript` and `completeFeeBy` handle most of the heavy lifting. What I still had to do manually:

- Fetching the deposit block header and encoding the block number as little-endian bytes
- Adding the block header as a `headerDep` in the Phase 1 transaction
- Waiting for the deposit to confirm before initiating withdrawal (polling `blockHash` on the transaction response)

The header deps are the part that is unique to CKB. Other chains do not have this concept. They are references to specific block headers that scripts can read during execution, without those headers being part of the transaction itself.

## Practical Progress

### Deposit

Deposited 1,000 CKB into the Nervos DAO on testnet.

- **Tx:** `0xb3109e500a5ab303dad1e2f830e0ca381452ebe539837ab47d351963275b18c0`
- **Block:** 20,524,306
- **Output #0:** Nervos DAO Deposit - 1,000 CKB
- **Output #1:** Change - 8,999.99999438 CKB

### Phase 1 Withdrawal

Initiated withdrawal from the DAO. The deposit cell was spent and replaced with a withdrawing cell.

- **Tx:** `0xbe13a755e183cb6d336ad8f63261ccec4ea0f94f3fec1143f6a2c0995e06b591`
- **Block:** 20,524,408
- **Input #0:** Nervos DAO Deposit - 1,000 CKB (the deposit cell)
- **Output #0:** Nervos DAO Withdraw - 1,000 CKB (now in the withdrawal queue)

The data field on the output cell encodes block 20,524,306 in little-endian, which is the block the original deposit landed in.

### Phase 2

Pending the epoch lock period. Will submit the unlock transaction once the minimum lock window has passed and claim the CKB with interest.

## Screenshots

![Deposit transaction confirmed on testnet explorer](/screenshots/week-09/dao-deposit-tx.png)

*Deposit tx confirmed at block 20,524,306.*

![Deposit transaction outputs](/screenshots/week-09/dao-deposit-outputs.png)

*Output #0 shows "Nervos DAO Deposit" - 1,000 CKB locked with the NervosDAO type script.*

![Phase 1 withdrawal transaction](/screenshots/week-09/dao-withdraw-phase1-tx.png)

*Phase 1 withdrawal request tx confirmed at block 20,524,408.*

![Phase 1 withdrawal outputs](/screenshots/week-09/dao-withdraw-phase1-outputs.png)

*Output #0 now shows "Nervos DAO Withdraw" - cell is in the withdrawal queue, data field encodes the deposit block number.*

## Blockers / Questions

No blockers. Phase 2 is waiting on the epoch lock period, nothing to do until the window opens.

One thing worth flagging: the CKB explorer label changes from "Nervos DAO Deposit" to "Nervos DAO Withdraw" after Phase 1, which makes the state transition easy to verify visually.

## Plan for Next Week

- Week 10: Spore Protocol / DOBs - minting on-chain NFTs with content stored directly in cells
