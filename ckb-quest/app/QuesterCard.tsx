"use client";

import { useCallback, useRef, useState } from "react";
import { avatarSpec } from "@/lib/avatar";
import { Avatar } from "./Avatar";

const SITE = "ckb-quest.vercel.app";

function shortId(id: string) {
  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || fallback;
}

// Draws the card to a 1200x630 canvas for a crisp, shareable PNG. Layout mirrors
// the HTML preview below but is redrawn here so the export does not depend on
// rasterizing live DOM.
function drawCard(
  canvas: HTMLCanvasElement,
  opts: { address: string; cleared: number; total: number; earned: number; sporeId: string | null },
) {
  const W = 1200;
  const H = 630;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const display = cssVar("--font-display", '"Fraunces Variable", Georgia, serif');
  const mono = cssVar("--font-mono", '"JetBrains Mono Variable", monospace');
  const ui = cssVar("--font-ui", "Inter, system-ui, sans-serif");

  const ink = "#1a1916";
  const muted = "#6b6560";
  const faint = "#9e9890";
  const green = "#16773d";
  const borderStrong = "#ccc8bf";

  ctx.fillStyle = "#f7f4ef";
  ctx.fillRect(0, 0, W, H);

  // inset frame
  ctx.strokeStyle = borderStrong;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // avatar tile
  const { grid, cells, color } = avatarSpec(opts.address);
  const tileX = 90;
  const tileY = 165;
  const tileSize = 300;
  ctx.fillStyle = "#ffffff";
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(tileX, tileY, tileSize, tileSize, 12);
    ctx.fill();
    ctx.strokeStyle = "#e4e0d8";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillRect(tileX, tileY, tileSize, tileSize);
  }
  const inset = 36;
  const cellPx = (tileSize - inset * 2) / grid;
  ctx.fillStyle = color;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (cells[y][x]) {
        ctx.fillRect(
          Math.round(tileX + inset + x * cellPx),
          Math.round(tileY + inset + y * cellPx),
          Math.ceil(cellPx),
          Math.ceil(cellPx),
        );
      }
    }
  }

  const colX = 450;

  // eyebrow
  ctx.fillStyle = faint;
  ctx.font = `500 20px ${mono}`;
  ctx.letterSpacing = "4px";
  ctx.fillText("CKB QUEST", colX, 175);
  ctx.letterSpacing = "0px";

  // headline
  ctx.fillStyle = ink;
  ctx.font = `700 78px ${display}`;
  ctx.fillText("The Quester", colX, 260);

  // rule
  ctx.strokeStyle = "#e4e0d8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(colX, 295);
  ctx.lineTo(W - 90, 295);
  ctx.stroke();

  // stats
  ctx.fillStyle = ink;
  ctx.font = `400 30px ${display}`;
  ctx.fillText(`${opts.cleared} of ${opts.total} checkpoints cleared`, colX, 350);
  ctx.fillStyle = green;
  ctx.font = `600 30px ${display}`;
  ctx.fillText(`${opts.earned.toLocaleString()} CKB earned`, colX, 398);

  // on-chain line
  ctx.fillStyle = muted;
  ctx.font = `400 20px ${mono}`;
  if (opts.sporeId) {
    ctx.fillText(`spore ${shortId(opts.sporeId)} · on-chain forever`, colX, 450);
  }

  // wallet stamp + site footer
  ctx.fillStyle = faint;
  ctx.font = `400 20px ${mono}`;
  ctx.fillText(`${opts.address.slice(0, 14)}…${opts.address.slice(-6)}`, colX, H - 95);

  ctx.fillStyle = ink;
  ctx.font = `500 22px ${ui}`;
  ctx.fillText(SITE, colX, H - 60);
}

export function QuesterCard({
  address,
  cleared,
  total,
  earned,
  sporeId,
}: {
  address: string;
  cleared: number;
  total: number;
  earned: number;
  sporeId: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);

  const download = useCallback(async () => {
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = canvasRef.current ?? document.createElement("canvas");
      drawCard(canvas, { address, cleared, total, earned, sporeId });
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ckb-quest-the-quester.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }, [address, cleared, total, earned, sporeId]);

  const shareText = `I finished CKB Quest: ${cleared} on-chain checkpoints on CKB. Sent real transactions, locked CKB in the Nervos DAO, decoded an RGB++ binding, and minted my identity as a Spore. My Quester lives on-chain.`;
  const shareUrl = `https://${SITE}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div style={{ marginTop: "64px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
        Your card
      </div>

      {/* HTML preview */}
      <div
        style={{
          backgroundColor: "var(--color-paper)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "10px",
          padding: "32px",
          display: "flex",
          gap: "28px",
          alignItems: "center",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <Avatar address={address} size={150} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-faint)", letterSpacing: "0.22em" }}>
            CKB QUEST
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "38px", fontWeight: 700, color: "var(--color-ink)", lineHeight: 1.05, letterSpacing: "-0.02em", marginTop: "4px" }}>
            The Quester
          </div>
          <div style={{ height: "1px", backgroundColor: "var(--color-border)", margin: "16px 0" }} />
          <p style={{ fontFamily: "var(--font-display)", fontSize: "17px", color: "var(--color-ink)" }}>
            {cleared} of {total} checkpoints cleared
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 600, color: "var(--color-green)", marginTop: "2px" }}>
            {earned.toLocaleString()} CKB earned
          </p>
          {sporeId && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-muted)", marginTop: "10px" }}>
              spore {shortId(sporeId)} · on-chain forever
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
        <button
          onClick={download}
          disabled={busy}
          style={{
            backgroundColor: "var(--color-ink)",
            color: "var(--color-paper)",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            fontFamily: "var(--font-ui)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Rendering…" : "Download card (PNG)"}
        </button>
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: "6px",
            padding: "10px 18px",
            fontFamily: "var(--font-ui)",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Share on X
        </a>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
