import { db, type Sql } from "@/lib/db";
import { clientKey, take } from "@/lib/rate-limit";
import { isWaitlistLevel } from "@/lib/waitlist";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let ready: Promise<void> | null = null;
function ensureTable(sql: Sql) {
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
  const level = body.level ?? "";
  const source = (body.source ?? "landing").slice(0, 64);
  const referrer = (req.headers.get("referer") ?? "").slice(0, 512);

  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  // The form can only ever send "" or one of the known levels, so anything
  // else is a caller that has drifted. Saying so beats storing a blank and
  // reporting success, which is how the last round of this bug hid: the
  // validator rejected the value, fell back to empty, and told nobody.
  if (!isWaitlistLevel(level)) {
    return Response.json({ error: "That experience level isn't one of the options." }, { status: 400 });
  }

  try {
    const sql = db();

    const rate = await take(sql, clientKey(req));
    if (!rate.allowed) {
      return Response.json(
        { error: "That's a lot of signups from one place. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    await ensureTable(sql);

    const rows = await sql`
      INSERT INTO waitlist (email, level, source, referrer)
      VALUES (${email}, ${level}, ${source}, ${referrer})
      ON CONFLICT (email) DO UPDATE SET level = COALESCE(NULLIF(EXCLUDED.level, ''), waitlist.level)
      RETURNING (xmax = 0) AS inserted
    `;

    if (rows.length === 0) {
      // The upsert always returns a row. No row means something changed under
      // us, and claiming success here would be a guess.
      console.error("[waitlist] upsert returned no row", { email });
      return Response.json(
        { error: "Couldn't save that. Try again in a moment." },
        { status: 500 },
      );
    }

    return Response.json({
      ok: true,
      message: rows[0].inserted ? "You're on the list." : "Already on the list.",
    });
  } catch (err) {
    console.error("[waitlist] insert failed", err);
    return Response.json(
      { error: "Couldn't save that. Try again in a moment." },
      { status: 500 },
    );
  }
}
