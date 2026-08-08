// Titles, subtitles and rewards mirror the live product at ckb-quest.vercel.app.
export interface Checkpoint {
  id: number;
  title: string;
  subtitle: string;
  reward: number;
}

export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 1,
    title: "Get On-Chain",
    subtitle: "Connect a wallet and pull testnet CKB from the faucet",
    reward: 50,
  },
  {
    id: 2,
    title: "Send CKB Correctly",
    subtitle: "Master the change output. The mistake that eats real balances.",
    reward: 75,
  },
  {
    id: 3,
    title: "Issue a Token",
    subtitle: "Deploy your own xUDT token on testnet",
    reward: 100,
  },
  {
    id: 4,
    title: "Fiber First Contact",
    subtitle: "Run a node. Open a channel. Touch the Lightning.",
    reward: 200,
  },
  {
    id: 5,
    title: "Pay for Something Real",
    subtitle: "Use your channel to pay a live HTTP 402 API",
    reward: 300,
  },
  {
    id: 6,
    title: "Lock Your CKB",
    subtitle: "Deposit into the Nervos DAO and opt into inflation protection",
    reward: 150,
  },
  {
    id: 7,
    title: "Write Something Permanent",
    subtitle: "Mint a Spore: no URL, no IPFS, the actual bytes on-chain",
    reward: 200,
  },
  {
    id: 8,
    title: "Find the Bitcoin Ghost",
    subtitle: "Decode a live RGB++ binding: a Bitcoin UTXO inside a CKB cell",
    reward: 250,
  },
  {
    id: 9,
    title: "Mint Your Quester",
    subtitle: "Your address, drawn in cells, minted as a Spore you own",
    reward: 175,
  },
];

export const TOTAL_REWARD = CHECKPOINTS.reduce((n, c) => n + c.reward, 0);

export const hex = (n: number) => `0x${n.toString(16).padStart(2, "0")}`;

// Everything user-facing counts the array. Add a checkpoint to CHECKPOINTS and
// the headline, the totals and the metadata all follow. Nothing to remember.
export const COUNT = CHECKPOINTS.length;

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

export const countWord = (n: number = COUNT) => WORDS[n] ?? String(n);

export const Count = (n: number = COUNT) => {
  const w = countWord(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};
