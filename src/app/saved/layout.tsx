import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved spots",
  description: "Your shortlist of restaurants saved on this device.",
  robots: { index: false, follow: false },
};

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
