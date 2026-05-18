# Dolibarr ERP Panel - Faz Speç (Özellik Spesifikasyonu)

**Versiyon:** 1.0
**Tarih:** 2024
**Yazar:** MiniMax Agent
**Durum:** Planlama

---

## Genel Bakış

Bu doküman, Dolibarr ERP Panel'e eklenecek tüm özelliklerin detaylı spesifikasyonlarını içerir. Her özellik için kullanıcı hikayeleri, teknik gereksinimler, UI/UX tasarımları ve acceptance kriterleri tanımlanmıştır.

---

## Faz 1: Temel Stok & Satış Özellikleri

### 1.1 QR/Barkod Etiket Baskısı

**Öncelik:** 🔴 Yüksek
**Tahmini Süre:** 3-4 gün

#### 1.1.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-1.1.1 | Depo personeli olarak, ürünlerin barkodlu etiketlerini yazdırabilmeliyim | Depo Personeli |
| US-1.1.2 | Satış personeli olarak, müşteriye verilecek ürünlere özel etiket basabilmeliyim | Satış Personeli |
| US-1.1.3 | Yönetici olarak, etiket şablonlarını özelleştirebilmeliyim | Yönetici |

#### 1.1.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-1.1.1 | Ürün listesi görüntülenebilmeli ve seçilebilmeli | Çoklu seçim destekli |
| FR-1.1.2 | Barkod formatları desteklenmeli | EAN-13, Code-128, QR Code |
| FR-1.1.3 | Etiket boyutları seçilebilmeli | 50x25mm, 70x35mm, A4 |
| FR-1.1.4 | Etiket içeriği özelleştirilebilmeli | Ürün adı, fiyat, barkod, VKN |
| FR-1.1.5 | Toplu yazdırma desteği | Batch printing |
| FR-1.1.6 | Termal yazıcı desteği | ESC/POS protokolü |

#### 1.1.3 UI/UX Gereksinimleri

- **Etiket Önizleme:** Gerçek zamanlı önizleme
- **Sürükle-Bırak:** Ürünleri etiket alanına sürükleme
- **Yazdırma Kuyruğu:** Yazdırılacak işlerin listesi
- **Mobil Uyumluluk:** Temel mobil destek

#### 1.1.4 Teknik Gereksinimler

```
Teknolojiler:
- JsBarcode (barkod üretimi)
- qrcode.js (QR kod üretimi)
- react-to-print (yazdırma)
- ESC/POS library (termal yazıcı)

API Endpointleri:
- GET /api/products - Ürün listesi
- GET /api/products/:id/barcode - Barkod verisi
- POST /api/prints/label - Etiket yazdırma isteği
```

#### 1.1.5 Acceptance Kriterleri

- [ ] Ürün seçildiğinde barkod otomatik oluşuyor
- [ ] EAN-13 ve Code-128 barkodlar okunabilir
- [ ] QR kodlar telefon kamerasıyla taranabilir
- [ ] Etiket önizleme doğru görüntüleniyor
- [ ] A4 kağıda çoklu etiket yazdırılabiliyor
- [ ] Termal yazıcıdan çıktı alınabiliyor

---

### 1.2 Çoklu Depo Yönetimi

**Öncelik:** 🔴 Yüksek
**Tahmini Süre:** 5-7 gün

#### 1.2.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-1.2.1 | Yönetici olarak, birden fazla depo ekleyebilmeliyim | Yönetici |
| US-1.2.2 | Depo personeli olarak, her depodaki stokları görebilmeliyim | Depo Personeli |
| US-1.2.3 | Satış personeli olarak, ürün transferi yapabilmeliyim | Satış Personeli |

#### 1.2.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-1.2.1 | Depo CRUD işlemleri | Create, Read, Update, Delete |
| FR-1.2.2 | Depo bazlı stok takibi | Her depo için ayrı stok yönetimi |
| FR-1.2.3 | Depolar arası transfer | Transfer emri ve onayı |
| FR-1.2.4 | Depo yetkilendirme | Kullanıcı-depo ilişkisi |
| FR-1.2.5 | Minimum/maximum stok uyarıları | Depo bazlı eşik değerler |
| FR-1.2.6 | Konsolide stok görünümü | Tüm depoların toplamı |

