"use client";

import { useEffect, useState } from "react";

// Nothing in the 3D chain may carry opacity, filter or scaleZ. Any of them
// flattens preserve-3d and the box collapses to a rotated square. Fading is
// done on the 2D caption layer only; boxes move and change colour instead.

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const PAPER = "#edeae2";
const GREEN = "#3ecf6d";
const AMBER = "#c98a1e";

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round(((n >> 16) & 255) * k)},${Math.round(
    ((n >> 8) & 255) * k,
  )},${Math.round((n & 255) * k)})`;
}

function Box({
  w,
  d,
  h,
  color,
  x = 0,
  y = 0,
  z = 0,
  ms = 900,
  delay = 0,
}: {
  w: number;
  d: number;
  h: number;
  color: string;
  x?: number;
  y?: number;
  z?: number;
  ms?: number;
  delay?: number;
}) {
  const t = `${ms}ms ${EASE} ${delay}ms`;
  const move = `width ${t}, height ${t}, top ${t}, left ${t}, transform ${t}, background-color ${t}`;
  const top = color;
  const side = shade(color, 0.6);
  const front = shade(color, 0.34);

  const faces: React.CSSProperties[] = [
    { width: w, height: d, background: top, transform: `translateZ(${h / 2}px)` },
    {
      width: w,
      height: h,
      top: (d - h) / 2,
      background: front,
      transform: `rotateX(-90deg) translateZ(${d / 2}px)`,
    },
    {
      width: w,
      height: h,
      top: (d - h) / 2,
      background: front,
      transform: `rotateX(90deg) translateZ(${d / 2}px)`,
    },
    {
      width: h,
      height: d,
      left: (w - h) / 2,
      background: side,
      transform: `rotateY(90deg) translateZ(${w / 2}px)`,
    },
    {
      width: h,
      height: d,
      left: (w - h) / 2,
      background: side,
      transform: `rotateY(-90deg) translateZ(${w / 2}px)`,
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: w,
        height: d,
        marginLeft: -w / 2,
        marginTop: -d / 2,
        transformStyle: "preserve-3d",
        transform: `translate3d(${x}px, ${y}px, ${z + h / 2}px)`,
        transition: move,
      }}
    >
      {faces.map((f, i) => (
        <div
          key={i}
          style={{ position: "absolute", top: 0, left: 0, ...f, transition: move }}
        />
      ))}
    </div>
  );
}

const BEATS = [
  {
    k: "A cell is a box you own.",
    v: "Not a row in somebody's table that gets edited. A box, with your name on the lock, sitting on a network nobody can switch off.",
  },
  {
    k: "Its size is space you own.",
    v: "You pay for the box by its size, and whatever you put inside is really in there. Not a link to a file on a server that stops paying its bill one day.",
  },
  {
    k: "Nothing is ever edited.",
    v: "To change anything, old boxes are destroyed and new ones are made in the same breath. That is why the history cannot quietly be rewritten behind you.",
  },
];

export default function CellAnatomy() {
  const [beat, setBeat] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setBeat((b) => (b + 1) % BEATS.length), 6000);
    return () => clearInterval(t);
  }, [auto]);

  const U = 74; // base footprint

  return (
    <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:items-center">
      {/* the stage */}
      <div
        className="stage flex h-[300px] items-center justify-center sm:h-[380px]"
        aria-hidden="true"
      >
        <div
          className="relative"
          style={{
            width: U * 3,
            height: U * 2,
            transformStyle: "preserve-3d",
            transform: "rotateX(62deg) rotateZ(42deg)",
          }}
        >
          {beat === 0 && (
            <Box w={U} d={U} h={34} color={PAPER} />
          )}

          {beat === 1 && (
            <>
              {/* the box, taller: capacity is literally its size */}
              <Box w={U} d={U} h={82} color={PAPER} />
              {/* what is actually inside it */}
              <Box w={U * 0.44} d={U * 0.44} h={30} color={GREEN} z={84} />
            </>
          )}

          {beat === 2 && (
            <>
              {/* two inputs, consumed: they sink through the floor */}
              <Box w={U * 0.8} d={U * 0.8} h={10} color={shade(PAPER, 0.3)} x={-96} y={-52} z={-40} />
              <Box w={U * 0.8} d={U * 0.8} h={10} color={shade(PAPER, 0.3)} x={-58} y={26} z={-40} delay={90} />
              {/* one output, created */}
              <Box w={U} d={U} h={72} color={AMBER} x={72} y={10} delay={220} />
            </>
          )}
        </div>
      </div>

      {/* the captions */}
      <div>
        <ol className="space-y-6">
          {BEATS.map((b, i) => {
            const on = i === beat;
            return (
              <li key={b.k}>
                <button
                  type="button"
                  onClick={() => {
                    setBeat(i);
                    setAuto(false);
                  }}
                  className="block w-full border-l-2 pl-5 text-left transition-colors"
                  style={{
                    borderColor: on ? "var(--accent)" : "var(--rule)",
                  }}
                >
                  <span
                    className="font-display text-[clamp(1.25rem,2.1vw,1.6rem)] leading-snug transition-opacity"
                    style={{ opacity: on ? 1 : 0.42 }}
                  >
                    {b.k}
                  </span>
                  <span
                    className="mt-2 block max-w-md text-[13px] leading-relaxed text-dim transition-opacity"
                    style={{ opacity: on ? 1 : 0 }}
                  >
                    {on ? b.v : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <p className="mt-10 max-w-md border-t border-rule pt-8 font-display text-[clamp(1.15rem,1.9vw,1.45rem)] leading-snug">
          You have spent your career renting rows in someone else&apos;s
          database.{" "}
          <span className="text-accent">This is owning the file.</span>
        </p>
      </div>
    </div>
  );
}
