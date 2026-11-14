import type { Metadata } from "next";
import { org } from "@/content/site";

export const metadata: Metadata = {
  title: { absolute: `Dashboard | ${org.name}` },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-paper">{children}</div>;
}
