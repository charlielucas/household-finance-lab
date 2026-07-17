import type { Metadata } from "next";
import SystemShowcase from "./system-showcase";

export const metadata: Metadata = {
  title: "System reference | Weekmark Household Lab",
  description: "A public, synthetic reference for Weekmark's responsive planning interface patterns.",
  alternates: { canonical: "/system" },
  openGraph: {
    title: "System reference | Weekmark Household Lab",
    description: "A public, synthetic reference for Weekmark's responsive planning interface patterns.",
    url: "/system",
  },
};

export default function SystemPage() {
  return <SystemShowcase />;
}
