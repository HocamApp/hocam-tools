import { PuanCalculator } from "@/components/PuanCalculator";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { SOURCES } from "@/lib/osym-data";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "yks-puan-siralama-hesaplama")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "Bu sonuç kesin mi?",
    a: "Hayır. Sonuç yaklaşık bir tahmindir. ÖSYM, puanı 100-500 aralığına ölçeklerken kullandığı en küçük ve en büyük değerleri yayımlamaz; biz bunları yayımlanan puan dağılımından kestiriyoruz. Sıra ise o yılın dağılımına göre hesaplanır ve yıldan yıla değişir. Resmî puan ve sıran yalnızca ÖSYM sonuç belgesindedir.",
  },
  {
    q: "Sıralama neden iki yılla hesaplanıyor?",
    a: "Aynı net, sınavın zorluğuna ve adayların başarısına göre her yıl farklı bir puana ve sıraya denk gelir. 2026 ve 2025 verisiyle ayrı ayrı hesaplıyor, tablodaki iki sütunu ve baştaki ortalamayı gösteriyoruz. 2027 sonuçları açıklandığında araç bu yıla göre güncellenir; senin sınavında sıra farklı çıkabilir.",
  },
  {
    q: "Sınav puanı ile yerleştirme puanı arasındaki fark nedir?",
    a: "Yerleştirme puanı, sınav puanına OBP katkısının (diploma notu × 5 × 0,12; geçen yıl yerleşenlerde 0,06) eklenmesiyle bulunur. Üniversite tercihlerinde yerleştirme puanı kullanılır. Diploma notunu girmezsen yalnızca sınav puanı ve sırası gösterilir.",
  },
  {
    q: "Neden benim alan puanım yok?",
    a: "ÖSYM alan puanını, TYT puanı hesaplanmış adaylar için ve seçilen alanın AYT testlerinden en az birinde 0,5 net yapıldıysa hesaplar. Bu koşullar sağlanmıyorsa araç da alan puanı göstermez.",
  },
  {
    q: "Meslek lisesi ek puanı ve bölüm tabanları hesaba katılıyor mu?",
    a: "Hayır. Meslek lisesi mezunlarına alan-program eşleşmesine bağlı uygulanan ek puan ve programların taban puan/sırası bu araca dâhil değildir. Bunlar için ÖSYM kılavuzuna bak.",
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
      lead="TYT ve AYT netlerini ve diploma notunu gir; tahmini sınav puanını, yerleştirme puanını ve başarı sıranı tek sayfada gör. Sonuçlar, ÖSYM'nin yayımladığı verilerle hesaplanan yaklaşık değerlerdir."
      faq={FAQ}
      article={
        <>
          <h2>Puan ve sıralama nasıl hesaplanıyor?</h2>
          <ol>
            <li>
              <strong>Net:</strong> doğru − yanlış ÷ 4.
            </li>
            <li>
              <strong>Standart puan:</strong> her test için 50 + 10 × (net − ortalama) ÷ standart sapma. Ortalama
              ve standart sapma, ÖSYM&apos;nin son sınıf adayları için yayımladığı değerlerdir.
            </li>
            <li>
              <strong>Ağırlıklı puan:</strong> testlerin standart puanları, ÖSYM kılavuzundaki ağırlıklarla
              toplanır (TYT %40; Sayısal&apos;da Matematik %30, Fizik, Kimya ve Biyoloji %10&apos;ar; diğer alanlar
              kılavuzdaki gibi).
            </li>
            <li>
              <strong>100-500 ölçeği:</strong> ağırlıklı puan, en küçüğü 100 ve en büyüğü 500 olacak şekilde
              ölçeklenir. ÖSYM bu iki sınırı yayımlamadığı için biz en büyüğünü tüm soruları doğru yapan aday,
              en küçüğünü ise ÖSYM&apos;nin yayımladığı puan dağılımının ortalamasından kestiriyoruz.
            </li>
            <li>
              <strong>Yerleştirme puanı:</strong> sınav puanı + OBP katkısı.
            </li>
            <li>
              <strong>Sıra:</strong> ÖSYM&apos;nin yayımladığı yığınsal puan dağılımında (&quot;şu puan ve üstü kaç
              aday&quot;) puanın yeri bulunur.
            </li>
          </ol>

          <h2>Sonuç neden yaklaşık?</h2>
          <p>
            Aynı net her yıl farklı puan getirebilir, çünkü standart puan o yılın ortalama ve sapmasına
            bağlıdır. Ayrıca ÖSYM&apos;nin 100-500 ölçeğindeki iki sınır değerini bilmediğimiz için puanı
            kestiriyoruz. Bu yüzden sonuçlar yaklaşık değerlerdir: iki farklı yılın dağılımıyla ayrı ayrı
            hesaplıyor, baştaki sırayı bu iki değerin ortalaması olarak veriyoruz.
          </p>

          <h2>Kaynaklar</h2>
          <ul>
            <li>
              <a href={SOURCES[2026]} rel="noopener">ÖSYM 2026-YKS Sayısal Bilgiler</a> (test ortalamaları,
              standart sapmalar, puan dağılımları)
            </li>
            <li>
              <a href={SOURCES[2025]} rel="noopener">ÖSYM 2025-YKS Sayısal Bilgiler</a>
            </li>
            <li>
              <a href={SOURCES.guide} rel="noopener">ÖSYM 2026-YKS Kılavuzu</a> (puan hesaplama §3.10.1,
              ağırlıklar, OBP)
            </li>
          </ul>
          <p>Veriler yeni sınav sonuçları yayımlandıkça güncellenir. Resmî sonuç ÖSYM sonuç belgesindedir.</p>
        </>
      }
    >
      <PuanCalculator />
    </ToolPage>
  );
}
