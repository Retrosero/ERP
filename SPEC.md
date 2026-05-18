# Dolibarr Panel - Paraşüt Alternatifi Teknik Şartnamesi

**Versiyon:** 2.0
**Tarih:** 2026-05-18
**Durum:** Aktif Geliştirme
**Hedef:** Türkiye'deki KOBİ'ler için Paraşüt alternatifi ön muhasebe platformu

---

## 1. Proje Vizyonu

Dolibarr ERP altyapısını kullanarak, Paraşüt benzeri modern, Türkçe ve kullanımı kolay bir ön muhasebe platformu oluşturmak. Küçük ve orta ölçekli işletmeler için fatura yönetimi, cari takip, stok kontrolü, nakit yönetimi, çek-senet işlemleri, gelir-gider raporlaması ve banka entegrasyonunu tek bir platformda sunmak.

**Temel Fark:** Paraşüt gibi bulut tabanlı değil, Dolibarr üzerinde çalışan ve Dolibarr'ın güçlü backend'ini kullanan bir ön muhasebe arayüzü.

---

## 2. Mevcut Durum (v1.0)

### Tamamlanan Modüller

| Modül | Durum | Açıklama |
|-------|-------|----------|
| Dashboard | ✅ | İstatistikler, grafikler, hızlı erişim |
| Müşteriler | ✅ | Müşteri/Cari yönetimi |
| Ürünler | ✅ | Ürün ve hizmet yönetimi |
| Siparişler | ✅ | Satış siparişleri |
| Teklifler | ✅ | Müşteri teklifleri |
| Faturalar | ✅ | Fatura yönetimi |
| Tahsilatlar | ✅ | Tahsilat/Tediye |
| Stok | ✅ | Stok hareketleri |
| Ayarlar | ✅ | API bağlantı ayarları |

---

## 3. Eklenmesi Gereken Modüller (v2.0)

### 3.1 Nakit Yönetimi (Kasa/Banka)

**Öncelik:** 🔴 Yüksek

#### Sayfa Yapısı
```
/kasa
├── /kasa/hareketler     # Kasa hareketleri listesi
├── /kasa/ekle           # Yeni kasa hareketi
└── /kasa/rapor          # Kasa raporu

/banka-hesaplari
├── /bankalar             # Banka hesapları listesi
├── /bankalar/hesap/:id   # Hesap detayı
└── /bankalar/hareketler   # Banka hareket geçmişi
```

#### Özellikler

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | **Kasa Hesapları** | Birden fazla kasa tanımlama (TL, USD, EUR) |
| 2 | **Banka Hesapları** | Banka hesapları tanımlama ve bakiye takibi |
| 3 | **Nakit Giriş/Çıkış** | Manuel para giriş/çıkış işlemleri |
| 4 | **Hareket Kategorileri** | Gelir/Gider kategorileri |
| 5 | **Açıklama ve Etiketler** | Her hareket için not ve etiket |
| 6 | **Cari Entegrasyonu** | Müşteri/Tedarikçi ile ilişkilendirme |
| 7 | **Fatura Entegrasyonu** | Fatura ödemelerini otomatik kaydetme |
| 8 | **Döviz Takibi** | Çoklu döviz kuru desteği |
| 9 | **Bakiye Uyarıları** | Belirli bakiye altına düşünce uyarı |

#### Veri Modeli

```typescript
// Kasa Hesabı
interface CashAccount {
  id: number;
  name: string;                    // "Kasa TL", "Kasa USD"
  currency: string;                // "TRY", "USD", "EUR"
  balance: number;                  // Mevcut bakiye
  description?: string;
  is_default?: boolean;
  created_at: string;
}

// Banka Hesabı
interface BankAccount {
  id: number;
  name: string;                    // "Garanti - TL Hesap"
  bank_name: string;               // "Garanti BBVA"
  account_number: string;          // "TR12 3456 7890..."
  iban?: string;
  currency: string;
  balance: number;
  account_type: 'checking' | 'savings' | 'credit';
  created_at: string;
}

// Kasa/Banka Hareketi
interface CashFlow {
  id: number;
  account_type: 'cash' | 'bank';
  account_id: number;
  direction: 'in' | 'out';
  amount: number;
  currency: string;
  date: string;
  category: string;                // "Satış Tahsilatı", "Tedarikçi Ödeme"
  reference_type?: 'invoice' | 'expense' | 'manual';
  reference_id?: number;
  description?: string;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'check' | 'bond';
  created_by: number;
}

// Kategori
interface CashCategory {
  id: number;
  name: string;                    // "Satış", "Kira", "Maas"
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}
```