#### 1.2.3 UI/UX Gereksinimleri

- **Depo Haritası:** Görsel depo takibi
- **Transfer Akışı:** Sürükle-bırak ile transfer
- **Stok Dashboard:** Depo bazlı özet kartlar
- **Filtreleme:** Depo seçim dropdown

#### 1.2.4 Teknik Gereksinimler

```
Veritabanı:
- warehouses (id, name, address, is_active)
- warehouse_products (warehouse_id, product_id, quantity, min_stock, max_stock)
- warehouse_transfers (id, from_warehouse, to_warehouse, product_id, quantity, status)

API Endpointleri:
- GET /api/warehouses
- POST /api/warehouses
- GET /api/warehouses/:id/stock
- POST /api/transfers
- GET /api/transfers/:id
- PUT /api/transfers/:id/status
```

#### 1.2.5 Acceptance Kriterleri

- [ ] Yeni depo eklenebiliyor
- [ ] Depo silinebiliyor (boş ise)
- [ ] Her depodaki stok ayrı görünüyor
- [ ] Transfer talebi oluşturulabiliyor
- [ ] Transfer onay/red işlemi çalışıyor
- [ ] Stok uyarıları tetikleniyor

---

### 1.3 Fiyat Listeleri

**Öncelik:** 🔴 Yüksek
**Tahmini Süre:** 4-5 gün

#### 1.3.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-1.3.1 | Yönetici olarak, müşteri gruplarına özel fiyat listesi oluşturabilmeliyim | Yönetici |
| US-1.3.2 | Satış personeli olarak, müşteriye özel fiyat uygulayabilmeliyim | Satış Personeli |
| US-1.3.3 | Müşteri olarak, toptan fiyatımla alışveriş yapabilmeliyim | Müşteri |

#### 1.3.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-1.3.1 | Fiyat listesi CRUD | Liste oluşturma, ürün ekleme |
| FR-1.3.2 | Müşteri grubu tanımlama | Toptancı, perakende, özel |
| FR-1.3.3 | İskonto oranları | Yüzdesel ve sabit iskonto |
| FR-1.3.4 | Geçerlilik tarihleri | Başlangıç-bitiş tarihleri |
| FR-1.3.5 | Otomatik fiyat uygulama | Siparişte otomatik seçim |
| FR-1.3.6 | Fiyat hiyerarşisi | Özel > Grup > Standart |

#### 1.3.3 UI/UX Gereksinimleri

- **Fiyat Listesi Editörü:** Tablo formatında düzenleme
- **Müşteri Grubu Seçimi:** Dropdown ile seçim
- **İskonto Kartı:** Yüzdesel/ TL iskonto gösterimi
- **Fiyat Karşılaştırma:** Eski/yeni fiyat gösterimi

#### 1.3.4 Teknik Gereksinimler

```
Veritabanı:
- price_lists (id, name, customer_group, discount_type, discount_value, valid_from, valid_to, is_active)
- price_list_items (price_list_id, product_id, price, discount)
- customer_group_discounts (group_id, product_id, discount_percent)

API Endpointleri:
- GET /api/price-lists
- POST /api/price-lists
- GET /api/price-lists/:id/items
- POST /api/price-lists/:id/items
- GET /api/products/:id/price?customer_id=X
```

#### 1.3.5 Acceptance Kriterleri

- [ ] Fiyat listesi oluşturulabiliyor
- [ ] Ürünlere özel fiyat girilebiliyor
- [ ] İskonto oranları uygulanıyor
- [ ] Geçerlilik tarihleri kontrol ediliyor
- [ ] Siparişte doğru fiyat listesi seçiliyor
- [ ] Müşteri grubuna göre fiyat değişiyor

---

### 1.4 Kar Marjı Analizi

**Öncelik:** 🔴 Yüksek
**Tahmini Süre:** 3-4 gün

