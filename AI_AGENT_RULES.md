# AI Ajanları İçin Kritik Kurallar — Hocam Tools

> Bu dosya, bu repoda çalışan herhangi bir AI kodlama ajanının (Claude Code, Codex, Cursor,
> vb.) **ilk okuması gereken dosyadır**. Repo, `hocamozelders.com/araclar` altında yayınlanacak
> ücretsiz YKS araçlarını içerir (YKS puan ve sıralama, LGS sıralama). `hocam-frontend` ve
> `hocam-backend` repolarının `AI_AGENT_RULES.md` dosyaları yalnız o repoları bağlar; bu dosya
> yalnız bu repoyu. Çelişki olursa **bu dosya** README'nin üstündedir.

## 1. Doğruluk — formül, katsayı, tarih, veri

- Hiçbir formül, katsayı, soru sayısı, sınav tarihi veya sıralama/taban puan verisi
  **uydurulmaz ve tahmin edilmez**. Kaynak güncel ÖSYM kılavuzu / MEB duyurusudur. Kaynağı ve
  doğrulama tarihini PR açıklamasına ve ilgili dosyanın başındaki yoruma yaz.
- Her formül saf bir fonksiyondur ve yanında resmî bir örnekle test edilir (`src/lib/*.test.ts`).
- Formül veya katsayı değişince `src/lib/tools.ts` içindeki `updatedAt` de güncellenir; sayfada
  "Son güncelleme" olarak görünür.
- Puan/sıralama tahmini, LGS, YKS geri sayımı ve bölüm bulucu araçları **veri kaynağı onaylanmadan
  eklenmez**. Yıllık veriye bağlı bir araç eklemek, o veriyi her yıl güncelleme sorumluluğunu da
  getirir; bunu PR açıklamasında belirt.
- TYT/AYT soru dağılımı, net formülü ve OBP kuralları 10 Ekim 2026'da ÖSYM'nin 2026 belgelerinden
  (SSS ve TYT/AYT soru kitapçıkları) doğrulandı; kaynak bağlantıları `src/lib/net.ts` ve
  `src/lib/obp.ts` dosya başlarındadır. 2027-YKS Kılavuzu/SSS yayımlanınca yeniden kontrol edilir ve
  `updatedAt` güncellenir.
- Sonuçlar bilgilendirmedir; sayfalardaki "resmî değerlendirme ÖSYM'ye aittir" uyarısı kaldırılmaz.

## 2. Gizlilik (KVKK)

- Araçlar çerez, `localStorage`/`sessionStorage`, analytics, üçüncü taraf script veya ağ çağrısı
  **kullanmaz**. Girdi tarayıcıdan çıkmaz. Fontlar build sırasında barındırılır (`next/font`),
  çalışma anında Google'a istek gitmez.
- Analytics veya herhangi bir izleme eklemek ayrı bir karardır: onay (consent) akışı ana sitenin
  `DiscoveryConsentBanner`'ı ile birlikte düşünülmeli. Kendi başına ekleme.

## 3. URL ve SEO

- Uygulama `next.config.js` içindeki `basePath: "/araclar"` altında çalışır. Ana sitenin rewrite'ı
  buna bağlıdır; **kaldırma veya değiştirme**.
- `canonical` her zaman mutlak ve `https://www.hocamozelders.com/araclar/...` biçimindedir
  (`toolMetadata`). Yeni araç = `src/lib/tools.ts` kaydı + `src/app/<slug>/page.tsx`; hub ve sitemap
  kaydı otomatik alır.
- `layout.tsx` içindeki `revalidate = 3600` kalır: ana site bu uygulamayı proxy'ler ve dış hedefli
  rewrite yanıtlarını `s-maxage`'e göre saklar; bir yıllık varsayılan, yeniden yayımı ana sitede
  görünmez kılar.
- Ana siteye bağlantılar mutlak adres ve UTM ile verilir (`mainUrl`); `<Link>` yalnız araçtan araca.
- Her araç sayfasında görünür açıklayıcı metin ve SSS bulunur. İçeriksiz "ince" sayfa eklenmez.
- FAQPage şeması bilerek kullanılmıyor (bu site türü için zengin sonuç üretmiyor).

## 4. Erişilebilirlik — araç sayfaları için değişmez

- Etiketli girdiler; hata mesajı girdiyle `aria-describedby` ile bağlı ve satır içinde; sonuç
  gönderimden sonra odağı alır; dokunma hedefi en az 44 px.
- Kontrast: metin en az 4,5:1, girdi sınırı en az 3:1. `--gold` yalnız dolgudur, metin rengi olmaz;
  hata yalnızca renkle iletilmez.
- Yeni veya değişen araç, axe-core ile hem hata hem sonuç durumunda taranır ve 375 px genişlikte
  yatay kaydırma olmadığı doğrulanır. Sonuç tabloları dar ekranda sığmalıdır.

## 5. Marka ve bağımlılıklar

- Marka renkleri `hocam-frontend/src/app/globals.css` içinden kopyalanmıştır; orada değişirse burada
  elle güncellenir. Bu repo `hocam-frontend` kodunu import etmez.
- Çalışma zamanı bağımlılığı (Next + React dışında) eklemek için gerekçe yaz; tarih seçici, grafik
  vb. kütüphaneler yerine tarayıcının yerleşik özelliği tercih edilir.

## 6. Yayın

- Ana siteye bağlama (`hocam-frontend`'te rewrite, robots, footer) ve production yayını
  sahiplerin açık onayı olmadan yapılmaz. O PR'lar `hocam-frontend` kurallarına tabidir.

## 7. Git / PR akışı

Bu makinede zaten oturum açmış `git`/`gh` var — token istemeyin, yazdırmayın, `gh auth token`
çalıştırmayın. Bu repodaki ilk commit repo oluşturulurken doğrudan `main`'e atıldı; **bundan sonra
hiçbir şey doğrudan `main`'e gitmez.**

1. `which gh && gh auth status && git remote -v` ile önce yerel ortamı doğrulayın.
2. `git fetch origin --prune`, ardından `origin/main`'den `agent/<kısa-açıklama>-<tarih>` branch'i
   açın.
3. Yalnız istenen değişikliği yapın.
4. Commit'ten önce `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` (CI'ın çalıştırdığı
   sıra). Bir şey kırılıyorsa **durun ve rapor edin**; bozuk kodu commit etmeyin.
5. `git add <dosyalar>` (körü körüne `git add -A` değil; önce `git status`/`git diff`), açıklayıcı
   commit mesajı.
6. `git push -u origin agent/<kısa-açıklama>-<tarih>`, ardından `gh pr create --base main`.
7. "Tools CI / verify" yeşil olmadan merge etmeyin. Yeşilse `gh pr merge --merge --delete-branch`
   (merge commit; squash/rebase değil).
8. `git fetch origin main && git log origin/main -1` ile merge'in indiğini doğrulayın.
9. Rapor: PR URL'i, merge commit SHA'sı, ne değişti (kısa), test/lint/build sonucu, deploy durumu.

---
Son güncelleme: 10 Ekim 2026 — repo oluşturuldu, CI eklendi (PR #1).
