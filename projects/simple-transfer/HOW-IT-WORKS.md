# How CKB Transfers Work - A Simple Guide

## Think of it Like Cash in Envelopes

Forget code for a moment. CKB works like **physical cash inside locked envelopes**.

**An envelope = a Cell**

Each envelope has:
- Some money inside (that's the **capacity** / CKB balance)
- A padlock on it that only YOUR key can open (that's the **Lock Script**)

**Your "balance"** is just counting up all the money in every envelope that has YOUR padlock on it.

Example - you have 3 envelopes:

```
Envelope A: 500 CKB  [your padlock]
Envelope B: 300 CKB  [your padlock]
Envelope C: 200 CKB  [your padlock]

Total balance: 1000 CKB
```

There is no "account" or "balance field" anywhere. Just envelopes with padlocks.

---

## How a Transfer Works

You want to send **62 CKB** to your friend.

You can't just "take 62 out of an envelope." That's not how it works. Instead:

1. You **destroy** one of your envelopes (say Envelope C with 200 CKB)
2. You **create 2 new envelopes**:
   - One with **62 CKB** locked with your **friend's padlock** (only they can open it now)
   - One with **~138 CKB** locked with **your padlock** (your change, like getting change back at a shop)

```
BEFORE:                              AFTER:

You: [200 CKB envelope]    --->     Friend: [62 CKB envelope]
                                    You:    [138 CKB envelope] (change)
```

That's literally all a CKB transaction is. **Destroy old envelopes, create new ones.**

The destroyed envelopes are called **inputs**.
The new envelopes are called **outputs**.

---

## The Padlock System (Lock Scripts)

Every envelope has a padlock. That padlock is called a **Lock Script**.

How the padlock is made:

```
Private Key  (your secret - never share this)
     |
     v
Public Key   (derived from private key using secp256k1 math)
     |
     v
Blake160 Hash (the public key gets hashed/shortened)
     |
     v
Lock Script  (the hash becomes the "args" of your Lock Script)
     |
     v
CKB Address  (the Lock Script encoded in human-readable form: ckt1q...)
```

Everyone using the standard CKB Lock Script uses the **same padlock mechanism** (secp256k1_blake160). The only difference between your padlock and someone else's is the **args** field - your unique hash.

A Lock Script looks like this:

```json
{
  "codeHash": "0x9bd7e06f...",   <-- which padlock code to run (same for everyone)
  "hashType": "type",            <-- how to find that code
  "args": "0x8e42b1999f..."      <-- YOUR unique hash (what makes it yours)
}
```

---

## Checking Your Balance

To check how much CKB you have:

1. Take your address and decode it back into a Lock Script
2. Search the entire blockchain for **every envelope (Cell)** with that Lock Script
3. Add up all their capacities

```
Your Lock Script found on:
  Cell #1:  500 CKB
  Cell #2:  300 CKB
  Cell #3:  200 CKB
  -------------------
  Total:   1000 CKB   <-- that's your balance
```

---

## Why is the Minimum Transfer 61 CKB?

Every envelope needs to be big enough to **fit the padlock inside it**.

A standard padlock (Lock Script) takes up 61 bytes of space. In CKB, 1 byte of storage = 1 CKB of capacity. So the smallest possible envelope is **61 CKB**.

If you try to create an envelope smaller than 61 CKB, it physically can't hold the padlock, so the network rejects it.

---

## The Unit System: CKB and Shannons

Just like Bitcoin has Satoshis, CKB has **Shannons**.

```
1 CKB = 100,000,000 Shannons (10^8)
```

The SDK works in Shannons internally. When you see `ccc.fixedPointFrom("62")`, it converts 62 CKB into 6,200,000,000 Shannons.

---

## What the Code Does (Plain English)

Here's every function in `lib.ts` explained:

### `generateAccountFromPrivateKey(privKey)`

> "Given a secret key, figure out the padlock and the address."

1. Takes your private key
2. Derives the public key
3. Builds your Lock Script (padlock)
4. Encodes it as a `ckt1...` address
5. Returns everything: Lock Script, address, and public key

### `capacityOf(address)`

> "Count all the money in every envelope with this padlock."

1. Decodes the address into a Lock Script
2. Searches the blockchain for all Cells with that Lock Script
3. Returns the total capacity (in Shannons)

### `transfer(toAddress, amountInCKB, signerPrivateKey)`

> "Destroy some of my envelopes, create new ones for the receiver."

Step by step:

1. **Set up the sender**: Create a signer from the private key
2. **Decode the receiver**: Turn their address into a Lock Script
3. **Create the output**: A new envelope with the receiver's padlock and the specified amount
4. **Find inputs**: The SDK picks which of your envelopes to destroy to cover the amount (`completeInputsByCapacity`)
5. **Calculate fee**: Take a tiny extra amount (~0.001 CKB) for the network (`completeFeeBy`)
6. **Sign and send**: Use your private key to prove you own the input envelopes, then broadcast to the network

### Visual walkthrough of a 62 CKB transfer:

```
INPUTS (envelopes you destroy):         OUTPUTS (new envelopes created):
+------------------------------+        +------------------------------+
| Your Cell: 100 CKB           |        | Receiver's Cell: 62 CKB     |
| Padlock: YOUR Lock Script    | -----> | Padlock: THEIR Lock Script   |
+------------------------------+        +------------------------------+
                                        | Your Cell: ~37.999 CKB       |
                                        | Padlock: YOUR Lock Script    |
                                        +------------------------------+
                                          (change back to you,
                                           minus ~0.001 CKB fee)
```

---

## How CKB Compares to Other Chains

| Concept | Ethereum (Bank) | CKB (Envelopes) |
|---------|----------------|-----------------|
| Where balance lives | Account with a number | Scattered across many Cells |
| How transfer works | Subtract from sender, add to receiver | Destroy old Cells, create new ones |
| State model | Account-based | UTXO-based (like Bitcoin, but more flexible) |
| Minimum transfer | Any amount | 61 CKB (envelope must fit the padlock) |
| Smart contracts | EVM bytecode | RISC-V scripts running in CKB-VM |

**Ethereum** = a bank. Everyone has an account with a balance. Send 62, your number goes down, their number goes up.

**CKB** = envelopes with padlocks. No accounts, no bank. Just envelopes being destroyed and created. More like handing physical cash to someone.

---

## Key Takeaways

1. **Cells are envelopes** - they hold CKB and have a Lock Script (padlock)
2. **Your balance = sum of all your Cells** - there's no single "balance" field
3. **Transfers destroy and create** - old Cells consumed, new Cells produced
4. **Lock Scripts = ownership** - whoever's Lock Script is on the Cell owns it
5. **61 CKB minimum** - every Cell must be big enough to store its Lock Script
6. **Shannons** - the smallest unit, like Satoshis in Bitcoin (1 CKB = 10^8 Shannons)
