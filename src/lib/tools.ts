import type { Metadata } from "next";

import { SITE_URL, toolsUrl } from "./site";

export type Tool = {
  slug: string;
  /** H1 ve breadcrumb. */
  name: string;
  /** <title>; şablon "| Hocam" ekler. */
  metaTitle: string;
  /** Meta açıklama, en çok 160 karakter (test eder). */
  description: string;
  /** Hub kartındaki tek cümle. */
  blurb: string;
  /** Formül/katsayı son doğrulama tarihi (YYYY-AA-GG). */
  updatedAt: string;
};

export const TOOLS: Tool[] = [
  {
    slug: "yks-puan-siralama-hesaplama",
    name: "YKS Puan ve Sıralama Hesaplama",
    metaTitle: "YKS Puan ve Sıralama Hesaplama (TYT + AYT + OBP)",
    description:
      "TYT, AYT netlerini ve diploma notunu gir; tahmini YKS puanını ve başarı sıranı ÖSYM verileriyle yaklaşık olarak hesapla. Ücretsiz.",
    blurb: "Net ve OBP'den tahmini puanını ve sıranı, ÖSYM verileriyle yaklaşık olarak gör.",
    updatedAt: "2026-10-12",
  },
  {
    slug: "lgs-siralama-hesaplama",
    name: "LGS Sıralama Hesaplama",
    metaTitle: "LGS Sıralama ve Yüzdelik Dilim Hesaplama",
    description:
      "Derslerdeki netlerini ya da LGS puanını gir; yaklaşık puanını, yüzdelik dilimini ve sıranı gör. Ücretsiz, kayıt gerekmez.",
    blurb: "LGS netinden ya da puanından yaklaşık yüzdelik dilimini ve sıranı gör.",
    updatedAt: "2026-10-12",
  },
];

export function toolMetadata(tool: Tool): Metadata {
  const url = toolsUrl(tool.slug);
  return {
    title: tool.metaTitle,
    description: tool.description,
    // metadataBase basePath'i eklemediği için canonical mutlak verilir.
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: "Hocam",
      url,
      title: `${tool.metaTitle} | Hocam`,
      description: tool.description,
      images: [{ url: `${SITE_URL}/brand/hocam-logo.png`, width: 1024, height: 1024, alt: "Hocam" }],
    },
  };
}
