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
    slug: "tyt-net-hesaplama",
    name: "TYT Net Hesaplama",
    metaTitle: "TYT Net Hesaplama Aracı",
    description:
      "TYT'de doğru ve yanlış sayılarını gir, ders bazında ve toplam netini anında hesapla. Ücretsiz, kayıt gerektirmez.",
    blurb: "Türkçe, Sosyal, Matematik ve Fen netini ders ders hesapla.",
    updatedAt: "2026-10-10",
  },
  {
    slug: "ayt-net-hesaplama",
    name: "AYT Net Hesaplama",
    metaTitle: "AYT Net Hesaplama Aracı",
    description:
      "Sayısal, Eşit Ağırlık veya Sözel alanını seç, AYT doğru ve yanlışlarını gir; ders bazında netini hesapla. Ücretsiz.",
    blurb: "Alanını seç, AYT netini ders bazında gör.",
    updatedAt: "2026-10-10",
  },
  {
    slug: "obp-hesaplama",
    name: "OBP Hesaplama",
    metaTitle: "OBP Hesaplama Aracı",
    description:
      "Diploma notunu gir, OBP puanını ve YKS yerleştirme puanına katkısını hesapla. Kırık OBP durumunu da gösterir.",
    blurb: "Diploma notundan OBP'ni ve puana katkısını hesapla.",
    updatedAt: "2026-10-10",
  },
  {
    slug: "hedef-net-planlayici",
    name: "Hedef Net Planlayıcı",
    metaTitle: "Hedef Net Planlayıcı: YKS Net Hedefi Aracı",
    description:
      "TYT veya AYT'de şimdiki ve hedef netini ders ders gir; hedefe ulaşmak için hangi derste kaç net artırman gerektiğini gör. Ücretsiz.",
    blurb: "Hedef netine hangi derste ne kadar yaklaştığını ders ders gör.",
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
