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
Every cell requires a minimum of 61 CKBytes to exist that 61 CKB is not a fee,
it's the on-chain storage cost of the cell itself. 1 CKByte = 1 byte of on-chain storage.

This is fundamentally different from Ethereum, where you pay gas once and state
persists forever. On CKB, your cells occupy space, and that space is priced in CKBytes.`,
    task: "Connect your wallet, claim testnet CKB from the faucet, and verify your address has at least 100 CKB.",
    steps: [
      {
        text: 'Click "Connect Wallet" above. Use JoyID (passkey, no seed phrase) or MetaMask.',
      },
      {
        text: "Copy your CKB address (starts with ckt1 for testnet).",
      },
      {
        text: "Go to the testnet faucet and claim CKB.",
        link: { label: "faucet.nervos.org", url: "https://faucet.nervos.org" },
        windowsNote: "Open this link in any browser no special setup needed on Windows.",
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
    task: "Send exactly 100 CKB to the quest address below. Your transaction must have a change output back to your address.",
    steps: [
      {
        text: "Use the CKB Airdrop app or CCC Playground to send CKB.",
        link: { label: "CCC Playground", url: "https://live.ckbccc.com" },
      },
      {
        text: "Send exactly 100 CKB to: ckt1qzda0cr08m85hc8jlnfp3elzk7jkwdf7yw5q4ek (quest address).",
        windowsNote: "Copy this address exactly no spaces before or after.",
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
    id: 4,
    slug: "fiber-first-contact",
    title: "Fiber First Contact",
    subtitle: "Run a node. Open a channel. Touch the Lightning.",
    reward: 200,
    concept: `Fiber is CKB's payment channel network like Bitcoin's Lightning Network
but supporting multiple assets (CKB, RGB++ tokens, stablecoins) and using PTLCs
instead of HTLCs for better security.

Here's what payment channels actually are:
  1. You lock CKB into a channel contract on-chain (funding transaction)
  2. You and your counterparty exchange signed off-chain state updates instant, no fees
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
for future use specifically, for micropayment systems. Fiber makes it finally practical.

The flow:
  1. Your client requests a resource (GET /api/data)
  2. Server responds 402 with a Fiber invoice
  3. Your client pays the invoice over Fiber (instant, ~0.001 CKB)
  4. Client replays the request with a payment proof header
  5. Server verifies payment and returns the data

This is pay-per-call API monetization with no subscriptions, no credit cards,
no accounts just a wallet and an open Fiber channel. The implications for AI
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

export const TOTAL_REWARD = CHECKPOINTS.reduce((sum, c) => sum + c.reward, 0);
