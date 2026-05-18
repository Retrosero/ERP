# Geliştirme En İyi Uygulamaları

## TypeScript

### Tip Tanımlama
```typescript
// ❌ Kötü - any kullanımı
function handleData(data: any) {
  return data.id;
}

// ✅ İyi - Interface tanımlama
interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

function handleData(user: User) {
  return user.id;
}
```

### API Tip Tanımlama
```typescript
// src/lib/types/dolibarr.ts
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  zip?: string;
  town?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  zip?: string;
  town?: string;
  client: 0 | 1;
  supplier: 0 | 1;
}
```

## React

### Bileşen Yapısı
```typescript
// ✅ İyi - Ayrı fonksiyon bileşenleri
function CustomerList() {
  const { customers, loading, fetchCustomers } = useCustomers();

  return (
    <div>
      {customers.map(customer => (
        <CustomerItem key={customer.id} customer={customer} />
      ))}
    </div>
  );
}

function CustomerItem({ customer }: { customer: Customer }) {
  return <div>{customer.name}</div>;
}
```

### State Yönetimi
```typescript
// ✅ İyi - useCallback ile memoize
const fetchCustomers = useCallback(async () => {
  const data = await api.customers.getAll();
  setCustomers(data);
}, []);

useEffect(() => {
  fetchCustomers();
}, [fetchCustomers]);

// ❌ Kötü - Her render'da yeni fonksiyon
useEffect(() => {
  const fetchData = async () => { /* ... */ };
  fetchData();
}, []);
```

### Koşullu Render
```typescript
// ✅ İyi - && operatörü
{loading && <Spinner />}
{data?.length > 0 ? (
  <List data={data} />
) : (
  <EmptyState />
)}
```

## CSS / Tailwind

### Sınıf Organizasyonu
```typescript
// ✅ İyi - Anlamlı sınıf grupları
<Card className="
  p-6                      // Spacing
  bg-white                 // Background
  rounded-lg               // Border radius
  shadow-sm                // Shadow
  hover:shadow-md          // Interactive
  transition-shadow        // Animation
">
  <h2 className="          // Typography
    text-xl
    font-semibold
    text-gray-900
  ">
    Başlık
  </h2>
</Card>
```

### Responsive Tasarım
```typescript
// ✅ Mobile-first yaklaşım
<div className="
  w-full                  // Mobile (varsayılan)
  md:w-1/2               // Tablet
  lg:w-1/3               // Desktop
  xl:w-1/4               // Large screen
">
```

## Kod Organizasyonu

### Dosya Sıralaması
```typescript
// 1. Imports
import React from 'react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/dolibarr';
import { Button, Card } from '@/components/ui';

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Constants
const INITIAL_DATA = { name: '' };

// 4. Component
export default function MyComponent({ title }: Props) {
  // Hooks
  const [data, setData] = useState(INITIAL_DATA);

  // Effects
  useEffect(() => { }, []);

  // Handlers
  const handleSubmit = () => { };

  // Render
  return (
    <div>{title}</div>
  );
}
```

## Performans

### Lazy Loading
```typescript
// ✅ Code splitting
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Route-based
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### Memoization
```typescript
// ✅ expensive hesaplamalar
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);

// ✅ stable callback'ler
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

## Güvenlik

### API Key Yönetimi
```typescript
// ❌ Kötü - API key'i frontend'de saklama
const api = createClient({
  apiKey: 'secret-key-123', // HAYIR!
});

// ✅ İyi - Environment variable
const api = createClient({
  apiKey: import.meta.env.VITE_DOLIBARR_API_KEY,
});
```

### XSS Koruması
```typescript
// ✅ İyi - Kullanıcı girdisini doğrudan render etme
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userInput) }} />
```

## Test

### Temel Test Prensipleri
```typescript
// ✅ Test edilebilir kod
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Test
test('calculateTotal returns correct sum', () => {
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 1 },
  ];
  expect(calculateTotal(items)).toBe(25);
});
```

## Git Commit Mesajları
```
feat: yeni müşteri listesi görünümü
fix: arama filtresi düzeltildi
docs: README güncellendi
style: buton stilleri düzeltildi
refactor: API katmanı yeniden yapılandırıldı
test: müşteri bileşeni testleri eklendi
chore: bağımlılıklar güncellendi
```