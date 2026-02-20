# How Storing Data on a Cell Works - A Simple Guide

## Quick Recap: What's a Cell?

Remember from the Transfer tutorial - a Cell is like an **envelope with a padlock**.

But here's the thing we skipped over: the envelope isn't just for holding money. It also has **a piece of paper inside where you can write stuff**.

```
+----------------------------------+
|  ENVELOPE (Cell)                 |
|                                  |
|  Money: 100 CKB (capacity)      |
|  Padlock: your Lock Script      |
|  Note inside: [any data you want]  <--- THIS is new
|                                  |
+----------------------------------+
```

That "note inside" is the **data field**. In the Transfer tutorial, we left it empty. Now we're going to write on it.

---

## What This Tutorial Does

It's dead simple:

1. **Write**: Take a message like "Hello CKB!", stuff it into the data field of a new Cell, and save it to the blockchain
2. **Read**: Find that Cell later, pull out the data, and read the message back

That's it. Think of it as writing a note, putting it in a bottle (Cell), and tossing it into the ocean (blockchain). Later you fish out the bottle and read the note.

---

## The Problem: Computers Don't Speak English

Blockchain stores everything as **hex** (numbers in base-16). So "Hello CKB!" can't be stored directly. We need to convert it first.

### Writing (encoding): Text -> Hex

```
"Hello CKB!"
     |
     v  (TextEncoder converts each letter to a number)
[72, 101, 108, 108, 111, 32, 67, 75, 66, 33]
     |
     v  (convert each number to hex)
"0x48656c6c6f20434b4221"
```

That hex string `0x48656c6c6f20434b4221` is what actually gets stored in the Cell.

### Reading (decoding): Hex -> Text

```
"0x48656c6c6f20434b4221"
     |
     v  (split into pairs: 48, 65, 6c, 6c, 6f, 20, 43, 4b, 42, 21)
     v  (convert each pair back to a number)
[72, 101, 108, 108, 111, 32, 67, 75, 66, 33]
     |
     v  (TextDecoder converts numbers back to letters)
"Hello CKB!"
```

The two functions that do this in `lib.ts`:

| Function | What it does | Example |
|----------|-------------|---------|
| `utf8ToHex("Hello CKB!")` | Text -> Hex | Returns `"0x48656c6c6f20434b4221"` |
| `hexToUtf8("0x48656c6c6f20434b4221")` | Hex -> Text | Returns `"Hello CKB!"` |

---

## How the Write Works (buildMessageTx)

Using our envelope analogy:

### Step 1: Convert the message to hex

```typescript
const onChainMemoHex = utf8ToHex(onChainMemo);
// "hello common knowledge base!" becomes "0x68656c6c6f20636f6d6d6f6e..."
```

### Step 2: Create a new envelope with the note inside

```typescript
const tx = ccc.Transaction.from({
  outputs: [{ lock: signerAddress.script }],   // your padlock
  outputsData: [onChainMemoHex],               // the note inside
});
```

This is almost identical to the Transfer tutorial, with ONE key difference:

| | Transfer Tutorial | Store Data Tutorial |
|--|------------------|---------------------|
| `outputs` | Receiver's Lock Script | **Your own** Lock Script |
| `outputsData` | Empty `[]` | **Your message in hex** |

Notice: the output Cell is locked with **your own** Lock Script. You're not sending money to someone else - you're creating a Cell for yourself that contains data.

### Step 3: Same as before - complete and send

```typescript
await tx.completeInputsByCapacity(signer);  // pick which Cells to consume
await tx.completeFeeBy(signer, 1000);       // add the fee
const txHash = await signer.sendTransaction(tx);  // sign and send
```

### Visual walkthrough:

```
BEFORE:                              AFTER:
+---------------------------+        +----------------------------------+
| Your Cell: 200 CKB        |        | New Cell: ~61 CKB                |
| Padlock: YOUR Lock Script  | -----> | Padlock: YOUR Lock Script        |
| Data: (empty)              |        | Data: "0x48656c6c6f20434b4221"  |
+---------------------------+        |       (= "Hello CKB!")           |
                                     +----------------------------------+
                                     | Change Cell: ~139 CKB            |
                                     | Padlock: YOUR Lock Script        |
                                     | Data: (empty)                    |
                                     +----------------------------------+
```

Your old Cell gets destroyed. Two new Cells are created:
- One with your message in the data field
- One with your leftover CKB (change)

**Important**: The Cell with data needs MORE capacity than an empty one. Why? Because capacity = storage space. More data = more CKB needed to hold it. The message "Hello CKB!" is 10 bytes, so the Cell needs 61 + 10 = at least 71 CKB.

---

## How the Read Works (readOnChainMessage)

After writing, you get back a **transaction hash** (txHash) - it's like a receipt number.

To find your note later, you need two things:
- **txHash**: Which transaction created the Cell
- **index**: Which output Cell in that transaction (first one = `"0x0"`)

Together, these form an **OutPoint** - the exact address of your Cell on the blockchain.

```typescript
const cell = await cccClient.getCellLive({ txHash, index }, true);
```

This asks the blockchain: "Give me the Cell at this location."

Then you just read the data and decode it:

```typescript
const data = cell.outputData;           // "0x48656c6c6f20434b4221"
const msg = hexToUtf8(data);            // "Hello CKB!"
```

### Think of it like a filing system:

```
Transaction: 0xabc123...
  ├── Output[0]: Cell with your message   <-- OutPoint = {txHash: 0xabc123, index: 0x0}
  └── Output[1]: Change Cell (leftover)   <-- OutPoint = {txHash: 0xabc123, index: 0x1}
```

The OutPoint is like a file path: "in transaction abc123, the first output Cell."

---

## What Happens If the Cell Gets Consumed?

If someone (or you) later spends that Cell in another transaction, the data is NOT lost. The Cell becomes a "Dead Cell" - it's no longer active on the blockchain, but the data still exists in the transaction history. You just can't fetch it with `getCellLive` anymore (that only finds Live Cells).

This is important: **the blockchain never forgets**. Even consumed Cells leave a permanent record.

---

## Capacity vs Data: The Storage Rule

Remember: **1 byte of data = 1 CKB of capacity**

A Cell's total capacity must cover:
- Lock Script (~61 bytes for standard secp256k1_blake160)
- Type Script (if any)
- Data field (your message)
- The 8-byte capacity field itself

So if your message is 28 bytes ("hello common knowledge base!"), you need roughly:
```
61 (Lock Script) + 28 (your message) + 8 (capacity field) = ~97 CKB minimum
```

Longer messages cost more CKB. Not because of fees, but because the Cell needs to be big enough to hold the data.

---

## Comparison: Transfer vs Store Data

| Aspect | Transfer CKB | Store Data |
|--------|-------------|------------|
| Purpose | Send CKB to someone | Write data to the blockchain |
| Output Lock Script | Receiver's | Your own |
| Output Data | Empty | Your encoded message |
| Min Cell size | ~61 CKB | ~61 CKB + data size |
| What you learn | How Cells change ownership | How Cells store arbitrary data |

---

## Key Takeaways

1. **Every Cell has a data field** - it can hold anything: text, images, code, whatever
2. **You need to encode/decode** - blockchain stores raw hex bytes, so convert text to hex and back
3. **Data costs capacity** - 1 byte of data = 1 CKB. Bigger messages need bigger Cells
4. **OutPoint = Cell address** - a txHash + output index locates any Cell on the blockchain
5. **Data is permanent** - even if the Cell is consumed later, the data lives forever in the transaction history