#### 1.4.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-1.4.1 | Yönetici olarak, ürün bazlı kar marjımı görebilmeliyim | Yönetici |
| US-1.4.2 | Yönetici olarak, müşteri bazlı karlılığı analiz edebilmeliyim | Yönetici |
| US-1.4.3 | Yönetici olarak, dönemsel kar/zarar raporu alabilmeliyim | Yönetici |

#### 1.4.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-1.4.1 | Birim maliyet takibi | Alış fiyatı kaydı |
| FR-1.4.2 | Kar marjı hesaplama | (Satış - Maliyet) / Satış |
| FR-1.4.3 | Karlılık raporları | Ürün, müşteri, kategori bazlı |
| FR-1.4.4 | Grafikler ve görselleştirme | Pasta, çizgi, sütun grafikleri |
| FR-1.4.5 | Dönem karşılaştırması | Aylık, çeyreklik, yıllık |
| FR-1.4.6 | İhracat | Excel, PDF formatları |

#### 1.4.3 UI/UX Gereksinimleri

- **Karlılık Dashboard:** Ana metrikler özet kartı
- **Kar Marjı Tablosu:** Filtrelenebilir tablo
- **Grafikler:** Recharts ile interaktif grafikler
- **Trend Analizi:** Zaman serisi grafikleri

#### 1.4.4 Teknik Gereksinimler

```
Veritabanı:
- product_costs (product_id, cost, effective_date)
- profit_reports (id, product_id, customer_id, revenue, cost, profit, margin_percent, period)

API Endpointleri:
- GET /api/reports/profit-margin?product_id=X
- GET /api/reports/profit-margin?customer_id=X
- GET /api/reports/profit-margin?period=monthly
- GET /api/reports/customer-profitability
- GET /api/reports/product-profitability
```

#### 1.4.5 Acceptance Kriterleri

- [ ] Ürün bazlı kar marjı hesaplanıyor
- [ ] Müşteri bazlı karlılık görünüyor
- [ ] Dönemsel karşılaştırma yapılabiliyor
- [ ] Grafikler doğru veri gösteriyor
- [ ] Excel/PDF export çalışıyor

---

## Faz 2: Müşteri & İletişim Özellikleri

### 2.1 Tekrar Eden Siparişler

**Öncelik:** 🟡 Orta
**Tahmini Süre:** 4-5 gün

#### 2.1.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-2.1.1 | Müşteri olarak, düzenli siparişlerimi otomatik oluşturmasını istiyorum | Müşteri |
| US-2.1.2 | Yönetici olarak, tekrar eden siparişleri yönetebilmeliyim | Yönetici |

#### 2.1.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-2.1.1 | Recurring sipariş tanımı | Ürün, miktar, sıklık |
| FR-2.1.2 | Sıklık seçenekleri | Haftalık, 2 haftalık, aylık |
| FR-2.1.3 | Otomatik sipariş oluşturma | Cron job ile |
| FR-2.1.4 | E-posta bildirimi | Sipariş oluşunca |
| FR-2.1.5 | Sipariş geçmişi | Tüm recurring siparişler |

#### 2.1.3 Acceptance Kriterleri

- [ ] Recurring sipariş oluşturulabiliyor
- [ ] Sıklık ayarları çalışıyor
- [ ] Otomatik sipariş oluşuyor
- [ ] Bildirim gönderiliyor

---

### 2.2 E-posta/SMS Bildirimleri

**Öncelik:** 🟡 Orta
**Tahmini Süre:** 5-6 gün

#### 2.2.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-2.2.1 | Sistem olarak, sipariş durumu değiştiğinde bildirim gönderebilmeliyim | Sistem |
| US-2.2.2 | Müşteri olarak, ödeme hatırlatması alabilmeliyim | Müşteri |
| US-2.2.3 | Yönetici olarak, stok kritik uyarısı alabilmeliyim | Yönetici |