#### UI Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| `CashAccountCard` | Kasa/Banka özet kartı (bakiye, son hareket) |
| `CashFlowTable` | Hareket listesi (tarih, açıklama, tutar, yön) |
| `QuickTransferModal` | Hesaplar arası transfer formu |
| `CashFlowFilter` | Tarih, kategori, hesap filtreleri |
| `BalanceChart` | Bakiye trend grafiği |

#### API Endpoint'leri

```typescript
// Kasa hesapları
GET    /cashaccounts
POST   /cashaccounts
PUT    /cashaccounts/:id
DELETE /cashaccounts/:id

// Banka hesapları
GET    /bankaccounts
POST   /bankaccounts
PUT    /bankaccounts/:id
DELETE /bankaccounts/:id

// Nakit akışı
GET    /cashflows?account_type=&account_id=&date_start=&date_end=&category=
POST   /cashflows
PUT    /cashflows/:id
DELETE /cashflows/:id

// Transfer
POST   /cashflows/transfer {
  from_account_type: 'cash' | 'bank',
  from_account_id: number,
  to_account_type: 'cash' | 'bank',
  to_account_id: number,
  amount: number,
  date: string,
  description?: string
}
```

---

### 3.2 Çek ve Senet Yönetimi

**Öncelik:** 🔴 Yüksek

#### Sayfa Yapısı
```
/cek-senet
├── /cek-senet/alinan     # Alınan çekler/senetler
├── /cek-senet/verilen    # Verilen çekler/senetler
├── /cek-senet/bordro     # Çek/Senet bordroları
└── /cek-senet/guncelle   # Durum güncelleme
```

#### Özellikler

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | **Çek Kaydı** | Müşteriden alınan çek bilgileri |
| 2 | **Senet Kaydı** | Müşteriden alınan senet bilgileri |
| 3 | **Vade Takibi** | Çek/Senet vade tarihi takibi |
| 4 | **Durum Yönetimi** | Tahsil Edildi, Tahsil Edilemedi, Ciro Edildi, Protestolu |
| 5 | **Bordro İşlemleri** | Çek/Senet bordro oluşturma |
| 6 | **Ciro İşlemleri** | Başka firmaya ciro etme |
| 7 | **Takım Güncelleme** | Tarih güncelleme |
| 8 | **Hatırlatmalar** | Vade yaklaşan çekler için uyarı |
| 9 | **Yazdırma** | Çek/Senet yazdırma şablonu |

#### Veri Modeli

```typescript
// Çek
interface Check {
  id: number;
  type: 'check';
  direction: 'received' | 'issued';  // Alınan mı Verilen mi
  serial_number: string;             // Çek sıra numarası
  bank_code: string;                 // Banka kodu
  branch_code: string;               // Şube kodu
  account_number: string;            // Hesap numarası
  amount: number;
  currency: string;
  issue_date: string;                // Düzenlenme tarihi
  due_date: string;                 // Vade tarihi
  drawer_name: string;              // Çek sahibi (keşideci)
  drawer_tax_number?: string;
  beneficiary_id?: number;           // Lehtar (alındıysa)
  status: 'pending' | 'collected' | 'returned' | 'transferred' | 'protested';
  status_changed_at?: string;
  notes?: string;
  created_by: number;
  created_at: string;
}

// Senet
interface PromissoryNote {
  id: number;
  type: 'promissory';
  direction: 'received' | 'issued';
  serial_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  drawer_name: string;
  endorsement_count?: number;        // Ciro sayısı
  status: 'pending' | 'collected' | 'returned' | 'transferred' | 'protested';
  notes?: string;
  created_by: number;
  created_at: string;
}

// Bordro
interface CheckNoteBatch {
  id: number;
  batch_number: string;
  type: 'check' | 'promissory' | 'mixed';
  direction: 'in' | 'out';
  total_amount: number;
  count: number;
  issue_date: string;
  items: (Check | PromissoryNote)[];
  status: 'draft' | 'submitted' | 'processed';
  created_by: number;
}
```

