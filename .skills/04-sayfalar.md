# Sayfa Geliştirme Rehberi

## Sayfa Oluşturma Adımları

### 1. Yeni Sayfa Oluşturma
```typescript
// src/pages/YeniSayfa.tsx
import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, Button, Table, Badge } from '@/components/ui';

export default function YeniSayfa() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  return (
    <MainLayout>
      {/* Sayfa içeriği */}
    </MainLayout>
  );
}
```

### 2. Route Ekleme
`src/App.tsx` dosyasına ekle:
```typescript
import YeniSayfa from './pages/YeniSayfa';

<Route path="/yeni-sayfa" element={<YeniSayfa />} />
```

### 3. Sidebar'a Link Ekleme
`src/components/layout/Sidebar.tsx`:
```typescript
<SidebarLink
  href="/yeni-sayfa"
  icon={Icon}
  label="Sayfa Adı"
/>
```

## Sayfa Şablonu

### Listeleme Sayfası
```typescript
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import {
  Card, Button, Input, Select, Table,
  Badge, Pagination, Modal
} from '@/components/ui';
import { api } from '@/lib/dolibarr';
import { Plus, Search, Filter, Export } from 'lucide-react';

export default function ListPage() {
  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data fetch
  useEffect(() => {
    fetchData();
  }, [page, search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.entity.getAll({
        limit: 20,
        page: page,
        ...(search && { search }),
      });
      setItems(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sayfa Başlığı</h1>
          <p className="page-subtitle">Açıklama metni</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Yeni Ekle
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Arama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={[
            { key: 'id', header: 'ID' },
            { key: 'name', header: 'Ad' },
            { key: 'status', header: 'Durum', render: (val) => (
              <Badge variant={val === 'active' ? 'success' : 'gray'}>
                {val === 'active' ? 'Aktif' : 'Pasif'}
              </Badge>
            )},
            { key: 'actions', header: 'İşlemler', render: (_, item) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )},
          ]}
          data={items}
          loading={loading}
        />

        {/* Pagination */}
        <div className="border-t p-4">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / 20)}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Ekle"
      >
        <Form onSubmit={handleSubmit} />
      </Modal>
    </MainLayout>
  );
}
```

### Detay Sayfası
```typescript
import { useParams, useNavigate } from 'react-router-dom';

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    const data = await api.entity.getById(Number(id));
    setItem(data);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Geri
        </Button>
      </div>

      <Card>
        <Card.Header>
          <h2>{item?.name}</h2>
        </Card.Header>
        <Card.Body>
          {/* Detay içeriği */}
        </Card.Body>
      </Card>
    </MainLayout>
  );
}
```

## Sayfa Şablonu: Dashboard
```typescript
import { MainLayout } from '@/components/layout';
import { StatCard, Card } from '@/components/ui';
import { Users, Package, DollarSign, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const stats = [
    {
      title: 'Toplam Müşteri',
      value: '125',
      icon: Users,
      trend: { value: 12, positive: true },
    },
    {
      title: 'Toplam Ürün',
      value: '458',
      icon: Package,
      trend: { value: 5, positive: true },
    },
    {
      title: 'Bu Ay Satış',
      value: '₺45,230',
      icon: DollarSign,
      trend: { value: 23, positive: true },
    },
    {
      title: 'Bekleyen Sipariş',
      value: '8',
      icon: ShoppingCart,
    },
  ];

  return (
    <MainLayout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Chart */}
      <Card>
        <Card.Header>
          <h3>Aylık Satış</h3>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </MainLayout>
  );
}
```

## Form İşleme
```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: '',
});

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  try {
    await api.entity.create(formData);
    toast.success('Başarıyla kaydedildi');
    setIsModalOpen(false);
    fetchData();
  } catch (error) {
    toast.error('Kayıt sırasında hata oluştu');
  }
};
```

## Arama ve Filtreleme
```typescript
// Debounce ile arama
import { useDebounce } from '@/hooks/useDebounce';

const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  fetchData();
}, [debouncedSearch]);
```