# Sık Karşılaşılan Görevler

## Müşteri İşlemleri

### Yeni Müşteri Ekleme
```typescript
import { api } from '@/lib/dolibarr';

async function addCustomer() {
  try {
    const customer = await api.thirdParty.create({
      name: 'ABC Ticaret Ltd.',
      email: 'info@abc-ticaret.com',
      phone: '02125551234',
      address: 'Atatürk Cad. No:123',
      zip: '34000',
      town: 'İstanbul',
      client: 1,
      supplier: 0,
    });
    console.log('Müşteri oluşturuldu:', customer);
  } catch (error) {
    console.error('Hata:', error);
  }
}
```

### Müşteri Arama
```typescript
// İsme göre arama
const customers = await api.thirdParty.getAll({
  search: 'ABC',
});

// E-postaya göre
const customer = (await api.thirdParty.getAll()).find(
  c => c.email === 'info@firma.com'
);
```

### Müşteri Borç Bakiyesi
```typescript
// Dolibarr'da müşteri borcunu hesapla
const invoices = await api.invoice.getAll();
const customerInvoices = invoices.filter(
  i => i.socid === customerId && i.status !== 'paid'
);
const totalDebt = customerInvoices.reduce(
  (sum, inv) => sum + (inv.total_ttc || 0), 0
);
```

## Ürün İşlemleri

### Ürün Stok Kontrolü
```typescript
// Düşük stok kontrolü
const products = await api.product.getAll();
const lowStock = products.filter(p => (p.stock_reel || 0) < 10);

console.log('Düşük stoklu ürünler:', lowStock);
```

### Stok Güncelleme
```typescript
// Manuel stok girişi
await api.stock.createMovement({
  product_id: productId,
  warehouse_id: 1,
  qty: 100,
  type_movement: 1, // 1=Giriş, 0=Çıkış
  label: 'Stok düzeltmesi - Elle giriş',
  inventorycode: 'ADJ-001',
});
```

### Barkod ile Ürün Bulma
```typescript
// Dolibarr'da barcode alanı var
const products = await api.product.getAll();
const product = products.find(p => p.barcode === '8691234567890');
```

## Sipariş İşlemleri

### Sipariş Oluşturma (Detaylı)
```typescript
const order = await api.order.create({
  thirdparty_id: customerId,
  date: new Date().toISOString().split('T')[0],
  delivery_date: '2024-01-20',
  lines: [
    {
      fk_product: productId1,
      qty: 5,
      price: 100.00,
      tva_tx: 18,
      total_ht: 500.00,
      total_ttc: 590.00,
    },
    {
      fk_product: productId2,
      qty: 2,
      price: 250.00,
      tva_tx: 18,
      total_ht: 500.00,
      total_ttc: 590.00,
    },
  ],
  notes_public: 'Müşteri notu',
  notes_private: 'Dahili not',
});

// Siparişi onayla
await api.order.updateStatus(order.id, 'validated');
```

### Siparişi Teklife Dönüştürme
```typescript
// Teklif oluştur (siparişe benzer yapı)
const proposal = await api.proposal.create({
  thirdparty_id: customerId,
  date: new Date().toISOString().split('T')[0],
  valid_until: '2024-02-15',
  lines: orderLines,
});
```

## Fatura İşlemleri

### Fatura Oluşturma
```typescript
// Siparişten faturaya
const invoice = await api.invoice.create({
  thirdparty_id: order.socid,
  ref_client: order.ref_client,
  date: new Date().toISOString().split('T')[0],
  date_limit: '2024-02-15',
  lines: order.lines,
});

// Faturayı onayla (Dolibarr'da bu zorunlu)
await api.invoice.validate(invoice.id);

// Faturayı PDF olarak al
const pdfUrl = `${baseUrl}/documents/facture_${invoice.id}.pdf`;
```

### Kısmi Ödeme
```typescript
// Faturanın bir kısmını öde
await api.invoice.createPayment(invoiceId, {
  date: new Date().toISOString().split('T')[0],
  amount: 300.00, // Kısmi ödeme
  payment_id: 1,   // Nakit
  note: 'Peşin ödeme',
});
```

### Çoklu Fatura Ödemesi
```typescript
// Bir müşterinin tüm faturalarını listele
const invoices = await api.invoice.getAll({
  thirdparty_id: customerId,
  status: 'validated',
});

const totalDue = invoices.reduce((sum, inv) => sum + inv.total_ttc, 0);

// Tüm borcu tek seferde öde
await api.payment.createPayment({
  thirdparty_id: customerId,
  date: new Date().toISOString().split('T')[0],
  amount: totalDue,
  payment_type: 2, // Banka transferi
  invoices: invoices.map(inv => ({ id: inv.id, amount: inv.total_ttc })),
});
```

## Raporlama

### Gün Sonu Raporu
```typescript
async function getEndOfDayReport(date: string) {
  const [orders, invoices, payments] = await Promise.all([
    api.order.getAll({ date }),
    api.invoice.getAll({ date }),
    api.payment.getAll({ date }),
  ]);

  return {
    date,
    newOrders: orders.filter(o => o.status === 'validated').length,
    totalOrderAmount: orders.reduce((sum, o) => sum + (o.total_ttc || 0), 0),
    newInvoices: invoices.filter(i => i.status === 'validated').length,
    totalInvoiceAmount: invoices.reduce((sum, i) => sum + (i.total_ttc || 0), 0),
    totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    pendingInvoices: invoices.filter(i => i.status === 'validated').length,
  };
}
```

### Stok Raporu
```typescript
async function getStockReport() {
  const products = await api.product.getAll({ status: 1 });
  const movements = await api.stock.getMovements({ limit: 100 });

  return {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + (p.stock_reel || 0), 0),
    lowStockProducts: products.filter(p => (p.stock_reel || 0) < 10),
    outOfStockProducts: products.filter(p => (p.stock_reel || 0) <= 0),
    recentMovements: movements.slice(0, 20),
  };
}
```

## Dolgu Metinleri (Templates)

### Para Birimi Formatı
```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

formatCurrency(1234.56); // "1.234,56 ₺"
```

### Tarih Formatı
```typescript
const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

formatDate('2024-01-15'); // "15 Ocak 2024"
```

### Telefon Formatı
```typescript
const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};
```