import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, AlertTriangle, Loader2, Package2, Tag, TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, Input, Select, Badge, Table, Pagination, Alert } from '@/components/ui';
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

  const getTypeBadge = (type: number | undefined) => {
    if (type === 1) return <Badge variant="primary">Hizmet</Badge>;
    return <Badge variant="info">Ürün</Badge>;
  };

  const columns = [
    {
      key: 'ref',
      header: 'Kod',
      width: '100px',
      render: (value: unknown) => (
        <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded-lg">{value as string || '-'}</span>
      ),
    },
    {
      key: 'label',
      header: 'Ürün Adı',
      sortable: true,
      render: (value: unknown, record: unknown) => {
        const product = record as Product;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <span className="font-medium text-slate-900">{value as string}</span>
              {product.barcode && (
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{product.barcode}</p>
              )}
            </div>
          </div>
        );
      },
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
              'font-semibold',
              status === 'danger' ? 'text-red-600' :
              status === 'warning' ? 'text-amber-600' : 'text-slate-900'
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
        <span className="font-semibold text-slate-900">
          {value ? formatCurrency(value as number) : '-'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Tür',
      render: (value: unknown) => getTypeBadge(value as number | undefined),
    },
    {
      key: 'actions',
      header: '',
      width: '40px',
      render: () => (
        <Link to="#" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  // Calculate stats
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => (p.stock_reel || 0) > 0).length;
  const lowStockProducts = products.filter(p => p.seuil_stock_alerte && (p.stock_reel || 0) <= p.seuil_stock_alerte).length;
  const outOfStockProducts = products.filter(p => !p.stock_reel || p.stock_reel <= 0).length;

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Toplam Ürün</p>
                <p className="text-3xl font-bold text-white mt-1">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Stokta Olan</p>
                <p className="text-3xl font-bold text-white mt-1">{inStockProducts}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Düşük Stok</p>
                <p className="text-3xl font-bold text-white mt-1">{lowStockProducts}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Stokta Yok</p>
                <p className="text-3xl font-bold text-white mt-1">{outOfStockProducts}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Package2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
              <p className="text-slate-500">Ürünler yükleniyor...</p>
            </div>
          </Card>
        ) : paginatedProducts.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Ürün bulunamadı'}
              </p>
              <p className="text-sm text-slate-400 mt-2">
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
    </>
  );
}

export default Urunler;