# React Bileşen Geliştirme Rehberi

## Bileşen Yapısı
Projede iki ana bileşen kategorisi var:
1. **UI Bileşenleri** (`src/components/ui/`) - Genel kullanım
2. **Layout Bileşenleri** (`src/components/layout/`) - Sayfa yapısı

## UI Bileşenleri

### Button
```typescript
import { Button } from '@/components/ui/Button';

// Variant: primary | secondary | danger | ghost
// Size: sm | md | lg

<Button variant="primary" size="md">
  <PlusIcon className="w-4 h-4" />
  Yeni Ekle
</Button>

<Button variant="secondary" onClick={handleCancel}>
  İptal
</Button>

<Button variant="danger" onClick={handleDelete}>
  Sil
</Button>
```

### Input
```typescript
import { Input } from '@/components/ui/Input';

<Input
  label="Firma Adı"
  placeholder="Firma adını girin"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
/>
```

### Select
```typescript
import { Select } from '@/components/ui/Select';

<Select
  label="Durum"
  value={status}
  onChange={setStatus}
  options={[
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Pasif' },
  ]}
/>
```

### Card
```typescript
import { Card } from '@/components/ui/Card';

<Card>
  <Card.Header>
    <h3>Başlık</h3>
  </Card.Header>
  <Card.Body>
    İçerik...
  </Card.Body>
</Card>
```

### Modal
```typescript
import { Modal } from '@/components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Yeni Müşteri"
  size="lg"
>
  <Form onSubmit={handleSubmit} />
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>İptal</Button>
    <Button variant="primary" type="submit">Kaydet</Button>
  </Modal.Footer>
</Modal>
```

### Table
```typescript
import { Table } from '@/components/ui/Table';

<Table
  columns={[
    { key: 'name', header: 'Ad' },
    { key: 'email', header: 'E-posta' },
    { key: 'status', header: 'Durum', render: (val) => <Badge>{val}</Badge> },
  ]}
  data={customers}
  loading={loading}
/>
```

### Badge
```typescript
import { Badge } from '@/components/ui/Badge';

// Variant: success | warning | danger | info | gray

<Badge variant="success">Aktif</Badge>
<Badge variant="warning">Beklemede</Badge>
<Badge variant="danger">İptal</Badge>
<Badge variant="info">Bilgi</Badge>
```

### StatCard
```typescript
import { StatCard } from '@/components/ui/StatCard';

<StatCard
  title="Toplam Müşteri"
  value={125}
  icon={UsersIcon}
  trend={{ value: 12, positive: true }}
/>
```

## Layout Bileşenleri

### Sidebar
Ana navigasyon menüsü. `src/components/layout/Sidebar.tsx`

### Header
Üst bar. Arama, bildirimler, kullanıcı menüsü.

### MainLayout
Sayfa wrapper'ı.
```typescript
import { MainLayout } from '@/components/layout';

<MainLayout>
  <PageContent />
</MainLayout>
```

## Ortak Stiller

### CSS Sınıfları
`src/index.css` içinde tanımlı:

```css
/* Butonlar */
.btn { /* Temel buton stili */ }
.btn-primary { /* Yeşil buton */ }
.btn-secondary { /* Beyaz/gri buton */ }
.btn-danger { /* Kırmızı buton */ }
.btn-ghost { /* Şeffaf buton */ }

/* Kartlar */
.card { /* Beyaz kart */ }
.card-hover { /* Hover efekti */ }

/* Input */
.input { /* Standart input */ }
.input-error { /* Hatalı input */ }

/* Table */
.table-header { /* Tablo başlık stili */ }
.table-row { /* Tablo satır stili */ }
.table-cell { /* Tablo hücre stili */ }

/* Badge */
.badge-success { /* Yeşil badge */ }
.badge-warning { /* Sarı badge */ }
.badge-danger { /* Kırmızı badge */ }
.badge-info { /* Mavi badge */ }
.badge-gray { /* Gri badge */ }

/* Navigation */
.nav-item { /* Nav link */ }
.nav-item-active { /* Aktif nav link */ }
```

## Bileşen Oluşturma Şablonu
```typescript
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  title: string;
  children: React.ReactNode;
}

export function MyComponent({ className, title, children }: Props) {
  return (
    <div className={cn('my-component', className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
```

## İkon Kullanımı
Lucide React kullanılır:
```typescript
import {
  Plus, Search, Edit, Trash2, Eye,
  Users, Package, ShoppingCart, FileText,
  DollarSign, BarChart3, Settings
} from 'lucide-react';

// Örnek
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Yeni Ekle
</Button>
```

## Responsive Tasarım
Tailwind CSS breakpoints:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```