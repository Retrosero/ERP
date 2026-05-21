import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Eye, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Input, Select, Badge, Table, Pagination, Alert } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { orderApi } from '@/lib/dolibarr';
import type { Order } from '@/lib/types/dolibarr';

const statusOptions = [
  { value: '', label: 'Tüm Durumlar' },
  { value: '0', label: 'Taslak' },
  { value: '1', label: 'Onaylandı' },
  { value: '2', label: 'Sevk Edildi' },
  { value: '3', label: 'Teslim Edildi' },
  { value: '-1', label: 'İptal' },
];

const getStatusBadge = (status: number | undefined) => {
  switch (status) {
    case 0:
      return <Badge variant="gray">Taslak</Badge>;
    case 1:
      return <Badge variant="info">Onaylandı</Badge>;
    case 2:
      return <Badge variant="warning">Sevk Edildi</Badge>;
    case 3:
      return <Badge variant="success">Teslim Edildi</Badge>;
    case -1:
      return <Badge variant="danger">İptal</Badge>;
    default:
      return <Badge variant="gray">Bilinmiyor</Badge>;
  }
};

export function Siparisler() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch orders from Dolibarr
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 100, sortfield: 'date_commande', sortorder: 'DESC' };
      if (statusFilter) {
        params.status = parseInt(statusFilter);
      }
      const data = await orderApi.list(params as Parameters<typeof orderApi.list>[0]);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Siparişler yüklenirken hata oluştu');
      console.error('Orders fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.ref?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'ref',
      header: 'Sipariş No',
      width: '130px',
      render: (value: unknown) => (
        <Link to={`/siparisler/${value}`} className="font-medium text-primary hover:underline">
          {value as string}
        </Link>
      ),
    },
    {
      key: 'date_commande',
      header: 'Tarih',
      render: (value: unknown) => value ? formatDate(value as string) : '-',
    },
    {
      key: 'ref_client',
      header: 'Müşteri Ref',
      render: (value: unknown) => (value as string) || '-',
    },
    {
      key: 'total_ht',
      header: 'Toplam',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: 'total_ttc',
      header: 'KDV Dahil',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="text-gray-600">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: (value: unknown) => getStatusBadge(value as number),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (_: unknown, record: unknown) => {
        const order = record as Order;
        return (
          <div className="flex items-center gap-1">
            <Link
              to={`/siparisler/${order.id}`}
              className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title="Görüntüle"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
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
                placeholder="Sipariş no ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full md:w-44"
            />
          </div>
        </Card>

        {/* Loading or Table */}
        {isLoading ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Siparişler yükleniyor...</p>
            </div>
          </Card>
        ) : paginatedOrders.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Sipariş bulunamadı'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Dolibarr'da sipariş oluşturmak için yeni sipariş butonuna tıklayın.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <Table
              columns={columns}
              data={paginatedOrders as unknown as Record<string, unknown>[]}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Card>
        )}
      </div>
    </>
  );
}

export default Siparisler;