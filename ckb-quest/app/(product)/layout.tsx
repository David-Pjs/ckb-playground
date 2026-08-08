import { Providers } from "./providers";

// The product room: paper ground, Fraunces, and the wallet connector. The
// connector lives here rather than at the root so the marketing page does not
// ship the CCC bundle to someone who has not decided to start yet.
export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="product">
      <Providers>{children}</Providers>
    </div>
  );
}
