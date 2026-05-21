import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Receipt, Eye, Download, MoreVertical, Loader2, Wallet } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, Table, Pagination, Alert } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { invoiceApi } from '@/lib/dolibarr';
import type { Invoice } from '@/lib/types/dolibarr';

const statusOptions = [
  { value: '', label: 'Tüm Durumlar' },
  { value: '0', label: 'Taslak' },
  { value: '1', label: 'Onaylandı' },
  { value: '2', label: 'Ödendi' },
  { value: '3', label: 'İptal' },
];

const getStatusBadge = (status: number | undefined) => {
  switch (status) {
    case 0:
      return <Badge variant="gray">Taslak</Badge>;
    case 1:
      return <Badge variant="warning">Ödenmedi</Badge>;
    case 2:
      return <Badge variant="success">Ödendi</Badge>;
    case 3:
      return <Badge variant="danger">İptal</Badge>;
    default:
      return <Badge variant="gray">Bilinmiyor</Badge>;
  }
};

const isOverdue = (dueDate: string | number | undefined, status: number | undefined): boolean => {
  if (!dueDate || status === 2) return false; // Already paid
  const dueDateMs = typeof dueDate === 'number' ? dueDate * 1000 : new Date(dueDate).getTime();
  return Date.now() > dueDateMs;
};

export function Faturalar() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch invoices from Dolibarr
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 100, sortfield: 'date', sortorder: 'DESC' };
      if (statusFilter) {
        params.status = parseInt(statusFilter);
      }
      const data = await invoiceApi.list(params as Parameters<typeof invoiceApi.list>[0]);
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Faturalar yüklenirken hata oluştu');
      console.error('Invoices fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.ref?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'ref',
      header: 'Fatura No',
      width: '130px',
      render: (value: unknown) => (
        <Link to={`/faturalar/${value}`} className="font-medium text-primary hover:underline">
          {value as string}
        </Link>
      ),
    },
    {
      key: 'date',
      header: 'Fatura Tarihi',
      render: (value: unknown) => value ? formatDate(value as string) : '-',
    },
    {
      key: 'date_lim_reglement',
      header: 'Vade',
      render: (value: unknown, record: unknown) => {
        const invoice = record as Invoice;
        const overdue = isOverdue(invoice.date_lim_reglement, invoice.status);
        return (
          <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
            {value ? formatDate(value as string) : '-'}
            {overdue && ' ⚠️'}
          </span>
        );
      },
    },
    {
      key: 'total_ttc',
      header: 'Toplam',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: 'remain_to_pay',
      header: 'Kalan',
      align: 'right' as const,
      render: (value: unknown) => {
        const isPaid = (value as number) === 0;
        return (
          <span className={cn(
            'font-medium',
            isPaid ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(value as number)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Durum',
      render: (value: unknown) => getStatusBadge(value as number),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (_: unknown, record: unknown) => {
        const invoice = record as Invoice;
        return (
          <div className="flex items-center gap-1">
            <Link
              to={`/faturalar/${invoice.id}`}
              className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title="Görüntüle"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <button className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700" title="İndir">
              <Download className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="page-title">Faturalar</h1>
            <p className="page-subtitle">
              {filteredInvoices.length} fatura bulundu
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Wallet className="w-4 h-4" />}>
              Tahsilat Al
            </Button>
            <Link to="/faturalar/yeni">
              <Button icon={<Receipt className="w-4 h-4" />}>
                Yeni Fatura
              </Button>
            </Link>
          </div>
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
                placeholder="Fatura no ile ara..."
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
              <p className="text-gray-500">Faturalar yükleniyor...</p>
            </div>
          </Card>
        ) : paginatedInvoices.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Fatura bulunamadı'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Dolibarr'da fatura oluşturmak için yeni fatura butonuna tıklayın.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <Table
              columns={columns}
              data={paginatedInvoices as unknown as Record<string, unknown>[]}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredInvoices.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Card>
        )}
      </div>
    </>
  );
}

export default Faturalar;