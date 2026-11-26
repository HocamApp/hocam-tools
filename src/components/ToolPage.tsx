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
  /** Sayfa altındaki doğrulama/gizlilik notu; verilmezse standart ÖSYM notu gösterilir. */
  footerNote?: string;
};

export function ToolPage({ tool, lead, faq, article, children, showCta = true, footerNote }: Props) {
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

      <header className="shell pb-8 pt-8 sm:pt-12">
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

        <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl">{tool.name}</h1>
        <p className="mt-3 max-w-3xl text-lg text-ink-mid">{lead}</p>
      </header>

      <div className="shell pb-16 sm:pb-20">{children}</div>

      {/* Açıklama: tam genişlikte beyaz bant; yanında diğer araçlar. */}
      <section aria-label="Araç hakkında" className="border-y border-line bg-surface py-14 sm:py-20">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="prose-hocam max-w-[70ch]">{article}</div>

          <nav aria-labelledby="diger" className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
            <h2 id="diger" className="text-xl font-bold">Diğer araçlar</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {others.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/${t.slug}`}
                    className="flex min-h-14 items-center rounded-xl border border-line bg-paper px-4 py-3 font-medium text-pink-deep underline hover:border-ink"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <section aria-labelledby="sss" className="shell grid gap-8 py-14 sm:py-20 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-12">
        <div>
          <h2 id="sss" className="text-2xl font-bold leading-tight sm:text-3xl">Sık sorulan sorular</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-mid">
            Son güncelleme: {updated}.{" "}
            {footerNote ??
              "Sonuçlar bilgilendirme amaçlıdır; resmî değerlendirme ve kılavuz hükümleri ÖSYM'ye aittir. Bu sayfada girdiğin bilgiler cihazından çıkmaz ve kaydedilmez."}
          </p>
        </div>
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface px-5 sm:px-7">
          {faq.map((item) => (
            <div key={item.q} className="py-6">
              <h3 className="text-lg font-bold leading-snug">{item.q}</h3>
              <p className="mt-2 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {showCta && (
        <div className="shell pb-16 sm:pb-20">
          <section
            aria-labelledby="destek"
            className="flex flex-col gap-6 rounded-2xl bg-pink-pale p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="max-w-2xl">
              <h2 id="destek" className="text-2xl font-bold">YKS hazırlığında yalnız değilsin</h2>
              <p className="mt-2 text-ink">
                Hocam&apos;da YKS&apos;de derece yapmış, kimliği doğrulanmış hocalarla birebir online ders yapabilirsin.
              </p>
            </div>
            <a
              href={mainUrl("/", tool.slug)}
              className="inline-flex min-h-11 shrink-0 items-center self-start rounded-lg bg-pink-deep px-5 py-2 font-bold text-white hover:bg-ink lg:self-auto"
            >
              YKS özel ders hocalarını gör
            </a>
          </section>
        </div>
      )}
    </>
  );
}
