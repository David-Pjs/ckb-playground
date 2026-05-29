# Week 6 - CKB Quest Phase 3: The Quester, an on-chain identity

**Week Ending:** 2026-05-29

---

## What I Built

Phase 3 of CKB Quest. The first eight checkpoints teach the mechanics of CKB: cells, transfers, tokens, the DAO, Spore, RGB++. Phase 3 adds a ninth that turns all of it personal. You finish the quest by writing yourself onto the chain.

Total reward pool is now 1,500 CKB across 9 checkpoints.

## Checkpoint 9: Mint Your Quester

Every address that reaches this point has a Quester: a small pixel portrait generated deterministically from the address itself. Same address, same face, every time. Nobody assigns it. It falls out of the bytes of who you are on this chain.

So far the portrait only lives in the browser. The checkpoint makes it permanent. You mint it as a Spore, one click, signed in your own wallet. The actual SVG bytes go into the cell's data field, the same lesson as Checkpoint 7, except now the thing you are storing forever is your own identity.

Verification is the part I am proud of. The server regenerates the avatar for your address and reads the minted Spore back from testnet, then checks that the on-chain content matches your portrait byte for byte. You cannot fake it, and you cannot paste in someone else's Spore. The proof is the exact bytes.

## The Shareable Card

When all nine checkpoints are done, a completion card appears: the avatar, how many checkpoints you cleared, total CKB earned, and the Spore ID once minted. It downloads as a PNG and has a share link for X. Every finisher becomes a small piece of distribution instead of hitting a dead end at the bottom of the page.

## Technical Notes

**Determinism is the whole trick.** The avatar comes from an FNV-1a hash of the address seeding a mulberry32 PRNG, integer operations only, emitting SVG with integer coordinates. That guarantees the client and the server produce the exact same string. The byte identity is what makes the verification airtight.

**Capacity is the price of the image.** On CKB you pay cell capacity per byte, so a bigger picture is a bigger bill. The naive SVG was about 1,386 bytes, which would have cost roughly 1,500 CKB to mint right at the finish line. I rewrote it as a single path with one fill, about 440 bytes, so the mint costs around 570 CKB. The size of your portrait is literally its price, which is a clean way to feel the cell model.

**No hand-rolled molecule encoding.** I used createSpore from @ckb-ccc/spore for the mint and findSpore for verification, so the SDK handles the Spore data packing and the testnet script resolution.

**Indexer lag.** Right after a mint the indexer can take a few seconds to see the new cell. The UI has a Verify again button for exactly that, so a slow indexer does not look like a failure.

## Mobile

The page was overflowing on phones. Three causes, all fixed:

- The nine-checkpoint progress bar was a fixed track around 490 pixels wide, which cannot fit a 360 pixel screen and dragged the whole layout wider. Rebuilt it as a flex row with flexible connectors, so it fills whatever width is there and shrinks cleanly.
- Long code hashes and addresses in the lesson text were single unbroken tokens that ran off the edge. They now wrap.
- The completion card stacks the avatar above the text on narrow screens instead of squeezing them side by side.

## Deployment

Built clean, zero errors, deployed to production on Vercel.

## What's Next

- Run the Checkpoint 9 mint end to end with a real wallet and testnet CKB. The path is build verified but I have not signed a live mint yet.
- Stand up a Fiber node, most likely through Docker, to unblock Checkpoints 4 and 5 and the Fiber-402 project at the same time. That is next week's main job.
- Get real people through the quest and watch where they get stuck.