#### 2.2.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-2.2.1 | Bildirim türleri | Sipariş, fatura, ödeme, stok |
| FR-2.2.2 | Şablon yönetimi | E-posta ve SMS şablonları |
| FR-2.2.3 | Kanal seçimi | E-posta, SMS, bildirim merkezi |
| FR-2.2.4 | Zamanlama | Anlık, ertelenmiş |
| FR-2.2.5 | Bildirim geçmişi | Tüm gönderilen bildirimler |

#### 2.2.3 Acceptance Kriterleri

- [ ] E-posta bildirimi gönderilebiliyor
- [ ] SMS bildirimi gönderilebiliyor
- [ ] Şablonlar özelleştirilebiliyor
- [ ] Bildirim geçmişi görüntülenebiliyor

---

### 2.3 Müşteri Portalı

**Öncelik:** 🟡 Orta
**Tahmini Süre:** 6-8 gün

#### 2.3.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-2.3.1 | Bayi olarak, kendi siparişlerimi takip edebilmeliyim | Bayi |
| US-2.3.2 | Bayi olarak, borç durumumu görebilmeliyim | Bayi |
| US-2.3.3 | Bayi olarak, geçmiş faturalarımı indirebilmeliyim | Bayi |

#### 2.3.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-2.3.1 | Ayrı giriş ekranı | Bayi portalı |
| FR-2.3.2 | Sipariş takibi | Durum ve tarihçe |
| FR-2.3.3 | Borç dökümü | Vadesi geçmiş, mevcut |
| FR-2.3.4 | Fatura indirme | PDF, XML |
| FR-2.3.5 | Ürün kataloğu | Sadece fiyat görünümü |

#### 2.3.3 Acceptance Kriterleri

- [ ] Bayi girişi çalışıyor
- [ ] Siparişler listeleniyor
- [ ] Borç durumu görünüyor
- [ ] Faturalar indirilebiliyor

---

## Faz 3: Operasyonel Özellikler

### 3.1 Termal Fiş Baskısı

**Öncelik:** 🟡 Orta
**Tahmini Süre:** 3-4 gün

#### 3.1.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-3.1.1 | Kasiyer olarak, hızlı satış fişi basabilmeliyim | Kasiyer |
| US-3.1.2 | Kasiyer olarak, 80mm termal yazıcıdan çıktı alabilmeliyim | Kasiyer |

#### 3.1.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-3.1.1 | 80mm format desteği | Standart termal kağıt |
| FR-3.1.2 | ESC/POS protokolü | Yazıcı komutları |
| FR-3.1.3 | Logo basımı | Üst bilgi logosu |
| FR-3.1.4 | QR kod inclusion | Fiş üzerinde ödeme QR'ı |
| FR-3.1.5 | Kasiyer bilgisi | Personel adı ve saat |

#### 3.1.3 Acceptance Kriterleri

- [ ] 80mm fiş basılabiliyor
- [ ] ESC/POS komutları çalışıyor
- [ ] Logo görüntüleniyor
- [ ] QR kod taranabilir

---

### 3.2 Kargo Takibi

**Öncelik:** 🟡 Orta
**Tahmini Süre:** 4-5 gün

#### 3.2.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-3.2.1 | Satış personeli olarak, kargo takip numarası girebilmeliyim | Satış Personeli |
| US-3.2.2 | Müşteri olarak, kargo durumunu sorgulayabilmeliyim | Müşteri |
| US-3.2.3 | Yönetici olarak, tüm kargoları izleyebilmeliyim | Yönetici |

#### 3.2.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-3.2.1 | Kargo firması entegrasyonu | Yurtiçi, Aras, PTT |
| FR-3.2.2 | Takip numarası girişi | Manuel veya API |
| FR-3.2.3 | Durum güncelleme | Otomatik webhook |
| FR-3.2.4 | E-posta bildirimi | Müşteriye otomatik |

#### 3.2.3 Acceptance Kriterleri

- [ ] Takip numarası kaydediliyor
- [ ] Kargo durumu güncelleniyor
- [ ] Bildirim gönderiliyor

---

### 3.3 PWA Mobil Destek

**Öncelik:** 🟡 Orta
**Tahmini Süre:** 5-6 gün

#### 3.3.1 Kullanıcı Hikayeleri