#### API Endpoint'leri

```typescript
// Çekler
GET    /checks?direction=&status=&due_date_start=&due_date_end=
POST   /checks
PUT    /checks/:id
PUT    /checks/:id/status   // Durum güncelle
DELETE /checks/:id

// Senetler
GET    /promissorynotes?direction=&status=&due_date_start=&due_date_end=
POST   /promissorynotes
PUT    /promissorynotes/:id
PUT    /promissorynotes/:id/status
DELETE /promissorynotes/:id

// Bordrolar
GET    /check-note-batches
POST   /check-note-batches
PUT    /check-note-batches/:id/submit   // Bordroyu işleme koy
```

---

### 3.3 Gider Yönetimi

**Öncelik:** 🟡 Orta

#### Sayfa Yapısı
```
/giderler
├── /giderler/lists             # Gider listesi
├── /giderler/kategoriler       # Gider kategorileri
├── /giderler/tekrar           # Tekrarlayan giderler
└── /giderler/rapor            # Gider raporu
```

#### Özellikler

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | **Gider Kaydı** | Manuel gider girişi |
| 2 | **Fatura Entegrasyonu** | Alış faturalarını gider olarak kaydetme |
| 3 | **Kategori Yönetimi** | Gider kategorileri (Kira, Maaş, Elektrik vb.) |
| 4 | **Tekrarlayan Giderler** | Aylık/KDV'li tekrar eden giderler |
| 5 | **Mekik/Gider Dağılımı** | Giderleri birden fazla kategoreye dağıtma |
| 6 | **Onay Süreci** | Büyük giderler için onay akışı |
| 7 | **Vergi Takibi** | KDV ve stopaj hesaplama |

#### Veri Modeli

```typescript
// Gider
interface Expense {
  id: number;
  title: string;
  amount: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  date: string;
  due_date?: string;
  category_id: number;
  supplier_id?: number;
  invoice_id?: number;
  payment_account_id?: number;
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  description?: string;
  receipt_path?: string;
  created_by: number;
  created_at: string;
}

// Gider Kategorisi
interface ExpenseCategory {
  id: number;
  name: string;          // "Kira", "Elektrik", "Su", "İnternet"
  parent_id?: number;
  icon?: string;
  color?: string;
  is_active: boolean;
}

// Tekrarlayan Gider
interface RecurringExpense {
  id: number;
  title: string;
  amount: number;
  category_id: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  next_execution?: string;
  auto_create: boolean;   // Otomatik oluştur
  is_active: boolean;
}
```

#### API Endpoint'leri

```typescript
// Giderler
GET    /expenses?category_id=&date_start=&date_end=&status=
POST   /expenses
PUT    /expenses/:id
DELETE /expenses/:id

// Kategoriler
GET    /expense-categories
POST   /expense-categories
PUT    /expense-categories/:id
DELETE /expense-categories/:id

// Tekrarlayan
GET    /recurring-expenses
POST   /recurring-expenses
PUT    /recurring-expenses/:id
DELETE /recurring-expenses/:id
```

---

### 3.4 Rapor Merkezi

**Öncelik:** 🔴 Yüksek

