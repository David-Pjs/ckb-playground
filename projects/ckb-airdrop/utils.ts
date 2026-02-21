export type Recipient = {
  address: string;
  amount: string;
};

export function shannonToCKB(shannon: bigint): string {
  const whole = shannon / 100_000_000n;
  const frac = shannon % 100_000_000n;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(8, '0').replace(/0+$/, '')}`;
}

export function parseCSV(text: string): Recipient[] {
  return text
    .trim()
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .flatMap(line => {
      const parts = line.split(',');
      const address = parts[0]?.trim();
      const amount = parts[1]?.trim();
      if (!address || !amount) return [];
      const n = Number(amount);
      if (isNaN(n) || n <= 0) return [];
      return [{ address, amount }];
    });
}

export function exportReceipt(
  recipients: Recipient[],
  symbol: string,
  txHash: string,
): void {
  const lines = [
    `# CKB Airdrop Receipt`,
    `# Transaction: ${txHash}`,
    `# Exported: ${new Date().toISOString()}`,
    `address,amount,token`,
    ...recipients.map(r => `${r.address},${r.amount},${symbol}`),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `airdrop-${txHash.slice(2, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
