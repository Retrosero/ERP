import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ArrowRightLeft, TrendingUp, TrendingDown, Filter, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, Table, Pagination, StatCard, Alert } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { paymentApi, thirdPartyApi, invoiceApi } from '@/lib/dolibarr';
import type { Payment, ThirdParty, Invoice } from '@/lib/types/dolibarr';

interface PaymentDisplay {
  id: number;
  date: string;
  type: 'collection' | 'payment';
  customer?: string;
  customerId?: number;
  supplier?: string;
  supplierId?: number;
  amount: number;
  method: string;
  reference: string;
  invoiceId?: number;
}

const typeOptions = [
  { value: '', label: 'Tümü' },
  { value: 'collection', label: 'Tahsilat' },
  { value: 'payment', label: 'Tediye' },
];

const methodOptions = [
  { value: '', label: 'Tüm Ödeme Yöntemleri' },
  { value: 'LIQ', label: 'Nakit' },
  { value: 'VIR', label: 'Banka Havalesi' },
  { value: 'CHQ', label: 'Çek' },
  { value: 'CB', label: 'Kredi Kartı' },
  { value: 'TRA', label: 'Senet' },
];

// Map Dolibarr payment type codes to display labels
const getPaymentMethodLabel = (code: string | number | undefined): string => {
  const methodMap: Record<string, string> = {
    'LIQ': 'Nakit',
    'VIR': 'Banka Havalesi',
    'CHQ': 'Çek',
    'CB': 'Kredi Kartı',
    'TRA': 'Senet',
    '1': 'Nakit',
    '2': 'Banka Havalesi',
    '3': 'Çek',
    '4': 'Kredi Kartı',
  };
  return methodMap[String(code)] || String(code || 'Bilinmiyor');
};

export function Tahsilatlar() {
  const [payments, setPayments] = useState<PaymentDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch payments from Dolibarr
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [customerPayments, supplierPayments, invoices] = await Promise.all([
        paymentApi.list({ limit: 100 }).catch(() => []),
        thirdPartyApi.list({ limit: 100, mode: 'supplier' }).catch(() => []),
        invoiceApi.list({ limit: 100 }).catch(() => []),
      ]);

      // Transform customer payments (collections) from invoice payments
      const collectionPayments: PaymentDisplay[] = customerPayments
        .filter(p => p.fk_invoice && p.fk_invoice > 0)
        .map(p => {
          const invoice = invoices.find(i => i.id === p.fk_invoice);
          return {
            id: p.id || Math.random(),
            date: typeof p.datep === 'number' ? new Date(p.datep * 1000).toISOString().split('T')[0] : String(p.datep || ''),
            type: 'collection' as const,
            customer: invoice?.ref || 'Müşteri',
            customerId: p.fk_soc,
            amount: p.amount || 0,
            method: getPaymentMethodLabel(p.fk_paiement),
            reference: p.payment_num || `TAH-${p.id}`,
            invoiceId: p.fk_invoice,
          };
        });

      // Transform supplier payments - in a real app, these would come from supplier invoice payments
      const paymentPayments: PaymentDisplay[] = [];

      setPayments([...collectionPayments, ...paymentPayments]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödemeler yüklenirken hata oluştu');
      console.error('Payments fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Calculate totals
  const totalCollections = payments
    .filter((p) => p.type === 'collection')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPayments = payments
    .filter((p) => p.type === 'payment')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.customer?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (payment.supplier?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !typeFilter || payment.type === typeFilter;
    const matchesMethod = !methodFilter || payment.method === methodFilter;
    return matchesSearch && matchesType && matchesMethod;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'date',
      header: 'Tarih',
      render: (value: unknown) => formatDate(value as string),
    },
    {
      key: 'reference',
      header: 'Belge No',
      width: '120px',
    },
    {
      key: 'type',
      header: 'Tür',
      render: (value: unknown) => (
        <Badge variant={value === 'collection' ? 'success' : 'danger'}>
          {value === 'collection' ? 'Tahsilat' : 'Tediye'}
        </Badge>
      ),
    },
    {
      key: 'customer',
      header: 'Cari',
      sortable: true,
      render: (value: unknown, record: unknown) => {
        const payment = record as PaymentDisplay;
        return (
          <Link
            to={payment.type === 'collection' ? `/musteriler/${payment.customerId}` : `/tedarikciler/${payment.supplierId}`}
            className="hover:text-primary"
          >
            {value as string || (payment.customer ? `${payment.customer}` : '-')}
          </Link>
        );
      },
    },
    {
      key: 'method',
      header: 'Yöntem',
    },
    {
      key: 'amount',
      header: 'Tutar',
      align: 'right' as const,
      render: (value: unknown, record: unknown) => {
        const payment = record as PaymentDisplay;
        return (
          <span className={cn(
            'font-semibold',
            payment.type === 'collection' ? 'text-green-600' : 'text-red-600'
          )}>
            {payment.type === 'collection' ? '+' : '-'}
            {formatCurrency(value as number)}
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
          <h1 className="text-2xl font-bold text-gray-900">Tahsilat ve Tediye</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kasa ve banka işlemlerinizi yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/tahsilatlar/yeni?type=collection">
            <Button variant="primary" icon={<TrendingUp className="w-4 h-4" />} className="bg-green-600 hover:bg-green-700">
              Tahsilat Al
            </Button>
          </Link>
          <Link to="/tahsilatlar/yeni?type=payment">
            <Button variant="danger" icon={<TrendingDown className="w-4 h-4" />}>
              Tediye Yap
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Toplam Tahsilat (Bu Ay)"
          value={formatCurrency(totalCollections, false)}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          icon={<TrendingDown className="w-6 h-6" />}
          label="Toplam Tediye (Bu Ay)"
          value={formatCurrency(totalPayments, false)}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
        <StatCard
          icon={<ArrowRightLeft className="w-6 h-6" />}
          label="Net (Tahsilat - Tediye)"
          value={formatCurrency(totalCollections - totalPayments, false)}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Belge no veya cari ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={setTypeFilter}
            className="w-full md:w-36"
          />
          <Select
            options={methodOptions}
            value={methodFilter}
            onChange={setMethodFilter}
            className="w-full md:w-44"
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
            <p className="text-gray-500">Ödemeler yükleniyor...</p>
          </div>
        </Card>
      ) : paginatedPayments.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Ödeme bulunamadı'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Fatura ödemeleri Dolibarr'da kaydedildiğinde burada görünecektir.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <Table
            columns={columns}
            data={paginatedPayments as unknown as Record<string, unknown>[]}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPayments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}
    </div>
  );
}

export default Tahsilatlar;