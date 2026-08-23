import { timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db";
import { funnel, playerCount } from "@/lib/progress";

export const runtime = "nodejs";
// Always read the tables live. A cached signup count is a wrong signup count.
export const dynamic = "force-dynamic";

// Compare in constant time so the token cannot be recovered a character at a
// time from response timing.
function tokenMatches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function unauthorized() {
  // No detail about why. A caller without the token learns only that it failed.
  return Response.json({ error: "Not authorised." }, { status: 401 });
}

function csvCell(value: unknown): string {
  // A Date stringifies to the server's locale and timezone, which sorts wrong
  // in a spreadsheet and means something different depending on where it was
  // opened. Timestamps go out as ISO 8601 UTC.
  const s =
    value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  // A leading =, +, - or @ makes a spreadsheet treat the cell as a formula, and
  // these values come from strangers on the internet.
  const guarded = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function csv(header: string, rows: unknown[][], filename: string): Response {
  const body = rows.map((r) => r.map(csvCell).join(",")).join("\n");
  return new Response(`${header}\n${body}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: Request) {
  const expected = process.env.WAITLIST_ADMIN_TOKEN;
  if (!expected) {
    console.error("[waitlist/export] WAITLIST_ADMIN_TOKEN is not set");
    return Response.json({ error: "Export is not configured." }, { status: 503 });
  }

  const url = new URL(req.url);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const given = bearer || url.searchParams.get("token") || "";
  if (!given || !tokenMatches(given, expected)) return unauthorized();

  const wantsJson = url.searchParams.get("format") === "json";

  try {
    const sql = db();

    // ?view=funnel answers the question the signup count cannot: of the people
    // who started, how far did they get, and which checkpoint is losing them.
    if (url.searchParams.get("view") === "funnel") {
      const [rows, players] = await Promise.all([funnel(sql), playerCount(sql)]);
      if (wantsJson) {
        return Response.json(
          { players, checkpoints: rows },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      return csv(
        "checkpoint_id,reached,completed,total_attempts",
        rows.map((r) => [r.checkpoint_id, r.reached, r.completed, r.total_attempts]),
        "ckb-quest-funnel.csv",
      );
    }

    const rows = await sql`
      SELECT id, email, level, source, referrer, created_at
      FROM waitlist
      ORDER BY id
    `;

    if (wantsJson) {
      return Response.json(
        { count: rows.length, rows },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return csv(
      "id,email,level,source,referrer,created_at",
      rows.map((r) => [r.id, r.email, r.level, r.source, r.referrer, r.created_at]),
      "ckb-quest-waitlist.csv",
    );
  } catch (err) {
    console.error("[waitlist/export] read failed", err);
    return Response.json({ error: "Couldn't read the list." }, { status: 500 });
  }
}
