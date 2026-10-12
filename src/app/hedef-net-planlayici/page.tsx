import { GoalPlanner } from "@/components/GoalPlanner";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "hedef-net-planlayici")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "Hedef net hangi puana denk gelir?",
    a: "Bu araç puan veya sıralama tahmini yapmaz. ÖSYM standart puanı her yıl o yılın ortalama ve standart sapmasına göre hesaplar; aynı net farklı yıllarda farklı puana denk gelebilir. Hedef puanını, hedeflediğin bölümün geçmiş yıl puanlarına bakarak belirle, burada ders ders net hedefine çevir.",
  },
  {
    q: "Şimdiki netimi nereden bulacağım?",
    a: "Son denemelerinin ders bazındaki netinin ortalamasını gir. Netini hesaplamak için TYT veya AYT net hesaplama araçlarını kullanabilirsin.",
  },
  {
    q: "Bütün derslerin hedefini girmem gerekiyor mu?",
    a: "Hayır. Hedef netini girdiğin dersler plana girer; hedef boş bıraktığın dersler hesaba katılmaz.",
  },
  {
    q: "Hedefim şimdiki netimden düşükse ne olur?",
    a: "O ders için kalan fark 0 görünür ve hedefe ulaşmış sayılırsın; fark toplamına negatif değer eklenmez.",
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
      lead="Sınavını seç, derslerdeki şimdiki netini ve hedef netini gir; hedefe ulaşmak için hangi derste ne kadar net artırman gerektiğini gör."
      faq={FAQ}
      article={
        <>
          <h2>Hedef net planı nasıl çalışır?</h2>
          <p>
            Her ders için <strong>kalan = hedef net − şimdiki net</strong> hesaplanır. Toplam kalan,
            hedef girdiğin derslerin farklarının toplamıdır. Hedefin şimdiki netinden düşükse o ders için
            kalan 0 sayılır.
          </p>

          <h2>Önce en büyük farka çalış</h2>
          <p>
            Aynı süreyle en çok net getirecek yer genellikle farkın en büyük olduğu derstir. Tablo, dersleri
            hedefe olan uzaklığıyla gösterir; önce o dersin konu eksiklerini kapatmayı dene.
          </p>

          <h2>Gerçekçi hedef koymak</h2>
          <ul>
            <li>Hedefi son birkaç denemenin ortalamasının biraz üstünde tut; bir anda tam puana çıkmaya çalışma.</li>
            <li>Her denemeden sonra planı güncelle: şimdiki netini yeni ortalamayla değiştir.</li>
            <li>Hedef puanını belirlerken hedeflediğin bölümün geçmiş yıl taban puanlarına ve ÖSYM kılavuzuna bak.</li>
          </ul>
        </>
      }
    >
      <GoalPlanner />
    </ToolPage>
  );
}
