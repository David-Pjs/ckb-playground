# CKB Airdrop Tool

**Live demo:** https://david-pjs.github.io/ckb-playground/

A browser-based dApp for distributing CKB and xUDT tokens to multiple addresses in a single on-chain transaction. Built on Nervos CKB using the CCC SDK.

---

## The Problem

If you're launching a project on CKB and want to reward 200 community members with tokens, you'd normally need to send 200 separate transactions — one per recipient. That's 200 fees, 200 manual steps, and realistically nobody does it. This tool collapses it all into one transaction.

---

## What It Does

Two modes:

**CKB Transfer** — send native CKB to a list of addresses simultaneously. Every recipient gets their funds in the same block.

**Token Airdrop** — distribute any xUDT token to multiple recipients at once. The app automatically funds each recipient's storage cell with the minimum required CKB (~162 CKB per recipient), so recipients don't need to hold any CKB beforehand to receive tokens.

---

## How to Use It

### Setup

1. Open https://david-pjs.github.io/ckb-playground/
2. Paste your testnet private key — your address and CKB balance load automatically
3. Your key never leaves the browser. All signing happens locally.

### CKB Transfer

1. Select **CKB Transfer** mode
2. Add recipient addresses and amounts (minimum 61 CKB each)
3. Review the summary — total recipients, total CKB, your balance
4. Click **Send**

### Token Airdrop

1. Select **Token Airdrop** mode
2. Paste your xUDT token args (the lock hash identifying your token)
3. Enter the token symbol and decimals
4. Your token balance appears
5. Add recipients and amounts
6. Click **Send** — the app handles cell capacity automatically

### CSV Import

For large recipient lists, use the **Import from CSV** panel:

```
# address,amount
ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvwg2cen8extgq8s5puft8vf40px3f599cytcyd8,100
ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvwg2cen8extgq8s5puft8vf40px3f599cytcyd8,250
```

Lines starting with `#` are ignored.

### After Sending

- Transaction hash is displayed on screen
- **View on Explorer** — inspect every output cell on the testnet block explorer
- **Export Receipt CSV** — download a record of the airdrop with the transaction hash attached

---

## Technical Details

### Stack

| | |
|---|---|
| Language | TypeScript |
| UI | React 18 |
| Blockchain SDK | CCC (Common Chain Connector) `@ckb-ccc/core` |
| Bundler | Parcel 2 |
| Network | Testnet (configurable via `NETWORK` env var) |

### How the token airdrop transaction works

For each recipient, the app creates an output cell with:
- **Lock script** — the recipient's address
- **Type script** — xUDT script with the token's args
- **Data** — token amount encoded as 16-byte little-endian uint128
- **Capacity** — 162 CKB minimum to cover cell storage

The sender's existing token cells are consumed as inputs. If the sender has more tokens than the total being sent, a change output is created back to the sender with the remainder. CCC handles input selection and fee calculation automatically.

### Why 162 CKB per recipient

CKB charges for on-chain storage by requiring each cell to hold at least 1 CKB per byte of space it occupies. A standard xUDT token cell is 142 bytes minimum:

```
8 bytes   capacity field
53 bytes  lock script  (secp256k1, 20-byte args)
65 bytes  type script  (xUDT, 32-byte args)
16 bytes  token amount (uint128 little-endian)
```

162 CKB gives headroom for recipients using lock scripts with longer args (OmniLock, for example).

### Network switching

The client reads a `NETWORK` environment variable at build time:

```bash
NETWORK=testnet npm start    # testnet (default)
NETWORK=devnet npm start     # local OffCKB node
NETWORK=mainnet npm run build
```

---

## Project Structure

```
ckb-airdrop/
  transfer.ts       Core transaction logic — batchTransferCKB, batchTokenAirdrop
  ccc-client.ts     CCC client with devnet/testnet/mainnet switching
  utils.ts          Pure utilities — CSV parsing, receipt export, formatting
  app.tsx           Root component and state management
  WalletPanel.tsx   Private key input, address display, CKB balance
  TokenPanel.tsx    xUDT args input, symbol/decimals, token balance
  RecipientTable.tsx  Editable recipient rows with validation
  CSVPanel.tsx      Collapsible CSV import
  TxPanel.tsx       Summary, validation, send button, tx result
  style.css         All styles
  index.html        Entry point
```

---

## Running Locally

```bash
cd projects/ckb-airdrop
npm install
npm start
```

Open http://localhost:1234

To build for production:

```bash
npm run build
```

Output goes to `dist/`.

---

## What's Next

This tool covers the distribution side. A natural extension would be a token issuance step — letting users mint a new xUDT token and immediately airdrop it in the same flow, without needing to know the token args in advance.
