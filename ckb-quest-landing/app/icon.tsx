import { ImageResponse } from "next/og";
import { questerSpec } from "@/lib/quester";
import { MARK_SEED } from "./Mark";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const { grid, color, cells } = questerSpec(MARK_SEED);
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
