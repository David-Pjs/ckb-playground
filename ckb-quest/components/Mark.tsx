import { avatarSpec } from "@/lib/avatar";
import { MARK_SEED } from "@/lib/mark";

export { MARK_SEED };

// The one mark, rendered by both rooms. It is the anchor across the seam: the
// marketing page and the quest are allowed to disagree about ground, display
// face and radii, but the thing in the top left has to be the same thing, or
// clicking through reads as landing on somebody else's site.
//
// The palette is a parameter rather than a constant because the mark is drawn
// on two different grounds. Omit it and you get the paper palette the product
// uses; the marketing page passes the dark-ground one. Same shape, same seed,
// legible on both.
export default function Mark({
  size = 22,
  gap = true,
  palette,
}: {
  size?: number;
  gap?: boolean;
  palette?: readonly string[];
}) {
  const { grid, color, cells } = avatarSpec(MARK_SEED, palette);
  const unit = size / grid;
  const inset = gap ? unit * 0.08 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid} ${grid}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      {cells.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x + inset}
              y={y + inset}
              width={1 - inset * 2}
              height={1 - inset * 2}
              fill={color}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
