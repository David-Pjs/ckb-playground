# DESIGN

## Color
Restrained strategy: tinted neutrals plus one green accent used sparingly, with a red reserved for one failure state only.

Tokens (currently hex in app/globals.css; tinted-neutral OKLCH equivalents noted for migration):
- paper / surface: #ffffff (background)
- raised: #fbfbf9 (inset preview panels)
- ink: #16160f (primary text, primary buttons)
- muted: #5c5c54 (secondary text)
- faint: #8d8d84 (tertiary text, placeholders, byte counts)
- border: #e7e7e1 (hairlines, structure)
- border-strong: #cfcfc7 (chunk-cell outlines)
- green: #16773d, green-bg: #f1f8f3 (success, integrity verified, accent labels)
- red: #b52319, red-bg: #fdf1f0 (failed integrity badge and errors ONLY)

Neutrals are warm (tinted toward the paper hue), never pure #000 or #fff in spirit. The green carries well under 10 percent of the surface.

## Typography
- Display: Fraunces Variable (opsz, SOFT, WONK axes active). Headlines, titles, wordmark.
- UI: Inter. Body, labels, controls.
- Mono: JetBrains Mono. Hashes, addresses, byte counts, step numbers, the cell count.
- Body line length capped ~65-75ch. Hierarchy by scale and weight contrast, not by color.

## Layout and Spacing
- Single column, content measure constrained (max ~720-768px) on a full-width paper field.
- Hairline borders (1px, border token) do the structural work. Reserve heavier separation for true section breaks.
- Spacing should breathe: distinct vertical rhythm between major sections (hero, how-it-works, workspace, footer), not uniform gaps. Cramped, conjoined sections are the current defect to fix.
- Avoid nesting cards. The workspace is one framed region; its inner controls are unframed and rely on spacing.

## Components
- field: 1px border, white, focus = ink border + soft ink-tinted ring.
- btn-primary: ink fill, white text. btn-outline: ink hairline, inverts on hover. btn-quiet: muted text link.
- CellStrip: the signature motif. Filled square = manifest cell, outlined squares = chunk cells.
- Integrity badge: green (verified) or red (failed), pill with a leading dot.

## Motion
Minimal. Color and border transitions only (150ms ease). No layout-property animation, no bounce.

## Bans
Side-stripe accent borders, gradient text, glassmorphism, hero-metric template, identical card grids, modals as first thought, em dashes.
