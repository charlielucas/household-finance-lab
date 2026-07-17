import type { Metadata } from "next";
import "./globals.css";

const title = "Weekmark Household Lab";
const description = "A clean-room household finance dashboard built with deterministic fictional data.";
const canonicalOrigin = "https://weekmark-household-lab.charlielucas95.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin),
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    description,
    images: [{
      url: "/og.png",
      width: 1200,
      height: 630,
      alt: "Weekmark household planning dashboard",
    }],
    siteName: title,
    title,
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
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
