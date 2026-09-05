export interface Step {
  text: string;
  windowsNote?: string;
  link?: { label: string; url: string };
}

export interface Checkpoint {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  reward: number;
  concept: string;
  task: string;
  steps: Step[];
  inputLabel: string;
  inputPlaceholder: string;
  inputType: "address" | "txHash" | "typeScriptHash" | "channelId" | "paymentHash" | "sporeId" | "btcBinding" | "quester";
  verifyHint: string;
  // Optional (bonus) checkpoints never block the required spine. The Fiber checkpoints
  // are optional because they depend on a live Fiber node the quest server does not run
  // yet; marking them optional keeps the rest of the quest reachable in the meantime.
  optional?: boolean;
  // Surfaces the connected wallet's full CKB address inside the checkpoint itself.
  // The header shows it truncated, which a reviewer with CKB experience still missed
  // for several minutes; a beginner coming from an EVM wallet never finds it at all,
  // and checkpoint 1 cannot be completed without it.
  showsAddress?: boolean;
  // Builds and signs the transfer in the app instead of sending the player to an
  // external code editor. The lesson is the change output, not the SDK.
  inAppSend?: boolean;
}

// The quest's own address, and the single source of truth for it. lib/ckb.ts verifies
// against this value and the in-app send builds its output to it, so the two can never
// drift apart.
export const QUEST_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3elzk7jkwdf7yw5q4ek";

// Checkpoint 2 sends exactly this much to the quest address.
export const TRANSFER_CKB = 100;

