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
  inputType: "address" | "txHash" | "typeScriptHash" | "channelId" | "paymentHash";
  verifyHint: string;
}

export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 1,
    slug: "get-on-chain",
    title: "Get On-Chain",
    subtitle: "Connect your wallet and get testnet CKB",
    reward: 50,
    concept: `CKB is a blockchain where every piece of state lives in a Cell.
A Cell is like a box that holds both CKBytes (the native token) and arbitrary data.
Every cell requires a minimum of 61 CKBytes to exist — that 61 CKB is not a fee,
it's the on-chain storage cost of the cell itself. 1 CKByte = 1 byte of on-chain storage.

This is fundamentally different from Ethereum, where you pay gas once and state
persists forever. On CKB, your cells occupy space, and that space is priced in CKBytes.`,
    task: "Connect your JoyID wallet, claim testnet CKB from the faucet, and verify your address has at least 100 CKB.",
    steps: [
      {
        text: 'Click "Connect Wallet" above and connect with JoyID. No seed phrase needed — it uses your device passkey.',
      },
      {
        text: "Copy your CKB address (starts with ckt1 for testnet).",
      },
      {
        text: "Go to the testnet faucet and claim CKB.",
        link: { label: "faucet.nervos.org", url: "https://faucet.nervos.org" },
        windowsNote: "Open this link in any browser — no special setup needed on Windows.",
      },
      {
        text: "Paste your address in the faucet, click Claim, and wait ~30 seconds for confirmation.",
      },
      {
        text: "Paste your address below and click Verify. The system will check your balance on testnet.",
      },
    ],
    inputLabel: "Your CKB address",
    inputPlaceholder: "ckt1qzda0cr08m85hc8jlnfp3....",
    inputType: "address",
    verifyHint: "Must have at least 100 CKB on testnet",
  },
  {
    id: 2,
    slug: "send-correctly",
    title: "Send CKB Correctly",
    subtitle: "Master the change output — the most common beginner mistake",
    reward: 75,
    concept: `On CKB, when you send a transaction, your input Cells are destroyed and
new output Cells are created. There is no "balance field" that gets updated.

If you have a Cell with 200 CKB and want to send 100 CKB to Bob, you must:
  1. Consume your 200 CKB cell (it's destroyed)
  2. Create a new cell for Bob with 100 CKB
  3. Create a change cell back to yourself with the remaining ~100 CKB (minus fee)

If you forget the change cell, that CKB is gone. It becomes the transaction fee.
Most beginners lose CKB this way at least once. The CCC SDK handles this automatically
with completeInputsByCapacity() — but understanding WHY it exists matters.`,
    task: "Send exactly 100 CKB to the quest address below. Your transaction must have a change output back to your address.",
    steps: [
      {
        text: "Use the CKB Airdrop app or CCC Playground to send CKB.",
        link: { label: "CCC Playground", url: "https://live.ckbccc.com" },
      },
      {
        text: "Send exactly 100 CKB to: ckt1qzda0cr08m85hc8jlnfp3elzk7jkwdf7yw5q4ek (quest address).",
        windowsNote: "Copy this address exactly — no spaces before or after.",
      },
      {
        text: "Make sure you are connected to testnet (Pudge network).",
      },
      {
        text: "After the transaction confirms, copy the transaction hash from the explorer.",
        link: { label: "CKB Testnet Explorer", url: "https://pudge.explorer.nervos.org" },
      },
      {
        text: "Paste the transaction hash below. The system will verify: correct amount sent, change output exists.",
      },
    ],
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
        text: "Run 'offckb node' to start the devnet — OR set your environment to testnet.",
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
    id: 4,
    slug: "fiber-first-contact",
    title: "Fiber First Contact",
    subtitle: "Run a node. Open a channel. Touch the Lightning.",
    reward: 200,
    concept: `Fiber is CKB's payment channel network — like Bitcoin's Lightning Network
but supporting multiple assets (CKB, RGB++ tokens, stablecoins) and using PTLCs
instead of HTLCs for better security.

Here's what payment channels actually are:
  1. You lock CKB into a channel contract on-chain (funding transaction)
  2. You and your counterparty exchange signed off-chain state updates — instant, no fees
  3. When you're done, one final on-chain transaction settles the final balance

1,000 payments between two parties = 2 on-chain transactions (open + close).
This is how Fiber can do micropayments at 0.0001 CKB each.

The catch: you need a running Fiber node with a funded wallet and at least one open
channel before any payments work. This is exactly the infrastructure gap that stops
most developers. This checkpoint walks you through it.`,
    task: "Run a Fiber node on testnet, fund it, open a channel, and paste the channel ID.",
    steps: [
      {
        text: "Download the Fiber node binary for your platform.",
        link: { label: "Fiber Releases", url: "https://github.com/nervosnetwork/fiber/releases" },
        windowsNote: "Download the Windows binary (fiber-x86_64-pc-windows-msvc.zip). Extract to a folder like C:\\fiber-node\\",
      },
      {
        text: "Create a config file (fiber.toml). The Fiber docs have a testnet template.",
        link: { label: "Run a Fiber Node", url: "https://www.fiber.world/docs/quick-start/run-a-node" },
        windowsNote: "In PowerShell: New-Item -Path C:\\fiber-node\\fiber.toml -ItemType File",
      },
      {
        text: "Start the node: ./fiber run --config fiber.toml",
        windowsNote: "In PowerShell from C:\\fiber-node\\: .\\fiber.exe run --config fiber.toml",
      },
      {
        text: "Get your node's CKB address and fund it from the testnet faucet (need ~300 CKB to open a channel).",
        link: { label: "faucet.nervos.org", url: "https://faucet.nervos.org" },
      },
      {
        text: "Connect to a testnet peer and open a channel with at least 100 CKB.",
        link: { label: "Fiber Testnet Nodes", url: "https://www.fiber.world/docs/getting-started/testnet-nodes" },
        windowsNote: "Use the Fiber RPC: curl -X POST http://127.0.0.1:8227 with the open_channel method.",
      },
      {
        text: "Copy your channel ID from the open_channel response and paste it below.",
      },
    ],
    inputLabel: "Fiber channel ID",
    inputPlaceholder: "0x2cf3a8...",
    inputType: "channelId",
    verifyHint: "Must be a valid open channel on Fiber testnet with at least 100 CKB capacity",
  },
  {
    id: 5,
    slug: "pay-for-something",
    title: "Pay for Something Real",
    subtitle: "Use your channel to pay the Fiber-402 API",
    reward: 300,
    concept: `HTTP 402 Payment Required is a status code from 1996 that was reserved
for future use — specifically, for micropayment systems. Fiber makes it finally practical.

The flow:
  1. Your client requests a resource (GET /api/data)
  2. Server responds 402 with a Fiber invoice
  3. Your client pays the invoice over Fiber (instant, ~0.001 CKB)
  4. Client replays the request with a payment proof header
  5. Server verifies payment and returns the data

This is pay-per-call API monetization with no subscriptions, no credit cards,
no accounts — just a wallet and an open Fiber channel. The implications for AI
agent infrastructure are significant: agents can autonomously pay for data, compute,
and services without human authorization for each transaction.

You're about to make one of those payments for real.`,
    task: "Use your Fiber channel to pay the CKB Quest API endpoint and paste the payment hash.",
    steps: [
      {
        text: "Make sure your Fiber channel from Checkpoint 4 is still open.",
      },
      {
        text: "Call the quest payment endpoint to get a Fiber invoice.",
        link: { label: "Quest Payment Endpoint", url: "/api/quest-invoice" },
      },
      {
        text: "Pay the invoice using your Fiber node's RPC:",
        windowsNote: "In PowerShell: Invoke-WebRequest -Uri http://127.0.0.1:8227 -Method POST -Body '{...send_payment...}'",
      },
      {
        text: "Copy the payment hash from the send_payment response.",
      },
      {
        text: "Paste the payment hash below. The system will verify it on the Fiber network.",
      },
    ],
    inputLabel: "Fiber payment hash",
    inputPlaceholder: "0x9f1c44...",
    inputType: "paymentHash",
    verifyHint: "Must be a valid settled payment on Fiber testnet to the quest node",
  },
];

export const TOTAL_REWARD = CHECKPOINTS.reduce((sum, c) => sum + c.reward, 0);
