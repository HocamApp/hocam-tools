import { KpssCalculator } from "@/components/KpssCalculator";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "kpss-puan-hesaplama")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "Neden sıra hesaplanmıyor?",
    a: "ÖSYM KPSS için puan dağılımı (belirli bir puanın kaçıncı sırada olduğunu gösteren tablo) yayımlamıyor; yalnızca testlerin ortalama ve standart sapmasını yayımlıyor. Resmî dayanağı olmayan bir sıra tahmini yapmıyoruz. Sıran ÖSYM sonuç belgesinde yer alır.",
  },
  {
    q: "Puan ne kadar doğru?",
    a: "Yaklaşık. KPSS puanı formülü, ağırlıklı standart puanların standart sapmasını ve en yüksek değerini kullanır; ÖSYM bu ikisini yayımlamaz. Standart sapmayı Genel Yetenek ve Genel Kültür arasında 0,8 korelasyon varsayarak, en yüksek değeri tüm soruların doğru olduğu aday olarak hesaplıyoruz. Sonuç yaklaşık ±2 puan sapabilir.",
  },
  {
    q: "P1, P2 ve P3 farkı nedir?",
    a: "Üçü de Genel Yetenek ve Genel Kültür'den oluşur, yalnızca ağırlıkları farklıdır: P1'de Genel Yetenek %70, Genel Kültür %30; P2'de %60 ve %40; P3'te %50 ve %50. Hangi puan türünün kullanılacağını ilgili kurum ilanında belirtir.",
  },
  {
    q: "Alan bilgisi, ön lisans ve ortaöğretim puanları var mı?",
    a: "Şimdilik yok. Bu araç Lisans düzeyi Genel Yetenek-Genel Kültür puanlarını (P1, P2, P3) hesaplar. Diğer puan türleri doğrulanabildikçe eklenecek.",
  },
  {
    q: "Hangi sınavın verisi kullanılıyor?",
    a: "2026 KPSS Lisans. Her sınavın zorluğu farklı olduğundan aynı net farklı sınavlarda farklı puan getirir.",
  },
  {
    q: "Girdiğim bilgiler kaydediliyor mu?",
    a: "Hayır. Hesaplama tarayıcında yapılır; girdiğin sayılar hiçbir yere gönderilmez ve kaydedilmez.",
  },
];

export default function Page() {
  return (
    <ToolPage
      tool={tool}
      showCta={false}
      lead="Genel Yetenek ve Genel Kültür doğru ve yanlış sayılarını gir; KPSS Lisans P1, P2 ve P3 puanını ÖSYM'nin resmî formülüyle yaklaşık olarak hesapla."
      faq={FAQ}
      article={
        <>
          <h2>KPSS puanı nasıl hesaplanır?</h2>
          <ol>
            <li>Ham puan (net) = doğru − yanlış ÷ 4.</li>
            <li>Standart puan = 50 + 10 × (net − ortalama) ÷ standart sapma. Ortalama ve standart sapma ÖSYM&apos;nin yayımladığı 2026 KPSS Lisans değerleridir.</li>
            <li>Ağırlıklı standart puan (ASP) = testlerin standart puanlarının puan türü ağırlıklarıyla toplamı.</li>
            <li>KPSS puanı = 70 + 30 × [2(ASP − X) − S] ÷ [2(B − X) − S]. Burada X ASP ortalaması, S ASP standart sapması, B en yüksek ASP&apos;dir.</li>
          </ol>
          <p>
            ÖSYM, X ve S ile B&apos;yi yayımlamaz. X için 50, S için Genel Yetenek-Genel Kültür korelasyonuna dayalı bir
            kestirim, B için tüm soruların doğru olduğu aday kullanılır. Bu yüzden sonuç yaklaşık bir değerdir.
          </p>

          <h2>Kaynaklar</h2>
          <ul>
            <li>
              <a href="https://dokuman.osym.gov.tr/pdfdokuman/2026/KPSS/LISANS/kilavuz_Ld01072026.pdf" rel="noopener">
                ÖSYM 2026 KPSS Lisans Kılavuzu
              </a>{" "}
              (§3.10 değerlendirme, Tablo-2 ağırlıklar)
            </li>
            <li>
              <a
                href="https://dokuman.osym.gov.tr/web/2026/10/2026-kpss-lisans-sinavi-sonuclarina-liskin-sayisal-bilgiler-l38b0s-07100549.pdf"
                rel="noopener"
              >
                ÖSYM 2026 KPSS Lisans Sonuçlarına İlişkin Sayısal Bilgiler
              </a>{" "}
              (test ortalamaları ve standart sapmaları)
            </li>
          </ul>
        </>
      }
    >
      <KpssCalculator />
    </ToolPage>
  );
}
