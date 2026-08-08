"use client";

import { useEffect, useRef } from "react";

const CELL = 26; // px per cell
const FLASH = 620; // ms a newly written cell glows

const WRITTEN = "rgb(237,234,226)"; // held well under full alpha, see draw()
const ACCENT = "rgb(62,207,109)";

// deterministic 0..1 per coordinate
function noise(x: number, y: number) {
  let h = Math.imul(x + 0x9e37, 0x85eb) ^ Math.imul(y + 0x79b9, 0xc2b2);
  h = Math.imul(h ^ (h >>> 13), 0x27d4);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

export default function Lattice() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cols = 0;
    let rows = 0;
    let vw = 0;
    let vh = 0;
    let colLeft = 0;
    let colRight = 0;
    let thresholds = new Float32Array(0);
    let writtenAt = new Float64Array(0);
    let fill = 0;
    let raf = 0;

    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas!.width = Math.floor(vw * dpr);
      canvas!.height = Math.floor(vh * dpr);
      canvas!.style.width = `${vw}px`;
      canvas!.style.height = `${vh}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // the reading column is painted over the lattice. only skip the solid
      // core of it; the feathered edges want cells showing through.
      const colW = Math.min(vw, 68 * 16);
      const feather = 7 * 16;
      colLeft = (vw - colW) / 2 + feather;
      colRight = (vw + colW) / 2 - feather;

      cols = Math.ceil(vw / CELL) + 1;
      rows = Math.ceil(vh / CELL) + 1;
      thresholds = new Float32Array(cols * rows);
      writtenAt = new Float64Array(cols * rows);

      const cx = (cols - 1) / 2;
      const cy = (rows - 1) / 2;
      const far = Math.hypot(cx, cy) || 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const radial = Math.hypot(x - cx, y - cy) / far;
          thresholds[y * cols + x] = 0.74 * noise(x, y) + 0.26 * radial;
        }
      }
    }

    function progress() {
      const span = document.documentElement.scrollHeight - window.innerHeight;
      return span <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / span));
    }

    function draw(now: number) {
      ctx!.clearRect(0, 0, vw, vh);

      // vacant lattice, always present, waiting to be occupied
      ctx!.strokeStyle = WRITTEN;
      ctx!.globalAlpha = 0.1;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      for (let x = 0; x <= cols; x++) {
        const px = Math.round(x * CELL) + 0.5;
        ctx!.moveTo(px, 0);
        ctx!.lineTo(px, vh);
      }
      for (let y = 0; y <= rows; y++) {
        const py = Math.round(y * CELL) + 0.5;
        ctx!.moveTo(0, py);
        ctx!.lineTo(vw, py);
      }
      ctx!.stroke();

      // pass one: everything already settled. Low alpha on purpose: occupancy
      // should read as texture and weight, never as glare.
      ctx!.fillStyle = WRITTEN;
      ctx!.globalAlpha = 0.14;
      let hotCount = 0;
      const hot: number[] = [];

      for (let y = 0; y < rows; y++) {
        const py = Math.round(y * CELL) + 1;
        for (let x = 0; x < cols; x++) {
          const px = Math.round(x * CELL) + 1;
          if (px + CELL > colLeft && px < colRight) continue; // hidden anyway

          const i = y * cols + x;
          if (fill <= thresholds[i]) {
            writtenAt[i] = 0;
            continue;
          }
          if (writtenAt[i] === 0) writtenAt[i] = now;

          if (now - writtenAt[i] < FLASH) {
            hot[hotCount++] = i;
            continue;
          }
          ctx!.fillRect(px, py, CELL - 1, CELL - 1);
        }
      }

      // pass two: the cells being written right now
      ctx!.fillStyle = ACCENT;
      for (let k = 0; k < hotCount; k++) {
        const i = hot[k];
        const x = i % cols;
        const y = (i / cols) | 0;
        const t = 1 - (now - writtenAt[i]) / FLASH;
        ctx!.globalAlpha = 0.14 + t * 0.5;
        ctx!.fillRect(
          Math.round(x * CELL) + 1,
          Math.round(y * CELL) + 1,
          CELL - 1,
          CELL - 1,
        );
      }

      ctx!.globalAlpha = 1;
    }

    // Repainting is driven off scroll as well as rAF, so a throttled or paused
    // animation frame can never leave the canvas showing a stale state.
    function sync() {
      fill = progress();
      draw(performance.now());
    }

    function frame(now: number) {
      const target = progress();
      fill += (target - fill) * (reduce ? 1 : 0.085);
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    layout();
    sync();
    raf = requestAnimationFrame(frame);

    const onScroll = () => sync();
    const onResize = () => {
      layout();
      sync();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas id="lattice" ref={ref} aria-hidden="true" />;
}
