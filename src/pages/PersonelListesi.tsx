import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  Shield,
  Mail,
  Phone,
  Loader2,
  ChevronRight,
  Filter,
  X,
  Building,
  Calendar,
  UserCheck,
  LayoutGrid,
  List,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { userApi, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { User } from '@/lib/types/hrm';

const statusOptions = [
  { value: '', label: 'Tüm Durumlar' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Pasif' },
];

const roleOptions = [
  { value: '', label: 'Tüm Yetkiler' },
  { value: '1', label: 'Yönetici' },
  { value: '0', label: 'Normal Kullanıcı' },
];

type ViewMode = 'cards' | 'table';

type SortField = 'name' | 'email' | 'job' | 'dateemployment';
type SortOrder = 'asc' | 'desc';

export function PersonelListesi() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 12;

  // Fetch employees from Dolibarr
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { limit?: number; sortfield?: string; sortorder?: string; statut?: number; admin?: number; search?: string } = { 
        limit: 1000, 
        sortfield: 'lastname', 
        sortorder: 'ASC' 
      };
      if (statusFilter) {
        params.statut = parseInt(statusFilter);
      }
      if (roleFilter) {
        params.admin = parseInt(roleFilter);
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const data = await userApi.list(params);
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

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees.filter((employee) => {
      const matchesSearch =
        !searchQuery ||
        employee.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.login?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.job?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = !departmentFilter || employee.job?.toLowerCase().includes(departmentFilter.toLowerCase());
      
      return matchesSearch && matchesDepartment;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string = '';
      let bValue: string = '';

      switch (sortField) {
        case 'name':
          aValue = `${a.firstname || ''} ${a.lastname || ''}`.toLowerCase();
          bValue = `${b.firstname || ''} ${b.lastname || ''}`.toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'job':
          aValue = (a.job || '').toLowerCase();
          bValue = (b.job || '').toLowerCase();
          break;
        case 'dateemployment':
          aValue = a.dateemployment?.toString() || '';
          bValue = b.dateemployment?.toString() || '';
          break;
      }

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue, 'tr');
      }
      return bValue.localeCompare(aValue, 'tr');
    });

    return filtered;
  }, [employees, searchQuery, departmentFilter, sortField, sortOrder]);

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

  // Stats
  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.statut === 1).length,
    admins: employees.filter(e => e.admin === 1).length,
    newThisMonth: employees.filter(e => {
      if (!e.datecreation) return false;
      const created = new Date(e.datecreation);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
  }), [employees]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const jobs = employees.map(e => e.job).filter(Boolean);
    const unique = [...new Set(jobs)] as string[];
    return [{ value: '', label: 'Tüm Departmanlar' }, ...unique.map(d => ({ value: d, label: d }))];
  }, [employees]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setRoleFilter('');
    setDepartmentFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter || roleFilter || departmentFilter;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personel Listesi</h1>
          <p className="text-slate-500 mt-1">
            {filteredEmployees.length} personel bulundu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tablo Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button icon={<Users className="w-4 h-4" />}>
            Yeni Personel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-5 bg-gradient-to-br from-teal-500 to-teal-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Toplam Personel</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="!p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Aktif Personel</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="!p-5 bg-gradient-to-br from-amber-500 to-amber-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Yöneticiler</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.admins}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="!p-5 bg-gradient-to-br from-violet-500 to-violet-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">Bu Ay Eklenen</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.newThisMonth}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="!p-4 border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-800">Hata Oluştu</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card padding="sm">
        <div className="space-y-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="İsim, e-posta, kullanıcı adı veya pozisyon ile ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="!pl-11 h-11"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              icon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtrele
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Durum</label>
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(v) => {
                      setStatusFilter(v);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Yetki</label>
                  <Select
                    options={roleOptions}
                    value={roleFilter}
                    onChange={(v) => {
                      setRoleFilter(v);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Departman</label>
                  <Select
                    options={departments}
                    value={departmentFilter}
                    onChange={(v) => {
                      setDepartmentFilter(v);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4" />}
                    onClick={clearFilters}
                  >
                    Temizle
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Active Filters Badge */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">Aktif filtreler:</span>
          {searchQuery && (
            <Badge variant="info" className="gap-1">
              Arama: {searchQuery}
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {statusFilter && (
            <Badge variant="info" className="gap-1">
              Durum: {statusFilter === '1' ? 'Aktif' : 'Pasif'}
              <button onClick={() => setStatusFilter('')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {roleFilter && (
            <Badge variant="info" className="gap-1">
              Yetki: {roleFilter === '1' ? 'Yönetici' : 'Kullanıcı'}
              <button onClick={() => setRoleFilter('')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {departmentFilter && (
            <Badge variant="info" className="gap-1">
              Dept: {departmentFilter}
              <button onClick={() => setDepartmentFilter('')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="!p-5">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-24" />
                    <div className="h-3 bg-slate-200 rounded w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : paginatedEmployees.length === 0 ? (
        /* Empty State */
        <Card className="!p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || hasActiveFilters ? 'Arama sonucu bulunamadı' : 'Personel bulunamadı'}
            </h3>
            <p className="text-slate-500 max-w-md mb-6">
              {searchQuery || hasActiveFilters
                ? 'Arama kriterlerinize uygun personel bulunamadı. Filtreleri temizleyip tekrar deneyebilirsiniz.'
                : 'Henüz personel eklenmemiş. Yeni personel eklemek için "Yeni Personel" butonuna tıklayın.'}
            </p>
            {hasActiveFilters && (
              <Button variant="secondary" onClick={clearFilters} icon={<X className="w-4 h-4" />}>
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedEmployees.map((employee) => {
                const fullName = `${employee.firstname || ''} ${employee.lastname || ''}`.trim();
                return (
                  <Link key={employee.id} to={`/personel/${employee.id}`}>
                    <Card className="!p-5 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300 group cursor-pointer h-full">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                          {employee.firstname?.charAt(0)?.toUpperCase() || '?'}
                          {employee.lastname?.charAt(0)?.toUpperCase() || ''}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate">
                                {fullName || employee.name || 'İsimsiz'}
                              </h3>
                              {employee.job && (
                                <p className="text-sm text-slate-500 truncate mt-0.5">
                                  {employee.job}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                          </div>
                          
                          {/* Badges */}
                          <div className="flex items-center gap-2 mt-3">
                            {getStatusBadge(employee.statut)}
                            {getRoleBadge(employee.admin)}
                          </div>
                          
                          {/* Contact Info */}
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                            {employee.email && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate">{employee.email}</span>
                              </div>
                            )}
                            {employee.phone && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{employee.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                        <button
                          className="flex items-center gap-1 hover:text-teal-600 transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          Personel
                          {sortField === 'name' && (
                            sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                          )}
                        </button>
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                        <button
                          className="flex items-center gap-1 hover:text-teal-600 transition-colors"
                          onClick={() => handleSort('job')}
                        >
                          Pozisyon
                          {sortField === 'job' && (
                            sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                          )}
                        </button>
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                        <button
                          className="flex items-center gap-1 hover:text-teal-600 transition-colors"
                          onClick={() => handleSort('email')}
                        >
                          E-posta
                          {sortField === 'email' && (
                            sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                          )}
                        </button>
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">Telefon</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">Yetki</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">Durum</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.map((employee) => {
                      const fullName = `${employee.firstname || ''} ${employee.lastname || ''}`.trim();
                      return (
                        <tr
                          key={employee.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                                {employee.firstname?.charAt(0)?.toUpperCase() || '?'}
                                {employee.lastname?.charAt(0)?.toUpperCase() || ''}
                              </div>
                              <div>
                                <span className="font-medium text-slate-900">{fullName || employee.name || 'İsimsiz'}</span>
                                {employee.login && (
                                  <p className="text-xs text-slate-500">@{employee.login}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-sm text-slate-700">{employee.job || '-'}</span>
                          </td>
                          <td className="py-4 px-5">
                            {employee.email ? (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">{employee.email}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            {employee.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">{employee.phone}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            {getRoleBadge(employee.admin)}
                          </td>
                          <td className="py-4 px-5">
                            {getStatusBadge(employee.statut)}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <Link
                              to={`/personel/${employee.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors"
                            >
                              Detay
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} arası gösteriliyor
                <span className="mx-1">·</span>
                Toplam {filteredEmployees.length} personel
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Önceki
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-teal-500 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PersonelListesi;