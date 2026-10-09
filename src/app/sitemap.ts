import type { MetadataRoute } from "next";

import { toolsUrl } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

// Yayın adresi: /araclar/sitemap.xml. Ana sitenin robots.txt dosyası bu adrese de işaret etmeli.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: toolsUrl(), changeFrequency: "monthly", priority: 0.8 },
    ...TOOLS.map((tool) => ({
      url: toolsUrl(tool.slug),
      lastModified: new Date(tool.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
