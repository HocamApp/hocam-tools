import { LgsCalculator } from "@/components/LgsCalculator";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "lgs-siralama-hesaplama")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "Netlerimle sıramı hesaplayabilir miyim?",
    a: "Evet, ama yaklaşık olarak. LGS puanı her yıl o sınavın ders bazındaki ortalama ve standart sapmasına göre hesaplanır; MEB bu değerleri ve puan dağılımını yayımlamaz. Bu araç ders ortalama ve standart sapmalarını, MEB'in yayımladığı madde güçlüğü ve güvenirlik katsayılarından kestirir. Bu yüzden netlerinden bulunan puan yaklaşık ±10 puan sapabilir. Sonuç belgendeki puanı biliyorsan 'LGS puanımla' seçeneği daha doğru bir sıra verir.",
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
      lead="Derslerdeki doğru ve yanlış sayılarını ya da LGS puanını gir; tahmini puanını, yüzdelik dilimini ve sıranı yaklaşık olarak gör."
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
            Ham puan (net), doğru sayısından yanlış sayısının üçte biri çıkarılarak bulunur. Her testin standart puanı
            50 + 10 × (ham puan − ortalama) ÷ standart sapma formülüyle bulunur. Standart puanlar Türkçe, Matematik ve
            Fen Bilimleri için 4, diğer üç ders için 1 katsayısıyla çarpılıp toplanır ve toplam, en küçüğü 100 en büyüğü
            500 olacak şekilde ölçeklenir (
            <a href="https://odsgm.meb.gov.tr/www/2026-lgs-kapsaminda-merkezi-sinav-raporu/icerik/1695/tr" rel="noopener">
              MEB 2026 Merkezî Sınav Raporu
            </a>
            ).
          </p>

          <h2>Netlerden puan neden yaklaşık?</h2>
          <p>
            MEB testlerin ortalama ve standart sapmasını yayımlamaz. Raporda ders başına madde sayısı, ortalama madde
            güçlüğü (doğru oranı) ve güvenirlik katsayısı vardır. Bu araç, ortalamayı doğru oranından, standart sapmayı
            güvenirlik katsayısından kestirir; en büyük puanı tüm soruları doğru yapan öğrenci (2026&apos;da 452 öğrenci 500
            aldı) olarak alır; en küçük değeri ise 2025 yüzdelik dilim verilerine uydurur. Bu tahmin zinciri, üçüncü bir
            sitenin 50, 60 ve 70 net için yayımladığı puanlara yaklaşık 5 puan içinde yaklaşıyor, ama MEB&apos;in resmî
            değerleri değildir; hata payı yaklaşık ±10 puandır.
          </p>

          <h2>Sınırlar</h2>
          <ul>
            <li>Sonuç yaklaşıktır; resmî yüzdelik dilim MEB sonuç belgesindedir.</li>
            <li>Yüzdelik dilim ve sıra 2025 LGS verilerine dayanır ve yaklaşık ilk %35&apos;lik dilimi kapsar. Puan, 2026 raporundaki katsayılarla kestirilir; sınavların zorluğu farklı olabilir.</li>
            <li>Taban puanları okulların kendi yerleştirme sonuçlarıdır; her yıl değişir.</li>
          </ul>
        </>
      }
    >
      <LgsCalculator />
    </ToolPage>
  );
}
