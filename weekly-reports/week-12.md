# Week 12 - FiberFill: the engine proves itself unattended, then grows a face

**Name:** David Uhumagho
**Week Ending:** 2026-07-11
**Project:** FiberFill (Fiber inbound-liquidity / LSP toolkit) - "Gone in 60ms" Fiber hackathon, Category 3

---

## Current Progress

- Built `listProviders`: reads a small JSON registry of provider nodes and live-probes each one with `node_info`, returning whether it is online plus its channel and peer counts. Storage stays dead simple, a file, no database
- Wrote the hardening harness (`npm run harden`): an unattended run against three live nodes that takes a genuinely fresh node with zero inbound from unable-to-receive, through the provider funding capacity toward it, to a real 50 CKB payment landing on it. It asserts each step and exits non-zero if any fails, so it is a proof that reruns, not a one-off
- Brought up a third `fnn` node (8357/8358), funded only for its own reserve, to be that fresh zero-inbound node. The two existing nodes are back up after last week's outages
- Scaffolded the dashboard: Next.js, warm paper, Fraunces. The money-shot page streams the whole run live over server-sent events, connect then each channel state then invoice then paying then paid, wired to the real nodes with nothing mocked
- Built the provider operator view: reads the provider's on-chain balance from the public CKB indexer as its capacity to fund, sums the inbound it has already committed across open channels, and shows both alongside the directory. Read-only, no keys or signing anywhere in the app

## Key Learnings

- The dashboard had to be a stream, not a request. `requestLiquidity` takes over a minute to reach `ChannelReady`, and the entire point of the demo is watching the states move. A plain request would show a spinner then a result and throw away the story. Server-sent events let the same `onState` callback that the harness prints to a console push each transition to the browser as it happens
- The operator view reads two different balances for two different questions. On-chain capacity, what the provider can still fund, comes from the CKB indexer's `get_cells_capacity` against the funding lock. Committed inbound, what it has already handed out, comes from summing `local_balance` across its ready channels. They answer "how much more can this provider offer" and "how much is it already offering", and conflating them would misreport the provider's real headroom
- Keeping the whole app read-only except for the one funding action kept the trust story clean. The operator view never signs anything, it only reads public chain state, so the only privileged call in the entire surface is the provider opening a channel it chooses to open
- Recovering the schedule was mostly about the harden run. Once an unattended script could prove the full path on demand, every later change had a one-command way to confirm it had not broken the thing that matters

## Pending

- Push `fiberfill` to a GitHub remote; it is still local-only
- Docs: README, technical breakdown, the inbound-liquidity gap writeup, and the roadmap
- Deploy the hosted demo on Vercel and pre-seed it so there is no dead air
- Record the video: problem, live demo, one line on impact
- Polish and rehearse the one judge answer, why auto channel-open instead of submarine swap
- Submit before the 15 July deadline, not at it

---

## The week in one line

The FiberFill engine stopped needing a human to believe it: an unattended run now drives a fresh node from unable-to-receive to paid on live testnet, and the dashboard shows that same run happening in the browser.

## Catching back up

Last week ended mid-plan behind a run of power outages, with the provider directory and the hardening pass still owed. Both landed early this week, the nodes came back, and the build moved on into the dashboard, which was meant to be week-two work. So the week both closed the gap the outages opened and picked up the surface phase, rather than just recovering lost ground.

## The proof that reruns

The harden script is the piece I care about most. It is not a demo I perform, it is a check I run. It stands up the fresh zero-inbound node, asks `canReceive` and confirms the answer is no, has the provider fund 300 CKB of inbound toward it, confirms `canReceive` now says yes, then has the fresh node raise a real 50 CKB invoice, has the provider pay it, and measures that the money actually moved onto the fresh node. Each of those is an assertion, and the script exits non-zero the moment one fails. That turns the empty-to-paid moment from something I proved once by hand into something the toolkit reproves whenever I touch it.

## Giving the engine a face

The dashboard exists to make the argument without narration. You pick the fresh node, it shows it cannot receive yet, you click Request Liquidity, and the channel states animate live to ChannelReady before a payment lands and the balance moves. The trick that made it honest was streaming: the same state callback the harness logs to a terminal now pushes each transition to the browser as it happens, so what you watch on screen is the real channel forming on testnet, not a canned animation. The operator view sits next to it and reads the provider's actual on-chain headroom and the inbound it has already committed, so a provider can see what it can still offer.

## Where this leaves the project

The engine is done and it proves itself. The dashboard shows the money-shot live and the operator has a legible view of capacity. What is left is packaging, not building: push the repo public, write the docs and the gap writeup, deploy and pre-seed the hosted demo, record the video, and rehearse the one hard judge question. Four days to the deadline, and the hard technical risk is behind me.
