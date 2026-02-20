import React, { useEffect, useState } from 'react';
import { Script } from '@ckb-ccc/core';
import {
  capacityOf,
  generateAccountFromPrivateKey,
  shannonToCKB,
  batchTransfer,
  parseCSV,
  wait,
  Recipient,
} from './lib';

const MIN_CKB = 61;

export function App() {
  // default value: first account privkey from offckb
  const [privKey, setPrivKey] = useState('0x6109170b275a09ad54877b82f7d9930f88cab5717d484fb4741ae9d1dd078cd6');
  const [fromAddr, setFromAddr] = useState('');
  const [fromLock, setFromLock] = useState<Script>();
  const [balance, setBalance] = useState('0');

  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: 'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqt435c3epyrupszm7khk6weq5lrlyt52lg48ucew', amount: '100' },
    { address: '', amount: '100' },
  ]);

  const [csvText, setCsvText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (privKey) {
      updateFromInfo();
    }
  }, [privKey]);

  const updateFromInfo = async () => {
    const { lockScript, address } = await generateAccountFromPrivateKey(privKey);
    const capacity = await capacityOf(address);
    setFromAddr(address);
    setFromLock(lockScript);
    setBalance(shannonToCKB(capacity).toString());
  };

  const onInputPrivKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const priv = e.target.value;
    const privateKeyRegex = /^0x[0-9a-fA-F]{64}$/;
    if (privateKeyRegex.test(priv)) {
      setPrivKey(priv);
    } else {
      alert('Invalid private key: must start with 0x and be 32 bytes length.');
    }
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', amount: '100' }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const importCSV = () => {
    const parsed = parseCSV(csvText);
    if (parsed.length === 0) {
      alert('No valid recipients found in CSV. Format: address,amount (one per line)');
      return;
    }
    setRecipients(parsed);
    setCsvText('');
  };

  // Validation
  const validRecipients = recipients.filter(r => r.address.length > 0 && Number(r.amount) >= MIN_CKB);
  const totalCKB = validRecipients.reduce((sum, r) => sum + Number(r.amount), 0);
  const hasInvalidAmounts = recipients.some(r => r.address.length > 0 && Number(r.amount) < MIN_CKB);
  const exceedsBalance = totalCKB > Number(balance);
  const canSend = validRecipients.length > 0 && !hasInvalidAmounts && !exceedsBalance && !isSending;

  const onSend = async () => {
    setError(undefined);
    setTxHash(undefined);
    setIsSending(true);

    try {
      const hash = await batchTransfer(validRecipients, privKey);
      setTxHash(hash);

      // Wait for tx confirmation then refresh balance
      await wait(10);
      await updateFromInfo();
    } catch (e: any) {
      setError(e?.message || String(e));
    }

    setIsSending(false);
  };

  return (
    <div>
      <h1>CKB Batch Transfer</h1>

      <div className="section">
        <h3>Sender</h3>
        <label htmlFor="private-key">Private Key: </label>
        <input id="private-key" type="text" value={privKey} onChange={onInputPrivKey} />
        <ul>
          <li>Address: {fromAddr}</li>
          <li>Balance: {balance} CKB</li>
        </ul>
      </div>

      <div className="section">
        <h3>Recipients</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Address</th>
              <th>Amount (CKB)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  <input
                    type="text"
                    placeholder="ckb1... or ckt1..."
                    value={r.address}
                    onChange={(e) => updateRecipient(i, 'address', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={MIN_CKB}
                    value={r.amount}
                    onChange={(e) => updateRecipient(i, 'amount', e.target.value)}
                    style={{ width: 120 }}
                  />
                </td>
                <td>
                  <button className="btn-danger" onClick={() => removeRecipient(i)} disabled={recipients.length <= 1}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="btn-secondary" onClick={addRecipient}>+ Add Recipient</button>
      </div>

      <div className="section">
        <h3>Import from CSV</h3>
        <textarea
          rows={4}
          placeholder={"address,amount\nckt1qzda...,100\nckt1qzda...,200"}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
        <br />
        <button className="btn-secondary" onClick={importCSV} disabled={!csvText.trim()}>Import CSV</button>
      </div>

      <div className="section">
        <div className="summary">
          <span><strong>Recipients:</strong> {validRecipients.length}</span>
          <span><strong>Total:</strong> {totalCKB} CKB</span>
          <span><strong>Balance:</strong> {balance} CKB</span>
        </div>

        {hasInvalidAmounts && (
          <p className="error">Each recipient must receive at least {MIN_CKB} CKB.</p>
        )}
        {exceedsBalance && (
          <p className="error">Total amount exceeds your balance.</p>
        )}

        <button className="btn-primary" disabled={!canSend} onClick={onSend}>
          {isSending ? 'Sending...' : `Send to ${validRecipients.length} recipient(s)`}
        </button>

        {error && <p className="error">{error}</p>}

        {txHash && (
          <div className="tx-result">
            Tx Hash: <a href={`https://pudge.explorer.nervos.org/transaction/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a>
          </div>
        )}
      </div>
    </div>
  );
}
