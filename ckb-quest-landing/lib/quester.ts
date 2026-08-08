// Ported verbatim from ckb-quest/lib/avatar.ts so the Questers on this page are
// the real thing — same hash, same PRNG, same 7x7 mirrored grid, same palette.
// Brightened here only for a dark ground; the shapes are untouched.

const PALETTE = ["#edeae2", "#2fae5a", "#d93a2b", "#c98a1e"]; // ink, green, red, amber

const GRID = 7;

function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface QuesterSpec {
  grid: number;
  color: string;
  cells: boolean[][];
}

export function questerSpec(seed: string): QuesterSpec {
  const rand = mulberry32(hashString(seed));
  const color = PALETTE[Math.floor(rand() * PALETTE.length)];

  const half = Math.ceil(GRID / 2);
  const cells: boolean[][] = [];
  for (let y = 0; y < GRID; y++) {
    const row = new Array<boolean>(GRID).fill(false);
    for (let x = 0; x < half; x++) {
      const on = rand() < 0.5;
      row[x] = on;
      row[GRID - 1 - x] = on;
    }
    cells.push(row);
  }

  return { grid: GRID, color, cells };
}
