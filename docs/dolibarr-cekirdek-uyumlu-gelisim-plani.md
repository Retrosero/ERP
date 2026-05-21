# Dolibarr Çekirdek Uyumlu Gelişim Planı (Ücretsiz, Eklentisiz)

## Amaç
- Ücretli/ekstra modül kullanmadan ilerlemek.
- Dolibarr çekirdeğine müdahale etmeden geliştirmek.
- Frontend’i sadece Dolibarr çekirdek REST endpoint’lerine bağlamak.

## Zorunlu Prensipler
- Çekirdeğe dosya ekleme/değiştirme yok.
- Doğrudan veritabanı yazması yok.
- Yazma işlemleri yalnızca REST API üzerinden.
- Teknik hata detayları kullanıcıya gösterilmez, Türkçe sade mesaj gösterilir.
- Rol bazlı yetki UI ve API seviyesinde korunur.

## Mevcut Sorunların Kök Nedeni
- `overtimes`, `advances`, `equipment` gibi endpoint’ler çekirdek Dolibarr’da standart değildir.
- Bu yüzden `501 API not found` hatası oluşur.
- Çözüm: Bu akışları çekirdek modüllere map etmek.

## Çekirdek Modül Eşlemesi
1. Fazla Mesai:
- Kaynak modül: `Gündem` (Agenda / `actioncomm`)
- Kayıt modeli: etkinlik başlık/açıklama + başlangıç/bitiş + kullanıcı

2. Avans Yönetimi:
- Kaynak modül: `Gider Raporları` (`expensereports`)
- Kayıt modeli: avans talebini gider raporu satırı/özet notu ile temsil et

3. Zimmet Yönetimi:
- Kaynak modül: `Ürünler` + `Stoklar` + (opsiyonel) `Etiketler/Kategoriler`
- Kayıt modeli: ekipmanı ürün kartı olarak tut, zimmeti `Gündem` kaydı veya not alanı ile ilişkilendir

4. Personel Giriş/Çıkış:
- Kaynak modül: varsa `attendances`, yoksa `Gündem` üzerinden giriş/çıkış etkinliği

## Uygulama Fazları
1. Faz 1 - Endpoint Stabilizasyonu
- `src/lib/dolibarr-payroll.ts` içinde çekirdek dışı endpoint kullanımını kaldır.
- Yeni `coreHrmApi` katmanı oluştur:
  - `actioncomm` tabanlı mesai işlemleri
  - `expensereports` tabanlı avans işlemleri
  - ürün/stok tabanlı zimmet işlemleri

2. Faz 2 - Sayfa Dönüşümü
- `MesaiTalepleri.tsx` -> `actioncomm` okuma/yazma.
- `AvansYonetimi.tsx` -> `expensereports` okuma/yazma.
- `ZimmetYonetimi.tsx` -> ürün/stok + ilişki notları.
- Fallback mock veri kullanımını kaldır (üretimde yanıltıcıdır).

3. Faz 3 - Yetki ve Güvenlik
- Viewer: sadece liste.
- Warehouse: fiyat/bakiye alanları gizli.
- Sales: ayarlar ve teknik test ekranları kapalı.
- 401/403/501 hata eşlemesi standartlaştırılır.

4. Faz 4 - Test ve Doğrulama
- Bağlantı testi: `status`, `users/info` + en az bir yazma test senaryosu.
- Sayfa bazında “kayıt ekle/listele/güncelle” smoke test.
- Mobil kırılım kontrolü.

## Teknik Kararlar
- Frontend’de tek hata dönüştürücü kullanılacak (Türkçe mesaj sözlüğü).
- Tüm tarih alanları ISO formatta gönderilecek.
- Tüm parasal alanlarda sayı doğrulama zorunlu olacak.
- Mock veri sadece geliştirme bayrağı ile açılacak, varsayılan kapalı olacak.

## Hemen Yapılacaklar (İlk Sprint)
1. `dolibarr-payroll.ts` dosyasında `overtimes/advances/equipment` endpoint’lerini deprecate et.
2. `actioncomm` tabanlı `mesaiApi` ekle.
3. `MesaiTalepleri.tsx` sayfasını yeni `mesaiApi` ile çalıştır.
4. `501` mesajını kullanıcıya “Bu işlem çekirdek API’de yok” olarak sade göster.
5. Mevcut sayfalarda teknik exception metinlerini kullanıcıdan gizle.

## Beklenen Çıktı
- 501 kaynaklı kırılmalar biter.
- Uygulama yalnızca çekirdek Dolibarr özellikleriyle çalışır.
- Ücretli modül bağımlılığı kalkar.

## Riskler
- Bazı Dolibarr kurulumlarında endpoint adları/sürüm davranışı farklı olabilir.
- Avans ve zimmet için birebir karşılık yerine iş kuralı eşlemesi gerekecektir.
- Bu nedenle endpoint keşfi bir kez canlı sunucuda doğrulanmalıdır.

## Canlıya Geçiş Kontrol Listesi
- API/REST modülü açık.
- İK, Gündem, Gider Raporları, Ürün/Stok modülleri aktif.
- API key kullanıcısında ilgili okuma/yazma izinleri var.
- Test kullanıcılarında rol kısıtları doğrulandı.
