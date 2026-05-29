// The Quester avatar: a deterministic pixel portrait derived from a CKB address.
// This module is imported by both the client (to render and mint) and the server
// (to verify a minted Spore matches the address). Every value it produces must be
// byte-identical across both, so it uses only integer-seeded arithmetic and emits
// SVG with integer coordinates and fixed attribute order. No Date, no floats in output.

const PALETTE = ["#1a1916", "#16773d", "#b52319", "#976512"]; // ink, green, red, amber

const GRID = 7; // 7x7, mirrored across the vertical axis

// FNV-1a 32-bit hash of the address string.
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: deterministic PRNG, returns floats in [0, 1).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface AvatarSpec {
  grid: number;
  color: string;
  cells: boolean[][]; // [row][col]
}

export function avatarSpec(address: string): AvatarSpec {
  const rand = mulberry32(hashString(address));
  const color = PALETTE[Math.floor(rand() * PALETTE.length)];

  const half = Math.ceil(GRID / 2); // 4 columns generated, mirrored to the right
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

// The canonical on-chain content: a compact single-path SVG on a 7-unit grid.
// One fill keeps it a few hundred bytes, so the Spore cell capacity stays modest.
// Mint this exact string; verify against this exact string.
export function avatarSvg(address: string): string {
  const { grid, color, cells } = avatarSpec(address);
  let d = "";
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (cells[y][x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 ${grid} ${grid}" shape-rendering="crispEdges"><rect width="${grid}" height="${grid}" fill="#ffffff"/><path fill="${color}" d="${d}"/></svg>`;
}
