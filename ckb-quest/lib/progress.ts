import { db, type Sql } from "./db";

// What this exists to answer: how far do people actually get, and where do they
// stop. Until now progress lived only in the player's own browser, so the only
// thing the project could report was how many people arrived. Arrivals are not
// evidence that anyone learned anything.
//
// One row per address per checkpoint. `attempts` counts every verify, passing or
// failing, because a checkpoint people clear on the fifth try is a different
// problem from one they clear immediately, and both are different from one they
// never clear. `completed_at` is set once and never moved, so re-verifying an
// old checkpoint cannot rewrite when it was first cleared.
//
// Addresses are already public: they are on the chain, and the house wallet has
// paid rewards to them in the open. Nothing here is more identifying than what
// the transaction history already shows.

let ready: Promise<void> | null = null;

function ensureTable(sql: Sql) {
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS progress (
        address        text NOT NULL,
        checkpoint_id  int  NOT NULL,
        attempts       int  NOT NULL DEFAULT 0,
        completed_at   timestamptz,
        reward_tx_hash text,
        first_seen_at  timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (address, checkpoint_id)
      )
    `;
  })();
  return ready;
}

// Recording must never decide whether a verification succeeds. A player who did
// the work on-chain has earned the checkpoint whether or not this table is
// reachable, so every failure here is logged and swallowed.
export async function record(
  address: string,
  checkpointId: number,
  passed: boolean,
  rewardTxHash: string | null,
): Promise<void> {
  try {
    const sql = db();
    await ensureTable(sql);
    await sql`
      INSERT INTO progress (address, checkpoint_id, attempts, completed_at, reward_tx_hash)
      VALUES (
        ${address},
        ${checkpointId},
        1,
        ${passed ? "now()" : null}::timestamptz,
        ${rewardTxHash}
      )
      ON CONFLICT (address, checkpoint_id) DO UPDATE SET
        attempts       = progress.attempts + 1,
        completed_at   = COALESCE(progress.completed_at, EXCLUDED.completed_at),
        reward_tx_hash = COALESCE(progress.reward_tx_hash, EXCLUDED.reward_tx_hash)
    `;
  } catch (err) {
    console.error("[progress] record failed", { checkpointId, passed }, err);
  }
}

export type FunnelRow = {
  checkpoint_id: number;
  reached: number;
  completed: number;
  total_attempts: number;
};

// The funnel is the point of the table: reached counts everyone who tried a
// checkpoint at all, completed counts those who cleared it. The gap between the
// two, at each step, is where people are giving up.
export async function funnel(sql: Sql): Promise<FunnelRow[]> {
  await ensureTable(sql);
  const rows = await sql`
    SELECT
      checkpoint_id,
      count(*)::int                                        AS reached,
      count(completed_at)::int                             AS completed,
      coalesce(sum(attempts), 0)::int                      AS total_attempts
    FROM progress
    GROUP BY checkpoint_id
    ORDER BY checkpoint_id
  `;
  return rows as FunnelRow[];
}

export async function playerCount(sql: Sql): Promise<number> {
  await ensureTable(sql);
  const rows = await sql`SELECT count(DISTINCT address)::int AS n FROM progress`;
  return Number(rows[0]?.n ?? 0);
}
