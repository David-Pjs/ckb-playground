import React from 'react';
import type { Recipient } from './utils';

interface Props {
  recipients: Recipient[];
  mode: 'ckb' | 'token';
  ckbBalance: string;
  tokenBalance: string;
  tokenSymbol: string;
  minCKB: number;
  isSending: boolean;
  txHash: string | null;
  error: string | null;
  network: string;
  onSend: () => void;
  onExport: () => void;
}

export function TxPanel({
  recipients, mode, ckbBalance, tokenBalance, tokenSymbol,
  minCKB, isSending, txHash, error, network, onSend, onExport,
}: Props) {
  const unit = mode === 'ckb' ? 'CKB' : (tokenSymbol || 'tokens');

  const valid = recipients.filter(r => {
    if (!r.address.trim()) return false;
    const n = Number(r.amount);
    return !isNaN(n) && n > 0 && (mode === 'token' || n >= minCKB);
  });

  const total = valid.reduce((sum, r) => sum + Number(r.amount), 0);
  const balance = mode === 'ckb' ? Number(ckbBalance) : Number(tokenBalance);

  const hasInvalidAmt = recipients.some(r => {
    if (!r.address.trim()) return false;
    const n = Number(r.amount);
    return isNaN(n) || n <= 0 || (mode === 'ckb' && n < minCKB);
  });

  const overBalance = balance > 0 && total > balance;
  const canSend = valid.length > 0 && !hasInvalidAmt && !overBalance && !isSending;

  const explorerBase = network === 'mainnet'
    ? 'https://explorer.nervos.org/transaction'
    : 'https://pudge.explorer.nervos.org/transaction';

  return (
    <div className="card">
      <div className="card-label" style={{ marginBottom: 16 }}>Summary & Send</div>

      <div className="summary-row">
        <div className="summary-stat">
          <div className="stat-value">{valid.length}</div>
          <div className="stat-label">Recipients</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value">{total.toLocaleString()}</div>
          <div className="stat-label">Total {unit}</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value">{balance.toLocaleString()}</div>
          <div className="stat-label">Your Balance</div>
        </div>
      </div>

      {hasInvalidAmt && (
        <div className="alert alert-warning">
          {mode === 'ckb'
            ? `Each recipient must receive at least ${minCKB} CKB (minimum cell capacity on CKB).`
            : 'All amounts must be greater than zero.'}
        </div>
      )}

      {overBalance && (
        <div className="alert alert-error">
          Total exceeds your balance. Reduce amounts or remove some recipients.
        </div>
      )}

      {mode === 'token' && valid.length > 0 && (
        <div className="alert alert-info">
          Each recipient also requires ~162 CKB from your wallet for cell storage. Make sure
          your CKB balance covers {valid.length} × 162 CKB = {valid.length * 162} CKB.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-primary" disabled={!canSend} onClick={onSend}>
        {isSending
          ? <><span className="spinner" />Sending transaction…</>
          : `Send to ${valid.length} recipient${valid.length !== 1 ? 's' : ''}`}
      </button>

      {txHash && (
        <div className="tx-success">
          <div className="tx-success-check">✓</div>
          <div className="tx-success-label">Transaction Submitted</div>
          <div className="tx-hash-box">{txHash}</div>
          <div className="tx-links">
            <a
              href={`${explorerBase}/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Explorer →
            </a>
            <button className="btn-outline" onClick={onExport}>
              Export Receipt CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
