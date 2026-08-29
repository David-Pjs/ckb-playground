# Week 19 - Arrivals stopped being the only number the project could report

**Name:** David Uhumagho
**Week Ending:** 2026-08-29
**Project:** CKB Quest (learn-to-earn on CKB/Fiber)

---

## Current Progress

- Closed the gap named at the end of last week: checkpoint progress lived only in the player's own browser, so it died with the browser, and the only server-side trace of a completion was the reward leaving the house wallet, which is not tied to any signup. There was no honest way to produce a completion rate, so this week that became a table instead of a wish
- Added a `progress` table with one row per address per checkpoint, written from `/api/verify` on both the pass and the fail path. `attempts` counts every verify, passing or failing, because a checkpoint someone clears on the fifth try is a different problem from one they clear immediately, and both differ from one they never clear at all. `completed_at` is set once and never moved, so re-verifying an old checkpoint cannot rewrite when it was first cleared
- Kept recording strictly separate from deciding. A player who did the work on-chain has earned the checkpoint whether or not this table is reachable, so every write goes through a try/catch and every failure is logged and swallowed rather than surfaced to the request
- Grew the export with a funnel view alongside the existing list: `GET /api/waitlist/export?view=funnel` returns, per checkpoint, how many reached it, how many completed it, and the total attempts spent there, behind the same bearer-token auth as the waitlist export
- Filed the gap this doesn't close as an open question rather than pretending it doesn't exist. Progress is keyed on wallet address, the waitlist on email, and nothing joins them, so "of the people who signed up, how many actually played" is still unanswerable. That was deliberate rather than solved, since inventing a link would have meant guessing

## Key Learnings

- A completion rate and a signup count are different claims about a product, and only one of them says anyone learned anything. Instrumenting the funnel before the outreach push, rather than after, is the only way the number means something when the push happens
- Failing attempts carry more information than passing ones. A checkpoint nobody reaches and a checkpoint everybody gets stuck on look identical from the signup count alone, and the whole reason to log every verify, not just the successful one, is to tell those two apart
- Recording state and verifying correctness have to stay two separate failure domains. The moment a progress-table outage could turn a legitimate on-chain pass into a failed request, the table would be deciding things it has no business deciding
- Not joining two identifiers is sometimes the more honest move than joining them. Address and email don't share a natural key here, and bridging them with a guess would have produced a completion-rate number that looks precise and isn't

## Pending

- Progress and the waitlist are still not linked. Whether the people who signed up are the people who are playing remains an open question, and closing it needs a real join point, not an assumed one
- No email provider is wired up, so the promised one message when the group run starts still has no mechanism behind it
- Checkpoints 4 and 5 still need a live Fiber node, which is the question put to CKBuilder issue 31 rather than the thing solved this week

---

## The week in one line

The project could already say how many people arrived; now it can say where they stopped, and it was honest enough to leave the two counts unjoined rather than fake a link between them.
