import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { SharedNavbar } from "@/components/SharedNavbar";

import "./globals.css";
import { SITE_URL, mainUrl } from "@/lib/site";

/* latin-ext şart: ğ, ş, İ, ı yoksa sistem fontuna düşer ve kelime ortasında karışık glif görünür. */
const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
  display: "swap",
});

/* Ana site bu uygulamayı rewrite ile ön yüzler; Vercel dış hedefli rewrite
   yanıtlarını s-maxage'e göre kenarda saklar. Statik sayfaların varsayılanı
   bir yıl olduğundan burada kısaltılır; aksi hâlde bu projeyi yeniden
   yayımlamak ana sitedeki kopyayı yenilemez. */
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Hocam",
  title: { default: "Ücretsiz Sınav Araçları | Hocam", template: "%s | Hocam" },
  icons: { icon: [{ url: `${SITE_URL}/brand/hocam-logo.png`, type: "image/png" }] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const FOOTER_LINKS = [
  { label: "YKS özel ders", path: "/yks-ozel-ders" },
  { label: "Nasıl çalışır", path: "/nasil-calisir" },
  { label: "Hoca doğrulama", path: "/hocalar-nasil-dogrulaniyor" },
  { label: "İletişim", path: "/iletisim" },
  { label: "KVKK ve Gizlilik", path: "/kvkk" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={poppins.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          İçeriğe geç
        </a>

        <SharedNavbar />

        <main id="icerik" tabIndex={-1} className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 focus:outline-none sm:py-12">
          {children}
        </main>

        <footer className="border-t border-line bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-ink-mid">
            <nav aria-label="Alt bağlantılar">
              <ul className="flex flex-wrap gap-x-6">
                {FOOTER_LINKS.map((l) => (
                  <li key={l.path}>
                    <a
                      href={mainUrl(l.path, "site-footer")}
                      className="inline-flex min-h-11 items-center underline"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="mt-3">© Hocam. Hesaplama girdilerin kaydedilmez; oturumun açıksa üst menü Hocam hesabını kullanır.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
