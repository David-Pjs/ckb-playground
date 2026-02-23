# CKB Airdrop Tool

**Live demo:** https://david-pjs.github.io/ckb-playground/

Built this as my Week 7-8 project for the CKB Builders Track. The idea came from a real gap I noticed — if you issue a token on CKB and want to distribute it to a list of people, there's no easy tool for that. You'd be doing it one transaction at a time.

---

## What it does

Two things:

**CKB Transfer** — send CKB to multiple addresses in one transaction. Useful if you're paying out contributors or distributing rewards and don't want to do it manually 50 times.

**Token Airdrop** — the main one. Send any xUDT token to a recipient list all at once. The thing that makes this more interesting than it sounds on CKB is the cell capacity problem — every token recipient needs a storage cell funded with ~162 CKB minimum, not just the tokens themselves. The app handles that automatically so you don't have to think about it.

I built this on top of what I'd already learned in Weeks 3-5 (transfers, xUDT tokens) and used CCC to handle the transaction construction.

---

## Using it

Open the live demo, paste a testnet private key (your key never leaves the browser — signing is local), and your wallet loads. Pick your mode, add recipients, send.

For token airdrop you'll need the xUDT args of the token you want to distribute — that's the lock hash from the type script of the issuing cell. If you issued a token in Week 4 you'll have it.

**CSV import** — if you have a long list, use the Import from CSV panel and paste in this format:

```
# lines starting with # are skipped
ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvwg2cen8extgq8s5puft8vf40px3f599cytcyd8,100
ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvwg2cen8extgq8s5puft8vf40px3f599cytcyd8,250
```

After sending you get a transaction hash, a link to the testnet explorer, and an option to export a receipt CSV.

---

## The cell capacity thing

This is worth explaining because it caught me off guard at first.

On CKB, storage isn't free — every cell has to lock up 1 CKB per byte it occupies as a deposit. A standard xUDT token cell works out to 142 bytes minimum:

```
8 bytes   capacity field itself
53 bytes  lock script (secp256k1, 20-byte args)
65 bytes  type script (xUDT, 32-byte args)
16 bytes  token amount (uint128 little-endian)
```

So each recipient needs at least 142 CKB sitting in their token cell just to make it exist — on top of whatever tokens you're sending them. I set the minimum to 162 CKB to give headroom for recipients using different lock scripts with longer args.

This means when you do a token airdrop to 10 people, you need 10 × 162 = 1,620 CKB available in your wallet in addition to the tokens. The app warns you about this before you send.

---

## How the transaction is built

For each recipient the app creates an output cell with their lock script, the xUDT type script, and their token amount encoded as a 16-byte little-endian uint128 in the data field. The sender's existing token cells get consumed as inputs. If there's leftover tokens after all recipients are covered, a change output goes back to the sender.

CCC handles input selection and fee calculation. Without it this would be about 60 extra lines of manual UTXO selection code.

---

## Running locally

```bash
cd projects/ckb-airdrop
npm install
npm start
```

Runs on http://localhost:1234, defaults to testnet. To target devnet (local OffCKB node):

```bash
NETWORK=devnet npm start
```

---

## Stack

TypeScript, React 18, CCC (`@ckb-ccc/core`), Parcel 2. Tested on testnet.

---

## What I'd add next

The obvious next step is a token issuance flow — let users mint a new xUDT token and immediately airdrop it in the same session without having to know the token args in advance. Right now you need to have already issued the token separately.
