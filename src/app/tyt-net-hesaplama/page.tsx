import { NetCalculator } from "@/components/NetCalculator";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "tyt-net-hesaplama")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "Yanlış cevap neti nasıl etkiler?",
    a: "Her yanlış, doğrularından 0,25 net götürür; yani 4 yanlış 1 doğruyu siler. Boş bıraktığın sorular neti etkilemez.",
  },
  {
    q: "Boş bırakmak mı, tahmin etmek mi daha iyi?",
    a: "Beş şıktan birini rastgele işaretlemenin beklenen neti sıfırdır. En az bir şıkkı eleyebiliyorsan tahmin etmek beklenen netini artırır.",
  },
  {
    q: "Din Kültürü dersi almadıysam sorular nasıl değişir?",
    a: "Ortaöğretimde Din Kültürü ve Ahlak Bilgisi dersini almayan veya farklı müfredatla alan adaylar, Sosyal Bilimler testinde Din Kültürü yerine ilave Felsefe sorularını cevaplar. Cevaplanan soru sayısı yine 20'dir; netini aynı şekilde gir.",
  },
  {
    q: "Bu araç resmî sonuç verir mi?",
    a: "Hayır. Araç yalnızca net hesaplar. Resmî sonuçları ve kılavuz hükümlerini ÖSYM açıklar.",
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
      lead="Türkçe, Sosyal Bilimler, Temel Matematik ve Fen Bilimleri testlerindeki doğru ve yanlış sayılarını gir; ders bazında ve toplam netini hesapla."
      faq={FAQ}
      article={
        <>
          <h2>TYT neti nasıl hesaplanır?</h2>
          <p>
            Net, doğru sayısından yanlış sayısının dörtte birinin çıkarılmasıyla bulunur:{" "}
            <strong>net = doğru − yanlış ÷ 4</strong>. Boş bıraktığın sorular neti değiştirmez.
          </p>
          <p>
            Örneğin Türkçe testinde 30 doğru ve 8 yanlışın varsa netin 30 − 8 ÷ 4 = 28 olur.
          </p>

          <h2>TYT&apos;de kaç soru var?</h2>
          <p>TYT&apos;de toplam 120 soru bulunur:</p>
          <ul>
            <li>Türkçe: 40 soru</li>
            <li>Sosyal Bilimler: 20 soru (Tarih, Coğrafya, Felsefe ve Din Kültürü&apos;nden 5&apos;er)</li>
            <li>Temel Matematik: 40 soru</li>
            <li>Fen Bilimleri: 20 soru (Fizik 7, Kimya 7, Biyoloji 6)</li>
          </ul>

          <h2>Net ile puan aynı şey değildir</h2>
          <p>
            Yerleştirme puanları ham netle değil, ÖSYM&apos;nin her sınavda o yılın ortalama ve standart
            sapmasına göre hesapladığı standart puanlarla bulunur. Bu yüzden aynı net farklı yıllarda
            farklı puana karşılık gelebilir. Bu araç puan ve sıralama tahmini yapmaz.
          </p>

          <h2>Netini artırmak için</h2>
          <ul>
            <li>Her denemeden sonra yanlışlarını konularına göre grupla; en çok kayıp verdiğin konuyu bul.</li>
            <li>Önce o konudaki eksiği kapat, sonra soru çözümüne geç.</li>
            <li>Süreyi testlere bölüp denemelerde aynı sırayla çalışmayı alışkanlık hâline getir.</li>
          </ul>
        </>
      }
    >
      <NetCalculator exam="TYT" campaign={tool.slug} />
    </ToolPage>
  );
}
