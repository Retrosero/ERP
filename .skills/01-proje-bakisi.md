# Dolibarr Panel Proje Genel Bakış

## Proje Amacı
Dolibarr ERP için modern, Türkçe, responsive web arayüzü. Küçük ve orta ölçekli işletmeler için sadeleştirilmiş panel.

## Teknoloji Stack
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS 3.4
- **Routing:** React Router v6
- **Icons:** Lucide React
- **State:** React Context + localStorage
- **API:** Dolibarr REST API

## Proje Yapısı
```
src/
├── components/
│   ├── layout/      # Sidebar, Header, MainLayout
│   └── ui/          # Button, Input, Card, Modal, Table, vs.
├── hooks/           # Custom React hooks
├── lib/
│   ├── dolibarr.ts  # API client
│   ├── types/       # TypeScript type definitions
│   └── utils.ts     # Utility functions
├── pages/           # Sayfa bileşenleri
├── App.tsx          # Router tanımları
├── main.tsx         # Entry point
└── index.css       # Global stiller
```

## Sayfalar
| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Dashboard | `/` | Ana panel, istatistikler |
| Müşteriler | `/musteriler` | Müşteri/cariler |
| Ürünler | `/urunler` | Ürün ve hizmetler |
| Siparişler | `/siparisler` | Satış siparişleri |
| Teklifler | `/teklifler` | Müşteri teklifleri |
| Faturalar | `/faturalar` | Fatura yönetimi |
| Tahsilatlar | `/tahsilatlar` | Tahsilat/tediye |
| Stok | `/stok` | Stok hareketleri |
| Ayarlar | `/ayarlar` | API ve sistem ayarları |

## Başlangıç
```bash
# Development
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

## API Bağlantı Ayarları
`src/lib/dolibarr.ts` dosyasında `DolibarrConfig` ile tanımlanır:
- `baseUrl`: Dolibarr sunucu adresi
- `apiKey`: API anahtarı
- `companyId`: Şirket ID (opsiyonel)

## Önemli Notlar
- Tüm veri işlemleri Dolibarr REST API üzerinden yapılır
- Frontend doğrudan veritabanına erişmez
- Yetkilendirme sistemi Dolibarr API key ile sağlanır