import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { Card, Button, Input, Select, Alert } from '@/components/ui';
import { holidayApi, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { CreateHolidayDto, LeaveType, User, LeaveBalance } from '@/lib/types/hrm';
import { userApi } from '@/lib/dolibarr-hrm';

const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export function YeniIzinTalebi() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Record<number, LeaveBalance[]>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState<CreateHolidayDto>({
    fk_user: undefined,
    date_debut: '',
    date_fin: '',
    halfday: 0,
    fk_type: 0,
    libelle: '',
    note_private: '',
    note_public: '',
  });

  const [calculatedDuration, setCalculatedDuration] = useState<number>(0);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const types = await holidayApi.getTypes();
      setLeaveTypes(types.filter(t => t.active === 1));
    } catch (err) {
      console.error('Leave types fetch error:', err);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const users = await userApi.list();
      setEmployees(users);
      
      // Pre-select user if passed in URL
      const userParam = searchParams.get('user');
      if (userParam) {
        setFormData(prev => ({ ...prev, fk_user: parseInt(userParam) }));
      }
    } catch (err) {
      console.error('Employees fetch error:', err);
    }
  }, [searchParams]);

  // Fetch leave balances for selected user
  const fetchLeaveBalances = useCallback(async () => {
    if (!formData.fk_user) {
      setLeaveBalances({});
      return;
    }
    try {
      const balances = await holidayApi.getBalance(formData.fk_user, new Date().getFullYear());
      setLeaveBalances({ [formData.fk_user]: balances });
    } catch (err) {
      console.error('Leave balance fetch error:', err);
    }
  }, [formData.fk_user]);

  useEffect(() => {
    fetchLeaveTypes();
    fetchEmployees();
  }, [fetchLeaveTypes, fetchEmployees]);

  useEffect(() => {
    fetchLeaveBalances();
  }, [fetchLeaveBalances]);

  const handleChange = (field: keyof CreateHolidayDto, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'date_debut' || field === 'date_fin' || field === 'halfday') {
      // Recalculate will happen in useEffect
    }
  };

  // Calculate duration when dates change
  useEffect(() => {
    if (formData.date_debut && formData.date_fin) {
      const start = new Date(formData.date_debut);
      const end = new Date(formData.date_fin);
      if (end >= start) {
        let diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Adjust for half-day selection
        if (formData.halfday && formData.halfday > 0) {
          diffDays = 0.5;
        }
        
        setCalculatedDuration(diffDays);
      } else {
        setCalculatedDuration(0);
      }
    } else {
      setCalculatedDuration(0);
    }
  }, [formData.date_debut, formData.date_fin, formData.halfday]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.date_debut) {
      setError('Başlangıç tarihi zorunludur');
      return;
    }
    if (!formData.date_fin) {
      setError('Bitiş tarihi zorunludur');
      return;
    }
    if (formData.date_fin && formData.date_fin < formData.date_debut) {
      setError('Bitiş tarihi başlangıç tarihinden önce olamaz');
      return;
    }
    if (!formData.fk_type) {
      setError('İzin türü seçimi zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const newHoliday = await holidayApi.create(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/izin-talepleri/${newHoliday.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İzin talebi oluşturulurken hata oluştu');
      setIsSubmitting(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isStart = formData.date_debut === dateStr;
      const isEnd = formData.date_fin === dateStr;
      const isInRange = formData.date_debut && formData.date_fin && 
        dateStr > formData.date_debut && dateStr < formData.date_fin;
      const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => {
            if (!formData.date_debut || (formData.date_debut && formData.date_fin)) {
              handleChange('date_debut', dateStr);
              handleChange('date_fin', '');
            } else if (dateStr >= formData.date_debut) {
              handleChange('date_fin', dateStr);
            } else {
              handleChange('date_debut', dateStr);
              handleChange('date_fin', '');
            }
          }}
          className={`h-10 w-full rounded-xl text-sm font-medium transition-all ${
            isStart || isEnd
              ? 'bg-teal-500 text-white'
              : isInRange
              ? 'bg-teal-100 text-teal-700'
              : isWeekend
              ? 'bg-slate-50 text-slate-400'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const selectedUserBalances = formData.fk_user ? leaveBalances[formData.fk_user] || [] : [];

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/izin-talepleri" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">İzin Taleplerine Dön</span>
        </Link>
      </div>

      {/* Error/Success Messages */}
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
            <button onClick={() => setError(null)} className="p-2 hover:bg-red-100 rounded-lg">
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </Card>
      )}
      {success && (
        <Card className="!p-4 border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-800">Başarılı</p>
              <p className="text-sm text-emerald-600">İzin talebi başarıyla oluşturuldu. Yönlendiriliyorsunuz...</p>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                Personel ve İzin Türü
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Personel <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={[
                      { value: '', label: 'Seçiniz...' },
                      ...employees.map(e => ({
                        value: e.id.toString(),
                        label: `${e.firstname} ${e.lastname}`
                      })),
                    ]}
                    value={formData.fk_user?.toString() || ''}
                    onChange={(v) => handleChange('fk_user', v ? parseInt(v) : undefined)}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Boş bırakılırsa kendiniz için talep oluşturulur</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    İzin Türü <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={[
                      { value: '', label: 'Seçiniz...' },
                      ...leaveTypes.map(t => ({ value: t.id.toString(), label: t.label })),
                    ]}
                    value={formData.fk_type?.toString() || ''}
                    onChange={(v) => handleChange('fk_type', v ? parseInt(v) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Leave Balance Card */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-600" />
                İzin Bakiyesi
              </h3>
              {selectedUserBalances.length > 0 ? (
                <div className="space-y-3">
                  {selectedUserBalances.map((balance) => (
                    <div key={balance.id || balance.fk_leave_type} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                          <CalendarDays className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{balance.label_type || 'İzin'}</p>
                          <p className="text-xs text-slate-500">Kalan: {balance.days_available || balance.remaining || 0} gün</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-teal-600">
                          {balance.days_available || balance.remaining || 0}
                        </p>
                        <p className="text-xs text-slate-400">gün</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Personel seçildiğinde bakiyeler görüntülenecek</p>
                </div>
              )}
            </Card>
          </div>

          {/* Calendar Selection */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Tarih Seçimi
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <h4 className="font-semibold text-slate-900">
                    {MONTHS_TR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_TR.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>
                
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-teal-500" />
                    <span>Seçili</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-teal-100" />
                    <span>Aralık</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-50" />
                    <span>Hafta sonu</span>
                  </div>
                </div>
              </div>

              {/* Date Inputs & Duration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Başlangıç Tarihi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.date_debut?.toString() || ''}
                    onChange={(e) => handleChange('date_debut', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Bitiş Tarihi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.date_fin?.toString() || ''}
                    onChange={(e) => handleChange('date_fin', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Yarım Gün Seçeneği
                  </label>
                  <Select
                    options={[
                      { value: '0', label: 'Hayır - Tam Gün İzin' },
                      { value: '1', label: 'Evet - Sadece Sabah (0.5 gün)' },
                      { value: '2', label: 'Evet - Sadece Öğleden Sonra (0.5 gün)' },
                    ]}
                    value={formData.halfday?.toString() || '0'}
                    onChange={(v) => handleChange('halfday', parseInt(v))}
                    className="w-full"
                  />
                </div>
                
                {/* Duration Summary */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Hesaplanan Süre</p>
                      <p className="text-2xl font-bold text-teal-600">
                        {calculatedDuration > 0 ? `${calculatedDuration} gün` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Açıklama ve Notlar</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Kısa Açıklama
                </label>
                <Input
                  placeholder="İzin için kısa bir başlık..."
                  value={formData.libelle || ''}
                  onChange={(e) => handleChange('libelle', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Yöneticiye Özel Not
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                  rows={3}
                  placeholder="Yöneticiye iletmek istediğiniz özel notlar..."
                  value={formData.note_private || ''}
                  onChange={(e) => handleChange('note_private', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Info Box */}
          <Card className="!bg-blue-50 !border-blue-100">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">İzin talebiniz;</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Oluşturulduktan sonra yöneticinizin onayına sunulacaktır.</li>
                  <li>Onaylanan izinleriniz izin bakiyenizden düşülecektir.</li>
                  <li>İzninizi iptal etmek için detay sayfasından işlem yapabilirsiniz.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Link to="/izin-talepleri">
              <Button variant="secondary" type="button">
                İptal
              </Button>
            </Link>
            <Button
              type="submit"
              icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              loading={isSubmitting}
              disabled={isSubmitting || success}
            >
              {isSubmitting ? 'Kaydediliyor...' : success ? 'Kaydedildi!' : 'Talep Oluştur'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default YeniIzinTalebi;