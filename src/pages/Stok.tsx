import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, ArrowUp, ArrowDown, ArrowLeftRight, Filter, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, Table, Pagination, Alert } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';
import { stockApi, productApi, warehouseApi } from '@/lib/dolibarr';
import type { StockMovement, Product, Warehouse } from '@/lib/types/dolibarr';

interface StockMovementDisplay {
  id: number;
  date: string;
  type: number;
  productName: string;
  productId: number;
  warehouseName: string;
  warehouseId: number;
  quantity: number;
  reference: string;
}

const typeOptions = [
  { value: '', label: 'Tüm Hareketler' },
  { value: '0', label: 'Giriş' },
  { value: '1', label: 'Çıkış' },
  { value: '2', label: 'Transfer' },
];

const getTypeBadge = (type: number) => {
  switch (type) {
    case 0:
      return <Badge variant="success">Giriş</Badge>;
    case 1:
      return <Badge variant="danger">Çıkış</Badge>;
    case 2:
      return <Badge variant="info">Transfer</Badge>;
    default:
      return <Badge variant="gray">Bilinmiyor</Badge>;
  }
};

const getTypeIcon = (type: number) => {
  switch (type) {
    case 0:
      return <ArrowDown className="w-4 h-4 text-green-600" />;
    case 1:
      return <ArrowUp className="w-4 h-4 text-red-600" />;
    case 2:
      return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
    default:
      return <Package className="w-4 h-4 text-gray-400" />;
  }
};

export function Stok() {
  const [movements, setMovements] = useState<StockMovementDisplay[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [movementsData, productsData, warehousesData] = await Promise.all([
        stockApi.listMovements({ limit: 100, sortfield: 'datem', sortorder: 'DESC' }),
        productApi.list({ limit: 100 }).catch(() => []),
        warehouseApi.list().catch(() => []),
      ]);

      const productMap = new Map(productsData.map(p => [p.id, p]));
      const warehouseMap = new Map(warehousesData.map(w => [w.id, w]));

      const displayMovements: StockMovementDisplay[] = movementsData.map(m => ({
        id: m.id || Math.random(),
        date: m.datem ? new Date(m.datem * 1000).toISOString() : new Date().toISOString(),
        type: m.type_movement || 0,
        productName: productMap.get(m.fk_product || m.product_id)?.label || `Ürün #${m.fk_product || m.product_id}`,
        productId: m.fk_product || m.product_id || 0,
        warehouseName: warehouseMap.get(m.fk_entrepot)?.label || `Depo #${m.fk_entrepot}`,
        warehouseId: m.fk_entrepot || 0,
        quantity: m.qty || m.quantity || 0,
        reference: m.ref || m.label || `STK-${m.id}`,
      }));

      setMovements(displayMovements);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stok hareketleri yüklenirken hata oluştu');
      console.error('Stock fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const warehouseOptions = [
    { value: '', label: 'Tüm Depolar' },
    ...warehouses.map(w => ({ value: String(w.id), label: w.label || w.ref || `Depo #${w.id}` })),
  ];

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || movement.type === parseInt(typeFilter);
    const matchesWarehouse = !warehouseFilter || movement.warehouseId === parseInt(warehouseFilter);
    return matchesSearch && matchesType && matchesWarehouse;
  });

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'date',
      header: 'Tarih / Saat',
      render: (value: unknown) => {
        const date = new Date(value as string);
        return (
          <div>
            <p className="text-sm text-gray-900">{date.toLocaleDateString('tr-TR')}</p>
            <p className="text-xs text-gray-500">{date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Tür',
      width: '100px',
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(value as number)}
          {getTypeBadge(value as number)}
        </div>
      ),
    },
    {
      key: 'productName',
      header: 'Ürün',
      sortable: true,
      render: (value: unknown, record: unknown) => {
        const movement = record as StockMovementDisplay;
        return (
          <Link to={`/urunler/${movement.productId}`} className="hover:text-primary">
            <div>
              <p className="text-sm font-medium text-gray-900">{value as string}</p>
              <p className="text-xs text-gray-500">{movement.reference}</p>
            </div>
          </Link>
        );
      },
    },
    {
      key: 'warehouseName',
      header: 'Depo',
    },
    {
      key: 'quantity',
      header: 'Miktar',
      align: 'right' as const,
      render: (value: unknown, record: unknown) => {
        const movement = record as StockMovementDisplay;
        const numValue = Number(value) || 0;
        const isPositive = numValue > 0;
        return (
          <span className={cn(
            'font-semibold',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? '+' : ''}{numValue}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: () => (
        <button className="text-sm text-primary hover:underline">
          Detay
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Hareketleri</h1>
          <p className="text-sm text-gray-500 mt-1">
            Depo giriş, çıkış ve transfer işlemleri
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/stok/yeni?type=0">
            <Button variant="primary" icon={<ArrowDown className="w-4 h-4" />} className="bg-green-600 hover:bg-green-700">
              Stok Girişi
            </Button>
          </Link>
          <Link to="/stok/yeni?type=1">
            <Button variant="danger" icon={<ArrowUp className="w-4 h-4" />}>
              Stok Çıkışı
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Ürün veya referans ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={setTypeFilter}
            className="w-full md:w-40"
          />
          <Select
            options={warehouseOptions}
            value={warehouseFilter}
            onChange={setWarehouseFilter}
            className="w-full md:w-40"
          />
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert type="error" title="Hata">
          {error}
          <p className="text-sm mt-1">Lütfen Dolibarr bağlantınızı kontrol edin.</p>
        </Alert>
      )}

      {/* Loading or Table */}
      {isLoading ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Stok hareketleri yükleniyor...</p>
          </div>
        </Card>
      ) : paginatedMovements.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery || typeFilter || warehouseFilter ? 'Arama sonucu bulunamadı' : 'Stok hareketi bulunamadı'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Dolibarr'da stok hareketi olduğunda burada görünecektir.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <Table
            columns={columns}
            data={paginatedMovements as unknown as Record<string, unknown>[]}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredMovements.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}
    </div>
  );
}

export default Stok;