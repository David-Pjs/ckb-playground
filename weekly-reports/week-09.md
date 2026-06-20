# Week 9 - Hardening CKB Quest: the bugs that only show up on-chain

**Name:** David Uhumagho
**Week Ending:** 2026-06-19
**Project:** CKB Quest

---

## Current Progress

- Fixed a critical progression bug: the Fiber checkpoints, which cannot be completed without a live Fiber node, were permanently locking the entire back half of the quest. The DAO, Spore, RGB++, and Quester checkpoints were unreachable in production and the completion card could never fire. Fiber is now an optional bonus that never blocks the required spine
- Closed a reward double-claim hole: claim tracking moved off server memory (which reset on every redeploy and let any address re-drain the funded house wallet) onto the chain itself. Each reward output is now tagged at shannon precision with its checkpoint id, so a paid reward is a uniquely identifiable cell the server looks up before paying again
- Fixed a silent payout failure: the first checkpoint paid 50 CKB, below the ~61 CKB cell-capacity floor, so the reward cell could never form and the send was being swallowed by the error handler. Raised it to 100 CKB and added a hard floor guard that throws instead of dropping the cell quietly
- Pinned @ckb-ccc/spore, which the app imports for the Quester mint but was missing from package.json, so clean installs could break
- Production build green, types validated

## Key Learnings

- "Compiles and deploys" hides the class of bug only the cell model surfaces. A reward below 61 CKB is not a rounding problem, it is a cell that cannot exist. The capacity floor is a consensus rule, not a suggestion, and a payout under it is invalid before it ever reaches a fee check
- The chain is the correct database for idempotency. Server memory resets, the ledger does not. Tagging a payout's capacity at shannon precision turns the reward into its own on-chain receipt, so "have we already paid this checkpoint?" becomes a lookup against truth instead of a guess that a redeploy can erase
- A linear unlock plus one un-completable step equals a dead funnel. The Fiber dependency quietly amputated four of nine checkpoints in production. Anything that can be unavailable has to be modeled as non-blocking from the start, not bolted on after it strands users
- Receipts have to be checked against history, not just live cells. findCellsByLock catches the common case where the reward is still sitting unspent in the wallet, but the holder may have moved it, so findTransactionsByLock is the fallback that confirms a payment that has already been spent

## Pending

- Run one funded end-to-end pass on testnet: complete Checkpoint 1 with the house wallet live, confirm the 100 CKB tagged reward lands, then verify again and confirm the second pass does not double-pay
- Stand up a Fiber node to flip the bonus checkpoints live (set NEXT_PUBLIC_FIBER_ENABLED and FIBER_NODE_RPC_URL together)
- Bring Checkpoints 2 and 3 in-app so sending a first transaction and issuing a first token no longer push a beginner out to another tool

---

## The week in one line

CKB Quest looked finished and deployed cleanly, but three of its bugs were the kind that only the cell model and the live chain reveal. This week was about finding and fixing them before the app is put in front of real beginners, because the most dangerous bug in an onboarding tool is the one that makes a working screenshot lie.

## The dead funnel

The worst bug was invisible from the outside. The quest unlocks linearly: the first incomplete checkpoint is active, everything after it is locked. Checkpoints 4 and 5 are Fiber, and Fiber verification needs a live node the quest server does not run yet, so those two checkpoints can never be completed in production. Because the unlock is linear, an un-completable Checkpoint 4 permanently locks 5 through 9. The Nervos DAO deposit, the Spore mint, the RGB++ decode, and the Quester capstone, the best parts of the quest, were all unreachable. The "all checkpoints complete" card keyed off `completedCount === CHECKPOINTS.length`, so it could never appear either. The app demoed perfectly and delivered half of itself.

The fix is a model change, not a patch. Checkpoints are now either required or optional. The required ones form the spine and unlock in order. Optional ones, the Fiber pair, are a bonus: attemptable once the required work before them is done, but they never lock the checkpoints that follow, and the quest counts as finished when every required checkpoint is done. When no Fiber node is configured the optional checkpoints render an honest "coming soon, this is a bonus and does not block you" panel instead of an input that cannot succeed. The back half is reachable again and the quest is finishable today.

## The reward that paid twice

Rewards are real testnet CKB sent from a funded house wallet when a checkpoint verifies. The guard against paying the same checkpoint twice was an in-memory Map of who had claimed what. In-memory means it lives in the server process, and a serverless redeploy starts a fresh process with an empty Map. Every deploy reopened the door for any address to re-claim every checkpoint and drain the wallet.

The fix is to stop trusting memory and trust the chain, which is the one record a redeploy cannot wipe. Every reward output is now tagged: its capacity is the base reward plus the checkpoint id in the low shannons, so Checkpoint 7's 200 CKB reward is paid as exactly 200.00000007 CKB. That makes each payout a uniquely identifiable cell. Before paying, the server asks the chain whether a cell of that exact tagged capacity has ever reached the address: first by scanning the wallet's live cells for the common unspent case, then by walking the address's receipt history for a reward that has since been spent. The Map stays, but only as a fast in-deploy cache. The authority is the ledger, so a redeploy can no longer cause a double payout. The tag doubles as a neat property: the last digits of any reward tell you which checkpoint paid it.

## The reward that could not exist

The first checkpoint paid 50 CKB. On CKB a cell cannot hold less than its occupied capacity, and a standard lock cell occupies about 61 CKB. A 50 CKB output is therefore not a small reward, it is an invalid cell the chain refuses, so the transaction throws. The verify route catches reward-send failures and continues by design, so the failure was silent: the checkpoint verified, the user was told they passed, and the 50 CKB never moved. Raised the first reward to 100 CKB so it clears the floor for every supported lock type, and added an explicit guard in the reward path that throws a clear message if a reward is ever set below the floor again, so the next misconfiguration fails loudly instead of disappearing.

## The dependency that was not declared

The Quester mint imports @ckb-ccc/spore, and so does the verifier, but the package was only present transitively and was never listed in package.json. It worked locally by luck of hoisting. A clean install on a fresh machine or a CI runner could resolve a different tree and break the build. Pinned it to the installed version so the mint path is reproducible.

## Where this leaves the project

CKB Quest now finishes, pays correctly, and pays once. The fixes were not features, they were the difference between an app that looks complete and one that survives a real user and real funds. Next is the funded end-to-end pass to put a real transaction hash behind the reward path, a Fiber node to turn the bonus checkpoints on, and pulling the first transaction and first token in-app so the earliest steps stop sending beginners out to other tools.
