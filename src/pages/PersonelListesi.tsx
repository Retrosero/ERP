import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Users,
  Shield,
  Mail,
  Phone,
  Building,
  Loader2,
  ChevronRight,
  Briefcase,
  Calendar
} from 'lucide-react';
import { Card, Input, Select, Badge, Table, Pagination, Alert } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';
import { userApi, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { User } from '@/lib/types/hrm';

const statusOptions = [
  { value: '', label: 'Tümü' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Pasif' },
];

const roleOptions = [
  { value: '', label: 'Tüm Yetkiler' },
  { value: '1', label: 'Yönetici' },
  { value: '0', label: 'Normal Kullanıcı' },
];

export function PersonelListesi() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch employees from Dolibarr
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 100, sortfield: 'lastname', sortorder: 'ASC' };
      if (statusFilter) {
        params.status = parseInt(statusFilter);
      }
      if (roleFilter) {
        params.admin = parseInt(roleFilter);
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const data = await userApi.list(params as Parameters<typeof userApi.list>[0]);
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Personeller yüklenirken hata oluştu');
      console.error('Employees fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, roleFilter, searchQuery]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.login?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: number | undefined) => {
    if (status === 1) return <Badge variant="success">Aktif</Badge>;
    if (status === 0) return <Badge variant="danger">Pasif</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const getRoleBadge = (admin: number | undefined) => {
    if (admin === 1) return <Badge variant="warning">Yönetici</Badge>;
    return <Badge variant="info">Kullanıcı</Badge>;
  };

  const columns = [
    {
      key: 'name',
      header: 'Personel',
      sortable: true,
      render: (value: unknown, record: unknown) => {
        const employee = record as User;
        const fullName = `${employee.firstname || ''} ${employee.lastname || ''}`.trim();
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
              {employee.firstname?.charAt(0)?.toUpperCase() || '?'}
              {employee.lastname?.charAt(0)?.toUpperCase() || ''}
            </div>
            <div>
              <span className="font-medium text-slate-900">{fullName || employee.name || 'İsimsiz'}</span>
              {employee.job && (
                <p className="text-xs text-slate-500 mt-0.5">{employee.job}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'login',
      header: 'Kullanıcı Adı',
      render: (value: unknown) => (
        <span className="font-mono text-sm text-slate-600">{value as string || '-'}</span>
      ),
    },
    {
      key: 'email',
      header: 'E-posta',
      render: (value: unknown) => value ? (
        <div className="flex items-center gap-2 text-slate-600">
          <Mail className="w-4 h-4 text-slate-400" />
          <span className="text-sm truncate max-w-[180px]">{value as string}</span>
        </div>
      ) : '-',
    },
    {
      key: 'phone',
      header: 'Telefon',
      render: (value: unknown) => value ? (
        <div className="flex items-center gap-2 text-slate-600">
          <Phone className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{value as string}</span>
        </div>
      ) : '-',
    },
    {
      key: 'admin',
      header: 'Yetki',
      render: (value: unknown) => getRoleBadge(value as number | undefined),
    },
    {
      key: 'statut',
      header: 'Durum',
      render: (value: unknown) => getStatusBadge(value as number | undefined),
    },
    {
      key: 'actions',
      header: '',
      width: '40px',
      render: (_: unknown, record: unknown) => {
        const employee = record as User;
        return (
          <Link
            to={`/personel/${employee.id}`}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        );
      },
    },
  ];

  // Calculate stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.statut === 1).length;
  const admins = employees.filter(e => e.admin === 1).length;

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Toplam Personel</p>
                <p className="text-3xl font-bold text-white mt-1">{totalEmployees}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Aktif Personel</p>
                <p className="text-3xl font-bold text-white mt-1">{activeEmployees}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Yöneticiler</p>
                <p className="text-3xl font-bold text-white mt-1">{admins}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
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
                placeholder="İsim, e-posta veya kullanıcı adı ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full md:w-32"
            />
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              className="w-full md:w-40"
            />
          </div>
        </Card>

        {/* Loading or Table */}
        {isLoading ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
              <p className="text-slate-500">Personeller yükleniyor...</p>
            </div>
          </Card>
        ) : paginatedEmployees.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Personel bulunamadı'}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Dolibarr'da personel eklemek için yeni personel butonuna tıklayın.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <Table
              columns={columns}
              data={paginatedEmployees as unknown as Record<string, unknown>[]}
              onRowClick={(row) => window.location.href = `/personel/${(row as User).id}`}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEmployees.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Card>
        )}
      </div>
    </>
  );
}

export default PersonelListesi;