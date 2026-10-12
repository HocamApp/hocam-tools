import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, toolsUrl } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

const TITLE = "Ücretsiz Sınav Araçları";
const DESCRIPTION =
  "YKS puan ve sıralama hesaplama: net ve OBP'den tahmini puanını ve sıranı ÖSYM verileriyle gör. Ücretsiz, kayıt gerekmez.";

export const metadata: Metadata = {
  // Kök segmentte layout'taki title.template uygulanmaz; son ek elle eklenir.
  title: `${TITLE} | Hocam`,
  description: DESCRIPTION,
  alternates: { canonical: toolsUrl() },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Hocam",
    url: toolsUrl(),
    title: `${TITLE} | Hocam`,
    description: DESCRIPTION,
    images: [{ url: `${SITE_URL}/brand/hocam-logo.png`, width: 1024, height: 1024, alt: "Hocam" }],
  },
};

export default function ToolsHub() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Hocam", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Araçlar", item: toolsUrl() },
          ],
        }}
      />
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{TITLE}</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-mid">
        YKS, LGS ve KPSS için en çok aranan hesaplamalar, tek yerde. Hepsi ücretsiz; kayıt gerekmez ve
        girdiğin bilgiler cihazından çıkmaz.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/${tool.slug}`}
              className="block h-full rounded-2xl border border-line bg-surface p-5 hover:border-ink"
            >
              <h2 className="text-xl font-bold text-pink-deep">{tool.name}</h2>
              <p className="mt-2 text-ink">{tool.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
