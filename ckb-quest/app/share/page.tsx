import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "../Avatar";

type SearchParams = Record<string, string | string[] | undefined>;

function toStr(v: string | string[] | undefined, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function buildOgUrl(params: SearchParams): string {
  const qs = new URLSearchParams({
    address: toStr(params.address),
    cleared: toStr(params.cleared, "0"),
    total: toStr(params.total, "9"),
    earned: toStr(params.earned, "0"),
  });
  const sporeId = toStr(params.sporeId);
  if (sporeId) qs.set("sporeId", sporeId);
  return `/api/og?${qs.toString()}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const cleared = toStr(params.cleared, "0");
  const total = toStr(params.total, "9");
  const earned = toStr(params.earned, "0");
  const ogUrl = buildOgUrl(params);
  const title = `The Quester: ${cleared}/${total} checkpoints, ${earned} CKB earned`;
  const description = "Real testnet transactions, no shortcuts. See the proof, then run your own CKB Quest.";

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const address = toStr(params.address);
  const cleared = toStr(params.cleared, "0");
  const total = toStr(params.total, "9");
  const earned = toStr(params.earned, "0");
  const sporeId = toStr(params.sporeId);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-paper)" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "64px 24px 96px", textAlign: "center" }}>
        {address && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <Avatar address={address} size={120} />
          </div>
        )}
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-faint)", letterSpacing: "0.2em", marginBottom: "8px" }}>
          CKB QUEST · THE QUESTER
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 700, color: "var(--color-ink)", marginBottom: "16px" }}>
          {cleared} of {total} checkpoints cleared
        </h1>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--color-green)", marginBottom: "8px" }}>
          {earned} CKB earned
        </p>
        {sporeId && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-muted)", marginBottom: "32px" }}>
            spore {sporeId.slice(0, 10)}…{sporeId.slice(-6)} · on-chain forever
          </p>
        )}
        <p style={{ color: "var(--color-muted)", fontSize: "14px", marginTop: "24px", marginBottom: "24px", lineHeight: 1.6 }}>
          Real testnet transactions. No shortcuts. An AI cannot generate a valid testnet transaction hash for you.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            backgroundColor: "var(--color-ink)",
            color: "var(--color-paper)",
            borderRadius: "6px",
            padding: "10px 20px",
            fontFamily: "var(--font-ui)",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Start CKB Quest →
        </Link>
      </div>
    </div>
  );
}
