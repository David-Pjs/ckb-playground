import React, { useState } from 'react';
import { parseCSV } from './utils';
import type { Recipient } from './utils';

interface Props {
  onImport: (recipients: Recipient[]) => void;
}

export function CSVPanel({ onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      setError('No valid rows found. Expected format: address,amount');
      return;
    }
    onImport(parsed);
    setText('');
    setError('');
    setOpen(false);
  };

  const toggle = () => {
    setOpen(o => !o);
    setError('');
  };

  return (
    <div className="card">
      <div
        className="csv-toggle"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && toggle()}
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Import from CSV</span>
      </div>

      {open && (
        <div className="csv-body">
          <textarea
            rows={6}
            className="mono"
            placeholder={'# One recipient per line — header row is optional\naddress,amount\nckt1qzda0cr08...,100\nckt1qzda0cr08...,250\nckt1qzda0cr08...,75'}
            value={text}
            onChange={e => { setText(e.target.value); setError(''); }}
          />
          {error && <div className="alert alert-error">{error}</div>}
          <div className="csv-actions">
            <button className="btn-secondary" onClick={handleImport} disabled={!text.trim()}>
              Import Rows
            </button>
            <span className="csv-hint">Replaces the current recipient list.</span>
          </div>
        </div>
      )}
    </div>
  );
}
