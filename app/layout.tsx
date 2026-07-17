import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "Weekmark Household Lab";
const description = "A clean-room household finance dashboard built with deterministic fictional data.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"))
    ?.split(",")[0]
    .trim();
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocol = forwardedProtocol === "http" || host?.startsWith("localhost") ? "http" : "https";
  const imageUrl = host ? `${protocol}://${host}/og.png` : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: "Weekmark household planning dashboard" }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

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