// Ids 4 and 5 are absent on purpose. They were the two Fiber checkpoints, cut from v1
// after a reviewer who knows CKB well pointed out that asking a beginner to run a payment
// channel node is a wall, not a checkpoint. The ids of the survivors are deliberately not
// renumbered: id is the persisted key behind progress rows, the reward de-duplication in
// alreadyRewarded, and the verification switch, so shifting them would silently rewrite
// what every historical record means. Display position comes from array order instead.
export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 1,
    slug: "get-on-chain",
    title: "Get On-Chain",
    subtitle: "Connect your wallet and get testnet CKB",
    // Must clear the cell-capacity floor: a reward output below ~61 CKB (the occupied
    // capacity of a standard lock) cannot form a valid cell, so the payout would fail.
    reward: 100,
    concept: `CKB is a blockchain where every piece of state lives in a Cell.
A Cell is like a box that holds both CKBytes (the native token) and arbitrary data.
Every cell requires a minimum of 61 CKBytes to exist. That 61 CKB is not a fee,
it's the on-chain storage cost of the cell itself. 1 CKByte = 1 byte of on-chain storage.

This is fundamentally different from Ethereum, where you pay gas once and state
persists forever. On CKB, your cells occupy space, and that space is priced in CKBytes.`,
    task: "Connect your wallet, claim testnet CKB from the faucet, and verify your address has at least 100 CKB.",
    steps: [
      {
        text: 'Click "Connect Wallet" above. Use JoyID (passkey, no seed phrase) or MetaMask.',
      },
      {
        text: "Copy your CKB testnet address using the copy button below. It starts with ckt1. If your wallet also shows an address starting with 0x, that is not the one the faucet needs.",
      },
      {
        text: "Go to the testnet faucet and claim CKB.",
        link: { label: "faucet.nervos.org", url: "https://faucet.nervos.org" },
        windowsNote: "Open this link in any browser. No special setup needed on Windows.",
      },
      {
        text: "Paste your address in the faucet, click Claim, and wait ~30 seconds for confirmation.",
      },
      {
        text: "Come back here and click Verify. Your address is already filled in below.",
      },
    ],
    showsAddress: true,
    inputLabel: "Your CKB address",
    inputPlaceholder: "ckt1qzda0cr08m85hc8jlnfp3....",
    inputType: "address",
    verifyHint: "Must have at least 100 CKB on testnet",
  },
  {
    id: 2,
    slug: "send-correctly",
    title: "Send CKB Correctly",
    subtitle: "Master the change output the most common beginner mistake",
    reward: 75,
    concept: `On CKB, when you send a transaction, your input Cells are destroyed and
new output Cells are created. There is no "balance field" that gets updated.

If you have a Cell with 200 CKB and want to send 100 CKB to Bob, you must:
  1. Consume your 200 CKB cell (it's destroyed)
  2. Create a new cell for Bob with 100 CKB
  3. Create a change cell back to yourself with the remaining ~100 CKB (minus fee)

If you forget the change cell, that CKB is gone. It becomes the transaction fee.
Most beginners lose CKB this way at least once. The CCC SDK handles this automatically
with completeInputsByCapacity() but understanding WHY it exists matters.`,
    task: "Send exactly 100 CKB to the quest address. Your transaction must have a change output back to your address.",
    steps: [
      {
        text: "Read the breakdown below. It shows the cells your transaction will destroy and create, including the change cell coming back to you.",
      },
      {
        text: "Click Build and Sign. The app assembles the transaction and your wallet asks you to approve it. You are signing, not writing code.",
      },
      {
        text: "Approve in your wallet. The transaction hash appears here automatically once it is broadcast.",
      },
      {
        text: "Click Verify. The chain is checked for two things: 100 CKB reached the quest address, and a change output came back to you.",
      },
      {
        text: "Optional. If you want to build the same transaction by hand, CCC Playground is a code editor for exactly that. Skip it if you are new; it is not required to pass this checkpoint.",
        link: { label: "CCC Playground", url: "https://live.ckbccc.com" },
      },
    ],
    inAppSend: true,
    inputLabel: "Transaction hash",
    inputPlaceholder: "0x3b4f2d...",
    inputType: "txHash",
    verifyHint: "The tx must send 100 CKB to the quest address with a change output back to your address",
  },
  {
    id: 3,
    slug: "issue-a-token",
    title: "Issue a Token",
    subtitle: "Deploy your own xUDT token on CKB testnet",
    reward: 100,
    concept: `xUDT (extensible User Defined Token) is CKB's fungible token standard.
Unlike Ethereum's ERC-20, an xUDT token has no separate contract address.
Instead, token identity is defined by the Type Script of the cells holding that token.

Your token's ID = the hash of YOUR Lock Script. This means:
  - Only you can issue more tokens (same lock script hash)
  - Anyone can verify a token is yours by checking the type script args
  - The token amount is stored as a uint128 in the cell's data field

One gotcha: xUDT cells cost ~142-162 CKB each in capacity (not just 61),
because they hold a Type Script in addition to the Lock Script.
Airdropping 100 tokens to 10 people = ~1,620 CKB minimum just in capacity costs.`,
    task: "Issue your own xUDT token on CKB testnet. Issue at least 1,000 units.",
    steps: [
      {
        text: "Open OffCKB and navigate to the xUDT example, or use the CCC Playground.",
        windowsNote: "If OffCKB isn't installed: run 'npm install -g @offckb/cli' in PowerShell as Administrator.",
      },
      {
        text: "Run 'offckb node' to start the devnet OR set your environment to testnet.",
        windowsNote: "In PowerShell: $env:NETWORK='testnet' before running your script.",
      },
      {
        text: "Issue at least 1,000 units of your token to your own address.",
      },
      {
        text: "After confirmation, copy the Type Script hash of your token (visible in the CKB explorer transaction output).",
        link: { label: "CKB Testnet Explorer", url: "https://pudge.explorer.nervos.org" },
      },
      {
        text: "Paste the Type Script hash (also called token type hash) below.",
      },
    ],
    inputLabel: "Token Type Script hash",
    inputPlaceholder: "0x55e7086c...",
    inputType: "typeScriptHash",
    verifyHint: "Must be a valid xUDT type script hash on testnet with at least 1,000 units issued",
  },
  {
    id: 6,
    slug: "lock-your-ckb",
    title: "Lock Your CKB",
    subtitle: "Deposit into the Nervos DAO and opt into inflation protection",
    reward: 150,
    concept: `CKB has two issuance streams. Primary issuance goes to miners on a halving schedule.
Secondary issuance is proportional to how much of the total CKB supply is used for state storage.

Without the DAO, secondary issuance dilutes every holder quietly, every block.
The DAO lets you opt in to receiving your share of it back.

This is not staking. You are not securing the network. You are protecting your
position in the supply. Deposit, and secondary issuance flows to you instead of past you.

The deposit is one transaction: a cell with the NervosDAO type script and exactly
8 zero bytes in the data field. That zero placeholder gets replaced with the deposit
block number when you initiate withdrawal later.`,
    task: "Deposit at least 100 CKB into the Nervos DAO on testnet. Paste the deposit transaction hash.",
    steps: [
      {
        text: "Open the CCC Playground and connect your wallet.",
        link: { label: "CCC Playground", url: "https://live.ckbccc.com" },
      },
      {
        text: "Run the Nervos DAO deposit example, which creates a cell with the NervosDAO type script and 8 zero bytes of data.",
        windowsNote: "You can also use the NervDAO browser app if you prefer a UI.",
      },
      {
        text: "Deposit at least 100 CKB.",
      },
      {
        text: "After confirmation, open the transaction in the testnet explorer. You should see an output labelled 'Nervos DAO Deposit'.",
        link: { label: "CKB Testnet Explorer", url: "https://pudge.explorer.nervos.org" },
      },
      {
        text: "Paste the deposit transaction hash below.",
      },
    ],
    inputLabel: "Deposit transaction hash",
    inputPlaceholder: "0xb3109e50...",
    inputType: "txHash",
    verifyHint: "Must be a confirmed DAO deposit tx with at least 100 CKB locked",
  },
  {
    id: 7,
    slug: "write-something-permanent",
    title: "Write Something Permanent",
    subtitle: "Mint a Spore: no URL, no IPFS, the actual bytes on-chain",
    reward: 200,
    concept: `Most NFTs are a lie. The token is on-chain. The content is not.
It lives on IPFS, or worse, a centralised server. If that server disappears, the NFT is blank.

Spore Protocol takes a different position: the content goes directly into the cell's data field.
Not a pointer to the content. The content itself. Text, images, whatever fits.
As long as CKB runs, the content runs with it. No external dependency, ever.

The cell model makes this possible because cells can hold arbitrary bytes.
Spore just defines a standard encoding: content-type string + raw content bytes,
packed into a molecule struct and written into the data field.

Whatever you mint today will still be readable in 20 years if someone runs a node.`,
    task: "Create a Spore on testnet with any content. Paste the Spore ID.",
    steps: [
      {
        text: "Open the Spore SDK quickstart or the Spore demo app.",
        link: { label: "docs.spore.pro", url: "https://docs.spore.pro" },
      },
      {
        text: "Write a createCluster transaction if you want to put it in a collection (optional). Otherwise skip straight to minting.",
      },
      {
        text: "Write a createSpore transaction with contentType: 'text/plain' and any content you like.",
        windowsNote: "Install the SDK: npm install @spore-sdk/core. Run the script with ts-node or tsx.",
      },
      {
        text: "After confirmation, the terminal or explorer will show your Spore ID, which is the type.args of the output cell.",
        link: { label: "CKB Testnet Explorer", url: "https://pudge.explorer.nervos.org" },
      },
      {
        text: "Paste the Spore ID (the 0x… type args) below.",
      },
    ],
    inputLabel: "Spore ID (type args)",
    inputPlaceholder: "0x596f780b...",
    inputType: "sporeId",
    verifyHint: "Must be a confirmed Spore cell on testnet with non-empty content",
  },
  {
    id: 8,
    slug: "find-the-bitcoin-ghost",
    title: "Find the Bitcoin Ghost",
    subtitle: "Decode a live RGB++ binding: a Bitcoin UTXO hiding inside a CKB cell",
    reward: 250,
    concept: `RGB++ binds Bitcoin UTXOs to CKB cells, one-to-one. To transfer an RGB++ asset,
you spend both the Bitcoin UTXO and the matching CKB cell in a coordinated transaction.
No bridge operator. No wrapping. The Bitcoin chain provides ownership proof.
The CKB cell holds the state and contract logic.

Every RGB++ cell on CKB announces exactly which Bitcoin UTXO owns it.
That ownership is encoded directly in the cell's lock args, 36 bytes:

  VOUT (4 bytes, little-endian) + BTC TXID (32 bytes, little-endian)

That's the whole protocol in one line. Find a live RGB++ cell on CKB mainnet,
decode those 36 bytes, and you'll see a real Bitcoin TXID staring back at you.
A Bitcoin UTXO, hiding inside a CKB lock script.`,
    task: "Query CKB mainnet for a live RGB++ cell. Decode its lock args and submit the bound Bitcoin TXID and VOUT.",
    steps: [
      {
        text: "Write a script that queries the CKB mainnet indexer for RGB++ cells using prefix search on the lock code hash.",
        link: { label: "CKB Mainnet RPC", url: "https://mainnet.ckb.dev/rpc" },
      },
      {
        text: "The RGB++ lock code hash on mainnet is: 0xbc6c568a1a0d0a09f6844dc9d74ddb4343c32143ff25f727c59edf4fb72d6936 (hash_type: type).",
        windowsNote: "Install: npm install @rgbpp-sdk/ckb. Use getRgbppLockScript(true) to get the mainnet constants.",
      },
      {
        text: "Take any result cell. Read its lock.args (36 bytes). The first 4 bytes (little-endian) are the VOUT. The next 32 bytes (reversed) are the Bitcoin TXID.",
      },
      {
        text: "Reverse the byte order to recover the human-readable Bitcoin TXID (big-endian). Confirm the VOUT integer.",
      },
      {
        text: "Paste the result below as: txid:vout (e.g. a4a078ff...00:0). The system will verify the cell exists on mainnet.",
      },
    ],
    inputLabel: "Bitcoin TXID:VOUT",
    inputPlaceholder: "a4a078ff5ff42f2b...00:0",
    inputType: "btcBinding",
    verifyHint: "Format: 64-char hex txid colon vout number. Must match a live RGB++ cell on CKB mainnet.",
  },
  {
    id: 9,
    slug: "mint-your-quester",
    title: "Mint Your Quester",
    subtitle: "Put your face on-chain: the capstone of everything you just learned",
    reward: 175,
    concept: `Every address that reaches this point has a Quester: a small pixel portrait
generated deterministically from your CKB address. Same address, same face, every time.
Nobody assigned it to you. It falls directly out of the bytes of who you are on this chain.

So far the portrait only exists in your browser. This checkpoint makes it permanent.

You mint it as a Spore. Not a link to the image, not an IPFS pin that rots in two years.
The actual SVG bytes go into the cell's data field, the same way Checkpoint 7 taught you.
From the moment it confirms, your Quester is a CKB cell that anyone can read for as long
as the chain runs. You are not buying a profile picture. You are writing your identity
into permanent on-chain storage and paying the exact capacity it occupies.

This is the whole point of the cell model in one click: arbitrary data, owned by you,
priced honestly in the space it takes.`,
    task: "Mint your Quester avatar as a Spore on testnet. One button below builds the transaction, your wallet signs it, and the system verifies the on-chain content is exactly your portrait.",
    steps: [
      {
        text: "Make sure your wallet is connected. Your Quester appears below, generated from your address.",
      },
      {
        text: 'Click "Mint Your Quester". This builds a Spore creation transaction with your portrait SVG as the content and asks your wallet to sign it.',
        windowsNote: "Nothing to install. The mint happens in the browser through the wallet you already connected.",
      },
      {
        text: "Approve the transaction in your wallet. It costs a few hundred CKB in cell capacity, the honest price of the bytes your portrait occupies, which you can reclaim later by melting the Spore.",
      },
      {
        text: "Wait for confirmation. The system reads your new Spore back from testnet and checks the bytes match your Quester exactly.",
      },
      {
        text: "If the indexer is still catching up when verification runs, just click Verify again in a few seconds.",
      },
    ],
    inputLabel: "Spore ID (filled in automatically after minting)",
    inputPlaceholder: "0x… minted Spore ID",
    inputType: "quester",
    verifyHint: "Verified on-chain: the Spore's content must be the exact avatar generated for your address.",
  },
];

// The required spine: every non-optional checkpoint. Completion of the quest is defined
// over these, so the Fiber bonus checkpoints can stay offline without stranding finishers.
export const REQUIRED_CHECKPOINTS = CHECKPOINTS.filter((c) => !c.optional);

export const TOTAL_REWARD = CHECKPOINTS.reduce((sum, c) => sum + c.reward, 0);

// ─── Presentation helpers, used by the landing page ───────────────────────────
// The marketing page used to carry its own trimmed copy of this list, which
// meant the pitch could quote rewards the product does not actually pay. It now
// counts the same array the quest runs on, so the two cannot disagree.

export const hex = (n: number) => `0x${n.toString(16).padStart(2, "0")}`;

// The number a player sees. Deliberately not the id: ids are stable storage keys and carry
// gaps where cut checkpoints used to sit, so labelling cards with them would show 0x06 on
// the card counting 4 of 7.
export const positionOf = (id: number) => CHECKPOINTS.findIndex((c) => c.id === id) + 1;

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