| # | Hikaye | Actor |
|---|--------|-------|
| US-3.3.1 | Saha personeli olarak, internet olmadan sipariş girebilmeliyim | Saha Personeli |
| US-3.3.2 | Saha personeli olarak, telefonuma indirdiğim uygulamayı kullanabilmeliyim | Saha Personeli |

#### 3.3.2 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-3.3.1 | Service Worker | Offline veri önbelleği |
| FR-3.3.2 | IndexedDB | Yerel veri depolama |
| FR-3.3.3 | Background sync | Online olunca gönderim |
| FR-3.3.4 | App manifest | Kurulum desteği |
| FR-3.3.5 | Push notifications | Bildirim desteği |

#### 3.3.3 Acceptance Kriterleri

- [ ] Uygulama telefona yüklenebiliyor
- [ ] Offline sipariş girişi çalışıyor
- [ ] Online olunca veri senkronize oluyor
- [ ] Push bildirimleri alınıyor

---

## Faz 4: Yönetim & Raporlama

### 4.1 Aktivite Logları

**Öncelik:** 🟢 Geliştirme
**Tahmini Süre:** 2-3 gün

#### 4.1.1 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-4.1.1 | İşlem loglama | Tüm CRUD işlemleri |
| FR-4.1.2 | Kullanıcı takibi | Kim, ne zaman, nerede |
| FR-4.1.3 | Log sorgulama | Tarih, kullanıcı, işlem tipi |
| FR-4.1.4 | Log dışa aktarma | Excel, PDF |

#### 4.1.2 Acceptance Kriterleri

- [ ] Tüm işlemler loglanıyor
- [ ] Loglar listelenebiliyor
- [ ] Filtreleme çalışıyor

---

### 4.2 Bütçe Takibi

**Öncelik:** 🟢 Geliştirme
**Tahmini Süre:** 4-5 gün

#### 4.2.1 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-4.2.1 | Bütçe tanımlama | Yıllık, aylık |
| FR-4.2.2 | Kategori bazlı bütçe | Gider kategorileri |
| FR-4.2.3 | Gerçekleşen takibi | Bütçe vs harcama |
| FR-4.2.4 | Uyarı sistemi | %80, %100 eşikleri |

#### 4.2.2 Acceptance Kriterleri

- [ ] Bütçe oluşturulabiliyor
- [ ] Harcamalar izleniyor
- [ ] Uyarılar tetikleniyor

---

### 4.3 Dashboard Özelleştirme

**Öncelik:** 🟢 Geliştirme
**Tahmini Süre:** 3-4 gün

#### 4.3.1 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-4.3.1 | Widget seçimi | Drag-drop ile |
| FR-4.3.2 | Layout özelleştirme | Grid sistemi |
| FR-4.3.3 | Tercih kaydetme | LocalStorage |
| FR-4.3.4 | Varsayılan layout | Reset seçeneği |

#### 4.3.2 Acceptance Kriterleri

- [ ] Widgetlar eklenebiliyor
- [ ] Layout kaydediliyor
- [ ] Reset çalışıyor

---

## Faz 5: Entegrasyon & Veri Yönetimi

### 5.1 E-ticaret Entegrasyonu

**Öncelik:** 🟢 Geliştirme
**Tahmini Süre:** 6-8 gün

#### 5.1.1 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-5.1.1 | WooCommerce entegrasyonu | Ürün, sipariş senkronizasyonu |
| FR-5.1.2 | Shopify entegrasyonu | API üzerinden bağlantı |
| FR-5.1.3 | Çift yönlü senkronizasyon | Stok güncelleme |
| FR-5.1.4 | Log yönetimi | Senkronizasyon hataları |

#### 5.1.2 Acceptance Kriterleri

- [ ] WooCommerce'e bağlanabiliyor
- [ ] Ürünler senkronize oluyor
- [ ] Siparişler aktarılıyor

---

### 5.2 Yedekleme/Geri Yükleme

**Öncelik:** 🟢 Geliştirme
**Tahmini Süre:** 3-4 gün

#### 5.2.1 Fonksiyonel Gereksinimler

