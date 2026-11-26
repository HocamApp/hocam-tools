import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, toolsUrl } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

const TITLE = "Ücretsiz Sınav Araçları";
const DESCRIPTION =
  "Beş ücretsiz sınav aracı: YKS puan ve sıralama, LGS sıralama, bölüm bulma, 2027 YKS ve LGS geri sayım konu planlayıcı ve Pomodoro çalışma sayacı.";

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

/* Çizgi ikonlar, araç slug'ına göre. Bilinmeyen bir araç takvim ikonunu alır. */
const ICONS: Record<string, string> = {
  "yks-puan-siralama-hesaplama":
    "M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5zM8 7.5h8M8 12h2M12 12h2M8 16h2M12 16h4",
  "lgs-siralama-hesaplama": "M4 20h16M7 16v-4M12 16V8M17 16v-7",
  "bolum-bulucu": "M3 9l9-4.5L21 9l-9 4.5zM7 11v4.5c1.5 1.3 3.2 2 5 2s3.5-.7 5-2V11",
  "yks-lgs-kac-gun-kaldi": "M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 9.5h16M9 3v4M15 3v4",
  "pomodoro-sayaci": "M12 5.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM12 9v4l2.5 2M9.5 2.5h5",
};

function ToolIcon({ slug }: { slug: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[slug] ?? ICONS["yks-lgs-kac-gun-kaldi"]} />
    </svg>
  );
}

function updatedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Araçlar ana sayfası, tasarım C (Arda, 24 Kasım 2026): ilk araç (YKS puan ve
 * sıralama) plum bir kartta sarı "Hesapla" düğmesiyle öne çıkar, diğerleri
 * altında tek bir beyaz listede, her satırda çizgi ikon, bir cümle, son
 * güncelleme etiketi ve çerçeveli "Aç" düğmesi.
 */
export default function ToolsHub() {
  const [featured, ...rest] = TOOLS;
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
      <div className="shell pb-16 pt-8 sm:pb-24 sm:pt-12">
      <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-[40px]">{TITLE}</h1>
      <p className="mt-2 max-w-2xl text-base text-ink-mid sm:text-lg">
        Beş araç, hepsi ücretsiz. Hesaplama araçlarına girdiğin sayılar cihazından çıkmaz; giriş yaptığında Pomodoro
        oturumların hesabında saklanır.
      </p>

      <Link
        href={`/${featured.slug}`}
        className="group mt-6 grid gap-4 rounded-[28px] bg-plum p-6 text-on-plum sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:p-7"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-plum-quiet text-yellow">
          <ToolIcon slug={featured.slug} />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-bold sm:text-2xl">{featured.name}</span>
          <span className="mt-1 block text-on-plum-mid">{featured.blurb}</span>
        </span>
        <span className="inline-flex min-h-12 items-center justify-center justify-self-start rounded-full bg-yellow px-6 font-bold text-ink group-hover:bg-surface sm:justify-self-auto">
          Hesapla <span aria-hidden="true">&nbsp;→</span>
        </span>
      </Link>

      <ul className="mt-4 overflow-hidden rounded-[24px] border border-line bg-surface">
        {rest.map((tool) => (
          <li key={tool.slug} className="border-t border-line first:border-t-0">
            <Link
              href={`/${tool.slug}`}
              className="group grid grid-cols-[auto_1fr] items-start gap-x-4 sm:items-center gap-y-3 px-5 py-5 hover:bg-paper sm:grid-cols-[auto_1fr_auto] sm:px-6"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-line bg-paper text-plum">
                <ToolIcon slug={tool.slug} />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold">{tool.name}</span>
                <span className="mt-0.5 block text-ink-mid">{tool.blurb}</span>
                <span className="mt-2 inline-block rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-mid">
                  Son güncelleme: {updatedLabel(tool.updatedAt)}
                </span>
              </span>
              <span className="col-start-2 inline-flex min-h-11 items-center justify-center justify-self-start rounded-full border-[1.5px] border-plum px-5 font-bold group-hover:bg-surface sm:col-start-3 sm:justify-self-auto">
                Aç
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-ink-mid">
        Sonuçlar bilgilendirme amaçlıdır; resmî değerlendirme ÖSYM ve MEB&apos;e aittir.
      </p>
      </div>
    </>
  );
}