#### Sayfa Yapısı
```
/raporlar
├── /raporlar/dashboard         # Özet raporlar
├── /raporlar/cari              # Cari hesap raporu
├── /raporlar/stok              # Stok durumu raporu
├── /raporlar/gelir-gider       # Gelir-Gider raporu
├── /raporlar/kdv               # KDV raporu
├── /raporlar/bakiye            # Bakiye raporu
├── /raporlar/tahsilat          # Tahsilat raporu
└── /raporlar/custom            # Özel rapor oluşturma
```

#### Rapor Türleri

| # | Rapor | Açıklama | Parametreler |
|---|-------|----------|--------------|
| 1 | **Cari Raporu** | Müşteri/Tedarikçi borç-alacak | Tarih aralığı, Cari seçimi |
| 2 | **Yaşlandırma Raporu** | Vadesi geçen alacaklar | Tarih, Vade günü |
| 3 | **Gelir-Gider Raporu** | Aylık gelir-gider karşılaştırma | Tarih aralığı, Kategori |
| 4 | **KDV Raporu** | KDV beyannamesi verileri | Ay/Yıl, Matrah |
| 5 | **Stok Durumu** | Anlık stok miktar ve değeri | Depo seçimi |
| 6 | **Stok Hareket** | Giriş/Çıkış hareketleri | Tarih, Ürün |
| 7 | **Satış Raporu** | Satış performansı | Tarih, Ürün, Müşteri |
| 8 | **Tahsilat Raporu** | Tahsilat performansı | Tarih, Müşteri |
| 9 | **Nakit Akışı** | Nakit giriş-çıkış | Tarih, Hesap |
| 10 | **Kar-Zarar** | Brüt kar, net kar | Tarih |

#### Veri Modeli

```typescript
// Rapor Konfigürasyonu
interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  parameters: ReportParameter[];
  created_by: number;
  is_favorite: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

// Rapor Çıktısı
interface ReportResult {
  id: string;
  config_id: string;
  generated_at: string;
  parameters_used: Record<string, any>;
  data: any;
  summary: {
    total_records: number;
    total_amount?: number;
  };
}
```

#### API Endpoint'leri

```typescript
// Raporlar
GET    /reports/cari?date_start=&date_end=&soc_id=
GET    /reports/aging?as_of_date=&days=
GET    /reports/income-expense?date_start=&date_end=
GET    /reports/vat?month=&year=
GET    /reports/stock?warehouse_id=
GET    /reports/sales?date_start=&date_end=&product_id=
GET    /reports/collection?date_start=&date_end=
GET    /reports/cashflow?date_start=&date_end=&account_id=

// Özel Rapor
POST   /reports/custom
GET    /reports/custom/:id

// Rapor Çıktısı
GET    /reports/:id/export?format=pdf|excel|csv
```

---

### 3.5 Kullanıcı Yetkilendirme

**Öncelik:** 🟡 Orta

#### Sayfa Yapısı
```
/yonetim
├── /yonetim/kullanicilar       # Kullanıcı listesi
├── /yonetim/roller             # Rol tanımları
├── /yonetim/izinler             # İzin matris
└── /yonetim/aktivite           # Aktivite logları
```

#### Rol Tanımları

| # | Rol | İzinler |
|---|-----|---------|
| 1 | **Yönetici** | Tüm modüller, tüm işlemler |
| 2 | **Muhasebeci** | Faturalar, Cari, Nakit, Raporlar (okuma/yazma) |
| 3 | **Satış Temsilcisi** | Müşteriler, Siparişler, Teklifler (okuma/yazma) |
| 4 | **Depo Sorumlusu** | Stok, Ürünler (okuma/yazma) |
| 5 | **Saha Satış** | Müşteriler, Siparişler (okuma/yazma/mobil) |
| 6 | **Sadece Okuma** | Tüm modüller (salt okuma) |

#### Veri Modeli

```typescript
// Kullanıcı
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'accountant' | 'sales' | 'warehouse' | 'field_sales' | 'viewer';
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

// Rol İzinleri
interface Permission {
  module: string;           // "invoices", "customers", "cash"
  action: 'create' | 'read' | 'update' | 'delete' | 'approve';
  granted: boolean;
}

// Aktivite Log
interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  module: string;
  record_id?: number;
  details?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}
```

