import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEVELS = new Set([
  "",
  "Never touched a blockchain",
  "Some web3",
  "Already build on-chain",
]);

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

let ready: Promise<void> | null = null;
function ensureTable(sql: ReturnType<typeof db>) {
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist (
        id          bigserial PRIMARY KEY,
        email       text NOT NULL UNIQUE,
        level       text,
        source      text,
        referrer    text,
        created_at  timestamptz NOT NULL DEFAULT now()
      )
    `;
  })();
  return ready;
}

export async function POST(req: Request) {
  let body: { email?: string; level?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const level = LEVELS.has(body.level ?? "") ? (body.level ?? "") : "";
  const source = (body.source ?? "landing").slice(0, 64);
  const referrer = (req.headers.get("referer") ?? "").slice(0, 512);

  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  try {
    const sql = db();
    await ensureTable(sql);

    const rows = await sql`
      INSERT INTO waitlist (email, level, source, referrer)
      VALUES (${email}, ${level}, ${source}, ${referrer})
      ON CONFLICT (email) DO UPDATE SET level = COALESCE(NULLIF(EXCLUDED.level, ''), waitlist.level)
      RETURNING (xmax = 0) AS inserted
    `;

    const inserted = rows[0]?.inserted !== false;
    return Response.json({
      ok: true,
      message: inserted ? "You're on the list." : "Already on the list.",
    });
  } catch (err) {
    console.error("[waitlist] insert failed", err);
    return Response.json(
      { error: "Couldn't save that. Try again in a moment." },
      { status: 500 },
    );
  }
}
