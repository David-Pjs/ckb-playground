# Week 18 - The waitlist gets a database, and a number worth quoting

**Name:** David Uhumagho
**Week Ending:** 2026-08-22
**Project:** CKB Quest (learn-to-earn on CKB/Fiber)

---

## Current Progress

- Provisioned Postgres through the Vercel marketplace and connected it to the project, so `DATABASE_URL` is injected across production, preview and development rather than copied by hand. There is no connection string in the repository and none in my shell history
- Proved the waitlist end to end against production rather than locally. A signup posted to the live endpoint created a real row, a repeat of the same address updated the stated experience level instead of writing a second row, a malformed address returned 400 and malformed JSON returned 400. Deleted the test rows afterwards so the count starts at zero and nothing I did shows up in it
- Metered the endpoint at ten signups per address per hour. This was not a spam concern. The signup count is the evidence that anyone wants this, so an unmetered public endpoint that writes a row per call is a measurement problem: a loop can inflate the figure until it means nothing, and afterwards there is no way to tell which rows were real
- Made the count and the increment a single statement. Reading the current number and then writing an incremented one lets two simultaneous requests both read the same value and both decide they are under the limit. Verified against production by sending twelve requests: ten passed, the eleventh and twelfth returned 429 with the seconds remaining until the window closes
- Built a way to read the list back. There is now a token-gated export serving CSV or JSON. The token is compared in constant time so it cannot be recovered from response timing, and the route returns 503 rather than serving the list unprotected if the token is ever missing
- Two things in the export that would have gone wrong quietly. Timestamps were serialising as the server's locale string, which sorts incorrectly in a spreadsheet and means something different depending on where it is opened, so they go out as ISO 8601 UTC. And any value beginning with an equals sign, plus, minus or at sign is quoted, because an address like `=cmd|calc@example.com` passes the email check and would otherwise be a live formula in Excel
- Removed the last of the silent coercion. An unrecognised experience level was being stored as an empty string with a 200 response, which is the same shape as the bug from two weeks ago: the validator rejected the value, fell back to empty, and told nobody. It returns 400 now
- Carried the mark across the seam between the landing page and the quest. The two surfaces deliberately disagree about ground, display face and radii, but they were disagreeing about everything at once, so clicking through inverted the entire visual world at the moment someone is deciding whether to trust this. The mark now appears in both, with its palette as a parameter rather than a constant, since the same glyph has to sit on near-black and on paper. The index into the palette comes from the same generator call either way, so both show the same shape in the corresponding hue
- Read the other submissions in the CKBuilder projects repository before writing my own, and filed the review request as issue 31. Almost everything there is a tool for people who have already arrived. Onboarding appears repeatedly as a sub-feature and nobody appears to be building the on-ramp itself

## Key Learnings

- A public write endpoint whose output is a number you intend to quote is a different problem from one whose output is just data. The rate limit is not protecting the database, it is protecting the credibility of the figure
- Checking a limit and then applying it are one operation or they are a race. Splitting them across two statements looks correct in every single-request test and fails exactly when the endpoint is under the load that makes limiting matter
- Building the export surfaced what I cannot currently measure. Checkpoint progress lives in the player's own browser, and the only server-side trace of a completion is the reward payout leaving the house wallet, which is not tied to any signup. So a completion rate is a number I have no honest way to produce yet, and I found that out by trying to produce it
- Naming a gap before a reviewer finds it is worth more than hiding it. The healthiest thread in the projects repository belongs to a builder who was criticised in detail, came back, and answered every point with what he had changed. So the Fiber node problem went into my issue as a question to the person most able to answer it rather than something to quietly work around
- Two visual identities can share an application, but they need at least one thing in common at the point where a person crosses between them, or the crossing reads as leaving

## Pending

- Completion tracking has no database behind it. Progress is browser-local and disappears with the browser, so I cannot say how far anyone gets or where they stop. This is the next real piece of work, and it is what turns the outreach push into evidence rather than a signup count
- No email provider is wired up. The form promises one message when the group run starts and there is currently no mechanism to send it
- Screenshots for issue 31 still need attaching. Images upload through the web interface rather than the command line, so this is a manual step
- Checkpoints 4 and 5 still need a live Fiber node. This is the question I put to the reviewers rather than the thing I solved

---

## The week in one line

The waitlist stopped being a form that goes nowhere and became a number I would be willing to defend, and the act of building the way to read it out showed me the number I still cannot produce.
