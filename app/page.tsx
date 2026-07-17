import Dashboard from "./dashboard";
import { createDashboardBundle } from "../lib/model.ts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekmark Household Lab",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Weekmark Household Lab",
    description: "A clean-room household finance dashboard built with deterministic fictional data.",
    images: [{
      url: "/og.png",
      width: 1200,
      height: 630,
      alt: "Weekmark household planning dashboard",
    }],
    siteName: "Weekmark Household Lab",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weekmark Household Lab",
    description: "A clean-room household finance dashboard built with deterministic fictional data.",
    images: ["/og.png"],
  },
};

export default function Home() {
  return <Dashboard initialBundle={createDashboardBundle()} />;
}
