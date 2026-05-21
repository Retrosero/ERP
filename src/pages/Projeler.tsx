/**
 * Proje Listesi Sayfası
 * Projelerin listelendiği ve filtrelendiği ana sayfa
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  FolderKanban,
  Users,
  Clock,
  Loader2,
  ChevronRight,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { Card, Input, Select, Badge, Table, Pagination, Button, StatCard } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

// Mock project status
const PROJECT_STATUS = {
  DRAFT: { value: 0, label: 'Taslak', color: 'gray' },
  OPEN: { value: 1, label: 'Açık', color: 'blue' },
  CLOSED: { value: 2, label: 'Kapalı', color: 'green' },
  CANCELLED: { value: -1, label: 'İptal', color: 'red' },
};

// Mock data for projects
const mockProjects = [
  {
    id: 1,
    ref: 'PRJ-2024-001',
    title: 'E-Ticaret Platformu Geliştirme',
    description: 'Yeni nesil e-ticaret platformunun geliştirilmesi',
    fk_user_creat: 1,
    author: 'Ahmet Yılmaz',
    date_start: '2024-01-15',
    date_end: '2024-06-30',
    budget: 250000,
    status: 1,
    progress: 65,
    tasks_total: 24,
    tasks_done: 15,
  },
  {
    id: 2,
    ref: 'PRJ-2024-002',
    title: 'Mobil Uygulama Redesign',
    description: 'Mevcut mobil uygulamanın yeniden tasarımı',
    fk_user_creat: 2,
    author: 'Ayşe Demir',
    date_start: '2024-02-01',
    date_end: '2024-04-30',
    budget: 150000,
    status: 1,
    progress: 40,
    tasks_total: 16,
    tasks_done: 6,
  },
  {
    id: 3,
    ref: 'PRJ-2024-003',
    title: 'ERP Entegrasyonu',
    description: 'Dolibarr ERP sisteminin entegrasyonu',
    fk_user_creat: 1,
    author: 'Ahmet Yılmaz',
    date_start: '2024-03-01',
    date_end: '2024-05-31',
    budget: 180000,
    status: 0,
    progress: 10,
    tasks_total: 12,
    tasks_done: 1,
  },
  {
    id: 4,
    ref: 'PRJ-2023-015',
    title: 'Veritabanı Optimizasyonu',
    description: 'Mevcut veritabanı sisteminin optimizasyonu',
    fk_user_creat: 3,
    author: 'Mehmet Kaya',
    date_start: '2023-10-01',
    date_end: '2024-01-31',
    budget: 80000,
    status: 2,
    progress: 100,
    tasks_total: 8,
    tasks_done: 8,
  },
];

export default function Projeler() {
  const [projects, setProjects] = useState<typeof mockProjects>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setProjects(mockProjects);
    } catch (err) {
      console.error('Projects fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.ref.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || project.status === parseInt(statusFilter);
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get status badge
  const getStatusBadge = (status: number) => {
    const statusInfo = Object.values(PROJECT_STATUS).find(s => s.value === status);
    const colorMap: Record<string, string> = {
      gray: 'bg-slate-100 text-slate-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-emerald-100 text-emerald-700',
      red: 'bg-red-100 text-red-700',
    };
    return (
      <Badge className={colorMap[statusInfo?.color || 'gray']}>
        {statusInfo?.label || 'Bilinmiyor'}
      </Badge>
    );
  };

  // Progress bar
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Calculate stats
  const activeProjects = projects.filter(p => p.status === 1).length;
  const completedProjects = projects.filter(p => p.status === 2).length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  // Table columns
  const columns = [
    {
      key: 'ref',
      header: 'Proje Kodu',
      width: '120px',
      render: (value: unknown) => (
        <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded-lg">{value as string}</span>
      ),
    },
    {
      key: 'title',
      header: 'Proje Adı',
      sortable: true,
      render: (value: unknown, record: unknown) => {
        const project = record as typeof mockProjects[0];
        return (
          <div>
            <span className="font-medium text-slate-900">{value as string}</span>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
          </div>
        );
      },
    },
    {
      key: 'author',
      header: 'Sorumlu',
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
            {(value as string).charAt(0)}
          </div>
          <span className="text-sm text-slate-700">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'date_start',
      header: 'Başlangıç',
      render: (value: unknown) => (
        <span className="text-sm text-slate-600">{formatDate(value as string)}</span>
      ),
    },
    {
      key: 'progress',
      header: 'İlerleme',
      width: '150px',
      render: (value: unknown, record: unknown) => {
        const project = record as typeof mockProjects[0];
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">{project.tasks_done}/{project.tasks_total} görev</span>
              <span className="text-xs font-semibold text-slate-700">{value as number}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', getProgressColor(value as number))}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Durum',
      render: (value: unknown) => getStatusBadge(value as number),
    },
    {
      key: 'budget',
      header: 'Bütçe',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold text-slate-900">{formatCurrency(value as number)}</span>
      ),
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

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              Projeler
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tüm projelerinizi görüntüleyin ve yönetin
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Proje
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Toplam Proje</p>
                <p className="text-3xl font-bold text-white mt-1">{projects.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Aktif Projeler</p>
                <p className="text-3xl font-bold text-white mt-1">{activeProjects}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Tamamlanan</p>
                <p className="text-3xl font-bold text-white mt-1">{completedProjects}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">Toplam Bütçe</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Proje adı veya kodu ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={[
                { value: '', label: 'Tüm Durumlar' },
                { value: '0', label: 'Taslak' },
                { value: '1', label: 'Açık' },
                { value: '2', label: 'Kapalı' },
                { value: '-1', label: 'İptal' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full md:w-40"
            />
          </div>
        </Card>

        {/* Table */}
        {isLoading ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
              <p className="text-slate-500">Projeler yükleniyor...</p>
            </div>
          </Card>
        ) : paginatedProjects.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <FolderKanban className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Proje bulunamadı'}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Yeni proje oluşturmak için butona tıklayın.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <Table
              columns={columns}
              data={paginatedProjects as unknown as Record<string, unknown>[]}
              onRowClick={(row) => window.location.href = `/projeler/${(row as any).id}`}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProjects.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Card>
        )}
      </div>
    </>
  );
}