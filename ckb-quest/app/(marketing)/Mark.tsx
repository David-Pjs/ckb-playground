import { avatarSpec, DARK_GROUND_PALETTE } from "@/lib/avatar";
import { MARK_SEED } from "@/lib/mark";

export { MARK_SEED };

export default function Mark({
  size = 22,
  gap = true,
}: {
  size?: number;
  gap?: boolean;
}) {
  const { grid, color, cells } = avatarSpec(MARK_SEED, DARK_GROUND_PALETTE);
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
