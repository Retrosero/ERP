import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, Mail, Building, Loader2, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, Table, Pagination, Alert } from '@/components/ui';
import { formatCurrency, formatPhone, cn } from '@/lib/utils';
import { thirdPartyApi } from '@/lib/dolibarr';
import type { ThirdParty } from '@/lib/types/dolibarr';

const statusOptions = [
  { value: '', label: 'Tümü' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Pasif' },
];

export function Musteriler() {
  const [customers, setCustomers] = useState<ThirdParty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch customers from Dolibarr
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mode = statusFilter === 'active' ? 'customer' : statusFilter === 'inactive' ? 'supplier' : undefined;
      const data = await thirdPartyApi.list({ limit: 100, mode });
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Müşteriler yüklenirken hata oluştu');
      console.error('Customers fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.code_client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    const matchesCity = !cityFilter || customer.town === cityFilter;
    return matchesSearch && matchesCity;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'code_client',
      header: 'Kod',
      width: '100px',
      render: (value: unknown) => (
        <span className="font-mono text-sm">{value as string || '-'}</span>
      ),
    },
    {
      key: 'name',
      header: 'Müşteri Adı',
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telefon',
      render: (value: unknown) => value ? (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          {formatPhone(value as string)}
        </div>
      ) : '-',
    },
    {
      key: 'town',
      header: 'Şehir',
      render: (value: unknown) => value as string || '-',
    },
    {
      key: 'email',
      header: 'E-posta',
      render: (value: unknown) => value ? (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm truncate">{value as string}</span>
        </div>
      ) : '-',
    },
    {
      key: 'client',
      header: 'Tür',
      render: (value: unknown) => (
        <Badge variant={value === 1 ? 'success' : 'gray'}>
          {(value as number) === 1 ? 'Müşteri' : (value as number) === 2 ? 'Tedarikçi' : 'Her İkisi'}
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
            <h1 className="page-title">Müşteriler</h1>
            <p className="page-subtitle">
              {filteredCustomers.length} müşteri bulundu
            </p>
          </div>
          <Link to="/musteriler/yeni">
            <Button icon={<Plus className="w-4 h-4" />}>
              Yeni Müşteri
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
                placeholder="Müşteri adı, kod veya telefon ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full md:w-40"
            />
          </div>
        </Card>

        {/* Loading or Table */}
        {isLoading ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Müşteriler yükleniyor...</p>
            </div>
          </Card>
        ) : paginatedCustomers.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Müşteri bulunamadı'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Dolibarr'da müşteri eklemek için yeni müşteri butonuna tıklayın.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <Table
              columns={columns}
              data={paginatedCustomers as unknown as Record<string, unknown>[]}
              onRowClick={(row) => window.location.href = `/musteriler/${row.id}`}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCustomers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

export default Musteriler;