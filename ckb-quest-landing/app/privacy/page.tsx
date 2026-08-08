import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CKB Quest · privacy note",
  description:
    "What CKB Quest collects, why, how long it is kept and how to have it deleted.",
};

const UPDATED = "30 July 2026";
const CONTACT = "uhumaghodavid@gmail.com";

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-14 font-display text-2xl leading-snug sm:text-3xl">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-dim">
      {children}
    </p>
  );
}

export default function Privacy() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
      <a
        href="/"
        className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-accent"
      >
        ← CKB Quest
      </a>

      <h1 className="mt-10 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1] tracking-[-0.025em]">
        Privacy note
      </h1>
      <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
        Last updated {UPDATED}
      </p>

      <P>
        This is written plainly on purpose. If anything here is unclear, email{" "}
        <a
          href={`mailto:${CONTACT}`}
          className="underline underline-offset-2 hover:text-accent"
        >
          {CONTACT}
        </a>{" "}
        and ask.
      </P>

      <H>What is collected</H>
      <P>
        Only what you type into the form: your email address, and optionally the
        one experience level you tap. Nothing else is asked for and nothing else
        is stored about you.
      </P>
      <P>
        Two technical values are saved alongside it: the time you submitted, and
        which page you submitted from. These exist so I can tell where people
        heard about this.
      </P>

      <H>What is not collected</H>
      <P>
        There are no analytics, no advertising trackers, no cookies set by this
        site, no fingerprinting and no session recording. Your wallet address is
        never collected here. The quest itself runs on a separate site and this
        page cannot see what you do there.
      </P>

      <H>Why it is collected</H>
      <P>
        To email you once when a group run starts. That is the only reason, and
        that is the only email you will get unless you write back and ask for
        more.
      </P>

      <H>Who else sees it</H>
      <P>
        Nobody. It is not sold, rented, shared, or handed to a third-party
        marketing tool. It is stored in a hosted database provided by Neon and
        served through Vercel, both of which process it on my behalf and neither
        of which has any right to use it.
      </P>

      <H>How long it is kept</H>
      <P>
        Until you ask for it to be deleted, or until the group runs are finished
        and the list has no further purpose, whichever comes first.
      </P>

      <H>Your rights</H>
      <P>
        You can ask for a copy of what is held about you, ask for it to be
        corrected, or ask for it to be deleted outright. Email{" "}
        <a
          href={`mailto:${CONTACT}`}
          className="underline underline-offset-2 hover:text-accent"
        >
          {CONTACT}
        </a>{" "}
        and it will be done, with no questions asked and no attempt to talk you
        out of it. Replying to the email you receive works too.
      </P>
      <P>
        These rights apply under the Nigeria Data Protection Act and, if you are
        in the UK or EU, under UK GDPR and GDPR. The lawful basis for holding
        your email is your consent, which you gave by submitting the form and
        can withdraw at any time.
      </P>

      <H>Money</H>
      <P>
        CKB Quest is free. There is no token, no payment, no purchase and no
        investment of any kind, so no payment details are ever collected. Any
        coins earned in the quest are test coins on a practice network and
        cannot be sold or converted.
      </P>

      <H>Changes</H>
      <P>
        If this note changes in a way that affects what is collected or why, the
        date at the top changes and anyone already on the list gets told before
        it takes effect.
      </P>

      <footer className="mt-20 border-t border-rule pt-8">
        <p className="font-mono text-[11px] text-faint">
          David Uhumagho · {CONTACT}
        </p>
      </footer>
    </main>
  );
}
