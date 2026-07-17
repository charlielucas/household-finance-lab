import type { Metadata } from "next";
import "./globals.css";

const title = "Weekmark Household Lab";
const description = "A clean-room household finance dashboard built with deterministic fictional data.";
const canonicalOrigin = "https://weekmark-household-lab.charlielucas95.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin),
  // Leaf routes provide their complete public title. Keeping one authoritative
  // value here prevents the brand from being appended twice by Next metadata.
  title,
  description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
