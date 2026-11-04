import type { Metadata } from "next";
import { org } from "@/content/site";

/**
 * No production domain has been chosen. Set NEXT_PUBLIC_SITE_URL once there is
 * one. On Vercel the project's own URL is used until then.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3600");

export function pageMeta(title: string | null, description: string, path: string): Metadata {
  const fullTitle = title ? `${title} | ${org.name}` : `${org.name} | Sports, Fitness & Hospitality in Miami`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: org.name,
      type: "website",
      locale: "en_US",
      images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: org.name }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: ["/images/og.jpg"] },
  };
}
