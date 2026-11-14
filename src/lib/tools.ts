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
  {
    slug: "bolum-bulucu",
    name: "YKS Sıralamasına Göre Bölüm Bulucu",
    metaTitle: "YKS Sıralamasına Göre Bölüm Bulma (2025 Taban Sıraları)",
    description:
      "YKS sıralamanı gir; ÖSYM'nin 2025 taban sıralarına göre hangi 4 yıllık bölümlere girebileceğini, hangilerinin sınırda olduğunu gör. Ücretsiz.",
    blurb: "Sıralamanla hangi lisans bölümlerine girebileceğini 2025 taban sıralarıyla gör.",
    updatedAt: "2026-10-13",
  },
  {
    slug: "yks-lgs-kac-gun-kaldi",
    name: "YKS ve LGS Kaç Gün Kaldı",
    metaTitle: "YKS ve LGS Kaç Gün Kaldı? 2027 Sınav Sayacı ve Konu Planlayıcı",
    description:
      "2027 YKS (TYT, AYT, YDT) ve LGS için sınava kaç gün, hafta ve saat kaldığını gör. Kalan konu sayını gir, sınava kadar günlük çalışma planını çıkar.",
    blurb: "2027 YKS ve LGS için kalan gün sayacı ve kalan konu sayına göre günlük çalışma planlayıcı.",
    updatedAt: "2026-11-15",
  },
  {
    slug: "pomodoro-sayaci",
    name: "Pomodoro Çalışma Sayacı",
    metaTitle: "Pomodoro Çalışma Sayacı - YKS ve LGS Odak Süresi Takibi",
    description:
      "Odak ve mola süreni ayarla, kronometreyi başlat. Giriş yaptığında eski sayaçlarını hatırla ve toplam kaç saat çalıştığını takip et.",
    blurb: "Odak ve mola süresini ayarla; giriş yaptığında eski sayaçlarını ve toplam çalışma saatini gör.",
    updatedAt: "2026-11-15",
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
