# Week 3 - Transfer CKB & Store Data on Cell

**Name:** David
**Week Ending:** 2026-02-04

---

## Courses / Material Completed

- [x] Read the [Transfer CKB](https://docs.nervos.org/docs/dapp/transfer-ckb) tutorial end-to-end
- [x] Cloned and studied the [simple-transfer example](https://github.com/nervosnetwork/docs.nervos.org/tree/develop/examples/dApp/simple-transfer)
- [x] Reviewed CCC SDK docs for `SignerCkbPrivateKey`, `Transaction.from`, and `fixedPointFrom`
- [x] Tested the dApp on Codespaces using OffCKB devnet
- [x] Read the [Store Data on Cell](https://docs.nervos.org/docs/dapp/store-data-on-cell) tutorial end-to-end
- [x] Cloned and studied the [store-data-on-cell example](https://github.com/nervosnetwork/docs.nervos.org/tree/develop/examples/dApp/store-data-on-cell)
- [x] Test storing and reading messages on testnet

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

### Store Data on Cell - How It Works

The second tutorial builds directly on the first. A Cell isn't just for holding CKB - it has a **data field** that can store anything. The tutorial writes "Hello CKB!" into a Cell and reads it back.

The key insight: you need to **encode** text into hex format before storing it (computers don't store plain English on-chain). The `utf8ToHex` function converts "Hello CKB!" into `0x48656c6c6f20434b4221`, and `hexToUtf8` converts it back.

The transaction structure is almost identical to the transfer tutorial, with two differences:
- The output Cell is locked to **your own** address (you're not sending to someone else)
- The `outputsData` array contains your **hex-encoded message** instead of being empty

To read the message later, you use an **OutPoint** (txHash + output index) to locate the exact Cell, then decode its data field back to text.

One important detail: storing data costs more CKB. Each byte of data = 1 CKB of capacity. So a Cell holding a 28-byte message needs roughly 61 + 28 = 89 CKB minimum (61 for the Lock Script overhead, 28 for the data).

## Practical Progress (Store Data)

- Cloned the store-data-on-cell project into `projects/store-data-on-cell/`
- Reviewed `lib.ts` - understood `utf8ToHex`, `hexToUtf8`, `buildMessageTx`, and `readOnChainMessage`
- Ran the app on testnet (`NETWORK=testnet npm start`)
- Wrote message `"hello common knowledge base!"` on-chain
- Tx hash: `0x91e34dae8e30934ea0cd89a1696bc2ef52db34d5020dd1b70b00b4cbf0c6f82a`
- Read the message back successfully - confirmed it returned `"hello common knowledge base!"`

### How to Run (Codespaces)

```bash
cd projects/store-data-on-cell
npm install
NETWORK=testnet npm start
```

## Blockers / Questions

- No major blockers this week - both tutorials worked
- The 10-second `wait()` for transaction confirmation in the transfer app is a bit hacky. The tutorial mentions using `get_transaction` RPC for proper confirmation polling - want to explore that
- Curious how `completeInputsByCapacity` selects which Cells to consume when an account has many Cells (UTXO selection strategy)
- Wondering what happens when a Cell holding data gets consumed - the data is preserved in transaction history but the Cell becomes "dead"

## Plan for Next Week

- Complete the **Create Fungible Token (xUDT)** tutorial
- Complete the **Create DOB** tutorial
- Start exploring how Type Scripts work in practice
- Take screenshots of all completed exercises
