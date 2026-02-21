import React from 'react';
import type { Recipient } from './utils';

interface Props {
  recipients: Recipient[];
  amountLabel: string;
  minAmount: number;
  onChange: (recipients: Recipient[]) => void;
}

export function RecipientTable({ recipients, amountLabel, minAmount, onChange }: Props) {
  const update = (i: number, field: keyof Recipient, value: string) => {
    const next = [...recipients];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  const add = () => onChange([...recipients, { address: '', amount: String(minAmount || 100) }]);

  const remove = (i: number) => {
    if (recipients.length <= 1) return;
    onChange(recipients.filter((_, idx) => idx !== i));
  };

  const filled = recipients.filter(r => r.address.trim()).length;

  return (
    <div className="card">
      <div className="table-header">
        <span className="card-label">Recipients</span>
        <div className="table-actions">
          <span className="recipient-count">{filled} of {recipients.length} filled</span>
          <button className="btn-secondary" onClick={add}>+ Add Row</button>
        </div>
      </div>

      <table className="recipients-table">
        <thead>
          <tr>
            <th style={{ width: 30 }}>#</th>
            <th>Address</th>
            <th style={{ width: 145 }}>{amountLabel}</th>
            <th style={{ width: 36 }}></th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((r, i) => {
            const n = Number(r.amount);
            const badAmount = r.address.trim().length > 0 && (isNaN(n) || n < minAmount);
            return (
              <tr key={i}>
                <td className="num">{i + 1}</td>
                <td>
                  <input
                    type="text"
                    placeholder="ckb1… or ckt1…"
                    value={r.address}
                    onChange={e => update(i, 'address', e.target.value)}
                    spellCheck={false}
                  />
                </td>
                <td className="amount-cell">
                  <input
                    type="number"
                    className={badAmount ? 'err' : ''}
                    value={r.amount}
                    min={minAmount}
                    step="any"
                    onChange={e => update(i, 'amount', e.target.value)}
                  />
                </td>
                <td className="action-cell">
                  <button
                    className="btn-ghost"
                    onClick={() => remove(i)}
                    disabled={recipients.length <= 1}
                    title="Remove row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
