# Week 8 - Building the Airdrop App (Part 2)

**Name:** David
**Week Ending:** 2026-03-27

---

## Courses / Material Completed

- [x] Built full React UI across 6 components
- [x] CSV import — paste a spreadsheet, table populates
- [x] Receipt export — download a CSV record of the airdrop after sending
- [x] Tested CKB batch transfer on testnet (confirmed on explorer)
- [x] Tested xUDT token airdrop on testnet (used token issued in Week 4)
- [x] Production build and cleanup

## Key Learnings

### UI structure

The app ended up with five sections stacked vertically:

1. **Wallet panel** — private key input, resolved address, CKB balance
2. **Token panel** — only shows in token mode — xUDT args, symbol, decimals, token balance
3. **Recipient table** — editable rows, add/remove buttons
4. **CSV panel** — collapsible, paste a CSV to bulk-load recipients
5. **Send panel** — summary stats, validation warnings, send button, tx result

That ordering was deliberate. You configure your wallet first (who's paying), then what you're sending, then who you're sending to, then you review and fire. It mirrors the mental model of actually doing a transfer.

### Controlled inputs for crypto addresses

Wallet address inputs in crypto apps are awkward. You don't want to let partial/invalid state propagate through the app and trigger blockchain calls with garbage data. The private key field only calls the parent's `onChange` if the value is empty or a valid 64-byte hex string — anything in between is held locally:

```typescript
const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value.trim();
  if (val === '' || PRIV_KEY_RE.test(val)) onChange(val);
};
```

In practice this means you paste a full key, not type it character by character. That's fine — nobody types a private key.

### Validation before letting the user hit Send

The send button needs to be disabled in a few specific cases:

- No valid recipients (empty addresses or zero amounts)
- CKB amounts below the 61 CKB cell minimum
- Total exceeds the sender's balance
- Transaction already in flight

I also added a persistent info banner in token mode warning that each recipient costs ~162 CKB in addition to the tokens. This one is easy to miss and would cause confusing failures if the sender doesn't have enough CKB to fund the cells.

### Testing on testnet

Testing a multi-recipient transaction requires testnet funds, so I grabbed CKB from the faucet and used the xUDT token I'd issued in Week 4 (DAVID token, 1,000,000 supply).

Test cases run:

**CKB batch transfer:**
- Sent 61 CKB to 2 different testnet addresses
- Transaction confirmed, both outputs visible on explorer with correct capacity

**Token airdrop:**
- Sent 100 DAVID tokens to 2 recipients
- Each output cell had the xUDT type script with the correct args
- Data field decoded correctly to the expected amounts
- Sender's token cell had the correct change amount (original balance minus what was sent)

The change output was the thing I was most uncertain about. Seeing it appear correctly in the explorer with the right uint128 value was satisfying.

**CSV import:**
- Pasted 5 lines of `address,amount`
- All 5 rows imported cleanly into the table
- Invalid rows (bad amounts, comment lines starting with `#`) skipped silently

### What the receipt export does

After a successful send, there's a button to download a CSV file with the transaction hash and a record of who received what. Looks like:

```
# CKB Airdrop Receipt
# Transaction: 0x3a4b...
# Exported: 2026-03-25T14:23:00.000Z
address,amount,token
ckt1qz...,100,DAVID
ckt1qz...,250,DAVID
```

For a real airdrop with hundreds of recipients you'd want this for your records. It's a minor feature but the kind of thing that makes the tool actually usable rather than just a tech demo.

### Build size

```
dist/ckb-airdrop.721fafc6.js    644 KB
dist/ckb-airdrop.33833ca4.css     9 KB
dist/index.html                    436 B
```

Most of that 644KB is `@ckb-ccc/core`. The application code itself is small. No complaints — this is a dev tool, not a consumer app where bundle size matters much.

## Practical Progress

### The app — what it does

A browser-based dApp that lets a single sender distribute CKB or xUDT tokens to multiple recipients in one on-chain transaction. Two modes:

- **CKB transfer**: send native CKB to a list of addresses (min 61 CKB each)
- **Token airdrop**: distribute xUDT tokens with automatic cell capacity funding

Recipients can be added manually or imported from CSV. After sending, the transaction hash is displayed with a direct link to the testnet explorer and an option to export a receipt.

### What I'd do differently

The token balance refresh after sending has an 8-second `sleep()` before it re-queries — just waiting for the transaction to be committed. A better approach would be to poll the node for transaction status rather than sleeping blind. For a dev tool it's fine, but it'd be the first thing to fix for a production version.

## Screenshots

[Screenshots stored in /screenshots/week-08/]

## Blockers / Questions

No blockers. The tool is working end-to-end on testnet.

## Plan for Next Week

- Week 9: Nervos DAO — deposit and withdrawal flow
