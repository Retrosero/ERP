import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, Mail, Building, Loader2, Users, TrendingUp, Filter, ChevronRight } from 'lucide-react';
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

  const getTypeBadge = (client: number | undefined) => {
    if (client === 1) return <Badge variant="success">Müşteri</Badge>;
    if (client === 2) return <Badge variant="warning">Tedarikçi</Badge>;
    return <Badge variant="info">Her İkisi</Badge>;
  };

  const columns = [
    {
      key: 'code_client',
      header: 'Kod',
      width: '100px',
      render: (value: unknown) => (
        <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded-lg">{value as string || '-'}</span>
      ),
    },
    {
      key: 'name',
      header: 'Müşteri Adı',
      sortable: true,
      render: (value: unknown, record: unknown) => {
        const customer = record as ThirdParty;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
              {customer.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <span className="font-medium text-slate-900">{value as string}</span>
              {customer.email && (
                <p className="text-xs text-slate-500 mt-0.5">{customer.email}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Telefon',
      render: (value: unknown) => value ? (
        <div className="flex items-center gap-2 text-slate-600">
          <Phone className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{formatPhone(value as string)}</span>
        </div>
      ) : '-',
    },
    {
      key: 'town',
      header: 'Şehir',
      render: (value: unknown) => (
        <span className="text-slate-600">{value as string || '-'}</span>
      ),
    },
    {
      key: 'client',
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
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.client === 1).length;
  const suppliers = customers.filter(c => c.client === 2).length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Müşteriler</h1>
            <p className="text-sm text-slate-500 mt-1">
              {filteredCustomers.length} müşteri bulundu
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/musteriler/yeni">
              <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                Yeni Müşteri
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Toplam Müşteri</p>
                <p className="text-3xl font-bold text-white mt-1">{totalCustomers}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Aktif Müşteriler</p>
                <p className="text-3xl font-bold text-white mt-1">{activeCustomers}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Tedarikçiler</p>
                <p className="text-3xl font-bold text-white mt-1">{suppliers}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
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
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
              <p className="text-slate-500">Müşteriler yükleniyor...</p>
            </div>
          </Card>
        ) : paginatedCustomers.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Building className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Müşteri bulunamadı'}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Dolibarr'da müşteri eklemek için yeni müşteri butonuna tıklayın.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <Table
              columns={columns}
              data={paginatedCustomers as unknown as Record<string, unknown>[]}
              onRowClick={(row) => window.location.href = `/musteriler/${(row as ThirdParty).id}`}
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