#### API Endpoint'leri

```typescript
// Kullanıcılar
GET    /users
POST   /users
PUT    /users/:id
DELETE /users/:id

// Roller
GET    /roles
POST   /roles
PUT    /roles/:id
DELETE /roles/:id

// İzinler
GET    /permissions
PUT    /permissions/:role_id

// Aktivite
GET    /activity-logs?user_id=&module=&date_start=&date_end=
```

---

### 3.6 Banka Entegrasyonu

**Öncelik:** 🟡 Orta

#### Sayfa Yapısı
```
/banka-entegrasyonu
├── /banka-entegrasyonu/hesaplar  # Bağlı banka hesapları
├── /banka-entegrasyonu/hareketler # Otomatik hareketler
└── /banka-entegrasyonu/eslestirme  # Eşleştirme
```

#### Özellikler

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | **Banka Bağlantısı** | İmza/MT940 formatında veri alma |
| 2 | **Otomatik Hareket** | Banka hareketlerini otomatik çekme |
| 3 | **Fatura Eşleştirme** | Banka harek. ile fatura eşleştirme |
| 4 | **Tahsilat Otomatik** | Gelen para => Fatura kapatma |
| 5 | **Mekik İşlemleri** | Banka > Kasa, Kasa > Banka |
| 6 | **Bakiye Senkron** | Banka bakiyesini otomatik güncelle |

#### Veri Modeli

```typescript
// Banka Bağlantısı
interface BankConnection {
  id: number;
  bank_account_id: number;
  connection_type: 'file_import' | 'api' | 'internet_banking';
  format: 'mt940' | 'csv' | 'excel';
  last_sync?: string;
  is_active: boolean;
}

// Banka Hareketi (Otomatik)
interface BankTransaction {
  id: number;
  connection_id: number;
  original_date: string;
  original_description: string;
  amount: number;
  currency: string;
  matched: boolean;
  matched_invoice_id?: number;
  matched_cashflow_id?: number;
  status: 'pending' | 'matched' | 'manual';
}

// Eşleştirme Kuralı
interface MatchingRule {
  id: number;
  name: string;
  pattern: string;           // Regex veya keyword
  target_type: 'invoice' | 'customer' | 'cashflow';
  auto_match: boolean;
  is_active: boolean;
}
```

#### API Endpoint'leri

```typescript
// Banka Bağlantıları
GET    /bank-connections
POST   /bank-connections
PUT    /bank-connections/:id
DELETE /bank-connections/:id

// Banka Hareketleri
GET    /bank-transactions?connection_id=&status=&date=
POST   /bank-transactions/import
POST   /bank-transactions/:id/match
POST   /bank-transactions/:id/ignore

// Eşleştirme Kuralları
GET    /matching-rules
POST   /matching-rules
PUT    /matching-rules/:id
DELETE /matching-rules/:id
```

---

### 3.7 Çoklu Şirket Yönetimi

**Öncelik:** 🟡 Orta

#### Sayfa Yapısı
```
/sirketler
├── /sirketler/lists             # Şirket listesi
├── /sirketler/ekle              # Yeni şirket
├── /sirketler/:id               # Şirket detay
└── /sirketler/:id/ayarlar       # Şirket ayarları
```

#### Özellikler

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | **Şirket Tanımlama** | Her şirket için ayrı Dolibarr entity |
| 2 | **Hızlı Geçiş** | Şirketler arası geçiş menüsü |
| 3 | **Şirket Bazlı Yetki** | Kullanıcı sadece belirli şirkete erişir |
| 4 | **Konsolide Rapor** | Tüm şirketlerin birleşik raporu |
| 5 | **Logo ve Renk** | Her şirket için özelleştirme |

#### Veri Modeli

```typescript
// Şirket
interface Company {
  id: number;
  dolibarr_entity: number;      // Dolibarr entity ID
  name: string;
  tax_number: string;
  logo?: string;
  color?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

// Kullanıcı-Şirket İlişkisi
interface UserCompanyAccess {
  user_id: number;
  company_id: number;
  role: string;
  is_default: boolean;
}
```

