import type { MetadataRoute } from "next";
import { nav } from "@/content/site";
import { siteUrl } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return nav.map((item) => ({ url: `${siteUrl}${item.href === "/" ? "" : item.href}` }));
}
