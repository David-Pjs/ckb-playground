import React from 'react';

interface Props {
  privKey: string;
  address: string;
  balance: string;
  unit: string;
  loading: boolean;
  onChange: (key: string) => void;
}

const PRIV_KEY_RE = /^0x[0-9a-fA-F]{64}$/;

export function WalletPanel({ privKey, address, balance, unit, loading, onChange }: Props) {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '' || PRIV_KEY_RE.test(val)) onChange(val);
  };

  return (
    <div className="card">
      <div className="card-label" style={{ marginBottom: 14 }}>Sender Wallet</div>

      <div className="field">
        <label className="field-label">Private Key</label>
        <input
          type="password"
          className="mono"
          placeholder="0x6109..."
          value={privKey}
          onChange={handleInput}
          autoComplete="off"
          spellCheck={false}
        />
        <span className="field-hint">
          Use a testnet key only. Your key never leaves the browser — all signing happens locally.
        </span>
      </div>

      {address && (
        <div className="account-grid">
          <div>
            <div className="info-pill-label">Address</div>
            <div className="info-pill-value">{address}</div>
          </div>
          <div className="balance-display">
            <div className="balance-amount">{loading ? '…' : balance}</div>
            <div className="balance-unit">{unit}</div>
          </div>
        </div>
      )}
    </div>
  );
}
