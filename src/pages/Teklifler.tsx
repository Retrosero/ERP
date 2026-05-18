import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Eye, MoreVertical, Send, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, Table, Pagination } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock data for proposals
const mockProposals = [
  {
    id: 1,
    ref: 'PRP-2024-001',
    date: '2024-01-15',
    validUntil: '2024-01-30',
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
    validUntil: '2024-01-29',
    customer: 'XYZ Holding',
    customerId: 2,
    items: 5,
    total: 125000,
    status: 2,
  },
  {
    id: 3,
    ref: 'PRP-2024-003',
    date: '2024-01-13',
    validUntil: '2024-01-28',
    customer: 'DEF Lojistik',
    customerId: 3,
    items: 3,
    total: 18000,
    status: 0,
  },
  {
    id: 4,
    ref: 'PRP-2024-004',
    date: '2024-01-10',
    validUntil: '2024-01-25',
    customer: 'GHI Market',
    customerId: 4,
    items: 6,
    total: 28000,
    status: 4,
  },
  {
    id: 5,
    ref: 'PRP-2024-005',
    date: '2024-01-08',
    validUntil: '2024-01-23',
    customer: 'JKL Teknoloji',
    customerId: 5,
    items: 4,
    total: 89000,
    status: 5,
  },
];

const statusOptions = [
  { value: '', label: 'Tüm Durumlar' },
  { value: '0', label: 'Taslak' },
  { value: '1', label: 'Gönderildi' },
  { value: '2', label: 'İmzalandı' },
  { value: '4', label: 'Kazanıldı' },
  { value: '5', label: 'Kaybedildi' },
];

const getStatusBadge = (status: number) => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const itemsPerPage = 10;

  const filteredProposals = mockProposals.filter((proposal) => {
    const matchesSearch =
      proposal.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || proposal.status === parseInt(statusFilter);
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
      render: (value: unknown) => formatDate(value as string),
    },
    {
      key: 'customer',
      header: 'Müşteri',
      sortable: true,
      render: (value: unknown, record: unknown) => {
        const proposal = record as typeof mockProposals[0];
        return (
          <Link to={`/musteriler/${proposal.customerId}`} className="hover:text-primary">
            {value as string}
          </Link>
        );
      },
    },
    {
      key: 'validUntil',
      header: 'Geçerlilik',
      render: (value: unknown) => {
        const date = new Date(value as string);
        const isExpired = date < new Date();
        return (
          <span className={isExpired ? 'text-red-600' : 'text-gray-600'}>
            {formatDate(value as string)}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: 'Tutar',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{formatCurrency(value as number)}</span>
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
        const proposal = record as typeof mockProposals[0];
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

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
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

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={paginatedProposals as unknown as Record<string, unknown>[]}
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
    </div>
  );
}

export default Teklifler;