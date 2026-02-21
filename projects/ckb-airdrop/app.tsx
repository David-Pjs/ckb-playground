import React, { useCallback, useEffect, useState } from 'react';
import { WalletPanel } from './WalletPanel';
import { TokenPanel } from './TokenPanel';
import { RecipientTable } from './RecipientTable';
import { CSVPanel } from './CSVPanel';
import { TxPanel } from './TxPanel';
import {
  loadWallet,
  getCKBBalance,
  getTokenBalance,
  batchTransferCKB,
  batchTokenAirdrop,
  type WalletInfo,
} from './transfer';
import { shannonToCKB, exportReceipt, sleep } from './utils';
import type { Recipient } from './utils';
import { readEnvNetwork } from './ccc-client';

type Mode = 'ckb' | 'token';

const PRIV_KEY_RE = /^0x[0-9a-fA-F]{64}$/;
const MIN_CKB = 61;
const DEFAULT_KEY = '0x6109170b275a09ad54877b82f7d9930f88cab5717d484fb4741ae9d1dd078cd6';
const DEFAULT_ROWS: Recipient[] = [
  { address: '', amount: '100' },
  { address: '', amount: '100' },
];

export function App() {
  const [mode, setMode] = useState<Mode>('ckb');

  const [privKey, setPrivKey] = useState(DEFAULT_KEY);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [ckbBalance, setCKBBalance] = useState('0');
  const [walletLoading, setWalletLoading] = useState(false);

  const [tokenArgs, setTokenArgs] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(8);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenLoading, setTokenLoading] = useState(false);

  const [recipients, setRecipients] = useState<Recipient[]>(DEFAULT_ROWS);
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const network = readEnvNetwork();

  const refreshWallet = useCallback(async (key: string) => {
    if (!PRIV_KEY_RE.test(key)) return;
    setWalletLoading(true);
    try {
      const w = await loadWallet(key);
      setWallet(w);
      const bal = await getCKBBalance(w.address);
      setCKBBalance(shannonToCKB(bal));
    } catch {
      setWallet(null);
      setCKBBalance('0');
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const refreshTokenBalance = useCallback(async (
    w: WalletInfo | null,
    args: string,
    decimals: number,
  ) => {
    if (!w || !args) return;
    setTokenLoading(true);
    try {
      const raw = await getTokenBalance(w.address, args);
      const human = Number(raw) / 10 ** decimals;
      setTokenBalance(human.toString());
    } catch {
      setTokenBalance('0');
    } finally {
      setTokenLoading(false);
    }
  }, []);

  useEffect(() => { refreshWallet(privKey); }, [privKey]);
  useEffect(() => { refreshTokenBalance(wallet, tokenArgs, tokenDecimals); }, [tokenArgs, tokenDecimals, wallet]);

  const handlePrivKeyChange = (key: string) => {
    setPrivKey(key);
    setTxHash(null);
    setError(null);
  };

  const handleTokenChange = (args: string, sym: string, dec: number) => {
    setTokenArgs(args);
    setTokenSymbol(sym);
    setTokenDecimals(dec);
    setTxHash(null);
    setError(null);
  };

  const handleModeSwitch = (next: Mode) => {
    setMode(next);
    setTxHash(null);
    setError(null);
  };

  const handleSend = async () => {
    if (!wallet) return;
    setError(null);
    setTxHash(null);
    setIsSending(true);

    const valid = recipients.filter(r => {
      if (!r.address.trim()) return false;
      const n = Number(r.amount);
      return !isNaN(n) && n > 0;
    });

    try {
      let hash: string;
      if (mode === 'ckb') {
        hash = await batchTransferCKB(valid, wallet.signer);
      } else {
        hash = await batchTokenAirdrop(valid, tokenArgs, tokenDecimals, wallet.signer);
      }
      setTxHash(hash);
      await sleep(8000);
      await refreshWallet(privKey);
      if (mode === 'token') await refreshTokenBalance(wallet, tokenArgs, tokenDecimals);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setIsSending(false);
    }
  };

  const handleExport = () => {
    if (!txHash) return;
    const valid = recipients.filter(r => r.address.trim() && Number(r.amount) > 0);
    const unit = mode === 'ckb' ? 'CKB' : (tokenSymbol || 'token');
    exportReceipt(valid, unit, txHash);
  };

  return (
    <>
      <header className="header">
        <div className="header-brand">
          <div className="brand-icon">⚡</div>
          <span className="brand-name">CKB <span>Airdrop</span></span>
        </div>
        <div className="header-spacer" />
        <div className="network-pill">
          <div className="network-dot" />
          {network}
        </div>
      </header>

      <div className="container">
        <div className="page-title">Token Airdrop Tool</div>
        <div className="page-subtitle">
          Distribute CKB or xUDT tokens to multiple addresses in a single on-chain transaction.
        </div>

        <div className="mode-switcher">
          <button
            className={`mode-btn${mode === 'ckb' ? ' active' : ''}`}
            onClick={() => handleModeSwitch('ckb')}
          >
            ⬡ CKB Transfer
          </button>
          <button
            className={`mode-btn${mode === 'token' ? ' active' : ''}`}
            onClick={() => handleModeSwitch('token')}
          >
            ◈ Token Airdrop
          </button>
        </div>

        <WalletPanel
          privKey={privKey}
          address={wallet?.address ?? ''}
          balance={ckbBalance}
          unit="CKB"
          loading={walletLoading}
          onChange={handlePrivKeyChange}
        />

        {mode === 'token' && (
          <TokenPanel
            args={tokenArgs}
            symbol={tokenSymbol}
            decimals={tokenDecimals}
            balance={tokenBalance}
            loading={tokenLoading}
            onChange={handleTokenChange}
          />
        )}

        <RecipientTable
          recipients={recipients}
          amountLabel={mode === 'ckb' ? 'Amount (CKB)' : `Amount (${tokenSymbol || 'tokens'})`}
          minAmount={mode === 'ckb' ? MIN_CKB : 0}
          onChange={setRecipients}
        />

        <CSVPanel onImport={setRecipients} />

        <TxPanel
          recipients={recipients}
          mode={mode}
          ckbBalance={ckbBalance}
          tokenBalance={tokenBalance}
          tokenSymbol={tokenSymbol}
          minCKB={MIN_CKB}
          isSending={isSending}
          txHash={txHash}
          error={error}
          network={network}
          onSend={handleSend}
          onExport={handleExport}
        />
      </div>
    </>
  );
}
