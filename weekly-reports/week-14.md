# Week 14 - CKB Quest learns to show its receipts

**Name:** David Uhumagho
**Week Ending:** 2026-07-25
**Project:** CKB Quest (learn-to-earn on CKB/Fiber)

---

## Current Progress

- Added a dynamic OG image route (`app/api/og/route.tsx`) that renders a quester's actual progress card server-side: their pixel avatar, checkpoints cleared, CKB earned, and Spore ID if minted
- Added a dedicated share page (`app/share/page.tsx`) that sets that image as the `og:image`/`twitter:image` for a shareable link, so a posted link on X, Discord, or Telegram unfurls into the real card instead of a generic site preview
- Rewired the "Share on X" button in `QuesterCard.tsx` to point at `/share?address=...&cleared=...&earned=...` instead of the bare homepage, so the tweet intent carries the rich preview
- Hit a Windows-specific build crash (`STATUS_STACK_BUFFER_OVERRUN` in the Next.js static-generation worker) caused by running the image route on the edge runtime; the WASM image renderer it pulls in doesn't survive Next's build-time analysis on this machine. Fixed by dropping the `edge` runtime declaration and letting it run on Node

## Key Learnings

- A completion card that only lives as a downloadable PNG doesn't spread on its own. A link that unfurls into the same card when pasted does, because the preview is the pitch, no click required
- The crash wasn't in application logic, it was in the platform: `next/og`'s WASM-backed renderer under the edge runtime is fine in dev and on Vercel, but the local Windows build worker chokes trying to statically analyze it. Isolating that (edge on vs off) took less time than the stack trace suggested, since the fix was a one-line runtime switch rather than a code problem

## Pending

- Live end-to-end check: mint a Quester with a real wallet, hit `/share` with the resulting params, and confirm the unfurl actually renders correctly on X/Discord (verified the build compiles; haven't verified a live social unfurl yet)
- Push this to `main` and redeploy to Vercel

---

## The week in one line

CKB Quest's completion card stopped being something you have to download to show someone, and became something that shows itself the moment you paste the link.
