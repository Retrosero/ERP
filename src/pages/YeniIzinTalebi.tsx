import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Info,
} from 'lucide-react';
import { Card, Button, Input, Select, Alert } from '@/components/ui';
import { holidayApi, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { CreateHolidayDto, LeaveType, User } from '@/lib/types/hrm';
import { userApi } from '@/lib/dolibarr-hrm';

export function YeniIzinTalebi() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

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
    } catch (err) {
      console.error('Employees fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeaveTypes();
    fetchEmployees();
  }, [fetchLeaveTypes, fetchEmployees]);

  const handleChange = (field: keyof CreateHolidayDto, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate duration when dates change
  useEffect(() => {
    if (formData.date_debut && formData.date_fin) {
      const start = new Date(formData.date_debut);
      const end = new Date(formData.date_fin);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCalculatedDuration(diffDays);
      } else {
        setCalculatedDuration(0);
      }
    } else {
      setCalculatedDuration(0);
    }
  }, [formData.date_debut, formData.date_fin]);

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
    if (formData.date_fin < formData.date_debut) {
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

  return (
    <>
      <div className="space-y-6 animate-fadeIn max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/izin-talepleri" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">İzin Taleplerine Dön</span>
          </Link>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert type="error" title="Hata">
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" title="Başarılı">
            İzin talebi başarıyla oluşturuldu. Yönlendiriliyorsunuz...
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Leave Type Selection */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                İzin Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Personel <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={[
                      { value: '', label: 'Seçiniz' },
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    İzin Türü <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={[
                      { value: '', label: 'Seçiniz' },
                      ...leaveTypes.map(t => ({ value: t.id.toString(), label: t.label })),
                    ]}
                    value={formData.fk_type?.toString() || ''}
                    onChange={(v) => handleChange('fk_type', v ? parseInt(v) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Date Selection */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">Tarih Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Başlangıç Tarihi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.date_debut?.toString() || ''}
                    onChange={(e) => handleChange('date_debut', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bitiş Tarihi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.date_fin?.toString() || ''}
                    onChange={(e) => handleChange('date_fin', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Yarım Gün
                  </label>
                  <Select
                    options={[
                      { value: '0', label: 'Hayır - Tam Gün' },
                      { value: '1', label: 'Evet - Sabah' },
                      { value: '2', label: 'Evet - Öğleden Sonra' },
                    ]}
                    value={formData.halfday?.toString() || '0'}
                    onChange={(v) => handleChange('halfday', parseInt(v))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hesaplanan Süre
                  </label>
                  <div className="h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center">
                    <span className="text-sm font-medium text-slate-700">
                      {calculatedDuration > 0 ? `${calculatedDuration} gün` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description and Notes */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">Açıklama ve Notlar</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Açıklama
                  </label>
                  <Input
                    placeholder="İzin için kısa bir açıklama..."
                    value={formData.libelle || ''}
                    onChange={(e) => handleChange('libelle', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Özel Not
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                    rows={3}
                    placeholder="Yöneticiye iletmek istediğiniz özel notlar..."
                    value={formData.note_private || ''}
                    onChange={(e) => handleChange('note_private', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Genel Not
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                    rows={3}
                    placeholder="Genel notlar..."
                    value={formData.note_public || ''}
                    onChange={(e) => handleChange('note_public', e.target.value)}
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
    </>
  );
}

export default YeniIzinTalebi;