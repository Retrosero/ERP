import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  User,
  Edit,
  Trash2,
  Loader2,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building,
  Banknote,
  Receipt,
  FileText,
  ChevronRight,
  ExternalLink,
  BadgeCheck,
  CalendarDays,
} from 'lucide-react';
import { Card, Button, Badge, Alert } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { userApi, holidayApi, expenseReportApi, HOLIDAY_STATUS, EXPENSE_STATUS, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { User as UserType, Holiday, ExpenseReport, LeaveBalance } from '@/lib/types/hrm';

type TabType = 'info' | 'leaves' | 'expenses' | 'payroll';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'info', label: 'Bilgiler', icon: <User className="w-4 h-4" /> },
  { id: 'leaves', label: 'İzinler', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'expenses', label: 'Harcamalar', icon: <Receipt className="w-4 h-4" /> },
  { id: 'payroll', label: 'Bordro', icon: <Banknote className="w-4 h-4" /> },
];

export function PersonelDetay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  
  // Data for tabs
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [expenses, setExpenses] = useState<ExpenseReport[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [isLoadingTabData, setIsLoadingTabData] = useState(false);

  const fetchEmployee = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await userApi.get(parseInt(id));
      setEmployee(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Personel bilgileri yüklenirken hata oluştu');
      console.error('Employee fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchTabData = useCallback(async (tab: TabType) => {
    if (!id) return;
    setIsLoadingTabData(true);
    
    try {
      const userId = parseInt(id);
      
      if (tab === 'leaves') {
        const [holidaysData, balancesData] = await Promise.all([
          holidayApi.list({ user_id: userId, limit: 50 }),
          holidayApi.getBalance(userId, new Date().getFullYear()),
        ]);
        setHolidays(holidaysData);
        setLeaveBalances(balancesData);
      } else if (tab === 'expenses') {
        const data = await expenseReportApi.list({ user_id: userId, limit: 50 });
        setExpenses(data);
      }
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
    } finally {
      setIsLoadingTabData(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  useEffect(() => {
    if (!isLoading && employee) {
      fetchTabData(activeTab);
    }
  }, [activeTab, isLoading, employee, fetchTabData]);

  const handleDelete = async () => {
    if (!employee || !confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;

    setIsDeleting(true);
    try {
      await userApi.delete(employee.id);
      navigate('/personel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme işlemi başarısız oldu');
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: number | undefined) => {
    if (status === 1) return <Badge variant="success">Aktif</Badge>;
    if (status === 0) return <Badge variant="danger">Pasif</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const getRoleBadge = (admin: number | undefined) => {
    if (admin === 1) return <Badge variant="warning">Yönetici</Badge>;
    return <Badge variant="info">Kullanıcı</Badge>;
  };

  const getHolidayStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === HOLIDAY_STATUS.DRAFT.value) return <Badge variant="gray">Taslak</Badge>;
    if (statusValue === HOLIDAY_STATUS.VALIDATED.value) return <Badge variant="warning">Bekliyor</Badge>;
    if (statusValue === HOLIDAY_STATUS.APPROVED.value) return <Badge variant="success">Onaylandı</Badge>;
    if (statusValue === HOLIDAY_STATUS.REFUSED.value) return <Badge variant="danger">Reddedildi</Badge>;
    if (statusValue === HOLIDAY_STATUS.CANCELLED.value) return <Badge variant="gray">İptal Edildi</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const getExpenseStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === EXPENSE_STATUS.DRAFT.value) return <Badge variant="gray">Taslak</Badge>;
    if (statusValue === EXPENSE_STATUS.VALIDATED.value) return <Badge variant="warning">Onay Bekliyor</Badge>;
    if (statusValue === EXPENSE_STATUS.APPROVED.value) return <Badge variant="success">Onaylandı</Badge>;
    if (statusValue === EXPENSE_STATUS.REFUSED.value) return <Badge variant="danger">Reddedildi</Badge>;
    if (statusValue === EXPENSE_STATUS.PAID.value) return <Badge variant="info">Ödendi</Badge>;
    if (statusValue === EXPENSE_STATUS.CANCELLED.value) return <Badge variant="gray">İptal Edildi</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  // Stats for tabs
  const leaveStats = useMemo(() => ({
    total: holidays.length,
    approved: holidays.filter(h => h.statuts === HOLIDAY_STATUS.APPROVED.value).length,
    pending: holidays.filter(h => h.statuts === HOLIDAY_STATUS.VALIDATED.value).length,
  }), [holidays]);

  const expenseStats = useMemo(() => ({
    total: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + (e.total_ttc || 0), 0),
    pending: expenses.filter(e => e.statut === EXPENSE_STATUS.VALIDATED.value).length,
  }), [expenses]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">Personel bilgileri yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <Alert type="error" title="Hata">
          {error || 'Personel bulunamadı'}
        </Alert>
        <Link to="/personel">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            Personel Listesine Dön
          </Button>
        </Link>
      </div>
    );
  }

  const fullName = `${employee.firstname || ''} ${employee.lastname || ''}`.trim();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link to="/personel" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Personel Listesine Dön</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to={`/personel/${employee.id}/duzenle`}>
            <Button variant="secondary" icon={<Edit className="w-4 h-4" />}>
              Düzenle
            </Button>
          </Link>
          <Button
            variant="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
            loading={isDeleting}
            disabled={isDeleting}
          >
            Sil
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert type="error" title="Hata">
          {error}
        </Alert>
      )}

      {/* Profile Card */}
      <Card className="!p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-teal-500/20">
              {employee.firstname?.charAt(0)?.toUpperCase() || '?'}
              {employee.lastname?.charAt(0)?.toUpperCase() || ''}
            </div>
            <div className="flex items-center gap-2 mt-3">
              {getStatusBadge(employee.statut)}
              {getRoleBadge(employee.admin)}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {fullName || employee.name || 'İsimsiz Kullanıcı'}
                </h1>
                {employee.job && (
                  <p className="text-slate-500 mt-1">{employee.job}</p>
                )}
                {employee.login && (
                  <p className="text-sm text-slate-400 mt-1">@{employee.login}</p>
                )}
              </div>
            </div>

            {/* Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {employee.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">E-posta</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{employee.email}</p>
                  </div>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Telefon</p>
                    <p className="text-sm font-medium text-slate-900">{employee.phone}</p>
                  </div>
                </div>
              )}
              {employee.phone_mobile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Cep Telefonu</p>
                    <p className="text-sm font-medium text-slate-900">{employee.phone_mobile}</p>
                  </div>
                </div>
              )}
              {(employee.address || employee.town) && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors sm:col-span-2 lg:col-span-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Adres</p>
                    <p className="text-sm font-medium text-slate-900">
                      {[employee.address, employee.town].filter(Boolean).join(', ') || '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600 bg-teal-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'leaves' && leaveStats.pending > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full">
                  {leaveStats.pending}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div key={activeTab}>
        {isLoadingTabData ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
              <span className="text-slate-500">Veriler yükleniyor...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Work Information */}
                  <Card>
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-teal-600" />
                      Çalışma Bilgileri
                    </h3>
                    <div className="space-y-3">
                      {employee.login && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">Kullanıcı Adı</span>
                          <span className="font-medium text-slate-900 font-mono">{employee.login}</span>
                        </div>
                      )}
                      {employee.job && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">Pozisyon</span>
                          <span className="font-medium text-slate-900">{employee.job}</span>
                        </div>
                      )}
                      {employee.dateemployment && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">İşe Başlama</span>
                          <span className="font-medium text-slate-900">
                            {typeof employee.dateemployment === 'string'
                              ? formatDate(employee.dateemployment)
                              : new Date(employee.dateemployment * 1000).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      )}
                      {employee.dateemploymentend && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">İşten Çıkış</span>
                          <span className="font-medium text-slate-900">
                            {typeof employee.dateemploymentend === 'string'
                              ? formatDate(employee.dateemploymentend)
                              : new Date(employee.dateemploymentend * 1000).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      )}
                      {employee.weeklyhours && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">Haftalık Çalışma</span>
                          <span className="font-medium text-slate-900">{employee.weeklyhours} saat</span>
                        </div>
                      )}
                      {employee.salary !== undefined && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">Maaş</span>
                          <span className="font-medium text-teal-600 font-semibold">
                            {employee.salary ? `${employee.salary.toLocaleString('tr-TR')} ₺` : '-'}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Personal Information */}
                  <Card>
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-teal-600" />
                      Kişisel Bilgiler
                    </h3>
                    <div className="space-y-3">
                      {employee.civility && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">Ünvan</span>
                          <span className="font-medium text-slate-900">{employee.civility}</span>
                        </div>
                      )}
                      {employee.birth && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">Doğum Tarihi</span>
                          <span className="font-medium text-slate-900">{formatDate(employee.birth)}</span>
                        </div>
                      )}
                      {employee.sex && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">Cinsiyet</span>
                          <span className="font-medium text-slate-900">
                            {employee.sex === 'M' ? 'Erkek' : employee.sex === 'F' ? 'Kadın' : '-'}
                          </span>
                        </div>
                      )}
                      {employee.national_id && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">TC Kimlik No</span>
                          <span className="font-medium text-slate-900 font-mono">{employee.national_id}</span>
                        </div>
                      )}
                      {employee.social_security_number && (
                        <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500">SSK No</span>
                          <span className="font-medium text-slate-900 font-mono">{employee.social_security_number}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* System Information */}
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    Sistem Bilgileri
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500 mb-1">Oluşturulma</p>
                      <p className="text-sm font-medium text-slate-900">
                        {employee.datecreation ? formatDate(employee.datecreation) : '-'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500 mb-1">Son Güncelleme</p>
                      <p className="text-sm font-medium text-slate-900">
                        {employee.datemodification ? formatDate(employee.datemodification) : '-'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500 mb-1">Son Giriş</p>
                      <p className="text-sm font-medium text-slate-900">
                        {employee.last_login
                          ? typeof employee.last_login === 'string'
                            ? formatDate(employee.last_login)
                            : new Date(employee.last_login * 1000).toLocaleDateString('tr-TR')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Notes */}
                {(employee.note_public || employee.note_private) && (
                  <Card>
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      Notlar
                    </h3>
                    <div className="space-y-4">
                      {employee.note_public && (
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium mb-1">Genel Not</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{employee.note_public}</p>
                        </div>
                      )}
                      {employee.note_private && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                          <p className="text-xs text-amber-600 font-medium mb-1">Özel Not</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{employee.note_private}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Leaves Tab */}
            {activeTab === 'leaves' && (
              <div className="space-y-6">
                {/* Leave Balance Summary */}
                {leaveBalances.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {leaveBalances.map((balance) => (
                      <Card key={balance.id || balance.fk_leave_type} className="!p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500">{balance.label_type || 'İzin Türü'}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                              {balance.days_available || balance.remaining || 0}
                            </p>
                            <p className="text-xs text-slate-400">gün kaldı</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                            <CalendarDays className="w-6 h-6 text-teal-600" />
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Kullanılan:</span>
                            <span className="font-medium">{balance.days_taken || balance.used || 0}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Yıllık Kota:</span>
                            <span className="font-medium">{balance.annual_quota || balance.total_days || '-'}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Leave Requests */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-teal-600" />
                      İzin Talepleri
                    </h3>
                    <Link to={`/izin-talepleri/yeni?user=${employee.id}`}>
                      <Button size="sm" icon={<CalendarDays className="w-4 h-4" />}>
                        Yeni İzin Talebi
                      </Button>
                    </Link>
                  </div>

                  {holidays.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <CalendarDays className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500">Henüz izin talebi bulunmuyor</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">Tarih Aralığı</th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">İzin Türü</th>
                            <th className="text-center text-xs font-semibold text-slate-500 uppercase py-3 px-4">Süre</th>
                            <th className="text-center text-xs font-semibold text-slate-500 uppercase py-3 px-4">Durum</th>
                            <th className="text-right text-xs font-semibold text-slate-500 uppercase py-3 px-4">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {holidays.map((holiday) => (
                            <tr key={holiday.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <div className="text-sm font-medium text-slate-900">
                                  {typeof holiday.date_debut === 'string' 
                                    ? new Date(holiday.date_debut).toLocaleDateString('tr-TR')
                                    : new Date(holiday.date_debut * 1000).toLocaleDateString('tr-TR')}
                                  {' - '}
                                  {typeof holiday.date_fin === 'string' 
                                    ? new Date(holiday.date_fin).toLocaleDateString('tr-TR')
                                    : new Date(holiday.date_fin * 1000).toLocaleDateString('tr-TR')}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-slate-700">{holiday.libelle_type || '-'}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-sm font-medium text-slate-900">{holiday.duration} gün</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getHolidayStatusBadge(holiday.statuts)}
                              </td>
                              <td className="py-3 px-4 text-right">
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
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
              <div className="space-y-6">
                {/* Expense Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="!p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{expenseStats.total}</p>
                        <p className="text-sm text-slate-500">Toplam Harcama</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="!p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                        <Banknote className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">
                          {expenseStats.totalAmount.toLocaleString('tr-TR')} ₺
                        </p>
                        <p className="text-sm text-slate-500">Toplam Tutar</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="!p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{expenseStats.pending}</p>
                        <p className="text-sm text-slate-500">Bekleyen</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Expense List */}
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-teal-600" />
                    Harcama Raporları
                  </h3>

                  {expenses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Receipt className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500">Henüz harcama raporu bulunmuyor</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">Referans</th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">Tarih</th>
                            <th className="text-right text-xs font-semibold text-slate-500 uppercase py-3 px-4">Tutar</th>
                            <th className="text-center text-xs font-semibold text-slate-500 uppercase py-3 px-4">Durum</th>
                            <th className="text-right text-xs font-semibold text-slate-500 uppercase py-3 px-4">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense) => (
                            <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <span className="font-mono text-sm font-medium text-slate-900">{expense.ref}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-slate-600">
                                  {expense.date_creation ? formatDate(expense.date_creation) : '-'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="text-sm font-semibold text-teal-600">
                                  {expense.total_ttc?.toLocaleString('tr-TR')} ₺
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getExpenseStatusBadge(expense.statut)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link to={`/harcamalar/${expense.id}`}>
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
            )}

            {/* Payroll Tab */}
            {activeTab === 'payroll' && (
              <div className="space-y-6">
                <Card className="!p-8 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Banknote className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Bordro Bilgileri</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Bordro bilgileri Dolibarr'ın bordro modülü üzerinden yönetilmektedir.
                    Detaylı bordro bilgileri için Dolibarr'a yönlendirilebilirsiniz.
                  </p>
                  {employee.salary !== undefined && (
                    <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-teal-50">
                      <Banknote className="w-5 h-5 text-teal-600" />
                      <span className="text-sm text-slate-600">Aylık Maaş:</span>
                      <span className="text-lg font-bold text-teal-600">
                        {employee.salary?.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PersonelDetay;