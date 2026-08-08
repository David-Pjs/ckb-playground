import { ImageResponse } from "next/og";
import { avatarSpec, DARK_GROUND_PALETTE } from "@/lib/avatar";
import { MARK_SEED } from "@/lib/mark";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const { grid, color, cells } = avatarSpec(MARK_SEED, DARK_GROUND_PALETTE);
  const pad = 6;
  const unit = (size.width - pad * 2) / grid;

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          background: "#08080a",
          display: "flex",
          position: "relative",
        }}
      >
        {cells.map((row, y) =>
          row.map((on, x) =>
            on ? (
              <div
                key={`${x}-${y}`}
                style={{
                  position: "absolute",
                  left: pad + x * unit,
                  top: pad + y * unit,
                  width: unit,
                  height: unit,
                  background: color,
                }}
              />
            ) : null,
          ),
        )}
      </div>
    ),
    size,
  );
}
