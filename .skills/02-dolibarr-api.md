# Dolibarr API Entegrasyon Rehberi

## Genel Bakış
API entegrasyonu `src/lib/dolibarr.ts` dosyasında yönetilir. Tek bir API istemcisi tüm Dolibarr endpoint'lerine erişim sağlar.

## Konfigürasyon
```typescript
import { createDolibarrClient, DolibarrConfig } from './lib/dolibarr';

const config: DolibarrConfig = {
  baseUrl: 'https://erp.firmaadi.com',
  apiKey: 'DOLAPIKEY-xxxxx',
  companyId: 1,
};

const api = createDolibarrClient(config);
```

## API Endpoint'leri

### Müşteriler (ThirdParty)
```typescript
// Tüm müşterileri listele
api.thirdParty.getAll();

// Müşteri detayı
api.thirdParty.getById(id);

// Müşteri oluştur
api.thirdParty.create({
  name: 'Firma Adı',
  email: 'info@firma.com',
  phone: '02125551234',
  address: 'Adres bilgisi',
  zip: '34000',
  town: 'İstanbul',
  client: 1,       // Müşteri (1) / Tedarikçi (0)
  supplier: 0,
});

// Müşteri güncelle
api.thirdParty.update(id, { name: 'Yeni Ad' });

// Müşteri sil
api.thirdParty.delete(id);
```

### Ürünler (Products)
```typescript
// Tüm ürünleri listele
api.product.getAll();

// Ürün detayı
api.product.getById(id);

// Ürün oluştur
api.product.create({
  ref: 'URN001',
  label: 'Ürün Adı',
  description: 'Ürün açıklaması',
  price: 100.00,
  price_ttc: 118.00,  // KDV dahil
  tva_tx: 18,         // KDV oranı
  type: 0,            // 0=Ürün, 1=Hizmet
  status: 1,          // 1=Aktif, 0=Pasif
  stock_reel: 50,     // Stok miktarı
});

// Stok güncelle
api.product.updateStock(id, { stock_reel: 100 });
```

### Siparişler (Orders)
```typescript
// Tüm siparişleri listele
api.order.getAll({
  status: 'validated',  // filtreleme
  limit: 20
});

// Sipariş detayı
api.order.getById(id);

// Sipariş oluştur
api.order.create({
  thirdparty_id: 1,
  date: '2024-01-15',
  lines: [
    {
      fk_product: 1,
      qty: 5,
      price: 100,
      tva_tx: 18,
    }
  ]
});

// Sipariş durumu güncelle
api.order.updateStatus(id, 'validated'); // draft, validated, approved, sent, delivered, closed, cancelled
```

### Teklifler (Proposals)
```typescript
// Tüm teklifleri listele
api.proposal.getAll();

// Teklif oluştur
api.proposal.create({
  thirdparty_id: 1,
  date: '2024-01-15',
  valid_until: '2024-01-30',
  lines: [...]
});

// Teklif onayla (siparişe dönüştür)
api.proposal.approve(id);

// Teklif reddet
api.proposal.refuse(id);
```

### Faturalar (Invoices)
```typescript
// Tüm faturaları listele
api.invoice.getAll();

// Fatura detayı
api.invoice.getById(id);

// Fatura oluştur
api.invoice.create({
  thirdparty_id: 1,
  date: '2024-01-15',
  date_limit: '2024-02-15',
  lines: [...],
});

// Fatura onayla
api.invoice.validate(id);

// Fatura öde
api.invoice.createPayment(id, {
  date: '2024-01-20',
  amount: 118,
  payment_id: 1,  // Nakit, Kredi Kartı, Banka
  note: 'Nakit ödeme'
});
```

### Ödemeler (Payments)
```typescript
// Tahsilatlar
api.payment.getPaymentsForCustomer(customerId);
api.payment.createPayment({
  thirdparty_id: customerId,
  date: '2024-01-20',
  amount: 500,
  payment_type: 1,  // 0=Nakit, 1=Kredi Kartı, 2=Banka
  note: 'Açıklama'
});

// Tediyeler (Tedarikçi ödemeleri)
api.payment.getPaymentsForSupplier(supplierId);
```

### Stok Hareketleri
```typescript
// Stok hareketleri
api.stock.getMovements({
  warehouse_id: 1,
  limit: 50,
});

// Stok girişi
api.stock.createMovement({
  product_id: 1,
  warehouse_id: 1,
  qty: 100,
  type_movement: 1,  // 0=Çıkış, 1=Giriş
  label: 'Stok girişi',
});

// Depo listesi
api.stock.getWarehouses();
```

### Sistem
```typescript
// Ping test
api.system.ping();

// Şirket bilgisi
api.system.getCompanyInfo();

// Kullanıcı bilgisi
api.system.getCurrentUser();
```

## Hata Yönetimi
```typescript
try {
  const customers = await api.thirdParty.getAll();
} catch (error) {
  if (error.response?.status === 401) {
    // API anahtarı geçersiz
  } else if (error.response?.status === 404) {
    // Kaynak bulunamadı
  } else {
    // Diğer hatalar
  }
}
```

## İpucu: Yerel Geliştirme
Dolibarr'a erişim olmadan geliştirme için mock data kullan:
```typescript
// src/lib/dolibarr.ts'de test modu
const USE_MOCK_DATA = true;
```

## Status Değerleri

### Sipariş Durumları
| Değer | Açıklama |
|-------|----------|
| `draft` | Taslak |
| `validated` | Onaylandı |
| `approved` | Satın alındı |
| `sent` | Gönderildi |
| `delivered` | Teslim edildi |
| `closed` | Kapandı |
| `cancelled` | İptal |

### Fatura Durumları
| Değer | Açıklama |
|-------|----------|
| `draft` | Taslak |
| `validated` | Onaylandı |
| `paid` | Ödendi |
| `cancelled` | İptal |
| `abandoned` | Bırakıldı |

### Teklif Durumları
| Değer | Açıklama |
|-------|----------|
| `draft` | Taslak |
| `opened` | Açık |
| `signed` | İmzalandı |
| `not_signed` | İmzalanmadı |
| `closed_signed` | Tamamlandı |
| `closed_unsigned` | Reddedildi |