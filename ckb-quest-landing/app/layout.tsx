import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const blurb = `Write your first blockchain app this afternoon. Short tasks in your browser, checked against a real network. Free, nothing to install, nothing to buy, no experience needed.`;

export const metadata: Metadata = {
  title: "CKB Quest · write your first blockchain app this afternoon",
  description: blurb,
  openGraph: { title: "CKB Quest", description: blurb, type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
