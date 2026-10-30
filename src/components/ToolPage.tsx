import Link from "next/link";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, TOOLS_PATH, mainUrl, toolsUrl } from "@/lib/site";
import { TOOLS, type Tool } from "@/lib/tools";

export type Faq = { q: string; a: string };

type Props = {
  tool: Tool;
  lead: string;
  faq: Faq[];
  /** Araç altındaki açıklayıcı bölümler (h2 ile başlayan JSX). */
  article: ReactNode;
  /** Hesaplayıcı. */
  children: ReactNode;
  /** Ana siteye (YKS özel ders) yönlendiren kutu; YKS dışı araçlarda kapatılır. Varsayılan: açık. */
  showCta?: boolean;
};

export function ToolPage({ tool, lead, faq, article, children, showCta = true }: Props) {
  const others = TOOLS.filter((t) => t.slug !== tool.slug);
  const updated = new Date(tool.updatedAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Hocam", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Araçlar", item: toolsUrl() },
              { "@type": "ListItem", position: 3, name: tool.name, item: toolsUrl(tool.slug) },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: tool.name,
            url: toolsUrl(tool.slug),
            description: tool.description,
            applicationCategory: "EducationalApplication",
            operatingSystem: "Any",
            inLanguage: "tr-TR",
            isAccessibleForFree: true,
            dateModified: tool.updatedAt,
            offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
            publisher: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Hocam" },
          },
        ]}
      />

      <nav aria-label="Sayfa yolu" className="text-sm text-ink-mid">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li>
            <a href={SITE_URL} className="underline">Hocam</a>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <a href={TOOLS_PATH} className="underline">Araçlar</a>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page">{tool.name}</li>
        </ol>
      </nav>

      <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{tool.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-mid">{lead}</p>

      <div className="mt-8">{children}</div>

      <div className="prose-hocam mt-12 max-w-2xl">{article}</div>

      <section aria-labelledby="sss" className="prose-hocam mt-12 max-w-2xl">
        <h2 id="sss">Sık sorulan sorular</h2>
        {faq.map((item) => (
          <div key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </section>

      {showCta && (
        <section
          aria-labelledby="destek"
          className="mt-12 max-w-2xl rounded-2xl bg-pink-pale p-6"
        >
          <h2 id="destek" className="text-xl font-bold">YKS hazırlığında yalnız değilsin</h2>
          <p className="mt-2 text-ink">
            Hocam&apos;da YKS&apos;de derece yapmış, kimliği doğrulanmış hocalarla birebir online ders yapabilirsin.
          </p>
          <a
            href={mainUrl("/", tool.slug)}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-pink-deep px-5 py-2 font-bold text-white hover:bg-ink"
          >
            YKS özel ders hocalarını gör
          </a>
        </section>
      )}

      <section aria-labelledby="diger" className="mt-12">
        <h2 id="diger" className="text-xl font-bold">Diğer araçlar</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {others.map((t) => (
            <li key={t.slug}>
              <Link href={`/${t.slug}`} className="font-medium text-pink-deep underline">
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-12 text-sm text-ink-mid">
        Son güncelleme: {updated}. Sonuçlar bilgilendirme amaçlıdır; resmî değerlendirme ve kılavuz
        hükümleri ÖSYM&apos;ye aittir. Bu sayfada girdiğin bilgiler cihazından çıkmaz ve kaydedilmez.
      </p>
    </>
  );
}
