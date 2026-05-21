import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { holidayApi, HOLIDAY_STATUS, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { Holiday, LeaveType } from '@/lib/types/hrm';

export function IzinTalepleri() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchHolidays = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (statusFilter) params.statuts = statusFilter;
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

  const filteredHolidays = holidays.filter(holiday => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesEmployee = `${holiday.fk_user}`.includes(search);
      const matchesType = holiday.libelle_type?.toLowerCase().includes(search) || false;
      if (!matchesEmployee && !matchesType) return false;
    }
    if (typeFilter && holiday.fk_type.toString() !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: holidays.length,
    pending: holidays.filter(h => h.statuts === HOLIDAY_STATUS.VALIDATED.value).length,
    approved: holidays.filter(h => h.statuts === HOLIDAY_STATUS.APPROVED.value).length,
    rejected: holidays.filter(h => h.statuts === HOLIDAY_STATUS.REFUSED.value).length,
  };

  const formatDateRange = (start: string | number, end: string | number) => {
    const formatDate = (date: string | number) => {
      if (typeof date === 'number') {
        return new Date(date * 1000).toLocaleDateString('tr-TR');
      }
      return new Date(date).toLocaleDateString('tr-TR');
    };
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">İzin talepleri yükleniyor...</span>
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
            <h1 className="text-2xl font-bold text-slate-900">İzin Talepleri</h1>
            <p className="text-slate-500 mt-1">Personel izin taleplerini görüntüleyin ve yönetin</p>
          </div>
          <Link to="/izin-talepleri/yeni">
            <Button icon={<Plus className="w-4 h-4" />}>
              Yeni İzin Talebi
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Toplam Talep</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                <p className="text-sm text-slate-500">Bekleyen</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
                <p className="text-sm text-slate-500">Onaylanan</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
                <p className="text-sm text-slate-500">Reddedilen</p>
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
                  placeholder="İzin talebi ara..."
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
            <div className="w-full md:w-48">
              <Select
                options={[
                  { value: '', label: 'Tüm İzin Türleri' },
                  ...leaveTypes.map(t => ({ value: t.id.toString(), label: t.label })),
                ]}
                value={typeFilter}
                onChange={(v) => setTypeFilter(v)}
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

        {/* Leave Requests Table */}
        <Card>
          {filteredHolidays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">İzin talebi bulunamadı</h3>
              <p className="text-slate-500 mb-6">Henüz izin talebi oluşturulmamış. Yeni bir izin talebi oluşturmak için butona tıklayın.</p>
              <Link to="/izin-talepleri/yeni">
                <Button icon={<Plus className="w-4 h-4" />}>
                  Yeni İzin Talebi
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Personel
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      İzin Türü
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Tarih Aralığı
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Süre
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Durum
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHolidays.map((holiday) => (
                    <tr
                      key={holiday.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                            {holiday.fk_user}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {holiday.libelle_type || `Personel #${holiday.fk_user}`}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: #{holiday.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700">
                          {holiday.libelle_type || getLeaveTypeLabel(holiday.fk_type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700">
                          {formatDateRange(holiday.date_debut, holiday.date_fin)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700">
                          {holiday.duration} gün
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(holiday.statuts)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link to={`/izin-talepleri/${holiday.id}`}>
                          <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} iconPosition="right">
                            Detay
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

export default IzinTalepleri;