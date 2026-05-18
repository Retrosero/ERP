# Hata Ayıklama ve Sorun Giderme

## Yaygın Hatalar

### 1. API Bağlantı Hatası
```
Error: Network Error
```
**Çözüm:**
```typescript
// 1. CORS ayarlarını kontrol et (Dolibarr tarafında)
# Dolibarr'ın cors ayarlarını etkinleştir
# conf Dolibarr içinde:

// $dolibarr_main_prod = '0';
$dolibarr_main_cors = 'https://panel.firmaadi.com';


// 2. API erişimini test et
const test = await api.system.ping();
console.log(test);
```

### 2. API Key Hatası
```
Error: 401 Unauthorized
```
**Çözüm:**
```typescript
// 1. API key'in doğru olduğunu kontrol et
// Dolibarr admin panelinden API key'i kontrol et

// 2. Key formatı doğru mu?
// DOLAPIKEY- prefix olmamalı, sadece key string'i

const config = {
  baseUrl: 'https://erp.firmaadi.com',
  apiKey: 'gerçek-api-key-here', // DOLAPIKEY- prefix yok
};
```

### 3. CORS Hataları
```
Access to fetch at 'https://erp.firma.com/api/...'
from origin 'https://panel.firma.com' has been blocked by CORS policy
```
**Çözüm:**
```typescript
// 1. Backend proxy kullan (önerilen)
# vite.config.ts içinde proxy ekle:

export default defineConfig({
  server: {
    proxy: {
      '/api/dolibarr': {
        target: 'https://erp.firmaadi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dolibarr/, '/api/index.php'),
      },
    },
  },
});

// 2. Veya Dolibarr'da CORS ayarla
// conf/index.php:
// $dolibarr_main_cors = 'https://your-frontend-domain.com';
```

### 4. TypeScript Tip Hataları
```
Type 'string | undefined' is not assignable to type 'string'
```
**Çözüm:**
```typescript
// 1. Optional chaining kullan
const name = item?.name ?? 'Varsayılan';

// 2. Tip güvenli kontrol
if (item.name) {
  console.log(item.name);
}

// 3. Tip daraltma
const name = (item.name as string) || 'Varsayılan';
```

### 5. Veri Yüklenmiyor
```
Loading spinner dönüyor ama veri gelmiyor
```
**Çözüm:**
```typescript
// 1. Network tab kontrol et
// 2. API yanıtını logla
const data = await api.thirdParty.getAll();
console.log('API Response:', data);

// 3. Konsol log'larını kontrol et
useEffect(() => {
  fetchData().catch(err => console.error('Hata:', err));
}, []);

// 4. Mock data ile test et
const mockData = [
  { id: 1, name: 'Test Müşteri' },
];
```

## Debug Teknikleri

### 1. Network İsteklerini İzleme
```typescript
// API isteklerini logla
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Request:', args);
  const response = await originalFetch(...args);
  console.log('Response:', response);
  return response;
};
```

### 2. Component Debug
```typescript
// React DevTools kullan
// VEYA

function MyComponent() {
  console.log('Render:', { state: useTrackedState() });

  return <div>...</div>;
}
```

### 3. API Response Debug
```typescript
// Dolibarr API explorer kullan
// https://erp.firmaadi.com/api/index.php/explorer

// VEYA curl ile test et
curl -X GET "https://erp.firmaadi.com/api/index.php/thirdparties" \
  -H "DOLAPIKEY: your-api-key" \
  -H "Accept: application/json"
```

## Build Hataları

### 1. Tailwind CSS Build Hatası
```
Error: Can't resolve 'tailwindcss'
```
**Çözüm:**
```bash
# 1. Bağımlılıkları yeniden kur
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 2. Tailwind CSS versiyonunu kontrol et
# package.json'da tailwindcss: "3.4.x" olmalı

# 3. PostCSS config kontrol et
# postcss.config.js:
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 2. TypeScript Hataları
```bash
# TypeScript derleme hatalarını göster
pnpm tsc --noEmit

# Hataları düzelt
# src/lib/types/dolibarr.ts dosyasını kontrol et
```

### 3. Import Path Hataları
```
Cannot find module '@/components/...'
```
**Çözüm:**
```typescript
// tsconfig.json kontrol et:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// VEYA import'u düzelt
import { Button } from '../../components/ui/Button';
```

## Performans Sorunları

### 1. Çok Fazla API İsteği
```typescript
// ❌ Kötü - Her render'da istek
function Component() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetchData(); // Her render'da çalışır!
  });
  return <div>...</div>;
}

// ✅ İyi - useCallback ve dependency array
function Component() {
  const [data, setData] = useState([]);
  const fetchData = useCallback(async () => {
    const result = await api.getData();
    setData(result);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return <div>...</div>;
}
```

### 2. Büyük Listeler
```typescript
// ✅ Virtual scrolling kullan
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={400}
  itemCount={items.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  )}
</FixedSizeList>
```

## Production Hataları

### 1. Environment Değişkenleri
```bash
# .env dosyası oluştur
VITE_DOLIBARR_BASE_URL=https://erp.firmaadi.com
VITE_DOLIBARR_API_KEY=your-api-key

# Production'da değerleri log'la (debug için)
console.log('API URL:', import.meta.env.VITE_DOLIBARR_BASE_URL);
```

### 2. Build Sonrası 404
```
Page not found after deploy
```
**Çözüm:**
```typescript
// vite.config.ts - hash routing kullan
import { createHashHistory } from 'history';

export default defineConfig({
  // ...
});
```

### 3. Asset Yüklenmiyor
```typescript
// Özel favicon veya assets için
# index.html kontrol et
<link rel="icon" href="/favicon.ico" />

# public/ klasörüne dosyaları koy
# /public/logo.png
```

## Loglama

### Client-side Logging
```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
    // Burada remote logging eklenebilir (Sentry, LogRocket vb.)
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
};

// Kullanım
logger.info('Sayfa yüklendi');
logger.error('API hatası', error);
```