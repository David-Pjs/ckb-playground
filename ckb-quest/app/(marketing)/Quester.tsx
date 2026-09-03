"use client";

import { useEffect, useMemo, useState } from "react";
import { avatarSpec, DARK_GROUND_PALETTE } from "@/lib/avatar";

// Seeds picked only so the reel opens green and walks the whole palette.
// Colour and shape are whatever the real algorithm returns for each string.
const SEEDS = [
  "proof of work done", // green
  "find the bitcoin ghost", // ink
  "no shortcuts", // amber
  "spore", // red
];

const GRID = 7;
const S = 30; // cell footprint
const FLOOR = 3; // a vacant cell is still a cell
const STEPS = [24, 38, 56, 78]; // an occupied one holds what it holds
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// Shading is baked into the colour. A CSS filter would flatten the element out
// of the 3D rendering context. So would opacity or scaleZ on any ancestor,
// which is why occupancy is expressed as height rather than as fading.
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round(((n >> 16) & 255) * k)},${Math.round(
    ((n >> 8) & 255) * k,
  )},${Math.round((n & 255) * k)})`;
}

// Height belongs to the slot, so the skyline stays put while the portrait
// rewrites itself across it.
function heightAt(x: number, y: number) {
  let h = 0x811c9dc5;
  for (const ch of `slot:${x}:${y}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return STEPS[(h >>> 0) % STEPS.length];
}

function Cube({
  x,
  y,
  h,
  color,
  vacant,
}: {
  x: number;
  y: number;
  h: number;
  color: string;
  vacant: boolean;
}) {
  const lit = vacant ? shade(color, 0.22) : color;
  const sideA = shade(color, vacant ? 0.16 : 0.58);
  const sideB = shade(color, vacant ? 0.12 : 0.34);
  const delay = (x + y) * 38;
  const move = `${720}ms ${EASE} ${delay}ms`;

  const faces: Array<React.CSSProperties> = [
    { width: S, height: S, background: lit, transform: `translateZ(${h / 2}px)` },
    {
      width: S,
      height: h,
      top: (S - h) / 2,
      background: sideB,
      transform: `rotateX(-90deg) translateZ(${S / 2}px)`,
    },
    {
      width: S,
      height: h,
      top: (S - h) / 2,
      background: sideB,
      transform: `rotateX(90deg) translateZ(${S / 2}px)`,
    },
    {
      width: h,
      height: S,
      left: (S - h) / 2,
      background: sideA,
      transform: `rotateY(90deg) translateZ(${S / 2}px)`,
    },
    {
      width: h,
      height: S,
      left: (S - h) / 2,
      background: sideA,
      transform: `rotateY(-90deg) translateZ(${S / 2}px)`,
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: x * S,
        top: y * S,
        width: S,
        height: S,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: `translateZ(${h / 2}px)`,
          transition: `transform ${move}`,
        }}
      >
        {faces.map((f, i) => (
          <div
            key={i}
            className="face"
            style={{
              ...f,
              transition: `width ${move}, height ${move}, top ${move}, left ${move}, transform ${move}, background-color ${move}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Quester() {
  const [i, setI] = useState(0);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    // a timer, not requestAnimationFrame: a backgrounded tab must never be
    // left showing an empty floor where the Quester should be
    const rise = setTimeout(() => setGrown(true), 90);
    const t = setInterval(() => setI((n) => (n + 1) % SEEDS.length), 6400);
    return () => {
      clearTimeout(rise);
      clearInterval(t);
    };
  }, []);

  const spec = useMemo(() => avatarSpec(SEEDS[i], DARK_GROUND_PALETTE), [i]);
  const span = GRID * S;

  const slots = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const on = grown && spec.cells[y][x];
      slots.push(
        <Cube
          key={`${x}-${y}`}
          x={x}
          y={y}
          h={on ? heightAt(x, y) : FLOOR}
          color={spec.color}
          vacant={!on}
        />,
      );
    }
  }

  return (
    <div className="stage select-none" aria-hidden="true">
      <div className="rig relative" style={{ width: span, height: span }}>
        {slots}
      </div>
    </div>
  );
}
