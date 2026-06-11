# David Uhumagho Building on CKB

Building payment infrastructure and applications on Nervos CKB. This repo is where the work lives. (Learning and Building in Public)

---

## Weekly Reports

Every week gets a report: what shipped, key learnings, what is pending.

- [Week 1 - First attempt at running a Fiber node](./weekly-reports/week-01.md)
- [Week 2 - Researched reference architecture (Pocket Network)](./weekly-reports/week-02.md)
- [Week 3 - Audited codebase, identified the exact blocker](./weekly-reports/week-03.md)
- [Week 4 - CKB Quest: learn-to-earn game shipped](./weekly-reports/week-04.md)
- [Week 5 - CKB Quest Phase 2: DAO, Spore, RGB++](./weekly-reports/week-05.md)
- [Week 6 - CKB Quest Phase 3: The Quester, an on-chain identity](./weekly-reports/week-06.md)
- [Week 7 - Documents you can prove on CKB: shipping ckb-verification](./weekly-reports/week-07.md)

New entries follow [`weekly-reports/TEMPLATE.md`](./weekly-reports/TEMPLATE.md).

---

## Active Projects

### Fiber-402
HTTP 402 payment middleware powered by CKB Fiber micropayments. Pay-per-request infrastructure for AI agents and API services a real-money toll gate, not a demo.

**Status:** Building need a live Fiber node connected to replace mock fallback (code local, not published yet)  
**Stack:** Node.js, x402 protocol, Fiber RPC, CKB

### [CKB Quest](./ckb-quest/)
Learn-to-earn game for CKB and Fiber beginners. 9 checkpoints, each requiring a real on-chain action verified against testnet, ending with The Quester: a pixel identity you mint as a Spore so your own bytes live on-chain. Complete them all and earn testnet CKB.

**Status:** Live on testnet, 9 checkpoints (Checkpoints 4 and 5 await a live Fiber node)  
**Stack:** Next.js 15, TypeScript, @ckb-ccc, @ckb-ccc/spore, JoyID, Groq (llama-3.3-70b)

### [CKB Verification](./ckb-verification/)
Write a whole document onto CKB by splitting it across many cells (a manifest cell plus one cell per chunk), encrypted client side and sealed with a content hash. Read any document back from its transaction and prove every byte. The foundation for verifiable certificates: one cell cannot hold a book, so the book is made of cells.

**Status:** Engine and app built, builds clean, runs on testnet (live signed write and Vercel deploy next). MarkItDown and issuer-signature trust anchor planned.  
**Stack:** Next.js 15, TypeScript, Tailwind, @ckb-ccc, WebCrypto, JoyID and MetaMask

---

## Screenshots

Project screenshots live in [`screenshots/`](./screenshots/), organised by week.

---

## Repo Structure

```
ckb-playground/
  ckb-quest/          CKB Quest learn-to-earn game
  ckb-verification/   On-chain document storage and verification
  weekly-reports/     Weekly reports (current series)
    archive-builders-track/   CKB builders track reports, Jan-Mar 2026
  screenshots/        Screenshots by week
  projects/           Earlier CKB work (builders track, 2026)
```

---

<details>
<summary>CKB Builders Track completed Jan-Mar 2026</summary>

12-week programme on Nervos CKB. Covered the Cell model, Scripts, CKB-VM, xUDT tokens, Spore Protocol, Nervos DAO, RGB++ Protocol, and shipped a token airdrop app on testnet. Weekly reports in [`weekly-reports/archive-builders-track/`](./weekly-reports/archive-builders-track/).

</details>
