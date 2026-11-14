import { CountdownPlanner } from "@/components/CountdownPlanner";
import { ToolPage, type Faq } from "@/components/ToolPage";
import { TOOLS, toolMetadata } from "@/lib/tools";

const tool = TOOLS.find((t) => t.slug === "yks-lgs-kac-gun-kaldi")!;

export const metadata = toolMetadata(tool);

const FAQ: Faq[] = [
  {
    q: "2027 YKS hangi tarihte yapılacak?",
    a: "ÖSYM 2027 Yılı Sınav Takvimi'ne göre TYT 19 Haziran 2027 Cumartesi günü saat 10:15'te, AYT 20 Haziran 2027 Pazar 10:15'te, YDT ise 20 Haziran 2027 Pazar 15:45'te yapılacak. Başvurular 4 Şubat - 2 Mart 2027 arasında alınacak ve sonuçlar 21 Temmuz 2027'de açıklanacak.",
  },
  {
    q: "2027 LGS hangi tarihte yapılacak?",
    a: "MEB 2027 Yılı Sınav Uygulama Takvimi'ne göre LGS Merkezî Sınavı 13 Haziran 2027 Pazar günü yapılacak. 1. oturum (Sözel) 09:30'da, 2. oturum (Sayısal) 11:30'da başlar.",
  },
  {
    q: "Konu planlayıcı günlük süreyi nasıl hesaplıyor?",
    a: "Şu andan itibaren seçtiğin sınava (YKS veya LGS) kaç gün kaldığını otomatik algılar; kalan süreyi haftalık çalışma gün sayına ve girdiğin eksik konu sayısına böler. YKS için konu başına ortalama 4 saat, LGS için 3 saat konu anlatımı ve soru taraması varsayar.",
  },
  {
    q: "Girdiğim konu sayısı bir yere kaydediliyor mu?",
    a: "Hayır. Hesaplama tamamen tarayıcında yapılır; girdiğin sayılar sunuculara gönderilmez veya kaydedilmez.",
  },
];

export default function Page() {
  return (
    <ToolPage
      tool={tool}
      showCta={false}
      lead="2027 YKS ve 2027 LGS için sınava kaç gün, hafta ve saat kaldığını takip et. Kalan konu sayını yaz; şu andan sınava kadar kalan güne göre gerçekçi çalışma temponu çıkar."
      faq={FAQ}
      footerNote="Sınav tarihleri resmî takvimlere dayanır; yetkili kurum hükümleri ÖSYM ve MEB'e aittir. Bu sayfada girdiğin sayılar cihazından çıkmaz ve kaydedilmez."
      article={
        <>
          <h2>Resmî 2027 sınav tarihleri nereden alınıyor</h2>
          <p>
            YKS tarihleri{" "}
            <a href="https://www.osym.gov.tr/yks-19-20-haziran-2027de-yapilacak" rel="noopener">
              ÖSYM 2027 Yılı Sınav Takvimi
            </a>{" "}
            üzerinden, LGS tarihi ise{" "}
            <a
              href="https://www.meb.gov.tr/meb_iys_dosyalar/2026_11/6af468aeb17c0634849300_2027_YILI_SINAV_UYGULAMA_TAKVIMI.pdf"
              rel="noopener"
            >
              MEB 2027 Yılı Sınav Uygulama Takvimi
            </a>{" "}
            belgesinden doğrulanmıştır. Her iki sayaç da Türkiye saati (UTC+3) oturum başlangıç
            saatlerine göre çalışır.
          </p>

          <h2>Konuları son güne bırakmamak neden kritik</h2>
          <p>
            Sınava yaklaşırken netlerin asıl arttığı dönem, tüm konuları bitirip yalnız genel ve branş
            denemelerinde çıkan hatalara geri döndüğün son 2-3 haftalık kamptır. Konu anlatımını
            sınavın son haftasına taşıdığında ne öğrendiğin pekişir ne de süre yönetimi oturur.
          </p>

          <h2>Planı uygularken işine yarayacak küçük kurallar</h2>
          <ul>
            <li>Bir konuyu &apos;bitti&apos; saymak için yalnızca video izlemek yetmez; o konudan en az iki karma test çözmelisin.</li>
            <li>Haftalık hedefin 4 konunun üzerine çıkıyorsa zaten bildiğin konuları elemekle başla.</li>
            <li>Günlük çalışma bloklarını bölmeden yürütmek için Pomodoro Çalışma Sayacı aracımızla süre tutabilirsin.</li>
          </ul>
        </>
      }
    >
      <CountdownPlanner />
    </ToolPage>
  );
}
