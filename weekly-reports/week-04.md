# Week 4 - Tokens & Digital Objects

**Name:** David
**Week Ending:** 2026-02-27

---

## Courses / Material Completed

- [x] Read the [Create Fungible Token (xUDT)](https://docs.nervos.org/docs/dapp/create-token) tutorial end-to-end
- [x] Cloned and studied the xUDT example
- [x] Reviewed `lib.ts` - understood `issueToken`, `queryIssuedTokenCells`, `transferTokenToAddress`
- [x] Tested fungible token creation on testnet
- [ ] Read the [Create DOB (digital object)](https://docs.nervos.org/docs/dapp/create-dob) tutorial end-to-end
- [ ] Tested DOB creation on testnet

## Key Learnings

### How CKB Tokens Work (xUDT)

On Ethereum, a token is a smart contract that keeps a ledger of balances inside its storage. On CKB, there is no such thing as a contract with internal state. Instead, a token is just a **Cell** with a special Type Script attached to it.

The xUDT (extensible User Defined Token) Type Script is a pre-deployed script on CKB that enforces the rules of fungible tokens. Any Cell that uses xUDT as its Type Script is considered a token cell.

The token amount is stored in the Cell's **data field** as a 16-byte little-endian number. So if you issue 42 tokens, the data field contains `42` encoded in bytes - not text, but raw binary.

### The Token ID

The unique identifier for a token (equivalent to an ERC20 contract address) is called the **xUDT args**. It is constructed as:

```
xUDT args = issuer's Lock Script Hash + "00000000"
```

The `00000000` at the end is the issuance index (allows the same wallet to issue multiple different tokens). This means only the person with the matching private key can ever issue more of this token - no one else's Lock Script hash matches.

### What a Token Cell Looks Like

A token cell has three important parts:
- **Lock Script** - who owns these tokens (can be transferred to anyone)
- **Type Script** - the xUDT script with your token ID as args (proves it's your token)
- **Data** - the token amount in bytes

The Cell also needs **capacity** (CKB) to exist on-chain. A basic token cell costs 146 CKB because that's how much space the Lock Script + Type Script + data field takes up.

### Difference from Ethereum ERC20

| | Ethereum ERC20 | CKB xUDT |
|--|---------------|----------|
| Token state | Stored inside contract | Stored in Cell data field |
| Ownership | Mapping inside contract | Cell's Lock Script |
| Transfer | Contract function call | New transaction consuming old cell, creating new one |
| Token ID | Contract address | Issuer's Lock Script hash |

## Practical Progress

- Cloned xUDT example into `projects/xudt/`
- Ran `NETWORK=testnet npm start`
- Issued 42 tokens on testnet
- Tx hash: `0x1487f1b4eb85532d936c0482d1c29083e487b91983f6b8b8b53d371861422b9b`
- Token xUDT args: `0x7de82d61a7eb2ec82b0dc653e558ba120efcbfbb44dac87c12972d05bf25065300000000`
- Token cell capacity: 146 CKB

## Screenshots

[Screenshots stored in /screenshots/week-04/]

## Blockers / Questions

- The query step (Step 2) had a UI bug where the xUDT args input showed "Invalid bytes" regardless of input format - likely a line-break in the displayed value causing copy-paste issues
- DOB tutorial still to complete

## Plan for Next Week

- Complete **Create DOB** tutorial
- Complete **Build a Simple Lock** tutorial
- Start exploring CCC (Common Chain Connector)
