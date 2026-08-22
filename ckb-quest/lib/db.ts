import { neon } from "@neondatabase/serverless";

// One place that knows how to reach Postgres, so the waitlist route and the
// export route cannot drift into disagreeing about which connection string
// they read or how a missing one is reported.
//
// The return type is left to inference on purpose: annotating it as
// ReturnType<typeof neon> widens it to the union of every neon() overload,
// and the tagged-template results stop being arrays.
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export type Sql = ReturnType<typeof db>;
