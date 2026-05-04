# Week 4 - CKB Quest: Learn-to-Earn Game

**Week Ending:** 2026-05-04

---

## What I Built

Shipped the first version of CKB Quest: a learn-to-earn game for CKB and Fiber beginners.

The core problem it solves: most CKB tutorials are either too abstract or too easy to cheat. CKB Quest forces real on-chain actions. Every checkpoint requires a valid testnet transaction hash, wallet address, or type script hash that gets verified against the actual CKB testnet. Claude/Groq cannot generate those — you have to do the work.

## Architecture

- **Next.js 15 App Router** with TypeScript and Tailwind v4
- **@ckb-ccc/connector-react** for JoyID wallet integration (no seed phrase, device passkey auth)
- **@ckb-ccc/core** for testnet verification: balance queries, transaction lookups, cell searches
- **Groq SDK** (llama-3.3-70b-versatile, 128k context) for AI explanations
- **House wallet** funded with testnet CKB, sends rewards on checkpoint completion using ccc.SignerCkbPrivateKey

## The 5 Checkpoints

1. **Get On-Chain** — Connect JoyID, claim from faucet, verify 100 CKB balance (50 CKB reward)
2. **Send CKB Correctly** — Send 100 CKB to quest address with a change output back to self (75 CKB reward)
3. **Issue a Token** — Deploy xUDT on testnet, issue 1,000+ units, submit type script hash (100 CKB reward)
4. **Fiber First Contact** — Run a Fiber node, open a channel with 100 CKB (200 CKB reward)
5. **Pay for Something Real** — Send a Fiber payment to the quest node, submit payment hash (300 CKB reward)

Total: 725 CKB in testnet rewards for completing the full path.

## AI Explanations: Context Stuffing over Fine-Tuning

The AI tutor uses context stuffing, not fine-tuning. All 12 weekly learning reports and 3 Fiber dev logs are loaded into the Groq system prompt at inference time. llama-3.3-70b-versatile has 128k context and all those docs fit comfortably inside it.

Fine-tuning was the wrong tool: it changes model behavior/style, not knowledge. It is also expensive, slow to iterate, and not available on Groq. Context stuffing is free, instantly updatable (add a new dev log and the model knows about it on the next request), and gives the model the exact text to reason from rather than a vague memory of training examples.

## Design Decisions

- Warm paper aesthetic (#f7f4ef background, #1a1916 ink) — rare in crypto, deliberately not vibecoded
- Fraunces variable serif as display font (opsz, SOFT, WONK axes all active)
- Deep muted green (#16773d) and red (#b52319) for pass/fail — no neon
- AI explanations appear as a margin note with a left border, not as a modal or toast
- Every step has a Windows note field (shown with a Windows icon in amber) because Windows users hit unnecessary friction that discourages learning

## Key Technical Learnings

**findCells requires scriptSearchMode**: The CCC client's findCells call throws a type error without `scriptSearchMode: "prefix"` — the field is not optional despite the docs implying otherwise.

**useCcc() hook shape**: The hook returns `signerInfo?.signer`, not a top-level `signer`. Easy to miss and TypeScript catches it at a confusing point.

**Groq lazy init**: Instantiating `new Groq()` at module load time throws if `GROQ_API_KEY` is not set, which breaks `next build`. Solution: wrap in a factory function called only inside the request handler.

**Change output verification**: Checkpoint 2 checks both that 100 CKB was sent to the quest address AND that a change output back to the sender exists. This is the core lesson — most beginners lose CKB on their first transaction by forgetting the change cell.

## What's Next

- Deploy to Vercel and fund the house wallet
- Add GROQ_API_KEY and HOUSE_PRIVATE_KEY to Vercel environment variables
- Test the full checkpoint flow end-to-end on testnet
- Checkpoint 4/5 (Fiber) blocked on having a Fiber node to verify against — will unblock when Fiber-402 node is live
- Share with the CKB community on Nervos Talk
