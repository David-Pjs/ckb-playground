"use client";

import { useState } from "react";

type State = "idle" | "sending" | "done" | "error";

const LEVELS = ["New to blockchain", "Some blockchain", "Already on CKB"];

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, level, source: "landing" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setMessage(data?.error ?? "That did not go through. Try again.");
        return;
      }

      setState("done");
      setMessage(data?.message ?? "You are on the list.");
    } catch {
      setState("error");
      setMessage("Network dropped. Try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="border border-accent p-6 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
          Committed
        </p>
        <p className="mt-4 font-display text-3xl leading-tight">{message}</p>
        <p className="mt-4 text-[13px] leading-relaxed text-dim">
          Nothing is waiting on it though. The first task is open right now and
          takes about four minutes.
        </p>
        <a
          href="https://ckb-quest.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-block border border-rule px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
        >
          Start the first task →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@wherever.dev"
          aria-label="Email address"
          className="flex-1 border border-rule bg-transparent px-4 py-4 font-mono text-sm text-fg placeholder:text-faint outline-none transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="bg-accent px-7 py-4 font-mono text-xs uppercase tracking-[0.18em] text-[#08080a] transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {state === "sending" ? "Writing…" : "Join"}
        </button>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Where you are starting from</legend>
        {LEVELS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setLevel(level === label ? "" : label)}
            aria-pressed={level === label}
            className={`border px-3 py-2 font-mono text-[11px] transition-colors ${
              level === label
                ? "border-accent text-accent"
                : "border-rule text-dim hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </fieldset>

      {state === "error" && (
        <p className="font-mono text-xs text-[#d93a2b]">{message}</p>
      )}

      <p className="text-xs leading-relaxed text-faint">
        One email when the group run starts. Nothing else, no sharing, no
        selling. Delete it any time by replying. See the{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-accent">
          privacy note
        </a>
        .
      </p>
    </form>
  );
}
