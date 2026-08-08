// The one list of experience levels.
//
// The form and the validator used to each carry their own copy, and they
// disagreed: nothing the form could send passed the validator, so every signup
// stored an empty level and nobody was told. Both sides import this now, so a
// change to the wording cannot silently start dropping data.

export const WAITLIST_LEVELS = [
  "New to blockchain",
  "Some blockchain",
  "Already on CKB",
] as const;

export type WaitlistLevel = (typeof WAITLIST_LEVELS)[number];

// "" is the honest answer for someone who skipped the question.
const ACCEPTED = new Set<string>(["", ...WAITLIST_LEVELS]);

export const isWaitlistLevel = (value: string): boolean => ACCEPTED.has(value);