| # | Gereksinim | Açıklama |
|---|------------|----------|
| FR-5.2.1 | Veri dışa aktarma | JSON, CSV |
| FR-5.2.2 | Veri içe aktarma | Import wizard |
| FR-5.2.3 | Yedekleme zamanlama | Manuel ve otomatik |
| FR-5.2.4 | Yedek listesi | Versiyon takibi |

#### 5.2.2 Acceptance Kriterleri

- [ ] JSON export çalışıyor
- [ ] CSV import çalışıyor
- [ ] Yedekleme listesi görünüyor

---

## Sektöre Özel Özellikler

### Toptan Satış

| Özellik | Açıklama | Öncelik |
|---------|----------|---------|
| Minimum sipariş tutarı | Belirli tutarın altı red | 🔴 |
| Sevkiyat planlaması | Teslimat günü seçimi | 🟡 |
| Palet/Koli takibi | Birim dönüştürme | 🟡 |

### Gıda

| Özellik | Açıklama | Öncelik |
|---------|----------|---------|
| Son kullanma tarihi | STOK uyarı sistemi | 🔴 |
| Parti takibi | Lot numarası | 🟡 |
| Sıcaklık kontrolü | Soğuk zincir raporu | 🟡 |

### Hırdavat

| Özellik | Açıklama | Öncelik |
|---------|----------|---------|
| Birim dönüştürme | Adet/koli/paket | 🔴 |
| Raf/yeri takibi | Lokasyon kodu | 🟡 |
| Ölçü birimleri | Mt, kg, lt | 🟡 |

### Depo

| Özellik | Açıklama | Öncelik |
|---------|----------|---------|
| Lokasyon bazlı stok | Raf/kolon/kat | 🔴 |
| Barkod tarama | El terminalleri | 🟡 |
| Yerleştirme önerisi | Optimal yerleşim | 🟡 |

### Saha Satış

| Özellik | Açıklama | Öncelik |
|---------|----------|---------|
| GPS konum takibi | Ziyaret kaydı | 🟡 |
| Route optimizasyonu | En kısa yol | 🟡 |
| İmza yakalama | Dijital imza | 🟡 |

---

## Gantt Şeması (Önerilen Timeline)

```
Faz 1: Temel Stok & Satış (8-10 gün)
├── 1.1 QR/Barkod (3-4 gün)
├── 1.2 Çoklu Depo (5-7 gün)
├── 1.3 Fiyat Listeleri (4-5 gün)
└── 1.4 Kar Marjı (3-4 gün)

Faz 2: Müşteri & İletişim (8-10 gün)
├── 2.1 Tekrar Eden Sipariş (4-5 gün)
├── 2.2 E-posta/SMS (5-6 gün)
└── 2.3 Müşteri Portalı (6-8 gün)

Faz 3: Operasyonel (7-9 gün)
├── 3.1 Termal Fiş (3-4 gün)
├── 3.2 Kargo Takibi (4-5 gün)
└── 3.3 PWA Mobil (5-6 gün)

Faz 4: Yönetim & Raporlama (5-7 gün)
├── 4.1 Aktivite Logları (2-3 gün)
├── 4.2 Bütçe Takibi (4-5 gün)
└── 4.3 Dashboard (3-4 gün)

Faz 5: Entegrasyon (6-8 gün)
├── 5.1 E-ticaret (6-8 gün)
└── 5.2 Yedekleme (3-4 gün)
```

**Toplam Tahmini Süre:** 34-44 iş günü

---

## Sonraki Adımlar

1. **Onay:** Bu dokümanı review edin ve onaylayın
2. **Önceliklendirme:** Hangi özelliklerle başlanacağına karar verin
3. **Iterasyon:** Her özellik için ayrı sprint planlaması yapın
4. **Testing:** Her özellik için ayrı test senaryoları yazın

---

**Doküman Versiyon Geçmişi:**

| Versiyon | Tarih | Yazar | Değişiklik |
|----------|-------|------|------------|
| 1.0 | 2024 | MiniMax Agent | İlk versiyon |