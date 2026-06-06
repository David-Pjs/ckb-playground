# David Uhumagho Building on CKB

Building payment infrastructure and applications on Nervos CKB. This repo is where the work lives.

---

## Active Projects

### [Fiber-402](./fiber-402/)
HTTP 402 payment middleware powered by CKB Fiber micropayments. Pay-per-request infrastructure for AI agents and API services a real-money toll gate, not a demo.

**Status:** Building need a live Fiber node connected to replace mock fallback  
**Stack:** Node.js, x402 protocol, Fiber RPC, CKB

### [CKB Quest](./ckb-quest/)
Learn-to-earn game for CKB and Fiber beginners. 9 checkpoints, each requiring a real on-chain action verified against testnet, ending with The Quester: a pixel identity you mint as a Spore so your own bytes live on-chain. Complete them all and earn testnet CKB.

**Status:** Live on testnet, 9 checkpoints (Checkpoints 4 and 5 await a live Fiber node)  
**Stack:** Next.js 15, TypeScript, @ckb-ccc, @ckb-ccc/spore, JoyID, Groq (llama-3.3-70b)

---

## Dev Log

Build updates, blockers, and what's next.

| Date | Entry |
|------|-------|
| 2026-06-05 | [Week 7 Permanent documents on CKB: the certificate concept and its architecture](./dev-logs/week-07.md) |
| 2026-05-29 | [Week 6 CKB Quest Phase 3: The Quester, an on-chain identity](./dev-logs/week-06.md) |
| 2026-05-15 | [Week 5 CKB Quest Phase 2: DAO, Spore, RGB++](./dev-logs/week-05.md) |
| 2026-05-04 | [Week 4 CKB Quest: learn-to-earn game shipped](./dev-logs/week-04.md) |
| 2026-04-13 | [Week 3 Audited codebase, identified the exact blocker](./dev-logs/week-03.md) |
| 2026-04-06 | [Week 2 Researched reference architecture (Pocket Network)](./dev-logs/week-02.md) |
| 2026-03-30 | [Week 1 First attempt at running a Fiber node](./dev-logs/week-01.md) |

New entries go in [`dev-logs/`](./dev-logs/) using [`TEMPLATE.md`](./dev-logs/TEMPLATE.md).

---

## Screenshots

Project screenshots live in [`screenshots/`](./screenshots/), organised by project folder.

---

## Repo Structure

```
ckb-playground/
  ckb-quest/          CKB Quest learn-to-earn game
  fiber-402/          Fiber-402 project code
  dev-logs/           Weekly build logs
  screenshots/        Screenshots by project
  projects/           Earlier CKB work (builders track, 2026)
  weekly-reports/     CKB builders track reports (archive)
```

---

<details>
<summary>CKB Builders Track completed Jan–Mar 2026</summary>

12-week programme on Nervos CKB. Covered the Cell model, Scripts, CKB-VM, xUDT tokens, Spore Protocol, Nervos DAO, RGB++ Protocol, and shipped a token airdrop app on testnet. Weekly reports in [`weekly-reports/`](./weekly-reports/).

</details>
