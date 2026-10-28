# ClipBoardLine · zarlof Windows çalışması

Bu depo [orkunisitmak/clipboardline](https://github.com/orkunisitmak/clipboardline) projesinin MIT lisanslı kişisel fork'udur. Windows sürümü mevcut Electron uygulamasını, yerel PowerShell köprüsünü, Türkçe/İngilizce OCR ve çevrimdışı MobileCLIP aramasını kullanır. Özgün lisans ve model bildirimleri korunur.

## Windows iyileştirmesi

Yerel pano izleyicisi sıfır çıkış koduyla beklenmedik biçimde kapandığında da yedek pano taraması devreye girer. Kırık giriş borusu ve aşırı büyük yanıtlar aynı şekilde ele alınır. Bekleyen sıra numarası sorguları kapatılır, tek hata bildirilir; uygulamanın bilinçli kapanışı hata üretmez. Bu, Windows yardımcı sürecinin yaşam döngüsüne ait bir düzeltmedir; ortak askı davranışını değiştirmez. Davranış testleri `windows/tests/native-monitor.test.cjs` içindedir.

Normal Windows kullanıcılarında `SeSecurityPrivilege` gerektiren `Set-Acl` yerine yalnızca DACL bölümünü kaydeden .NET API'si kullanılır. Özel veri klasöründe aynı kullanıcı/SYSTEM/Administrators kısıtları korunur; yönetici çalıştırması gerekmez. Aramanın Unicode büyük/küçük harf dönüşümü de Windows dilinden bağımsızdır; Türkçe Windows'ta `CAFE istanbul blue` sorgusu `Café İstanbul` ve OCR metnini doğru eşler. Var olan davranış testi bu eşleşmeyi doğrular. Kaynak güvenlik taraması Windows x64 ve Git for Windows'un OpenSSL'iyle de çalışır.

Video kırpmada bazı masaüstü donanım kodlayıcılarının ürettiği `MF_E_TRANSFORM_TYPE_NOT_SET` hatasında Windows'un yazılım `MediaTranscoder` bileşeniyle tekrar denenir. Aynı başlangıç/bitiş aralığı, çözünürlük ve ses izi korunur; özgün dosya değiştirilmez, ek kodlayıcı indirilmez. Gerçek MP4/MOV sesli ve sessiz örnekleri; süre, renkli kare, çözümlenmiş ses, iptal ve özgün dosya özetleriyle doğrulanır.

## Kurulum ve kullanım

Windows x64, Node 24/npm ve Python 3 ile:

```powershell
./scripts/Install-Windows.ps1 -Build
```

Bağımlılıklar kilit dosyasından, çevrimdışı modeller sabitlenmiş özet doğrulamasıyla kurulur. Varsayılan kurulum kaynak deponun yanındaki `ClipBoardLine-Windows` klasörüdür. `-Destination` konumu değiştirir, `-NoShortcuts` kısayolları atlar. Paket hazırsa `-Build` olmadan kurulur. Klasörün tamamı birlikte tutulmalıdır; son kullanıcı Node/Python kurmadan çalıştırabilir. Masaüstü ve Başlat → Zarlof kısayolları oluşturulur. Otomatik başlangıç eklenmez.

- `Ctrl+Alt+T`: askıları aç/kapat.
- `Ctrl+Alt+S`: arama; `Ctrl+Alt+A`: ekran yakalama.
- `Space`: önizleme; `Enter`: kopyala; `P`: sabitle; `L`: kütüphane.
- Ayarlar → Kaynaklar: metin/görsel yakalama tercihi. Özgün açık/kapalı tercihleri korunur; kurulum kişisel pano içeriği toplama tercihini değiştirmez.
- Arayüz dili Ayarlar'dan Türkçe seçilebilir. OCR modelleri uygulamayla birlikte gelir.

Kişisel kaynak: https://github.com/zarlof/clipboardline. `origin` kişisel depo, `upstream` özgün projedir. Özgün imzalı güncelleme kanalı korunur; resmî güncelleme kurmak kişisel değişiklikleri özgün sürümle değiştirebilir. Fork güncellemelerinde kaynağı güncelleyip betiği yeniden çalıştırın; önce tepsi menüsünden uygulamadan çıkın. Pano verileri uygulama klasörünün dışındaki kullanıcı veri alanında kalır, GitHub'a gönderilmez.

## Doğrulama

`windows` klasöründe `npm test`, `npm run test:electron` ve `npm run dist` kullanılır. Yerel kanıtlar `validation` ve `local` altında tutulur, kaynak depoya eklenmez. Windows'ta geçen testler macOS testleri yerine sayılmaz; özgün sürüm yayımlama kapıları korunur.
