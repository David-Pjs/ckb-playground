# Week 3 - Transfer CKB Tutorial

**Name:** David
**Week Ending:** 2026-02-04

---

## Courses / Material Completed

- [x] Read the [Transfer CKB](https://docs.nervos.org/docs/dapp/transfer-ckb) tutorial end-to-end
- [x] Cloned and studied the [simple-transfer example](https://github.com/nervosnetwork/docs.nervos.org/tree/develop/examples/dApp/simple-transfer)
- [x] Reviewed CCC SDK docs for `SignerCkbPrivateKey`, `Transaction.from`, and `fixedPointFrom`
- [x] Tested the dApp on Codespaces using OffCKB devnet

## Key Learnings

### How CKB Transfers Actually Work

Transferring CKB is fundamentally different from account-based chains like Ethereum. There's no "balance field" that gets decremented and incremented. Instead, a transfer means **consuming input Cells** owned by the sender and **producing new output Cells** whose Lock Script points to the receiver. The total capacity of the consumed Cells is the amount being sent.

This clicked for me when looking at `lib.ts` - the `transfer()` function builds a transaction with a single output Cell locked to the receiver's address, then calls `completeInputsByCapacity(signer)` to automatically gather enough of the sender's Cells to cover the amount. The SDK handles the UTXO selection behind the scenes, which is convenient.

### CCC SDK Abstractions

The CCC SDK does a lot of heavy lifting. A few things I noticed:

- **`ccc.SignerCkbPrivateKey`** wraps a raw private key and gives you signing + address derivation. Under the hood it uses the standard secp256k1_blake160 Lock Script from Week 2.
- **`ccc.Transaction.from`** lets you declaratively describe outputs and then "complete" the transaction incrementally - first fill in inputs (`completeInputsByCapacity`), then calculate and fill in the fee (`completeFeeBy`).
- **`ccc.fixedPointFrom`** converts a human-readable CKB amount (like `"62"`) into Shannons (the smallest unit, 1 CKB = 10^8 Shannons). This is like Satoshis in Bitcoin.
- **`signer.sendTransaction(tx)`** signs the transaction with the private key and broadcasts it to the network in one call.

### The 61 CKB Minimum

One detail from the tutorial UI: you can't transfer less than 61 CKB. This is because every Cell must have enough capacity to store its own data (at minimum, the Lock Script). A basic Cell with a secp256k1_blake160 Lock Script needs at least 61 bytes, and since 1 byte of capacity = 1 CKB, the minimum is 61 CKB. This is a direct consequence of the Cell model - capacity represents both balance AND storage space.

### Network Configuration

The `ccc-client.ts` file shows how the app switches between devnet, testnet, and mainnet. For devnet, it connects to `http://localhost:28114` (the OffCKB proxy RPC) and loads system script definitions from a local JSON file. For testnet/mainnet, it uses CCC's built-in public clients. The network is set via the `NETWORK` environment variable.

## Practical Progress

- Cloned the simple-transfer project into `projects/simple-transfer/`
- Reviewed all source files: `lib.ts`, `ccc-client.ts`, `index.tsx`, `package.json`
- Set up on Codespaces with OffCKB devnet
- Ran `offckb node` to start the local devnet
- Ran `offckb accounts` to get the pre-funded test account private keys
- Ran `npm install && NETWORK=devnet npm start` to launch the dApp
- Successfully loaded the app at `http://localhost:1234`
- Transferred 62 CKB from Account #1 to Account #2 using the default pre-filled values
- Confirmed balance updated after ~10 seconds (the app waits for tx confirmation)

### How to Run (Codespaces)

```bash
# Terminal 1: Start devnet
offckb node

# Terminal 2: Get test account keys
offckb accounts

# Terminal 3: Run the dApp
cd projects/simple-transfer
npm install
NETWORK=devnet npm start
```

App runs at `http://localhost:1234`. Use the forwarded port in Codespaces to access it in browser.

## Screenshots

[Screenshots stored in /screenshots/week-03/]

## Blockers / Questions

- No major blockers this week - the tutorial worked as documented
- The 10-second `wait()` for transaction confirmation is a bit hacky. The tutorial mentions using `get_transaction` RPC for proper confirmation polling - want to explore that
- Curious how `completeInputsByCapacity` selects which Cells to consume when an account has many Cells (UTXO selection strategy)

## Plan for Next Week

- Complete the **Store Data on Cell** tutorial
- Start exploring how Type Scripts work in practice (for the token tutorials)
- Take screenshots of all completed exercises
- Continue reading CCC SDK source code to understand the transaction building helpers better
