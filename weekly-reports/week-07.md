# Week 7 - Building the Airdrop App (Part 1)

**Name:** David
**Week Ending:** 2026-03-20

---

## Courses / Material Completed

- [x] Set up project scaffold for `projects/ckb-airdrop/` with Parcel, React, TypeScript
- [x] Implemented `batchTransferCKB()` — multi-output CKB transfer in a single transaction
- [x] Implemented `batchTokenAirdrop()` — multi-output xUDT token distribution
- [x] Implemented `getTokenBalance()` — reading xUDT balance by scanning cells
- [x] Built out `ccc-client.ts` with devnet/testnet/mainnet network switching

## Key Learnings

### Designing the transaction layer first

One decision I made early was to write all the transaction logic in a plain TypeScript file (`transfer.ts`) completely separate from any UI code. No React, no hooks — just async functions that take inputs and return a tx hash. This made it much easier to reason about what was happening on-chain without UI state getting in the way.

The separation turned out to be important. The blockchain logic has different failure modes than UI logic. If `batchTokenAirdrop()` throws, that's a CKB error — insufficient tokens, bad address, whatever. If a React state update fails, that's something else entirely. Keeping them separate meant I could think about each problem on its own terms.

### Building a multi-output transaction

CKB transactions work on the UTXO model — you consume existing cells as inputs and create new cells as outputs. For a batch transfer, you're creating one output cell per recipient, all in the same transaction. CCC makes this straightforward:

```typescript
const outputs = await Promise.all(
  recipients.map(async r => {
    const { script: lock } = await ccc.Address.fromString(r.address, cccClient);
    return { lock, capacity: ccc.fixedPointFrom(r.amount) };
  }),
);

const tx = ccc.Transaction.from({ outputs, outputsData: recipients.map(() => '0x') });
await tx.completeInputsByCapacity(signer);
await tx.completeFeeBy(signer, 1000);
return signer.sendTransaction(tx);
```

`completeInputsByCapacity` handles UTXO selection automatically — it picks enough of the sender's cells to cover all outputs plus fees. Without CCC this would be maybe 60 lines of manual cell querying and sorting.

### The xUDT cell capacity problem

Token cells on CKB are more expensive than plain CKB cells because they carry extra data. A standard secp256k1 lock cell is 61 bytes. An xUDT token cell has:

- 8 bytes: the capacity field itself
- 53 bytes: lock script (secp256k1, 20-byte args)
- 65 bytes: type script (xUDT, 32-byte args)
- 16 bytes: token amount encoded as uint128

That's 142 bytes minimum = 142 CKB just to create the cell. I set `MIN_XUDT_CAPACITY` to 162 CKB to give headroom for recipients using different lock scripts with longer args (OmniLock, for example, has 42-byte args).

This is a CKB-specific UX consideration that doesn't exist on account-based chains. When you airdrop tokens to someone, you're also paying ~162 CKB per recipient to fund their storage cell. That needs to be clearly communicated in the UI.

### Reading xUDT balances

Token amounts are stored in the first 16 bytes of a cell's data field, encoded as a 128-bit little-endian unsigned integer. To read a wallet's token balance you iterate all of their cells filtered by the xUDT type script, decode each amount, and sum:

```typescript
for await (const cell of cccClient.findCells({
  script: addr.script,
  scriptType: 'lock',
  filter: { script: xudtType },
  scriptSearchMode: 'exact',
})) {
  if (cell.outputData && cell.outputData.length >= 34) {
    total += readUint128LE(cell.outputData);
  }
}
```

The `length >= 34` check is because the hex string includes the `0x` prefix (2 chars) plus 32 hex chars for 16 bytes. Cells with shorter data aren't valid xUDT cells.

### Handling the token change output

If the sender has 1000 tokens and wants to send 750, the transaction consumes their entire token cell(s) as input and needs to create two outputs: 750 to the recipients and 250 back to the sender. Forgetting the change output means the remaining 250 tokens are simply destroyed — burned.

```typescript
if (inputUdt > totalOut) {
  tx.outputs.push(ccc.CellOutput.from({ lock: senderLock, type: xudtType, capacity: MIN_XUDT_CAPACITY }));
  tx.outputsData.push(toHex(uint128LE(inputUdt - totalOut)));
}
```

This is the same pattern as Bitcoin's change output — a concept I understood in theory from Week 1 but only really internalised when I had to implement it.

### Network switching

The client is configured at startup via a `NETWORK` environment variable. Parcel bundles `process.env.NETWORK` at build time, so you can run:

```
NETWORK=testnet npm start   # testnet
NETWORK=devnet npm start    # local offckb node
npm start                   # defaults to testnet
```

The devnet client needs the system script addresses (`secp256k1`, `xUDT`, etc.) pointing at the local devnet deployment rather than the public ones. OffCKB publishes a `system-scripts.json` file with those addresses, which the client reads to configure itself.

## Practical Progress

### What's working

- `batchTransferCKB()` tested successfully — sent CKB to 3 recipients in one transaction
- `getTokenBalance()` reads xUDT balances correctly
- `batchTokenAirdrop()` logic written and TypeScript types clean

### What's next

- Build the React UI on top of these functions
- Test the token airdrop end-to-end on testnet with an actual xUDT token
- CSV import for pasting recipient lists

## Screenshots

[Screenshots stored in /screenshots/week-07/]

## Blockers / Questions

No blockers this week. The xUDT capacity requirement (162 CKB per recipient) is something I'll want to surface clearly in the UI so users aren't surprised.

## Plan for Next Week

- Build all UI components
- Test on testnet with real xUDT token from Week 4
- Add CSV import and receipt export
- Deploy to GitHub Pages or similar for the submission
