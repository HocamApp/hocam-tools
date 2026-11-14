import { PomodoroTool } from "@/components/PomodoroTool";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "pomodoro-sayaci")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "Giriş yapınca ne kaydediliyor?",
    a: "Yalnız tamamladığın odak oturumlarının başlığı, odak süresi, mola süresi ve tarihi hesabına kaydedilir. Böylece daha önce kurduğun sayaçlara tek tıkla dönebilir ve toplam kaç saat çalıştığını görebilirsin.",
  },
  {
    q: "Giriş yapmadan kullanabilir miyim?",
    a: "Evet. Giriş yapmadan odak ve mola süreni ayarlayıp kronometreyi çalıştırabilirsin. Bu durumda verilerin sunucuya gönderilmez; sekme kapanınca sıfırlanır.",
  },
  {
    q: "YKS ve LGS çalışırken ideal Pomodoro süresi nedir?",
    a: "Paragraf ve kısa konu tekrarlarında 25 dk odak ve 5 dk mola ritmi kolay başlamanı sağlar. AYT Matematik, Fen veya branş denemesi gibi derin dikkat isteyen bloklarda 40/10 ya da 50/10 düzeni daha az bölünmeni sağlar.",
  },
  {
    q: "Sürenin bitmesini beklemeden oturumu kaydedebilir miyim?",
    a: "Evet. 'Oturumu tamamla ve kaydet' düğmesine bastığında mevcut odak süren oturum geçmişine ve toplam çalışma saatine eklenir.",
  },
];

export default function Page() {
  return (
    <ToolPage
      tool={tool}
      lead="Odak ve mola süreni ayarla, dikkatini dağıtmadan çalış. Hesabına giriş yaptığında eski sayaçlarını tek tıkla yeniden kur ve toplam kaç saat çalıştığını gör."
      faq={FAQ}
      footerNote="Giriş yapmadığında süre bilgilerin cihazından çıkmaz; giriş yaptığında tamamladığın odak oturumları ve eski sayaçların Hocam hesabına kaydedilir."
      article={
        <>
          <h2>Nasıl çalışır</h2>
          <p>
            Çalışacağın dersin veya konunun adını yaz, odak ve mola süreni belirle ve kronometreyi
            başlat. Süre arka planda sekme değiştirsen de saat üzerinden ilerler ve blok bittiğinde
            kısa bir uyarı sesiyle molaya geçer.
          </p>

          <h2>Eski sayaçlar ve toplam çalışma saati</h2>
          <p>
            Hocam hesabınla giriş yaptığında her tamamladığın odak oturumu profiline eklenir. Daha önce
            kullandığın konu ve süre düzenleri üst bölümde hazır düğmelere dönüşür; her seferinde süre
            yazmak zorunda kalmadan tek tıkla kaldığın yerden devam edersin.
          </p>

          <h2>Hangi tempo sana uyar</h2>
          <ul>
            <li>25 dk odak + 5 dk mola: Ertelemeyi kırmak, paragraf veya kelime tekrarları için uygundur.</li>
            <li>40 dk odak + 10 dk mola: Tek bir konu anlatımı ve arkasından 15-20 soruluk tarama testi için dengelidir.</li>
            <li>50 dk odak + 10 dk mola: Uzun AYT problem setleri ve derin odak blokları için idealdir.</li>
          </ul>
        </>
      }
    >
      <PomodoroTool />
    </ToolPage>
  );
}
