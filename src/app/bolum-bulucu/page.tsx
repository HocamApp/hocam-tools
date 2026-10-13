import { BolumBulucu } from "@/components/BolumBulucu";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "bolum-bulucu")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "Hangi sıralamayı girmeliyim?",
    a: "2026 YKS sonuç belgendeki, seçtiğin puan türüne (SAY, EA, SÖZ veya DİL) ait başarı sırasını gir. Sıranı bilmiyorsan YKS Puan ve Sıralama Hesaplama aracıyla netlerinden yaklaşık bir sıra bulabilirsin.",
  },
  {
    q: "Taban sırası ne demek?",
    a: "Bir programın genel kontenjanına geçen yıl yerleşen son adayın başarı sırasıdır. Sırası bu değerden daha iyi olan aday programa girmiş olurdu. Kontenjan, tercih sayısı ve aday havuzu her yıl değiştiği için bu bir garanti değil, bir referanstır.",
  },
  {
    q: "Neden 2025 verisi kullanılıyor, önceki yıllar nereden geliyor?",
    a: "ÖSYM programlar bazında taban sırasını bir sonraki yılın Yükseköğretim Programları ve Kontenjanları Kılavuzu'nda yayımlar. 2026 yerleştirme sonuçlarının program bazındaki sırası 2027 kılavuzuyla gelir; yayımlandığında araç güncellenir. Güncel 2026 değerlerini YÖK Atlas'ta da görebilirsin. Önceki yıllar (2024, 2023, 2022) ÖSYM'nin 2025, 2024 ve 2023 kılavuzlarından alınır ve program koduna göre eşleştirilir; programın o yıl puan türü farklıysa veya program yoksa o yıl gösterilmez.",
  },
  {
    q: "Sıram neden 2025 ölçeğine çevriliyor?",
    a: "Her yıl sınava giren aday sayısı farklıdır. Örneğin Sayısal puan türünde 2026'da aday havuzu 2025'e göre daha küçüktür; aynı başarı seviyesi 2026'da sayısal olarak daha iyi bir sıraya denk gelir. Araç, sıranı iki yılın aday sayısı oranıyla 2025 ölçeğine çevirip taban sıralarıyla öyle karşılaştırır. Bu bir yaklaşıklıktır. Dil puan türü için aday sayısı verisi olmadığından çevirme yapılmaz.",
  },
  {
    q: "Rahat, sınırda ve zor ne demek?",
    a: "Sıranın programın taban sırasına oranına göre yapılan sezgisel bir sınıflandırmadır; resmî bir kural değildir. Rahat: sıran taban sırasından en az %15 daha iyi. Sınırda: taban sırasının %15 iyisi ile %15 gerisi arasında. Zor ama olabilir: taban sırasının %15 ile %30 gerisinde. Daha geride olan programlar listelenmez.",
  },
  {
    q: "Listede olmayan programlar var mı?",
    a: "Evet. Yalnızca 2025'te genel kontenjanı dolan lisans programları listelenir. Yeni açılan, puan türü değişen veya kontenjanı dolmayan programlar ile okul birincisi, şehit ve gazi yakını, 34 yaş üstü kadın gibi özel kontenjanlar ve ek puan uygulamaları hesaba katılmaz. Önlisans programları, KKTC ve yurt dışı üniversiteleri ile bakanlıklar adına açılan programlar da yoktur.",
  },
  {
    q: "Girdiğim sıra kaydediliyor mu?",
    a: "Hayır. Hesaplama tarayıcında yapılır; sıran ve aramaların hiçbir yere gönderilmez ve kaydedilmez.",
  },
];

export default function Page() {
  return (
    <ToolPage
      tool={tool}
      showCta={false}
      lead="YKS sıralamanı ve puan türünü gir; 2025 taban sıralarına göre hangi 4 yıllık bölümlere girebileceğini, hangilerinin sınırda olduğunu gör."
      faq={FAQ}
      article={
        <>
          <h2>Nasıl çalışıyor?</h2>
          <p>
            ÖSYM, 2026-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu&apos;nun Tablo 4&apos;ünde her lisans
            programının 2025 genel kontenjan en küçük puanını ve bu puana karşılık gelen başarı sırasını yayımlar
            (
            <a href="https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf" rel="noopener">
              kılavuz
            </a>
            ). Araç, sıranı bu taban sıralarıyla karşılaştırır ve programları üç gruba ayırır: rahat girebileceklerin,
            sınırda olanlar ve zor ama olabilecek olanlar. Her grup taban sırasına göre, en iyi sıralı program
            başta olacak şekilde sıralanır. Kapsam, Türkiye&apos;deki devlet ve vakıf üniversitelerinin lisans programlarıdır.
          </p>

          <h2>Sınırlar</h2>
          <ul>
            <li>Eşleştirme 2025 yerleştirme sonuçlarına göre yapılır; bu yılın taban sıraları farklı olabilir. Önceki yıllar yalnızca bilgi içindir.</li>
            <li>Gruplar bir sezgidir. Tercih yapmadan önce YÖK Atlas&apos;taki güncel verilere ve programların kendi duyurularına bak.</li>
            <li>Özel kontenjanlar ve ek puanlar hesaba katılmaz; yalnızca genel kontenjan sırası kullanılır.</li>
            <li>Sonuçlar bilgilendirme amaçlıdır. Tercih ve yerleştirme işlemleri ÖSYM kılavuzundaki hükümlere tabidir.</li>
          </ul>
        </>
      }
    >
      <BolumBulucu />
    </ToolPage>
  );
}
