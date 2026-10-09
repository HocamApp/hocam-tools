import { ObpCalculator } from "@/components/ObpCalculator";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "obp-hesaplama")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "OBP yerleştirme puanına en çok kaç puan ekler?",
    a: "OBP puanı en çok 500 olabilir ve 0,12 ile çarpıldığı için yerleştirme puanına en çok 60 puan katkı yapar. Kırık OBP'de bu üst sınır 30 puandır.",
  },
  {
    q: "Diploma notum 100'lük sistemde değilse ne yapmalıyım?",
    a: "4'lük veya 5'lik sistemde okuyorsan diploma notunun 100'lük karşılığını okulundan öğren ve onu gir.",
  },
  {
    q: "Bu araç resmî sonuç verir mi?",
    a: "Hayır. Katsayıların ve koşulların güncel hâli için ÖSYM'nin yayımladığı kılavuz esastır.",
  },
  {
    q: "Girdiğim bilgiler kaydediliyor mu?",
    a: "Hayır. Hesaplama tarayıcında yapılır; girdiğin not hiçbir yere gönderilmez ve kaydedilmez.",
  },
];

export default function Page() {
  return (
    <ToolPage
      tool={tool}
      lead="Diploma notunu gir; OBP puanını ve YKS yerleştirme puanına katkısını gör."
      faq={FAQ}
      article={
        <>
          <h2>OBP nasıl hesaplanır?</h2>
          <p>
            OBP, 100&apos;lük sistemdeki diploma notunun 5 ile çarpılmasıyla bulunur; en düşük 250, en
            yüksek 500 olur. Örneğin diploma notu 85,5 olan bir öğrencinin OBP&apos;si 85,5 × 5 = 427,5&apos;tir.
          </p>

          <h2>Yerleştirme puanına katkısı</h2>
          <p>
            Yerleştirme puanına katkı için OBP 0,12 ile çarpılır. 427,5 OBP için katkı 427,5 × 0,12 =
            51,30 puandır.
          </p>

          <h2>Kırık OBP nedir?</h2>
          <p>
            Daha önceki yıllarda bir yükseköğretim programına yerleşmiş adaylarda OBP katsayısı 0,06
            uygulanır. Bu durumda katkı en çok 30 puana düşer. Kendi durumunun bu kapsama girip girmediğini
            ÖSYM kılavuzundan kontrol et.
          </p>
        </>
      }
    >
      <ObpCalculator />
    </ToolPage>
  );
}
