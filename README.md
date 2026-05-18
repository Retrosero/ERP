# Dolibarr Panel

Dolibarr ERP için modern, Türkçe, responsive ve sade bir ön muhasebe/satış/stok web uygulaması.

## Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    Dolibarr ERP                          │
│                      (Backend)                           │
│           REST API - /api/index.php                      │
└─────────────────────────────────────────────────────────┘
                           │
                           │ DOLAPIKEY
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Proxy Server                           │
│              (server/ - Node.js/Express)                │
│  • API Key güvenliği                                     │
│  • Rate limiting                                         │
│  • Session management                                    │
│  • CORS kontrolü                                        │
│  • Cache yönetimi                                       │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP (no API key exposed)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Frontend (React)                         │
│  • Vite + TypeScript + Tailwind CSS                     │
│  • Mobil uyumlu                                          │
│  • Türkçe                                                │
│  • Dolibarr API'ye proxy üzerinden bağlanır              │
└─────────────────────────────────────────────────────────┘
```

## Hızlı Başlangıç

### 1. Frontend Kurulumu

```bash
npm install
npm run dev
```

### 2. Backend Server Kurulumu (Opsiyonel - Güvenlik için önerilir)

```bash
cd server
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm run dev
```

### 3. Dolibarr REST API Ayarları

1. Dolibarr Admin Panel → Modules → Web Services/API
2. "Enable REST API" seçeneğini aktif edin
3. Bir API key oluşturun

## Yapılandırma

### Ortam Değişkenleri (Backend)

```env
# Dolibarr Bağlantısı
DOLIBARR_BASE_URL=https://erp.firmaadi.com
DOLIBARR_API_KEY=your-api-key-here
DOLIBARR_API_PREFIX=/api/index.php
DOLIBARR_TIMEOUT=30000
DOLIBARR_ENABLE_CACHE=true

# Uygulama
APP_PORT=3001
APP_URL=http://localhost:3001

# CORS (Frontend URL'leri)
CORS_ORIGIN=http://localhost:5173
```

## Modüller

| Modül | Açıklama |
|-------|----------|
| Dashboard | Özet istatistikler ve hızlı işlemler |
| Müşteriler | Müşteri/carı yönetimi |
| Ürünler | Ürün ve stok takibi |
| Siparişler | Satış siparişleri |
| Teklifler | Teklif oluşturma ve yönetimi |
| Faturalar | Fatura görüntüleme |
| Tahsilatlar | Tahsilat ve tediye takibi |
| Stok | Stok hareketleri |
| Fiyat Listeleri | Müşteri gruplarına özel fiyatlar |
| Kar Marjı | Ürün bazlı kar marjı analizi |
| Tekrar Eden Siparişler | Otomatik sipariş oluşturma |
| Bildirimler | E-posta/SMS şablonları |
| Termal Baskı | Fiş ve etiket yazdırma |
| Kargo Takip | Kargo gönderi takibi |

## Güvenlik Özellikleri

- **Proxy Mode**: API key sadece backend'de saklanır, frontend'de visible olmaz
- **Rate Limiting**: API istekleri sınırlandırılır
- **CORS**: Frontend domain'leri beyaz listede
- **Session Yönetimi**: Backend tarafında session tabanlı auth

## Deployment

### Frontend (Bu proje)

```bash
npm run build
# dist/ klasörünü sunucuya deploy edin
```

### Backend Server

```bash
cd server
npm run build
npm start
```

## Teknolojiler

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **API**: Dolibarr REST API

## Lisans

MIT License