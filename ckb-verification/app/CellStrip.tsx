// A small visual of the document on chain: one filled square for the manifest cell,
// then one outlined square per chunk cell. The picture is the point of the project,
// so it shows up wherever a document's shape is described.

type Props = {
  chunkCount: number;
  max?: number;
};

export function CellStrip({ chunkCount, max = 64 }: Props) {
  const shown = Math.min(chunkCount, max);
  const overflow = chunkCount - shown;

  return (
    <div className="flex flex-wrap items-center gap-[3px]" aria-hidden="true">
      <span className="inline-block w-[11px] h-[11px] bg-ink" title="manifest cell" />
      {Array.from({ length: shown }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-[11px] h-[11px] border border-border-strong"
          title={`chunk cell ${i + 1}`}
        />
      ))}
      {overflow > 0 && <span className="ml-1 font-mono text-xs text-faint">+{overflow}</span>}
    </div>
  );
}
