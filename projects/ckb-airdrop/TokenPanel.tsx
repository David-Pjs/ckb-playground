import React from 'react';

interface Props {
  args: string;
  symbol: string;
  decimals: number;
  balance: string;
  loading: boolean;
  onChange: (args: string, symbol: string, decimals: number) => void;
}

export function TokenPanel({ args, symbol, decimals, balance, loading, onChange }: Props) {
  return (
    <div className="card">
      <div className="card-label" style={{ marginBottom: 14 }}>Token (xUDT)</div>

      <div className="token-fields">
        <div className="field" style={{ margin: 0 }}>
          <label className="field-label">Token Args</label>
          <input
            type="text"
            className="mono"
            placeholder="0x..."
            value={args}
            onChange={e => onChange(e.target.value.trim(), symbol, decimals)}
            spellCheck={false}
          />
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label className="field-label">Symbol</label>
          <input
            type="text"
            placeholder="e.g. MYTKN"
            value={symbol}
            onChange={e => onChange(args, e.target.value, decimals)}
          />
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label className="field-label">Decimals</label>
          <input
            type="number"
            min={0}
            max={18}
            value={decimals}
            onChange={e => onChange(args, symbol, Math.max(0, Math.min(18, Number(e.target.value))))}
          />
        </div>
      </div>

      <div className="field-hint" style={{ marginTop: 8 }}>
        The token args is the lock hash that uniquely identifies your xUDT token on CKB.
        Find it in the type script of your token's issuing cell.
      </div>

      {args && (
        <div className="token-balance-row">
          <span className="token-balance-label">Token Balance</span>
          <span className="token-balance-value">
            {loading ? 'Loading…' : `${balance} ${symbol || 'tokens'}`}
          </span>
        </div>
      )}
    </div>
  );
}
