# Week 16 - CKB Quest gets a front door, and stops being two projects

**Name:** David Uhumagho
**Week Ending:** 2026-08-08
**Project:** CKB Quest (learn-to-earn on CKB/Fiber)

---

## Current Progress

- Stopped Checkpoint 4/5 verification hanging forever against a slow or unreachable Fiber node. The verify call now gives up instead of leaving the user staring at a spinner with no way to tell whether the node is slow or their answer was wrong
- Built a landing page for CKB Quest: a hero that promises "write your first blockchain app this afternoon" with no jargon above the fold, a section naming the real reason people quit tutorials (hours lost to installs and version mismatches, or reading a guide you couldn't rebuild a week later), an exploded 3D view of a CKB cell, the checkpoint list, and an FAQ that answers "is this a token" and "do I have to buy anything" with a flat no
- Built the waitlist behind it: a Neon Postgres-backed route that creates its table on first call and upserts on email, so a repeat signup updates their experience level rather than erroring. It distinguishes a real insert from a repeat and tells the user which one happened instead of guessing
- Validated at the boundary rather than trusting the client: email regex plus a length cap, experience level checked against a server-side list, other fields length-capped, and every failure returned as plain language with no internals leaked
- Folded the landing page into the product app. It had been built as its own separate Next project, which meant the pitch and the thing being pitched were two deployments that could drift apart. It's now one app: `/` is the landing, `/quest` is the quest, `/share` is unchanged
- Kept both visual identities intact through route groups rather than picking a winner. The marketing surface stays near-black with Instrument Serif; the product stays paper with Fraunces. Every design token is plumbed through a variable so the marketing subtree can redefine the display face and the muted greys without the product ever seeing the change. Nothing was redesigned
- Moved the wallet connector out of the root layout into the product group, so the landing page no longer ships the CKB connector bundle to someone who hasn't decided to start yet: 115 kB first load on `/` against 338 kB on `/quest`
- Collapsed three things the split had quietly duplicated: the checkpoint list, the Quester avatar generator, and the waitlist's experience levels. Each is now a single module both sides import

## Key Learnings

- Two copies of the same list is not a style problem, it's a correctness problem, and I found three in one merge. The landing carried a trimmed checkpoint list paying Checkpoint 1 fifty CKB instead of a hundred, so the page was advertising 1,500 CKB when the quest actually pays 1,550. The signup form and its validator each had their own copy of the experience levels and disagreed on every string, so nothing a user picked could pass validation and every signup was silently stored blank. Neither was visible from either file alone, only from putting them side by side
- The silent-failure one is the lesson worth keeping: the validator did exactly what it was told, rejected the value, and fell back to empty without raising anything. A rejection that logs nothing and shows nothing is indistinguishable from working
- Route groups turn "which design wins" into a question you don't have to answer. Two identities can share one app as long as the tokens are plumbed through variables instead of baked in at build time, which meant a merge I'd assumed would cost a redesign cost a stylesheet
- When refactoring something whose output is verified on-chain, prove the bytes didn't move. The avatar generator feeds both minting and server-side verification, so I checked the SVG output against the pre-refactor version across a spread of addresses before trusting the change

## Pending

- Backend and database: the waitlist has no Postgres instance behind it yet. Provision it, wire the connection string into the deployment, and confirm a real signup lands in a real row
- Once that's done, the launch itself: deploy and get it in front of real devs

---

## The week in one line

CKB Quest stopped being a product and a pitch that could disagree with each other, and became one app where the front door and the thing behind it count from the same list.
