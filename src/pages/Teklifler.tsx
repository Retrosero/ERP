import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Eye, MoreVertical, Send, CheckCircle, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, Table, Pagination, Alert } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { proposalApi } from '@/lib/dolibarr';
import type { Proposal } from '@/lib/types/dolibarr';

/*
// Mock data for proposals - for testing only
const mockProposals: Proposal[] = [
  {
    id: 1,
    ref: 'PRP-2024-001',
    date: '2024-01-15',
    date_lim_parcours: '2024-01-30',
    customer: 'ABC Ticaret A.Ş.',
    customerId: 1,
    items: 8,
    total: 45000,
    status: 1,
  },
  {
    id: 2,
    ref: 'PRP-2024-002',
    date: '2024-01-14',
    date_lim_parcours: '2024-01-29',
    customer: 'XYZ Holding',
    customerId: 2,
    items: 5,
    total: 125000,
    status: 2,
  },
];
*/

const statusOptions = [
  { value: '', label: 'Tüm Durumlar' },
  { value: '0', label: 'Taslak' },
  { value: '1', label: 'Gönderildi' },
  { value: '2', label: 'İmzalandı' },
  { value: '4', label: 'Kazanıldı' },
  { value: '5', label: 'Kaybedildi' },
];

const getStatusBadge = (status: number | undefined) => {
  switch (status) {
    case 0:
      return <Badge variant="gray">Taslak</Badge>;
    case 1:
      return <Badge variant="info">Gönderildi</Badge>;
    case 2:
      return <Badge variant="success">İmzalandı</Badge>;
    case 3:
      return <Badge variant="warning">İmzalanmadı</Badge>;
    case 4:
      return <Badge variant="success">Kazanıldı</Badge>;
    case 5:
      return <Badge variant="danger">Kaybedildi</Badge>;
    default:
      return <Badge variant="gray">Bilinmiyor</Badge>;
  }
};

export function Teklifler() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch proposals from Dolibarr
  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 100, sortfield: 'date', sortorder: 'DESC' };
      if (statusFilter) {
        params.status = parseInt(statusFilter);
      }
      const data = await proposalApi.list(params as Parameters<typeof proposalApi.list>[0]);
      setProposals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Teklifler yüklenirken hata oluştu');
      console.error('Proposals fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.socname?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || proposal.fk_statut === parseInt(statusFilter);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const paginatedProposals = filteredProposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'ref',
      header: 'Teklif No',
      width: '130px',
      render: (value: unknown) => (
        <Link to={`/teklifler/${value}`} className="font-medium text-primary hover:underline">
          {value as string}
        </Link>
      ),
    },
    {
      key: 'date',
      header: 'Tarih',
      render: (value: unknown) => value ? formatDate(value as string) : '-',
    },
    {
      key: 'socname',
      header: 'Müşteri',
      sortable: true,
      render: (value: unknown, record: unknown) => {
        const proposal = record as Proposal;
        return (
          <Link to={`/musteriler/${proposal.fk_soc}`} className="hover:text-primary">
            {value as string || '-'}
          </Link>
        );
      },
    },
    {
      key: 'fin_validite',
      header: 'Geçerlilik',
      render: (value: unknown) => {
        const date = value ? new Date(value as string) : null;
        const isExpired = date && date < new Date();
        return (
          <span className={isExpired ? 'text-red-600' : 'text-gray-600'}>
            {value ? formatDate(value as string) : '-'}
          </span>
        );
      },
    },
    {
      key: 'total_ttc',
      header: 'Tutar',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: 'fk_statut',
      header: 'Durum',
      render: (value: unknown) => getStatusBadge(value as number | undefined),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (_: unknown, record: unknown) => {
        const proposal = record as Proposal;
        return (
          <div className="flex items-center gap-1">
            <Link
              to={`/teklifler/${proposal.id}`}
              className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title="Görüntüle"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <button className="p-2 rounded hover:bg-gray-100 text-gray-400" title="İşlemler">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teklifler</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredProposals.length} teklif bulundu
            </p>
          </div>
          <Link to="/teklifler/yeni">
            <Button icon={<Plus className="w-4 h-4" />}>
              Yeni Teklif
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
                placeholder="Teklif no veya müşteri ile ara..."
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
              <p className="text-gray-500">Teklifler yükleniyor...</p>
            </div>
          </Card>
        ) : filteredProposals.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Teklif bulunamadı'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Dolibarr'da teklif oluşturmak için yeni teklif butonuna tıklayın.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <Table
              columns={columns}
              data={filteredProposals as unknown as Record<string, unknown>[]}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProposals.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

export default Teklifler;