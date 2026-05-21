import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  MapPin,
  Users,
  DollarSign,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { recruitmentApi, RECRUITMENT_STATUS } from '@/lib/dolibarr-hrm';
import type { RecruitmentJobPosition } from '@/lib/types/hrm';

export function IsIlanlari() {
  const [positions, setPositions] = useState<RecruitmentJobPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchPositions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 100 };
      if (statusFilter) params.status = parseInt(statusFilter);
      const data = await recruitmentApi.listPositions(params);
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İş ilanları yüklenirken hata oluştu');
      console.error('Job positions fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const getStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === RECRUITMENT_STATUS.OPEN.value) return <Badge variant="success">Açık</Badge>;
    if (statusValue === RECRUITMENT_STATUS.CLOSED.value) return <Badge variant="gray">Kapalı</Badge>;
    if (statusValue === RECRUITMENT_STATUS.DRAFT.value) return <Badge variant="warning">Taslak</Badge>;
    if (statusValue === RECRUITMENT_STATUS.CANCELLED.value) return <Badge variant="danger">İptal</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const filteredPositions = positions.filter(pos => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesTitle = pos.label?.toLowerCase().includes(search) || false;
      const matchesDesc = pos.description?.toLowerCase().includes(search) || false;
      const matchesLocation = pos.location?.toLowerCase().includes(search) || false;
      if (!matchesTitle && !matchesDesc && !matchesLocation) return false;
    }
    return true;
  });

  const stats = {
    total: positions.length,
    open: positions.filter(p => p.status === RECRUITMENT_STATUS.OPEN.value).length,
    closed: positions.filter(p => p.status === RECRUITMENT_STATUS.CLOSED.value).length,
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Belirtilmedi';
    if (min && max) return `${min.toLocaleString('tr-TR')} - ${max.toLocaleString('tr-TR')} TL`;
    if (min) return `${min.toLocaleString('tr-TR')} TL'den başlayan`;
    return `${max?.toLocaleString('tr-TR')} TL'ye kadar`;
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">İş ilanları yükleniyor...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">İş İlanları</h1>
            <p className="text-slate-500 mt-1">Açık pozisyonları ve işe alım süreçlerini yönetin</p>
          </div>
          <Link to="/ise-alim/ilan/yeni">
            <Button icon={<Plus className="w-4 h-4" />}>
              Yeni İlan
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Toplam İlan</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.open}</p>
                <p className="text-sm text-slate-500">Açık Pozisyon</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.closed}</p>
                <p className="text-sm text-slate-500">Kapalı Pozisyon</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="İlan ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="!pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                options={[
                  { value: '', label: 'Tüm Durumlar' },
                  { value: RECRUITMENT_STATUS.OPEN.value.toString(), label: 'Açık' },
                  { value: RECRUITMENT_STATUS.CLOSED.value.toString(), label: 'Kapalı' },
                  { value: RECRUITMENT_STATUS.DRAFT.value.toString(), label: 'Taslak' },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
              />
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="!p-4">
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Job Positions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPositions.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Briefcase className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">İlan bulunamadı</h3>
                  <p className="text-slate-500 mb-6">Henüz iş ilanı oluşturulmamış. Yeni bir ilan oluşturmak için butona tıklayın.</p>
                  <Link to="/ise-alim/ilan/yeni">
                    <Button icon={<Plus className="w-4 h-4" />}>
                      Yeni İlan
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          ) : (
            filteredPositions.map((pos) => (
              <Link key={pos.id} to={`/ise-alim/ilan/${pos.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      {getStatusBadge(pos.status)}
                      <span className="text-xs text-slate-500">#{pos.id}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {pos.label || 'İsimsiz Pozisyon'}
                    </h3>
                    {pos.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {pos.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      {pos.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="w-4 h-4" />
                          <span>{pos.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatSalary(pos.salary_min, pos.salary_max)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {pos.nb_candidates || 0} aday
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default IsIlanlari;