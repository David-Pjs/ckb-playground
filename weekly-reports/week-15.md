# Week 15 - Checkpoints 4 and 5: building against the Fiber-node blocker

**Name:** David Uhumagho
**Week Ending:** 2026-08-01
**Project:** CKB Quest (learn-to-earn on CKB/Fiber)

---

## Current Progress

- Continued work on Checkpoints 4 and 5, the two remaining CKB Quest checkpoints that depend on a live Fiber node rather than testnet CCC calls alone
- Built out the parts of the checkpoint flow that don't require the node itself: verification logic, UI states (locked, in-progress, cleared), and the request path each checkpoint will call once a node is reachable, so the moment access lands there's no remaining scaffolding work in the way
- Went through the flow manually against expected inputs/outputs to sanity-check the logic ahead of a real node to test against

## Key Learnings

- The Fiber-node dependency splits cleanly into "needs the node" and "doesn't": most of a checkpoint is state machine, UI, and request wiring, and only the final verification call actually needs a live peer. Building everything up to that line first means the remaining work shrinks to a single integration point once node access is available
- Working ahead of a hard external blocker is only useful if the interface to that blocker is well-defined early, otherwise the work done now has to be redone once the real node's actual behavior (timings, error shapes) doesn't match what was assumed

## Pending

- Checkpoints 4 and 5 remain gated on live Fiber node access, same blocker carried over from prior weeks - the work done this week is everything that could be built without it
- Once node access is available: wire the real verification calls in, run both checkpoints end-to-end on testnet, and confirm the UI states match real node behavior rather than assumed behavior

---

## The week in one line

Checkpoints 4 and 5 went from blocked-and-untouched to blocked-only-on-the-final-integration-call, with everything else built and sanity-checked ahead of live Fiber node access.
