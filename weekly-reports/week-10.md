# Week 10 - Choosing the fight: Primer and Fiber's inbound-liquidity gap

**Name:** David Uhumagho
**Week Ending:** 2026-06-26
**Project:** Fiber-402 / Primer

---

## Current Progress

- Committed to entering "Gone in 60ms", the Fiber Network infrastructure hackathon. Build window is 1-15 July, deadline 15 July, $20,000 split equally across three categories. Worked the entry against the hard constraints first: new project only, infrastructure not product, one category, MIT open source, full deliverables (repo, hosted demo, video, technical breakdown, roadmap)
- Ran a category strategy pass and compared two grounded plans before settling: FiberProbe, a payment reliability and diagnostics toolkit for Category 2, against FiberDesk, a merchant settlement and reconciliation toolkit for Category 3. Both are written up with architecture, demo moments, timelines, and risks so the decision is on paper, not in my head
- Locked the entry: Primer, an inbound-liquidity / LSP (Liquidity Service Provider) toolkit for Fiber, Category 3. The product is the one thing a brand-new Fiber node cannot do for itself, which is receive its first payment
- Verified the technical foundation in the actual Fiber source (crates/fiber-lib/src/rpc/channel.rs) rather than trusting the docs. `open_channel` lets a provider open a channel funded toward a peer, which hands that peer inbound capacity it can receive against immediately. That single RPC is what makes Primer real, and the surrounding calls (accept_channel, list_channels, shutdown_channel, open_channel_with_external_funding) are all present
- Made the stack decision and wrote it down: `fnn` v0.9.0-rc4 node with v0.8.1 stable as fallback, the official `@ckb-ccc/fiber` SDK plus `@ckb-ccc/ccc` for wallet and asset handling (not raw JSON-RPC), `fnn-cli` and `ckb-cli` for key export and manual channel ops, Next.js and TypeScript for the app
- Wrote the full node bring-up runbook from the Fiber README: extract the released binary, set up the data folder with the testnet config, export a ckb-cli key into `ckb/key`, set FIBER_SECRET_KEY_PASSWORD, run against testnet RPC at 127.0.0.1:8227, fund from the faucet. Added a pre-build checklist that ends on the proof that matters
- Mapped the likely judges to match their bar: quake (Fiber core, the fiber-game and fiber-escrow demos), RetricSu (wrote the hackathon docs, maintains fiber-pay and fiber-l402), and the v0.8.1 contributor list. Confirmed the lane to stay out of: issue #1255 is the core team's own Fiber Native Agent Protocol, so Primer sits next to it, not on top

## Screenshots

This was a prep and research week, so there is no UI to show yet. The first screenshots, a provider node and a fresh merchant node both running on testnet and a channel opened between them, come next week and are the proof the whole demo rests on.

## Key Learnings

- The inbound-liquidity problem is Fiber's, not just Lightning's. A freshly started node has channels with zero inbound capacity, so it can send but cannot receive until someone funds a channel toward it. This is the exact gap I saw in person at the Lagos meetup, where an exhibitor's audience could not pay his demo because they had no nodes of their own. Primer productizes the fix instead of treating it as setup friction every operator solves alone
- Read the source, not the docs, when the whole project rests on one call. `open_channel`'s provider-funded direction is the entire premise of Primer. Confirming in channel.rs that funding_amount flows toward the peer and gives them receivable capacity is the difference between a plan and a guess, and it took an hour I would have lost twice over mid-build
- Category selection is part of the build, not a formality before it. With an equal three-way prize split, picking the thinnest and least glamorous category (infrastructure plumbing, not wallet UI) is a higher-expected-value decision than building something more impressive in the crowded lane everyone else chases
- Constraints narrow the design before any code is written. New-project-only means fiber-402 cannot be reused as a repo, but the RPC know-how transfers cleanly. Infra-only plus the rule against colliding with #1255 together rule out the agent-payment SDK I would otherwise have reached for, and push the idea toward operator tooling, which is where the thin field is anyway

