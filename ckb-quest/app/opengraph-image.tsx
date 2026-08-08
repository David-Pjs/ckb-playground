import { ImageResponse } from "next/og";
import { avatarSpec, DARK_GROUND_PALETTE } from "@/lib/avatar";
import { MARK_SEED } from "@/lib/mark";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "CKB Quest. Write your first blockchain app this afternoon.";

// Rendered as a real image, so it survives being pasted into WhatsApp and
// Telegram where the page itself never loads. Kept mostly typographic and
// mostly mark, because custom fonts in OG images are a reliability tax.
export default function OG() {
  const { grid, color, cells } = avatarSpec(MARK_SEED, DARK_GROUND_PALETTE);
  const unit = 34;
  const board = grid * unit;

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          background: "#08080a",
          color: "#edeae2",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 660 }}>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#8c8879",
            }}
          >
            CKB Quest
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 34,
              fontSize: 68,
              lineHeight: 1.06,
              letterSpacing: -2,
            }}
          >
            <span>Write your first</span>
            <span>blockchain app</span>
            <span style={{ color: "#3ecf6d" }}>this afternoon.</span>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 40,
              fontSize: 22,
              color: "#8c8879",
            }}
          >
            Free · nothing to install · nothing to buy
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: board,
            height: board,
            display: "flex",
          }}
        >
          {cells.map((row, y) =>
            row.map((on, x) =>
              on ? (
                <div
                  key={`${x}-${y}`}
                  style={{
                    position: "absolute",
                    left: x * unit,
                    top: y * unit,
                    width: unit - 3,
                    height: unit - 3,
                    background: color,
                  }}
                />
              ) : null,
            ),
          )}
        </div>
      </div>
    ),
    size,
  );
}
