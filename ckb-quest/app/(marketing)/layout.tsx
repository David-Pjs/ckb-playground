// The marketing room: near-black ground, Instrument Serif, hard edges. The
// class is what switches the palette and the display face — see globals.css.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="marketing">{children}</div>;
}
