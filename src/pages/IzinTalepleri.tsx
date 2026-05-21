import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  User,
  X,
  Eye,
  CalendarDays,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, Alert } from '@/components/ui';
import { holidayApi, HOLIDAY_STATUS, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { Holiday, LeaveType } from '@/lib/types/hrm';

export function IzinTalepleri() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchHolidays = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { limit?: number; statut?: string } = { limit: 500 };
      if (statusFilter) params.statut = statusFilter;
      const data = await holidayApi.list(params);
      setHolidays(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İzin talepleri yüklenirken hata oluştu');
      console.error('Holiday fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const types = await holidayApi.getTypes();
      setLeaveTypes(types);
    } catch (err) {
      console.error('Leave types fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
    fetchLeaveTypes();
  }, [fetchHolidays, fetchLeaveTypes]);

  const handleApprove = async (id: number) => {
    if (!confirm('Bu izin talebini onaylamak istediğinize emin misiniz?')) return;
    
    setIsSubmitting(id);
    try {
      await holidayApi.approve(id);
      await fetchHolidays();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onay işlemi başarısız');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleReject = async (id: number) => {
    const note = prompt('Reddetme nedeni (opsiyonel):');
    if (note === null) return;
    
    setIsSubmitting(id);
    try {
      await holidayApi.refuse(id, note);
      await fetchHolidays();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reddetme işlemi başarısız');
    } finally {
      setIsSubmitting(null);
    }
  };

  const getStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === HOLIDAY_STATUS.DRAFT.value) return <Badge variant="gray">Taslak</Badge>;
    if (statusValue === HOLIDAY_STATUS.VALIDATED.value) return <Badge variant="warning">Bekliyor</Badge>;
    if (statusValue === HOLIDAY_STATUS.APPROVED.value) return <Badge variant="success">Onaylandı</Badge>;
    if (statusValue === HOLIDAY_STATUS.REFUSED.value) return <Badge variant="danger">Reddedildi</Badge>;
    if (statusValue === HOLIDAY_STATUS.CANCELLED.value) return <Badge variant="gray">İptal Edildi</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const getLeaveTypeLabel = (typeId: number) => {
    const type = leaveTypes.find(t => t.id === typeId);
    return type?.label || typeId.toString();
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter(holiday => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesId = `${holiday.id}`.includes(search);
        const matchesType = holiday.libelle_type?.toLowerCase().includes(search) || false;
        const matchesUser = `${holiday.fk_user}`.includes(search);
        if (!matchesId && !matchesType && !matchesUser) return false;
      }
      if (typeFilter && holiday.fk_type.toString() !== typeFilter) return false;
      return true;
    });
  }, [holidays, searchTerm, typeFilter]);

  const stats = useMemo(() => ({
    total: holidays.length,
    pending: holidays.filter(h => h.statuts === HOLIDAY_STATUS.VALIDATED.value).length,
    approved: holidays.filter(h => h.statuts === HOLIDAY_STATUS.APPROVED.value).length,
    rejected: holidays.filter(h => h.statuts === HOLIDAY_STATUS.REFUSED.value).length,
  }), [holidays]);

  const formatDateRange = (start: string | number, end: string | number) => {
    const formatDate = (date: string | number) => {
      if (typeof date === 'number') {
        return new Date(date * 1000).toLocaleDateString('tr-TR');
      }
      return new Date(date).toLocaleDateString('tr-TR');
    };
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
  };

  const hasActiveFilters = searchTerm || statusFilter || typeFilter;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          <span className="text-slate-500">İzin talepleri yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İzin Talepleri</h1>
          <p className="text-slate-500 mt-1">
            {filteredHolidays.length} talep bulundu
            {stats.pending > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                • {stats.pending} bekliyor
              </span>
            )}
          </p>
        </div>
        <Link to="/izin-talepleri/yeni">
          <Button icon={<Plus className="w-4 h-4" />}>
            Yeni İzin Talebi
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-5 bg-gradient-to-br from-slate-600 to-slate-700 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-slate-200 text-sm font-medium">Toplam Talep</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="!p-5 bg-gradient-to-br from-amber-500 to-amber-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Bekleyen</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="!p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Onaylanan</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="!p-5 bg-gradient-to-br from-red-500 to-red-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Reddedilen</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
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
                <AlertCircle className="w-5 h-5 text-red-600" />
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

      {/* Filters */}
      <Card padding="sm">
        <div className="space-y-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="İzin talebi ara (ID, tür, personel)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!pl-11 h-11"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Durum</label>
                  <Select
                    options={[
                      { value: '', label: 'Tüm Durumlar' },
                      { value: HOLIDAY_STATUS.DRAFT.value.toString(), label: 'Taslak' },
                      { value: HOLIDAY_STATUS.VALIDATED.value.toString(), label: 'Bekliyor' },
                      { value: HOLIDAY_STATUS.APPROVED.value.toString(), label: 'Onaylandı' },
                      { value: HOLIDAY_STATUS.REFUSED.value.toString(), label: 'Reddedildi' },
                      { value: HOLIDAY_STATUS.CANCELLED.value.toString(), label: 'İptal Edildi' },
                    ]}
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">İzin Türü</label>
                  <Select
                    options={[
                      { value: '', label: 'Tüm İzin Türleri' },
                      ...leaveTypes.map(t => ({ value: t.id.toString(), label: t.label })),
                    ]}
                    value={typeFilter}
                    onChange={(v) => setTypeFilter(v)}
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
          {statusFilter && (
            <Badge variant="info" className="gap-1">
              Durum: {[
                { value: HOLIDAY_STATUS.DRAFT.value.toString(), label: 'Taslak' },
                { value: HOLIDAY_STATUS.VALIDATED.value.toString(), label: 'Bekliyor' },
                { value: HOLIDAY_STATUS.APPROVED.value.toString(), label: 'Onaylandı' },
                { value: HOLIDAY_STATUS.REFUSED.value.toString(), label: 'Reddedildi' },
                { value: HOLIDAY_STATUS.CANCELLED.value.toString(), label: 'İptal Edildi' },
              ].find(s => s.value === statusFilter)?.label || statusFilter}
              <button onClick={() => setStatusFilter('')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {typeFilter && (
            <Badge variant="info" className="gap-1">
              Tür: {getLeaveTypeLabel(parseInt(typeFilter))}
              <button onClick={() => setTypeFilter('')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Leave Requests Table */}
      <Card padding="none">
        {filteredHolidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {hasActiveFilters ? 'Arama sonucu bulunamadı' : 'İzin talebi bulunamadı'}
            </h3>
            <p className="text-slate-500 max-w-md mb-6">
              {hasActiveFilters
                ? 'Arama kriterlerinize uygun izin talebi bulunamadı.'
                : 'Henüz izin talebi oluşturulmamış. Yeni bir izin talebi oluşturmak için butona tıklayın.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="secondary" onClick={clearFilters} icon={<X className="w-4 h-4" />}>
                Filtreleri Temizle
              </Button>
            ) : (
              <Link to="/izin-talepleri/yeni">
                <Button icon={<Plus className="w-4 h-4" />}>
                  Yeni İzin Talebi
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                    #
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                    Personel
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                    İzin Türü
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                    Tarih Aralığı
                  </th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                    Süre
                  </th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                    Durum
                  </th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 px-5">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHolidays.map((holiday) => {
                  const isPending = holiday.statuts === HOLIDAY_STATUS.VALIDATED.value;
                  const isProcessing = isSubmitting === holiday.id;
                  
                  return (
                    <tr
                      key={holiday.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        isPending ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <span className="font-mono text-sm text-slate-400">#{holiday.id}</span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                            {holiday.fk_user}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {holiday.libelle_type || `Personel #${holiday.fk_user}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-slate-700">
                          {getLeaveTypeLabel(holiday.fk_type)}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDays className="w-4 h-4 text-slate-400" />
                          {formatDateRange(holiday.date_debut, holiday.date_fin)}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="text-sm font-semibold text-slate-900">
                          {holiday.duration} gün
                        </span>
                        {holiday.halfday === 1 && (
                          <span className="ml-1 text-xs text-amber-600">(Sabah)</span>
                        )}
                        {holiday.halfday === 2 && (
                          <span className="ml-1 text-xs text-amber-600">(Öğleden Sonra)</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        {getStatusBadge(holiday.statuts)}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleApprove(holiday.id)}
                                disabled={isProcessing}
                                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Onayla"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(holiday.id)}
                                disabled={isProcessing}
                                className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reddet"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          ) : null}
                          <Link
                            to={`/izin-talepleri/${holiday.id}`}
                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="Detay"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Stats Footer */}
      <div className="text-center text-sm text-slate-500">
        Toplam {filteredHolidays.length} talep
        {stats.pending > 0 && (
          <span className="mx-1">·</span>
        )}
        {stats.pending > 0 && (
          <span className="text-amber-600 font-medium">
            {stats.pending} onay bekliyor
          </span>
        )}
      </div>
    </div>
  );
}

export default IzinTalepleri;