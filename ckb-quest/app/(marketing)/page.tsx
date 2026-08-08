import Lattice from "./Lattice";
import Quester from "./Quester";
import Checkpoints from "./Checkpoints";
import CellAnatomy from "./CellAnatomy";
import Mark from "./Mark";
import Waitlist from "./Waitlist";
import { TOTAL_REWARD } from "@/lib/checkpoints";

// The product now lives in the same app, one route over. Internal link, no
// new tab: starting the quest is the same visit, not a departure.
const APP = "/quest";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-faint">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <>
      <Lattice />
      <div id="column" aria-hidden="true" />

      <main id="page" className="mx-auto w-full max-w-5xl px-6 sm:px-10">
        <header className="flex items-center justify-between gap-6 py-7">
          <span className="flex items-center gap-3">
            <Mark size={24} />
            <span className="font-display text-2xl leading-none tracking-tight">
              CKB Quest
            </span>
          </span>
          <a
            href="#start"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-accent"
          >
            Start
          </a>
        </header>

        {/* ── hero. no unexplained jargon above the fold. ─────────────────── */}
        <section className="grid gap-16 py-20 sm:py-28 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
          <div className="rise">
            <Label>Free · nothing to install · nothing to buy</Label>

            <h1 className="mt-8 font-display text-[clamp(2.7rem,6.6vw,4.9rem)] leading-[0.94] tracking-[-0.025em]">
              Write your first
              <br />
              blockchain app
              <br />
              <span className="text-accent">this afternoon.</span>
            </h1>

            <p className="mt-9 max-w-md text-[15px] leading-relaxed text-dim">
              Short tasks, all in your browser. A tutorial cannot tell whether
              you actually did the thing. This one checks, because everything
              you build runs on a real network you can go and look at
              afterwards. New tasks land as the network grows.
            </p>

            <div className="mt-11">
              <a
                href={APP}
                className="inline-block bg-accent px-8 py-4 font-mono text-xs uppercase tracking-[0.18em] text-[#08080a] transition-opacity hover:opacity-85"
              >
                Start the first task
              </a>
            </div>

            <p className="mt-6 font-mono text-[11px] leading-relaxed text-faint">
              About three hours. No blockchain experience needed. No wallet
              seed phrase, no money at any point.
              <span className="blink" />
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-10">
            <div className="flex h-[300px] w-full items-center justify-center sm:h-[380px]">
              <Quester />
            </div>
            <p className="max-w-[20rem] text-center font-mono text-[11px] leading-relaxed text-faint">
              You finish by putting this on the network permanently. It is built
              from your own account, so no two people get the same one.
            </p>
          </div>
        </section>

        {/* ── the pain a web2 dev has actually felt ──────────────────────── */}
        <section className="grid gap-10 border-t border-rule py-20 sm:grid-cols-3 sm:py-24">
          <Label>Why this exists</Label>
          <div className="sm:col-span-2">
            <p className="font-display text-[clamp(1.8rem,3.5vw,2.7rem)] leading-[1.14] tracking-[-0.015em]">
              You have tried to learn something like this before, and you quit.
            </p>
            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-dim">
              Not because it was too hard. You found a guide, lost the first two
              hours to installs and versions that did not match, and gave up
              before you wrote anything that did something. Or you read the
              whole thing, followed along fine, and a week later could not have
              rebuilt any of it on your own.
            </p>
            <p className="mt-8 max-w-xl font-display text-[clamp(1.3rem,2.2vw,1.7rem)] leading-snug">
              So there is nothing to install here, and{" "}
              <span className="text-accent">
                nothing gets explained to you that you do not do yourself, right
                then.
              </span>
            </p>
          </div>
        </section>

        {/* ── the idea worth falling for ─────────────────────────────────── */}
        <section className="border-t border-rule py-20 sm:py-24">
          <div className="pb-12">
            <Label>The one idea</Label>
            <p className="mt-6 max-w-2xl font-display text-[clamp(1.7rem,3.3vw,2.5rem)] leading-[1.14] tracking-[-0.015em]">
              Everything on this network is a cell, and once you see what that
              means you cannot unsee it.
            </p>
          </div>
          <CellAnatomy />
        </section>

        {/* ── three steps ────────────────────────────────────────────────── */}
        <section className="border-t border-rule py-20 sm:py-24">
          <Label>How it works</Label>
          <ol className="mt-12 grid gap-10 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Sign in",
                v: "One tap with your fingerprint or face. There is no password and no seed phrase to write down.",
              },
              {
                n: "02",
                t: "Do the task",
                v: "In the browser. Nothing to install, no versions to match, no first day lost to setup.",
              },
              {
                n: "03",
                t: "It gets checked",
                v: "The network is asked whether you really did it. If you did, the next task opens.",
              },
            ].map((s) => (
              <li key={s.n}>
                <span className="font-mono text-[11px] text-accent">{s.n}</span>
                <h3 className="mt-3 font-display text-2xl leading-snug">
                  {s.t}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-dim">
                  {s.v}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── the real list. jargon is fine here: it is the product. ─────── */}
        <section id="log" className="border-t border-rule py-20 sm:py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4">
            <Label>Open right now</Label>
            <p className="font-mono text-[11px] text-faint">
              {TOTAL_REWARD.toLocaleString()} test coins in the current set
            </p>
          </div>
          <p className="max-w-xl pb-10 text-[13px] leading-relaxed text-dim">
            Some of these names will mean nothing to you yet. That is fine, they
            are explained at the point you use them and not a minute before. The
            set grows: when the network ships something new, it shows up here as
            a task.
          </p>
          <Checkpoints />
        </section>

        {/* ── start, objections answered beside the button ───────────────── */}
        <section id="start" className="border-t border-rule py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
            <div>
              <Label>Start</Label>
              <h2 className="mt-7 font-display text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.02] tracking-[-0.025em]">
                The first one
                <br />
                takes four minutes.
              </h2>
              <p className="mt-7 max-w-sm text-[15px] leading-relaxed text-dim">
                It is open right now and you do not need anything to begin.
              </p>

              <div className="mt-9">
                <a
                  href={APP}
                  className="inline-block bg-accent px-8 py-4 font-mono text-xs uppercase tracking-[0.18em] text-[#08080a] transition-opacity hover:opacity-85"
                >
                  Start the first task
                </a>
              </div>
            </div>

            <dl className="space-y-8 lg:pt-10">
              {[
                {
                  k: "Do I need to know anything about crypto?",
                  v: "No. That is the point. The first task starts at signing in, and every idea is introduced at the moment you need it.",
                },
                {
                  k: "Do I have to buy anything?",
                  v: "No, not at any point. The coins you earn are test coins on a practice network. They cannot be sold and are worth nothing on purpose.",
                },
                {
                  k: "Is this trying to sell me a token?",
                  v: "No. There is no token, no waitlist for one, and no investment of any kind. It is free and the code is public.",
                },
                {
                  k: "What happens when I finish?",
                  v: "There is no finish, really. Your record keeps building and new tasks land as the network ships things. What you already did stays there permanently for anyone to check.",
                },
              ].map((f) => (
                <div key={f.k}>
                  <dt className="font-display text-xl leading-snug">{f.k}</dt>
                  <dd className="mt-2 max-w-md text-[13px] leading-relaxed text-dim">
                    {f.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── the list. its own room, not a footnote under a form. ───────── */}
        <section
          id="list"
          className="relative border-t border-rule py-24 sm:py-32"
        >
          <div className="grid gap-12 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:gap-16">
            <div>
              <Label>Or do it with other people</Label>
              <h2 className="mt-7 font-display text-[clamp(2.3rem,5.2vw,3.9rem)] leading-[0.98] tracking-[-0.03em]">
                The next group
                <br />
                run starts with
                <br />
                <span className="text-accent">five hundred of us.</span>
              </h2>
              <p className="mt-8 max-w-md text-[15px] leading-relaxed text-dim">
                Same tasks, done together over a weekend, with everything
                already switched on so nobody loses a morning to setup. You get
                one email when it starts and nothing else, ever.
              </p>
            </div>

            <div className="border border-rule p-7 sm:p-10">
              <Waitlist />
            </div>
          </div>
        </section>

        {/* ── the end goal, told as a person not a pitch ─────────────────── */}
        <section className="grid gap-10 border-t border-rule py-20 sm:grid-cols-3 sm:py-24">
          <Label>Where this goes</Label>
          <div className="sm:col-span-2">
            <p className="font-display text-[clamp(1.6rem,3.1vw,2.4rem)] leading-[1.16] tracking-[-0.015em]">
              The best thing about CKB is that it is small enough for you to
              matter in it.
            </p>
            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-dim">
              I learned CKB inside a programme that paid a monthly stipend, run
              by people who read every submission personally and gave real
              feedback. It is the reason I can build here at all. The only thing
              holding it back was arithmetic: a programme that good can only
              reach as many people as there are hours to read their work.
            </p>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-dim">
              So this hands the checking to the network, which never sleeps and
              does not care whether ten people showed up or ten thousand. The
              people stay for the part only people are good at.
            </p>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-dim">
              Learning it is only the first half. The half I care about next is
              what happens after, when the things you build here get seen by
              somebody instead of scrolling away in a group chat.
            </p>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-rule py-10">
          <p className="font-mono text-[11px] text-faint">
            David Uhumagho · Nervos CKB
          </p>
          <div className="flex gap-6">
            <a
              href="/privacy"
              className="font-mono text-[11px] text-dim transition-colors hover:text-accent"
            >
              Privacy
            </a>
            <a
              href="https://github.com/David-Pjs/ckb-playground/tree/main/ckb-quest"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-dim transition-colors hover:text-accent"
            >
              Source
            </a>
            <a
              href={APP}
              className="font-mono text-[11px] text-dim transition-colors hover:text-accent"
            >
              Launch
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
