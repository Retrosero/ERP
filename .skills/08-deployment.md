# Deployment ve DevOps Rehberi

## Yerel Geliştirme

### Geliştirme Ortamı Kurulumu
```bash
# 1. Projeyi klonla
git clone https://github.com/firma/dolibarr-panel.git
cd dolibarr-panel

# 2. Bağımlılıkları kur
pnpm install

# 3. .env dosyasını oluştur
cp .env.example .env

# 4. .env dosyasını düzenle
# DOLIBARR_BASE_URL=http://localhost/dolibarr
# DOLIBARR_API_KEY=your-api-key

# 5. Geliştirme sunucusunu başlat
pnpm dev
```

### Environment Değişkenleri
```bash
# .env dosyası içeriği
VITE_DOLIBARR_BASE_URL=https://erp.firmaadi.com
VITE_DOLIBARR_API_KEY=your-api-key
VITE_APP_NAME="Dolibarr Panel"
VITE_APP_VERSION=1.0.0
```

## Production Build

### Build İşlemi
```bash
# Production build
pnpm build

# Build output kontrol
ls -la dist/

# Önizleme
pnpm preview
```

### Build Sonrası Dosyalar
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].css
│   └── index-[hash].js
└── (diğer statik dosyalar)
```

## Deployment Seçenekleri

### 1. VPS Deployment (Nginx)

```bash
# Build output'u yükle
scp -r dist/* user@vps:/var/www/dolibarr-panel/

# Nginx config
# /etc/nginx/sites-available/dolibarr-panel
server {
    listen 80;
    server_name panel.firmaadi.com;

    root /var/www/dolibarr-panel;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Docker Deployment

```dockerfile
# Dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - TZ=Europe/Istanbul
```

### 3. Vercel / Netlify (Static Hosting)

```javascript
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 4. Docker + Dolibarr Birlikte

```yaml
# docker-compose.yml (Tam Stack)
version: '3.8'
services:
  # Dolibarr ERP
  dolibarr:
    image: dolibarr/dolibarr:latest
    ports:
      - "8080:80"
    environment:
      - DOLIBARR_DB_HOST=db
      - DOLIBARR_DB_USER=dolibarr
      - DOLIBARR_DB_PASSWORD=password
      - DOLIBARR_DB_NAME=dolibarr
    depends_on:
      - db
    volumes:
      - dolibarr_documents:/var/www/documents

  # Dolibarr Panel
  panel:
    image: dolibarr-panel:latest
    ports:
      - "3000:80"
    environment:
      - VITE_DOLIBARR_BASE_URL=http://dolibarr:80
    depends_on:
      - dolibarr

  # Database
  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=dolibarr
      - MYSQL_USER=dolibarr
      - MYSQL_PASSWORD=password
    volumes:
      - db_data:/var/lib/mysql

volumes:
  dolibarr_documents:
  db_data:
```

## CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build
        env:
          VITE_DOLIBARR_BASE_URL: ${{ secrets.DOLIBARR_BASE_URL }}
          VITE_DOLIBARR_API_KEY: ${{ secrets.DOLIBARR_API_KEY }}

      - name: Deploy to Server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: "dist/*"
          target: "/var/www/dolibarr-panel"

      - name: Deploy Commands
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /var/www/dolibarr-panel
            nginx -s reload
```

## Güvenlik

### Production Checklist
- [ ] API key environment variable olarak sakla
- [ ] HTTPS aktif et
- [ ] CORS ayarlarını yapılandır
- [ ] Rate limiting uygula
- [ ] Güvenlik header'ları ekle (HSTS, CSP, etc.)

### Nginx Security Headers
```nginx
server {
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

## Monitoring

### Health Check Endpoint
```typescript
// src/pages/HealthCheck.tsx
// Veya basit bir API route

export default function HealthCheck() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION,
  });
}
```

### Error Tracking
```typescript
// Sentry entegrasyonu
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});

export default Sentry.withErrorBoundary(App, {
  fallback: <ErrorFallback />,
});
```