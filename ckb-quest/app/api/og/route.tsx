import { ImageResponse } from "next/og";
import { avatarSpec } from "@/lib/avatar";

const INK = "#1a1916";
const MUTED = "#6b6560";
const FAINT = "#9e9890";
const GREEN = "#16773d";
const PAPER = "#f7f4ef";
const BORDER = "#e4e0d8";

function shortId(id: string) {
  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") ?? "";
  const cleared = Number(searchParams.get("cleared") ?? 0);
  const total = Number(searchParams.get("total") ?? 9);
  const earned = Number(searchParams.get("earned") ?? 0);
  const sporeId = searchParams.get("sporeId");

  const { grid, cells, color } = avatarSpec(address);
  const tileSize = 300;
  const cellPx = tileSize / grid;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          backgroundColor: PAPER,
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            border: `1.5px solid #ccc8bf`,
            padding: "80px 90px",
            alignItems: "center",
          }}
        >
          {/* Avatar tile */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: `${tileSize}px`,
              height: `${tileSize}px`,
              backgroundColor: "#ffffff",
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "36px",
              flexShrink: 0,
            }}
          >
            {cells.map((row, y) => (
              <div key={y} style={{ display: "flex", flexDirection: "row" }}>
                {row.map((on, x) => (
                  <div
                    key={x}
                    style={{
                      width: `${cellPx}px`,
                      height: `${cellPx}px`,
                      backgroundColor: on ? color : "transparent",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Copy column */}
          <div style={{ display: "flex", flexDirection: "column", marginLeft: "60px", flex: 1 }}>
            <div style={{ display: "flex", fontSize: "20px", color: FAINT, letterSpacing: "4px" }}>
              CKB QUEST
            </div>
            <div style={{ display: "flex", fontSize: "78px", fontWeight: 700, color: INK, marginTop: "10px" }}>
              The Quester
            </div>
            <div style={{ display: "flex", width: "100%", height: "1px", backgroundColor: BORDER, marginTop: "25px" }} />
            <div style={{ display: "flex", fontSize: "30px", color: INK, marginTop: "40px" }}>
              {cleared} of {total} checkpoints cleared
            </div>
            <div style={{ display: "flex", fontSize: "30px", fontWeight: 600, color: GREEN, marginTop: "12px" }}>
              {earned.toLocaleString()} CKB earned
            </div>
            {sporeId && (
              <div style={{ display: "flex", fontSize: "20px", color: MUTED, marginTop: "20px" }}>
                spore {shortId(sporeId)} · on-chain forever
              </div>
            )}
            <div style={{ display: "flex", fontSize: "20px", color: FAINT, marginTop: "auto" }}>
              {address ? `${address.slice(0, 14)}…${address.slice(-6)}` : ""}
            </div>
            <div style={{ display: "flex", fontSize: "22px", fontWeight: 500, color: INK, marginTop: "10px" }}>
              ckb-quest.vercel.app
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