#### API Endpoint'leri

```typescript
// Şirketler
GET    /companies
POST   /companies
PUT    /companies/:id
DELETE /companies/:id

// Kullanıcı Erişimi
GET    /user-company-access?user_id=
POST   /user-company-access
DELETE /user-company-access/:id

// Konsolide Rapor
GET    /reports/consolidated?date_start=&date_end=
```

---

### 3.8 e-Fatura / e-Arşiv (UI Hazırlığı)

**Öncelik:** 🟢 Düşük (Dolibarr API'ye bağlı)

#### Sayfa Yapısı
```
/e-fatura
├── /e-fatura/gonder             # Gönderilenler
├── /e-fatura/alinan             # Alınanlar
├── /e-fatura/taslak             # Taslaklar
├── /e-fatura/arama              # e-Fatura sorgulama
└── /e-fatura/ayarlar            # Gib entegrasyonu
```

#### Özellikler (UI Hazırlığı)

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | **e-Fatura Oluşturma** | e-Fatura formatında fatura oluştur |
| 2 | **e-Arşiv Oluşturma** | e-Arşiv formatında fatura oluştur |
| 3 | **GİB Entegrasyonu** | GİB'e gönderim/alma |
| 4 | **Ubl Oluşturma** | UBL-XML formatında çıktı |
| 5 | **İmzalama** | e-İmza desteği |
| 6 | **Gelen Kutusu** | Alınan e-Faturaları listele |

#### Veri Modeli

```typescript
// e-Fatura Ayarları
interface EFaturaSettings {
  company_id: number;
  gib_user: string;
  gib_password: string;
  alias: string;
  certificate_path?: string;
  endpoint: string;
  is_active: boolean;
}

// e-Fatura
interface EFatura {
  id: number;
  invoice_id?: number;
  uuid: string;
  type: 'invoice' | 'credit_note';
  direction: 'outbound' | 'inbound';
  status: 'draft' | 'signed' | 'sent' | 'received' | 'read' | 'error';
  issue_date: string;
  recipient_name: string;
  recipient_tax_number: string;
  total_amount: number;
  xml_path?: string;
  pdf_path?: string;
  created_at: string;
}
```

---

### 3.9 Fatura Şablonları ve Yazdırma

**Öncelik:** 🟡 Orta

#### Sayfa Yapısı
```
/ayarlar
├── /ayarlar/yazdirma             # Yazdırma şablonları
├── /ayarlar/sablonlar             # Şablon listesi
└── /ayarlar/logolar              # Logo yükleme
```

#### Özellikler

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | **Şablon Oluşturma** | Sürükle-bırak ile şablon tasarımı |
| 2 | **Logo Yükleme** | Şirket logosu |
| 3 | **Özel Alanlar** | Ek bilgi alanları |
| 4 | **PDF Çıktısı** | Şık PDF oluşturma |
| 5 | **Toplu Yazdırma** | Çoklu fatura yazdırma |
| 6 | **E-posta Gönder** | Faturaları e-posta ile gönderme |

#### Veri Modeli

```typescript
// Yazdırma Şablonu
interface PrintTemplate {
  id: number;
  name: string;
  type: 'invoice' | 'order' | 'proposal' | 'waybill';
  content: string;               // HTML/CSS template
  is_default: boolean;
  company_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Logo
interface CompanyLogo {
  company_id: number;
  logo_url: string;
  favicon_url?: string;
}
```

---

## 4. Geliştirme Sıralaması

### Faz 1: Temel Eksikler (2-3 hafta)
1. **Nakit Yönetimi** - Kasa/Banka modülü
2. **Çek-Senet Yönetimi** - Çek ve senet takibi
3. **Gider Yönetimi** - Gider kayıtları

### Faz 2: Raporlama (1-2 hafta)
4. **Rapor Merkezi** - Tüm rapor türleri
5. **Dashboard Geliştirme** - Yeni widget'lar

### Faz 3: Kurumsal (2-3 hafta)
6. **Kullanıcı Yetkilendirme** - Rol ve izin sistemi
7. **Çoklu Şirket** - Şirket yönetimi

### Faz 4: Entegrasyonlar (2-3 hafta)
8. **Banka Entegrasyonu** - Otomatik hareket
9. **e-Fatura UI** - Fatura şablonları

---

## 5. Teknoloji Notları

### Dolibarr API Uyumu
- Tüm API istekleri Dolibarr REST API üzerinden
- Authentication: `DOLAPIKEY` header
- Endpoint prefix: `/api/index.php`

### Frontend Mevcut
- React 18 + TypeScript
- Tailwind CSS
- React Router v6
- Lucide React (icons)

### Yeni Sayfalar Ekleme
```typescript
// src/App.tsx
import Kasa from './pages/Kasa';
import CekSenet from './pages/CekSenet';
import Giderler from './pages/Giderler';
import RaporMerkezi from './pages/RaporMerkezi';

// Route ekle
<Route path="/kasa" element={<Kasa />} />
<Route path="/cek-senet" element={<CekSenet />} />
<Route path="/giderler" element={<Giderler />} />
<Route path="/raporlar" element={<RaporMerkezi />} />
```

### Sidebar Güncelleme
```typescript
// src/components/layout/Sidebar.tsx
const menuItems = [
  // ... mevcut
  { section: 'Nakit Yönetimi', items: [
    { path: '/kasa', label: 'Kasa', icon: Wallet },
    { path: '/banka-hesaplari', label: 'Banka Hesapları', icon: Building2 },
  ]},
  { section: 'Çek/Senet', items: [
    { path: '/cek-senet/alinan', label: 'Alınan', icon: FileCheck },
    { path: '/cek-senet/verilen', label: 'Verilen', icon: FileX },
  ]},
  // ...
];
```

---

## 6. Test Planı

### Birim Testleri
- Her bileşen için test
- API mock kullanarak

### Entegrasyon Testleri
- Dolibarr API bağlantı testleri
- Form gönderim testleri

### UI/UX Testleri
- Responsive kontrol
- Tarayıcı uyumluluğu (Chrome, Firefox, Safari, Edge)
- Mobil görünüm testleri

### Performans Testleri
- Sayfa yüklenme süreleri
- API yanıt süreleri

---

## 7. Dokümantasyon

### Kullanıcı Dokümantasyonu
- Her modül için kullanım kılavuzu
- Video eğitimler (ileride)
- SSS bölümü

### Geliştirici Dokümantasyonu
- API referansı
- Bileşen kütüphanesi
- .skills/ klasörü zaten mevcut

---

## 8. Riskler ve Çözümler

| Risk | Olasılık | Etki | Çözüm |
|------|----------|------|-------|
| Dolibarr API sınırlamaları | Orta | Yüksek | Alternatif veri yapıları |
| CORS sorunları | Düşük | Orta | Backend proxy kullan |
| Performans sorunları | Düşük | Orta | Lazy loading, pagination |
| Dolibarr versiyon uyumsuzluğu | Düşük | Yüksek | Versiyon kontrolü |

---

## 9. Başarı Kriterleri

### Ürün
- [ ] Tüm modüller tam işlevsel
- [ ] Türkçe %100 tam
- [ ] Mobil uyumlu
- [ ] < 2 saniye sayfa yüklenme

### Kullanıcı
- [ ] Paraşüt benzeri kullanıcı deneyimi
- [ ] Minimal eğitim gereksinimi
- [ ] Yüksek kullanıcı memnuniyeti

### Teknik
- [ ] %100 TypeScript, hatasız build
- [ ] Responsive, tüm cihazlarda çalışır
- [ ] Dolibarr ile sorunsuz senkronizasyon

---

**Hazırlayan:** MiniMax Agent
**Onay:** Geliştirme başlamadan önce review edilmeli