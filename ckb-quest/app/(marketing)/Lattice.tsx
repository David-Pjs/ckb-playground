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
    // true while any cell is still inside its write flash, so the loop knows
    // it cannot stop yet even once fill has settled
    let hasHot = false;

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

    // scrollHeight forces a synchronous layout. Reading it per frame made the
    // rAF loop reflow the whole document 60x a second, which starved the main
    // thread on a long page. Measure it on layout changes instead; scrollY is
    // cheap and is the only thing that actually moves between frames.
    let span = 0;

    function measure() {
      span = document.documentElement.scrollHeight - window.innerHeight;
    }

    function progress() {
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

      hasHot = hotCount > 0;
      ctx!.globalAlpha = 1;
    }

    function frame(now: number) {
      const target = progress();
      fill += (target - fill) * 0.085;
      draw(now);
      // Settled and nothing still flashing: stop burning frames. A scroll or a
      // resize starts the loop again, so the canvas can never show stale state.
      if (Math.abs(target - fill) < 0.0005 && !hasHot) {
        fill = target;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      // Reduced motion gets the settled state directly, with no loop at all.
      if (reduce) {
        fill = progress();
        draw(performance.now());
        return;
      }
      if (raf === 0 && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function sync() {
      fill = progress();
      draw(performance.now());
    }

    layout();
    measure();
    sync();
    start();

    const onScroll = () => start();
    const onResize = () => {
      layout();
      measure();
      sync();
      start();
    };
    // The document gets taller as fonts and images settle, so the scroll span
    // has to be re-measured rather than trusted from first paint.
    const ro = new ResizeObserver(() => {
      measure();
      start();
    });
    ro.observe(document.documentElement);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        start();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas id="lattice" ref={ref} aria-hidden="true" />;
}
