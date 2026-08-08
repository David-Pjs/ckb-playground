import type { Metadata } from "next";
import { Fraunces, Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";

import "./globals.css";

// Both rooms' faces are loaded once here and handed down as variables. Which
// one `font-display` resolves to is decided in globals.css by the room you are
// standing in, not by the component asking for it.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const blurb = `Write your first blockchain app this afternoon. Short tasks in your browser, checked against a real network. Free, nothing to install, nothing to buy, no experience needed.`;

// Without this, every OG and Twitter image resolves against localhost and the
// link unfurls as nothing. The landing page's whole job is to be pasted.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ckb-quest.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "CKB Quest · write your first blockchain app this afternoon",
  description: blurb,
  openGraph: { title: "CKB Quest", description: blurb, type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: "CKB Quest", description: blurb },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${instrument.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