## Pending

- Register on CKBoost. Pre-registration is gated and required before submission
- Download fnn and ckb-cli for Windows, stand up the provider node on testnet, fund it from the faucet
- Stand up a second fresh merchant node with no inbound capacity
- Prove the core loop end to end: provider opens a channel toward the merchant, then the merchant receives a payment it provably could not have received before. That proof is the first screenshot and the spine of the demo
- Final scope lock by end of prep week (1 July): commit to Primer, or fall back to the lower-risk FiberDesk settlement plan if node topology setup stalls during the prep week
- CKB Quest CP2 and CP3 (the in-app send and first-token steps planned for this week) are deferred until after the hackathon. The funded end-to-end validation from Week 9 still stands as the first task when CKB Quest resumes

---

## The week in one line

No code shipped this week, and that was the point: the work was choosing the right fight. I committed to the Fiber infrastructure hackathon, did the category math, read the Fiber RPC source to confirm that one specific call can carry a whole product, and turned that into Primer, a toolkit that gives a brand-new Fiber node the one thing it cannot give itself.

## Why Primer, and why Category 3

The hackathon pays out $20,000 split equally across three categories, which changes the optimization. In a winner-take-all event you build the most impressive thing you can. Here, the highest expected value is the thinnest field, because the prize per category is fixed regardless of how many people enter it. Category 1 is wallet and UI work, which is where most hackers will crowd. Category 3 is the operator and back-office plumbing almost nobody finds glamorous. So the question stopped being "what is most impressive" and became "where is the smallest crowd standing in front of the most useful gap".

I wrote up two full plans before deciding. FiberProbe was a Category 2 payment reliability toolkit: a canPay verdict engine, a failure-code translator, and a route-confidence dashboard. FiberDesk was a Category 3 merchant settlement toolkit: invoices, webhooks, refunds, a reconciliation ledger, CSV export. Both are sound. But sitting with them surfaced a sharper idea than either, the one underneath the gap I had actually watched fail in a room full of people.

## The one RPC the product rests on

At the Lagos meetup an exhibitor demoed a Fiber app and his audience could not pay it, because paying required them to run their own funded nodes and none of them did. That is not a UX problem, it is a structural one. A Fiber node that just started has channels with no inbound capacity. It can send but it cannot receive, because receiving requires somebody on the other side to have already committed funds in its direction.

Lightning solved this years ago with Liquidity Service Providers: a provider opens a channel funded toward you, and now you can receive. Fiber has the primitive but not the productized service. I confirmed the primitive is real by reading crates/fiber-lib/src/rpc/channel.rs directly rather than trusting the docs. `open_channel` takes a peer_id and a funding_amount and opens the channel funded toward that peer, which is exactly the inbound capacity a fresh node lacks. That one call is the whole premise of Primer, so it was worth proving before committing two weeks to it.

## Standing up the node

I wrote the bring-up as a runbook so build week starts at the interesting part. Use the released fnn binary instead of a cargo build, extract it next to the testnet config, export a key from ckb-cli into ckb/key (fnn only wants the private-key line), set FIBER_SECRET_KEY_PASSWORD to encrypt the wallet key, and run against the default testnet RPC at 127.0.0.1:8227 with the node funded from the faucet. The one trap to respect is the upgrade path: protocol and storage can shift between versions, so channels have to be closed before upgrading or migrated with fnn-migrate. The mitigation is simple, which is to pin one version for the entire hackathon and not touch it.

## What this defers

The Week 10 plan was CKB Quest: bringing the send and first-token checkpoints in-app so beginners stop getting pushed out to other tools. That work is real and still queued, but the hackathon is a hard external deadline with a prize and ecosystem visibility attached, so it takes the next two weeks. CKB Quest resumes after submission, and it resumes where Week 9 left it, on the funded end-to-end validation pass that proves the reward path against a live wallet.
