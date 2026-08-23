# Week 17 - The landing page had no spacing, and nothing looked broken enough to notice

**Name:** David Uhumagho
**Week Ending:** 2026-08-15
**Project:** CKB Quest (learn-to-earn on CKB/Fiber)

---

## Current Progress

- Found that the landing page was rendering with none of its spacing. Every section sat flush against the left edge with no rhythm between them, and the cause was one rule. The global reset in `globals.css` sat outside any cascade layer, and unlayered CSS outranks layered CSS regardless of specificity. Tailwind v4 ships its utilities inside `@layer utilities`, so a bare `* { margin: 0; padding: 0 }` was quietly beating every `p-*`, `px-*`, `m-*` and `mx-auto` in the app
- Moved the reset inside `@layer base`, which is where a reset belongs, and the utilities outrank it again. The emitted cascade order is `@layer theme, base, components, utilities`, so `base` loses to `utilities` no matter where either appears in the file
- Verified the fix by reading the compiled stylesheet rather than trusting how the page looked. Brace-matched the minified production CSS to confirm the reset sits inside the `base` block and that `utilities` opens after it. The rendered page and the cascade are two different claims and only one of them can be checked mechanically
- Left a comment naming the failure mode rather than the fix. This is the second time the same reset has escaped its layer, and the symptom both times was a page that still had its colours, its type and its content, and so never looked broken enough to chase
- Repaired three sentences that had lost the punctuation carrying them, most likely when em dashes were stripped without a replacement. One of them was in the first paragraph a new player reads, describing why a cell needs 61 CKBytes to exist
- Stopped the marketing lattice reading `document.scrollHeight` inside its animation frame. That forces a synchronous layout of the whole document on every frame, and the cost grows with page length, so restoring the missing padding had quietly made it more expensive. It is measured on resize now through a ResizeObserver, so a document that grows as fonts settle is not trusted from first paint, and the loop parks itself once the fill has settled and nothing is still flashing

## Key Learnings

- Unlayered CSS beats every layered rule regardless of specificity. This is the whole bug, and it is not a specificity problem, so none of the usual instincts apply. Adding `!important` or a more specific selector to the utilities would have done nothing. The only fix is to put the reset in a layer that loses
- The failure mode of this bug is that nothing fails. Colours, fonts, content and layout structure all survive, so the page looks like a design decision rather than a defect. That is why it got through once before and why it got through again
- A fix I can only confirm by looking at the page is a fix I have not confirmed. Reading the compiled output and checking where the rule landed in the cascade is a different kind of evidence, and it is the kind that survives being wrong about what the page is supposed to look like
- Performance work that grows with content is invisible until the content grows. The per-frame reflow had been there all along and only mattered once the page got tall enough, which happened as a side effect of fixing the spacing

## Pending

- Nobody has looked at the landing page since the fix. The cascade is verified, the appearance is not
- The waitlist behind the landing page still has no database. The route returns 500 and nobody can join

---

## The week in one line

One rule in the wrong layer had been silently deleting every margin and padding in the app, and the page looked intentional enough that it took a second pass to see it.
