# ERP SaaS Backend

Multi-tenant ERP SaaS platform backend with Dolibarr API integration.

## ⚠️ Önemli Not

**Asla Dolibarr çekirdeğine dokunmayın!** Bu sistem Dolibarr'ın REST API'sini kullanarak çalışır ve Dolibarr'ın kendi kodunu değiştirmez.

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                     localhost:5173                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP
┌─────────────────────────────▼───────────────────────────────────┐
│                     BACKEND (Node.js)                          │
│                     localhost:3001                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   API Gateway                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │ Super Admin │  │   Tenant   │  │  API Key Auth   │  │    │
│  │  │    API      │  │    API     │  │    (v1)         │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────────┐│
│  │                    Services Layer                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    ││
│  │  │   Auth      │  │   Module    │  │    Dolibarr     │    ││
│  │  │   Service   │  │   Service   │  │    Service      │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌──────────────────┐    ┌───────────────┐
│  PostgreSQL   │    │  Firm 1 Dolibarr │    │  Firm N       │
│  SaaS DB      │    │  API             │    │  Dolibarr API │
└───────────────┘    └──────────────────┘    └───────────────┘
```

## 🚀 Başlangıç

### Gereksinimler

- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### Kurulum

```bash
# Bağımlılıkları yükle
cd backend
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env dosyasını düzenle ve veritabanı bağlantısını ayarla

# Prisma'i kur
npx prisma generate
npx prisma db push

# Seed data ekle
npm run db:seed

# Sunucuyu başlat
npm run dev
```

### Veritabanı

```bash
# Migration oluştur
npm run prisma:migrate

# Şemayı veritabanına push et
npm run prisma:push

# Seed data ekle
npm run db:seed
```

## 📁 Proje Yapısı

```
backend/
├── prisma/
│   ├── schema.prisma      # Veritabanı şeması
│   └── seed.ts           # Başlangıç verileri
├── src/
│   ├── config/           # Konfigürasyon
│   │   ├── index.ts      # Ana konfigürasyon
│   │   └── database.ts   # Prisma client
│   ├── controllers/      # API Controller'lar
│   │   ├── admin.controller.ts   # Super Admin işlemleri
│   │   └── tenant.controller.ts  # Tenant işlemleri
│   ├── middleware/      # Express Middleware'leri
│   │   ├── auth.middleware.ts    # JWT & API Key auth
│   │   ├── rate-limit.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/          # Express Rotları
│   │   ├── admin.routes.ts
│   │   └── tenant.routes.ts
│   ├── services/        # İş servisleri
│   │   └── dolibarr.service.ts   # Dolibarr API entegrasyonu
│   ├── types/          # TypeScript tipleri
│   │   └── index.ts
│   └── index.ts        # Ana uygulama
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Super Admin API (`/api/admin`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/auth/login` | Super Admin girişi |
| GET | `/auth/profile` | Admin profil bilgisi |
| GET | `/firms` | Tüm firmaları listele |
| POST | `/firms` | Yeni firma oluştur |
| GET | `/firms/:id` | Firma detayları |
| PUT | `/firms/:id` | Firma güncelle |
| DELETE | `/firms/:id` | Firma sil |
| POST | `/firms/:id/suspend` | Firmayı askıya al |
| POST | `/firms/:id/reactivate` | Firmayı aktif et |
| POST | `/modules/activate` | Modül aktive et |
| POST | `/modules/deactivate` | Modül deaktive et |
| GET | `/firms/:firm_id/users` | Firma kullanıcıları |
| POST | `/firms/:firm_id/users` | Kullanıcı oluştur |
| POST | `/firms/:firm_id/api-keys` | API key oluştur |
| GET | `/stats` | Platform istatistikleri |
| GET | `/logs` | Admin logları |

### Tenant API (`/api/tenant`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/dashboard/stats` | Tenant istatistikleri |
| GET | `/modules/:module/access` | Modül erişim kontrolü |
| GET | `/webhooks` | Webhook listesi |
| POST | `/webhooks` | Webhook oluştur |
| DELETE | `/webhooks/:id` | Webhook sil |

### Dolibarr Proxy (`/api/tenant/dolibarr/*`)

Dolibarr API'sine proxy istekleri:

| Method | Endpoint | Dolibarr Endpoint |
|--------|----------|-------------------|
| GET | `/dolibarr/thirdparties` | GET /thirdparties |
| POST | `/dolibarr/thirdparties` | POST /thirdparties |
| GET | `/dolibarr/products` | GET /products |
| POST | `/dolibarr/products` | POST /products |
| GET | `/dolibarr/orders` | GET /orders |
| POST | `/dolibarr/orders` | POST /orders |
| GET | `/dolibarr/invoices` | GET /invoices |
| POST | `/dolibarr/invoices` | POST /invoices |
| GET | `/dolibarr/projects` | GET /projects |
| POST | `/dolibarr/projects` | POST /projects |

### API Key API (`/api/v1`)

API key ile erişim için (JWT yerine):

```
# Header'da API key gönder
X-API-Key: your-api-key-here
```

## 🔐 Kimlik Doğrulama

### JWT Token

```bash
# Giriş
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@erp-saas.com", "password": "admin123"}'

# Token ile istek
curl -X GET http://localhost:3001/api/admin/firms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Key

```bash
# API key ile istek
curl -X GET http://localhost:3001/api/v1/products \
  -H "X-API-Key: YOUR_API_KEY"
```

## 📊 Veritabanı Şeması

### Firm (Tenant)

```typescript
{
  id: string;
  name: string;
  email: string;
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'PENDING' | 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  dolibarr_url: string;
  dolibarr_api_key: string;
  max_users: number;
  max_storage_gb: number;
  subdomain: string;
  trial_ends_at: Date;
}
```

### Module Permission

```typescript
{
  id: string;
  firm_id: string;
  module: ModuleType;
  is_active: boolean;
  expires_at: Date | null;
  is_trial: boolean;
  trial_ends_at: Date | null;
}
```

## 🧪 Test

```bash
# Sunucu çalışıyorken

# Health check
curl http://localhost:3001/health

# Super Admin login
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp-saas.com","password":"admin123"}'
```

## 📦 Modüller

| Modül | Açıklama | Plan |
|-------|----------|------|
| CRM | Müşteri İlişkileri Yönetimi | Tümü |
| INVENTORY | Stok ve Envanter | Tümü |
| PROJECT | Proje Yönetimi | Pro, Enterprise |
| HR | İnsan Kaynakları | Pro, Enterprise |
| SALES | Satış ve Teklifler | Tümü |
| POS | Satış Noktası | Pro, Enterprise |
| ACCOUNTING | Muhasebe | Pro, Enterprise |
| BANKING | Banka Yönetimi | Pro, Enterprise |
| CALENDAR | Takvim ve Randevular | Pro, Enterprise |
| WEBHOOKS | Webhook Entegrasyonları | Enterprise |
| API_ACCESS | API Erişimi | Enterprise |
| ANALYTICS | Analitik | Pro, Enterprise |

## 🔧 Konfigürasyon

`.env` dosyası:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/erp_saas"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Super Admin
SUPER_ADMIN_EMAIL="admin@erp-saas.com"
SUPER_ADMIN_PASSWORD="change-me!"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Trial
DEFAULT_TRIAL_DAYS=14
```

## 📄 Lisans

MIT License