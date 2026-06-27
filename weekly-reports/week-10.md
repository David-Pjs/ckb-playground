# Week 10 - Primer: making an empty Fiber node able to receive, live on testnet

**Name:** David Uhumagho
**Week Ending:** 2026-06-26
**Project:** Primer (Fiber inbound-liquidity / LSP toolkit)

---

## Current Progress

- Stood up two `fnn` v0.9.0-rc4 nodes on testnet from scratch on Windows, a provider and a merchant, on custom RPC/P2P ports (provider 8337/8338, merchant 8347/8348) so they sit alongside an existing v0.8.1 node without colliding. Funded both addresses from the faucet
- Proved Primer's core mechanic end to end with nothing mocked: the provider opened a funded channel toward the merchant, the merchant issued a 50 CKB invoice, the provider paid it, and the merchant's balance went from 0.00 to 50.00 CKB. A node that could not receive a single payment could now receive, and the only thing that changed was a provider funding capacity toward it
- Measured the real economics of the flow: the provider funds X and the merchant receives X of inbound capacity. Funding a 1000 CKB channel gave the merchant 901 CKB of inbound after the on-chain reserve, so the relationship is direct and predictable
- Worked out the full `open_channel` flow and every sharp edge around it (covered in Key Learnings), so the manual path is now reliable and repeatable rather than a lucky one-off
- Registered on CKBoost
- Wrote the node lab up as a runbook in `fiber-lab/NODES.md`: ports, wallet setup, the funding steps, and the exact command sequence, so the environment is reproducible and the build does not start from a blank machine

## Screenshots

The proof run is screenshot-worthy and I will capture these from the lab and drop them in:

- The empty-to-paid moment: merchant balance 0.00 CKB before, 50.00 CKB after the provider's payment
- `list_channels` on both nodes showing the channel in `ChannelReady`
- Both faucet-funded addresses confirmed on the testnet explorer

## Key Learnings

- A Fiber channel acceptor has to lock roughly 99 CKB of its own as the on-chain commitment-cell reserve, even for a one-way channel, so a literally empty node cannot even hold a channel side. That reframed what Primer actually sells. It is not "money for a broke merchant", because every node needs that ~99 CKB just to exist. What Primer provides is the inbound capacity, the receivable side that only somebody else can fund toward you. This is exactly how Lightning's Liquidity Service Providers work, and confirming it on CKB sharpened the whole pitch
- `open_channel` takes the node pubkey, not the peer_id, and the peer must be connected and have completed the Init handshake first. The "waiting for peer to send Init message" error clears on a retry once the handshake lands. I lost time treating that as a hard failure before realizing it was a timing one
- `FIBER_AUTO_ACCEPT_CHANNEL_CKB_FUNDING_AMOUNT=0` disables auto-accept entirely, it does not mean "accept with zero". And a manual `accept_channel` that gets rejected destroys the pending channel outright. The robust path is to fund the acceptor and leave auto-accept at its default ~99 CKB so it accepts cleanly on its own
- The channel lifecycle to watch is NegotiatingFunding, then AwaitingTxSignatures / AwaitingChannelReady, then ChannelReady. The trap is acting on AwaitingChannelReady when the channel is not actually usable until the exact ChannelReady state. Funding confirms on-chain in about a minute on testnet, so it pays to wait for the real state rather than the near-miss one

## Pending

- Capture and commit the screenshots above
- Wrap the proven manual flow into the toolkit proper: a request-liquidity call, the provider auto-opening a funded channel toward the requester, and a provider directory so a merchant can discover a provider in the first place. The toolkit itself is built fresh starting 1 July
- Decide the shape of provider discovery (how a merchant finds and trusts a provider), which is the one piece the proof run did by hand
- CKB Quest CP2 and CP3 (the in-app send and first-token steps) stay deferred. Week 9's funded end-to-end validation is still the first task when CKB Quest resumes

---

## The week in one line

Primer's premise stopped being a claim and became a demonstration. Two nodes on testnet, one of them unable to receive a single payment, and after the provider funded a channel toward it, a 50 CKB invoice paid in full. The mechanic works live, with nothing mocked.

## The problem Primer solves

A brand-new Fiber node cannot receive payments. Not because of a bug or a missing wallet, but because of how payment channels work: to receive, somebody else has to have opened a channel with capacity pointing toward you. A fresh merchant has no such channel, so the network has no path to deliver money to them. This is the gap I watched fail in person at the Lagos meetup, where an exhibitor's audience could not pay his Fiber demo because none of them had nodes funded toward it. Primer is the toolkit that closes that gap on demand: a merchant requests inbound liquidity, a provider auto-opens a funded channel toward them, and they can receive immediately.

## Proving it live

The whole project rests on one question: can a provider actually hand a stranger the ability to receive? So before writing any toolkit code, I proved the raw mechanic by hand on testnet. I ran two real nodes, funded both from the faucet, connected them, and had the provider open a channel funded toward the merchant. Then the merchant raised a 50 CKB invoice and the provider paid it. The merchant's balance moved from 0.00 to 50.00 CKB. That is the empty-to-paid moment, and it is the demo: a node that was structurally unable to be paid, made payable by an outside party funding capacity toward it, with real testnet coins and no mock anywhere in the path.

## What the reserve taught me

The most useful surprise was the ~99 CKB reserve. I had been thinking of Primer as helping a merchant who has nothing. But every Fiber node, rich or broke, has to lock about 99 CKB of its own just to hold a channel open, even a one-way one. So "the merchant has no money" was never the real problem. The real problem is that having your own reserve still does not let you receive, because receiving needs capacity pointed at you that only a counterparty can create. That distinction is the entire value proposition, and it matches the Lightning LSP model precisely. It also cleaned up how I talk about the project: Primer sells inbound capacity, not a bailout.

## The edges that cost time

Getting the channel open was less about the happy path and more about the sharp edges. `open_channel` wants the node pubkey, not the peer_id, which is an easy and silent mistake. The peer has to be connected and Init-handshaked before an open will take, and the "waiting for peer to send Init message" error is a retry signal, not a wall. Auto-accept has a counterintuitive switch where setting the funding amount to zero turns the feature off entirely rather than accepting with zero, and a manual accept that gets rejected destroys the pending channel, so the safe path is to fund the acceptor and let the default auto-accept do its job. None of these are in a quickstart, and writing them down in NODES.md is what turns a fragile first success into a flow I can run on command during the build.

## Where this leaves the project

The risk that mattered most, whether the core mechanic is even possible live on Fiber today, is now retired. It works, I have the node lab and the runbook to reproduce it, and I understand the economics and the failure modes. What is left is genuinely toolkit work: turn the manual request-fund-receive sequence into a clean API and a provider directory, built fresh from 1 July. The hard unknown is no longer technical feasibility, it is the discovery layer, how a merchant finds a provider to ask in the first place.
