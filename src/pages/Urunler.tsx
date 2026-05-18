import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, Table, Pagination, Alert } from '@/components/ui';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { productApi } from '@/lib/dolibarr';
import type { Product } from '@/lib/types/dolibarr';

const categoryOptions = [
  { value: '', label: 'Tüm Kategoriler' },
  { value: 'toy', label: 'Oyuncak' },
  { value: 'stationery', label: 'Kırtasiye' },
  { value: 'hardware', label: 'Hırdavat' },
  { value: 'service', label: 'Hizmet' },
];

const typeOptions = [
  { value: '', label: 'Tümü' },
  { value: 'product', label: 'Ürün' },
  { value: 'service', label: 'Hizmet' },
];

export function Urunler() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch products from Dolibarr
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productApi.list({ limit: 100, sortfield: 'label', sortorder: 'ASC' });
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ürünler yüklenirken hata oluştu');
      console.error('Products fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.includes(searchQuery);
    const matchesType = !typeFilter || (typeFilter === 'service' && product.type === 1) || (typeFilter === 'product' && product.type === 0);
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStockStatus = (stock: number | undefined, minStock: number | undefined) => {
    if (!stock || stock <= 0) return 'danger';
    if (minStock && stock <= minStock) return 'warning';
    return 'success';
  };

  const columns = [
    {
      key: 'ref',
      header: 'Kod',
      width: '100px',
      render: (value: unknown) => (
        <span className="font-mono text-sm">{value as string || '-'}</span>
      ),
    },
    {
      key: 'label',
      header: 'Ürün Adı',
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'barcode',
      header: 'Barkod',
      render: (value: unknown) => (
        <span className="font-mono text-sm text-gray-600">{value as string || '-'}</span>
      ),
    },
    {
      key: 'stock_reel',
      header: 'Stok',
      align: 'right' as const,
      render: (value: unknown, record: unknown) => {
        const product = record as Product;
        const status = getStockStatus(value as number | undefined, product.seuil_stock_alerte);
        return (
          <div className="flex items-center justify-end gap-2">
            {(product.seuil_stock_alerte && (value as number) <= product.seuil_stock_alerte) && (
              <AlertTriangle className={cn('w-4 h-4',
                status === 'danger' ? 'text-red-500' : 'text-amber-500'
              )} />
            )}
            <span className={cn(
              'font-medium',
              status === 'danger' ? 'text-red-600' :
              status === 'warning' ? 'text-amber-600' : 'text-gray-900'
            )}>
              {formatNumber(value as number, 0)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'price',
      header: 'Fiyat',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-medium text-gray-900">
          {value ? formatCurrency(value as number) : '-'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Tür',
      render: (value: unknown) => (
        <Badge variant={(value as number) === 1 ? 'primary' : 'info'}>
          {(value as number) === 1 ? 'Hizmet' : 'Ürün'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      render: () => (
        <button className="p-1 rounded hover:bg-gray-100">
          <span className="sr-only">İşlemler</span>
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="page-title">Ürünler</h1>
            <p className="page-subtitle">
              {filteredProducts.length} ürün bulundu
            </p>
          </div>
          <Link to="/urunler/yeni">
            <Button icon={<Plus className="w-4 h-4" />}>
              Yeni Ürün
            </Button>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <Alert type="error" title="Hata">
            {error}
            <p className="text-sm mt-1">Lütfen Dolibarr bağlantınızı kontrol edin.</p>
          </Alert>
        )}

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Ürün adı, kod veya barkod ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={typeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
              className="w-full md:w-32"
            />
          </div>
        </Card>

        {/* Loading or Table */}
        {isLoading ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Ürünler yükleniyor...</p>
            </div>
          </Card>
        ) : paginatedProducts.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Ürün bulunamadı'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Dolibarr'da ürün eklemek için yeni ürün butonuna tıklayın.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <Table
              columns={columns}
              data={paginatedProducts as unknown as Record<string, unknown>[]}
              onRowClick={(row) => window.location.href = `/urunler/${(row as any).id}`}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

export default Urunler;