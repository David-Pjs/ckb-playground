# Week 4 - CKB Quest: Learn-to-Earn Game

**Name:** David Uhumagho
**Week Ending:** 2026-05-04
**Project:** CKB Quest

---

## Current Progress

- Shipped CKB Quest v1, a learn-to-earn game for CKB and Fiber beginners, live at https://ckb-quest.vercel.app
- 5 checkpoints, each requiring a real testnet action verified on-chain: wallet + faucet, transfer with change output, xUDT token issue, Fiber channel, Fiber payment
- 725 CKB total testnet rewards, paid automatically by a funded house wallet on checkpoint completion
- AI tutor (Groq, llama-3.3-70b) answers questions using all my builders-track reports as context

## Key Learnings

- CCC's findCells throws without scriptSearchMode: "prefix", despite docs implying it is optional
- Context stuffing beats fine-tuning for the AI tutor: free, instantly updatable, and the 128k context fits all my docs
- getRecommendedAddress() returns the full bech32m format; the short legacy format needs manual construction from the blake160 hash
- MetaMask works on CKB through CCC (EIP-6963), same secp256k1 key re-encoded for CKB addresses

## Pending

- Share with the CKB community and get real users through checkpoints 1-3
- Checkpoints 4-5 (Fiber) blocked on a live Fiber node, the same blocker as Fiber-402

---

## What I Built

Shipped the first version of CKB Quest: a learn-to-earn game for CKB and Fiber beginners, deployed to production at https://ckb-quest.vercel.app.

The core problem it solves: most CKB tutorials are either too abstract or too easy to cheat. CKB Quest forces real on-chain actions. Every checkpoint requires a valid testnet transaction hash, wallet address, or type script hash verified against the actual CKB testnet. An AI cannot generate those. You have to do the work.

## Architecture

- **Next.js 15 App Router** with TypeScript and Tailwind v4
- **@ckb-ccc/connector-react** for wallet connection (JoyID passkey and MetaMask both supported)
- **@ckb-ccc/core** for testnet verification: balance queries, transaction lookups, cell searches
- **Groq SDK** (llama-3.3-70b-versatile, 128k context) for AI explanations
- **House wallet** funded with testnet CKB, sends rewards automatically on checkpoint completion using ccc.SignerCkbPrivateKey

## The 5 Checkpoints

1. **Get On-Chain** - Connect wallet, claim from faucet, verify 100 CKB balance (50 CKB reward)
2. **Send CKB Correctly** - Send 100 CKB to quest address with a change output back to self (75 CKB reward)
3. **Issue a Token** - Deploy xUDT on testnet, issue 1,000+ units, submit type script hash (100 CKB reward)
4. **Fiber First Contact** - Run a Fiber node, open a channel with 100 CKB (200 CKB reward)
5. **Pay for Something Real** - Send a Fiber payment to the quest node, submit payment hash (300 CKB reward)

Total: 725 CKB in testnet rewards for completing the full path.

## AI Explanations: Context Stuffing over Fine-Tuning

The AI tutor uses context stuffing, not fine-tuning. All 12 weekly learning reports and 3 Fiber dev logs are loaded into the Groq system prompt at inference time. llama-3.3-70b-versatile has 128k context and all those docs fit comfortably inside it.

Fine-tuning was the wrong tool: it changes model behavior and style, not knowledge. It is also expensive, slow to iterate, and not available on Groq. Context stuffing is free, instantly updatable, and gives the model the exact text to reason from.

## Design Decisions

- Warm paper aesthetic (#f7f4ef background, #1a1916 ink). Rare in crypto, deliberately not vibecoded.
- Fraunces variable serif as display font (opsz, SOFT, WONK axes all active)
- Deep muted green (#16773d) and red (#b52319) for pass/fail. No neon.
- AI explanations appear as a margin note with a left border, not a modal or toast
- Every step has a Windows note (shown with a Windows icon in amber) because Windows users hit friction that discourages learning

## Deployment

- Deployed to Vercel at https://ckb-quest.vercel.app
- House wallet funded with 100,000 CKB from testnet faucet
- GROQ_API_KEY and HOUSE_PRIVATE_KEY set as Vercel environment variables (server-side only, never exposed to client)
- Connected address shows truncated with a one-click copy button

## Key Technical Learnings

**findCells requires scriptSearchMode**: The CCC client's findCells call throws a type error without `scriptSearchMode: "prefix"`. The field is not optional despite the docs implying otherwise.

**useCcc() hook shape**: The hook returns `signerInfo?.signer`, not a top-level `signer`. Easy to miss and TypeScript catches it at a confusing point.

**Groq lazy init**: Instantiating `new Groq()` at module load time throws if `GROQ_API_KEY` is not set, which breaks `next build`. Fix: wrap in a factory function called only inside the request handler.

**CKB address formats**: The CCC `getRecommendedAddress()` returns the full 2021 bech32m format. The testnet faucet accepts it but is sensitive to leading spaces. The short legacy format (bech32, ~46 chars) requires manual construction from the blake160 hash of the compressed public key.

**MetaMask on CKB**: CCC supports MetaMask through EIP-6963. The derived CKB address uses the same secp256k1 key as the Ethereum address, re-encoded for CKB's address format.

## What's Next

- Share with the CKB community on Nervos Talk
- Get real users through checkpoints 1-3 and fix what breaks
- Checkpoint 4/5 (Fiber) blocked on a live Fiber node. Unblocking this also unblocks Fiber-402. One node, two projects.
