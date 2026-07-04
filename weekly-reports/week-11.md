# Week 11 - FiberFill: the engine starts, then a run of outages

**Name:** David Uhumagho
**Week Ending:** 2026-07-04
**Project:** FiberFill (Fiber inbound-liquidity / LSP toolkit) - "Gone in 60ms" Fiber hackathon, Category 3

---

## Current Progress

- Opened a fresh repo, `fiberfill`, separate from `fiber-402`. TypeScript, MIT licensed, no framework yet since the dashboard is a later phase
- Built a typed Fiber RPC client wrapping the calls already proven in the fiber-lab: `node_info`, `list_channels`, `connect_peer`, `open_channel`, `new_invoice`, `send_payment`, `get_payment`
- Built `requestLiquidity`: connects to the requesting peer, opens a funded channel toward it, watches `list_channels` for the new channel to reach `ChannelReady`, and returns the channel id plus the inbound added. Ran end to end against the fiber-lab provider and merchant nodes
- Built `canReceive`: sums `remote_balance` across a node's enabled, `ChannelReady` channels and compares it against a requested amount, returning whether the node can receive plus the exact shortfall

## Key Learnings

- `requestLiquidity` can't trust the channel id `open_channel` returns, because the call responds before the channel has finished forming. The reliable signal is a snapshot of the channel list taken before the open, then watching for the id that wasn't there before until its state reaches `ChannelReady`
- `canReceive` and `requestLiquidity` read opposite sides of the same balance. `canReceive` sums `remote_balance`, the counterparty's stake in a channel and therefore the actual capacity a node can receive. `requestLiquidity` reports the provider's `local_balance` after opening, since the provider's local balance is what becomes the merchant's inbound. Swapping the two would make `canReceive` answer the wrong question
- A run of power outages broke the daily build rhythm partway through the week, so the provider directory and the hardening pass that were supposed to follow did not happen yet

## Pending

- Provider directory (`listProviders`)
- Relaunch the fiber-lab nodes, which are currently down
- The hardening pass: a third, fresh, zero-inbound node running the full path unattended, request through auto-open through a landed payment
- Push `fiberfill` to a GitHub remote; it is local-only so far
- Dashboard, docs, hosted demo, and video, all still ahead in week two

---

## The week in one line

FiberFill went from an empty repo to a working request-and-check engine, run end to end against the live fiber-lab nodes, before a run of power outages interrupted the build partway through the week.

## What actually shipped

The two pieces that matter, `requestLiquidity` and `canReceive`, are built to work together. A node calls `canReceive` first: sum what its live channels can actually take in, compare it to what it wants to receive, and get a clean yes or no with the shortfall spelled out. Only if the answer is no does anything call `requestLiquidity`, which connects to the peer, opens a channel funded toward it, and does not return until that channel is actually `ChannelReady`. Both ran against the same two fiber-lab nodes that proved the mechanic by hand two weeks ago, so this week turned that manual proof into code that does the same thing without someone watching each state transition by hand.

## Where this leaves the project

Two of the four build days planned for this stretch landed: the RPC client and `requestLiquidity`, then `canReceive`. The provider directory and the hardening pass slipped behind a run of outages rather than any technical problem. Next is relaunching the nodes and picking the plan back up at the provider directory.
