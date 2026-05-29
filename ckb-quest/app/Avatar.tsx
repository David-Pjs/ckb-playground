"use client";

import { avatarSpec } from "@/lib/avatar";

// Renders the Quester portrait as inline SVG. The canonical on-chain content comes
// from avatarSvg(); this renders the same grid scaled to any display size.
export function Avatar({ address, size = 96 }: { address: string; size?: number }) {
  const { grid, cells, color } = avatarSpec(address);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid} ${grid}`}
      style={{ display: "block", borderRadius: "8px", border: "1px solid var(--color-border)" }}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Your Quester avatar"
    >
      <rect width={grid} height={grid} fill="#ffffff" />
      {cells.flatMap((row, y) =>
        row.map((on, x) =>
          on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null,
        ),
      )}
    </svg>
  );
}
