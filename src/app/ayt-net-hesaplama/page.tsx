import { NetCalculator } from "@/components/NetCalculator";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "ayt-net-hesaplama")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "AYT'de her alan için kaç soru var?",
    a: "Sayısal, Eşit Ağırlık ve Sözel alanlarının her birinde 80 soru bulunur. Ders dağılımı alana göre değişir; yukarıdaki araçta seçtiğin alana göre dersler otomatik gelir.",
  },
  {
    q: "Yanlış cevap neti nasıl etkiler?",
    a: "Her yanlış, doğrularından 0,25 net götürür; 4 yanlış 1 doğruyu siler. Boş sorular neti etkilemez.",
  },
  {
    q: "Din Kültürü dersi almadıysam sorular nasıl değişir?",
    a: "Ortaöğretimde Din Kültürü ve Ahlak Bilgisi dersini almayan veya farklı müfredatla alan adaylar, AYT Sosyal Bilimler-2 testinde Din Kültürü yerine ilave Felsefe Grubu sorularını cevaplar (6 soru). Sözel alanında bu soruların sonucunu \"Din Kültürü / ilave Felsefe\" satırına gir.",
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
      lead="Alanını seç, derslerdeki doğru ve yanlış sayılarını gir; ders bazında ve toplam AYT netini hesapla."
      faq={FAQ}
      article={
        <>
          <h2>AYT neti nasıl hesaplanır?</h2>
          <p>
            AYT&apos;de net, TYT&apos;deki gibi hesaplanır: <strong>net = doğru − yanlış ÷ 4</strong>. Boş
            bıraktığın sorular neti değiştirmez.
          </p>
          <p>Örneğin Matematikte 25 doğru ve 6 yanlışın varsa netin 25 − 6 ÷ 4 = 23,5 olur.</p>

          <h2>Alanlara göre ders ve soru dağılımı</h2>
          <ul>
            <li>
              <strong>Sayısal:</strong> Matematik 40, Fizik 14, Kimya 13, Biyoloji 13 soru.
            </li>
            <li>
              <strong>Eşit Ağırlık:</strong> Türk Dili ve Edebiyatı 24, Tarih-1 10, Coğrafya-1 6, Matematik 40 soru.
            </li>
            <li>
              <strong>Sözel:</strong> Türk Dili ve Edebiyatı 24, Tarih-1 10, Coğrafya-1 6, Tarih-2 11,
              Coğrafya-2 11, Felsefe Grubu 12, Din Kültürü 6 soru (Din Kültürü almayanlar bunun yerine ilave
              Felsefe Grubu sorularını cevaplar).
            </li>
          </ul>

          <h2>Net ile puan aynı şey değildir</h2>
          <p>
            Yerleştirme puanları ham netle değil, ÖSYM&apos;nin her sınavda o yılın ortalama ve standart
            sapmasına göre hesapladığı standart puanlarla bulunur. Bu araç puan ve sıralama tahmini yapmaz.
          </p>
        </>
      }
    >
      <NetCalculator exam="AYT" campaign={tool.slug} />
    </ToolPage>
  );
}
