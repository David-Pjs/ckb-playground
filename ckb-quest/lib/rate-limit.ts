import type { Sql } from "./db";

// The waitlist count is not a vanity number, it is the evidence that anyone
// wants this. An unmetered public POST that writes a row per call is therefore
// not a spam problem but a measurement problem: a loop can inflate the figure
// until it stops meaning anything, and there is no way to tell afterwards
// which rows were real.
//
// The window is deliberately generous. A real person signs up once, changes
// their mind about the experience level, and signs up again. Ten in an hour
// from one address is already far past honest use.
const MAX_PER_WINDOW = 10;

// Old windows are dead weight the moment they close. Sweeping on a fraction of
// requests keeps the table bounded without needing a cron.
const SWEEP_ODDS = 0.05;

let ready: Promise<void> | null = null;

function ensureTable(sql: Sql) {
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist_rate (
        bucket_key   text NOT NULL,
        window_start timestamptz NOT NULL,
        hits         int NOT NULL DEFAULT 0,
        PRIMARY KEY (bucket_key, window_start)
      )
    `;
  })();
  return ready;
}

// Behind Vercel the client address arrives in x-forwarded-for, first entry.
// Everything after it is proxy hops and is attacker-controlled, so only the
// first is trusted.
export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return (first || req.headers.get("x-real-ip") || "unknown").slice(0, 64);
}

export type RateResult = {
  allowed: boolean;
  hits: number;
  retryAfterSeconds: number;
};

// The count and the increment are one statement on purpose. Reading first and
// writing second lets two simultaneous requests both read the same number and
// both decide they are under the limit.
export async function take(sql: Sql, key: string): Promise<RateResult> {
  await ensureTable(sql);

  const rows = await sql`
    INSERT INTO waitlist_rate (bucket_key, window_start, hits)
    VALUES (${key}, date_trunc('hour', now()), 1)
    ON CONFLICT (bucket_key, window_start)
      DO UPDATE SET hits = waitlist_rate.hits + 1
    RETURNING hits, EXTRACT(EPOCH FROM (window_start + interval '1 hour' - now()))::int AS retry_after
  `;

  if (Math.random() < SWEEP_ODDS) {
    // Never let cleanup failure decide whether a signup is accepted.
    sql`DELETE FROM waitlist_rate WHERE window_start < now() - interval '3 hours'`.catch(
      (err) => console.error("[waitlist] rate sweep failed", err),
    );
  }

  const hits = Number(rows[0]?.hits ?? 0);
  const retryAfterSeconds = Math.max(1, Number(rows[0]?.retry_after ?? 60));

  return { allowed: hits <= MAX_PER_WINDOW, hits, retryAfterSeconds };
}
