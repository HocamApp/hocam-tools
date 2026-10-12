import { LgsCalculator } from "@/components/LgsCalculator";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "lgs-siralama-hesaplama")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "Netimi girerek sıramı hesaplayabilir miyim?",
    a: "Hayır. LGS puanı, her yıl o sınavın ders bazındaki ortalama ve standart sapmasına göre hesaplanır; MEB bu değerleri ve puan dağılımını yayımlamaz. Bu yüzden net üzerinden puan ve sıra tahmini dürüstçe yapılamaz. Sonuç belgendeki puanı girerek yüzdelik diliminin ve sıranın yaklaşık karşılığını görebilirsin.",
  },
  {
    q: "Bu hesaplama kesin mi?",
    a: "Hayır, yaklaşıktır. MEB her okulun taban puanını ve o puanın yüzdelik dilimini yayımlar. Araç, bu noktalardan geçen bir eğri kullanır; noktalar arasındaki puanlarda ve farklı yıllarda sonuç sapabilir. Resmî yüzdelik dilimin sonuç belgendedir.",
  },
  {
    q: "Hangi yılın verisi kullanılıyor?",
    a: "2025 LGS. MEB'in 2026 Tercih ve Yerleştirme Kılavuzu'ndaki taban puan ve yüzdelik dilim tablosu 2025 sonuçlarıdır. 2026 değerleri yayımlandığında araç güncellenir. Sınavın zorluğu değiştiği için aynı puan farklı yılda farklı yüzdelik dilime denk gelebilir.",
  },
  {
    q: "Neden düşük puanlar için sıra gösterilmiyor?",
    a: "Okulların taban puanı yalnızca sınavla öğrenci alan okullar için yayımlanan bir veridir ve yaklaşık ilk %35'lik dilimi kapsar. Daha düşük puanlarda güvenilir bir ulusal eğri çıkarılamaz.",
  },
  {
    q: "Yüzdelik dilim ne demek?",
    a: "Sınava giren öğrencilerin yüzde kaçının senden yüksek puan aldığını gösterir. %5'te olmak, öğrencilerin en üst %5'inde olmak demektir.",
  },
  {
    q: "Girdiğim bilgiler kaydediliyor mu?",
    a: "Hayır. Hesaplama tarayıcında yapılır; girdiğin sayı hiçbir yere gönderilmez ve kaydedilmez.",
  },
];

export default function Page() {
  return (
    <ToolPage
      tool={tool}
      showCta={false}
      lead="LGS sonuç belgendeki puanı gir; yüzdelik dilimini ve sıranı MEB'in yayımladığı okul taban puanı verilerinden yaklaşık olarak gör."
      faq={FAQ}
      article={
        <>
          <h2>Nasıl hesaplanıyor?</h2>
          <p>
            MEB, sınavla öğrenci alan her okulun taban puanını ve bu puanın yüzdelik dilimini yayımlar. Bu
            çiftler aynı ulusal puan dağılımının üzerindeki noktalardır. Araç, bu noktalardan (2025 LGS) geçen
            bir eğri çıkarır; puanını bu eğri üzerinde bulup yüzdelik dilime çevirir. Sıra, yüzdelik dilimin
            2025&apos;te sınava giren 963.142 öğrenciyle çarpılmasıyla bulunur.
          </p>

          <h2>LGS puanı nasıl hesaplanır?</h2>
          <p>
            Ham puan, doğru sayısından yanlış sayısının üçte biri çıkarılarak bulunur. Her testin standart puanı
            50 + 10 × (ham puan − ortalama) ÷ standart sapma formülüyle bulunur. Standart puanlar Türkçe,
            Matematik ve Fen Bilimleri için 4, diğer üç ders için 1 katsayısıyla çarpılıp toplanır ve toplam,
            en küçüğü 100 en büyüğü 500 olacak şekilde ölçeklenir (
            <a href="https://odsgm.meb.gov.tr/www/2026-lgs-kapsaminda-merkezi-sinav-raporu/icerik/1695/tr" rel="noopener">
              MEB 2026 Merkezî Sınav Raporu
            </a>
            ). MEB testlerin ortalama ve standart sapmasını yayımlamadığı için bu araç net değil, puan alır.
          </p>

          <h2>Sınırlar</h2>
          <ul>
            <li>Sonuç yaklaşıktır; resmî yüzdelik dilim MEB sonuç belgesindedir.</li>
            <li>Veriler 2025 LGS&apos;ye aittir ve yaklaşık ilk %35&apos;lik dilimi kapsar.</li>
            <li>Taban puanları okulların kendi yerleştirme sonuçlarıdır; her yıl değişir.</li>
          </ul>
        </>
      }
    >
      <LgsCalculator />
    </ToolPage>
  );
}
