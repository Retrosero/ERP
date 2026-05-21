import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  MapPin,
  DollarSign,
  FileText,
} from 'lucide-react';
import { Card, Button, Input, Select, Alert } from '@/components/ui';
import { recruitmentApi, RECRUITMENT_STATUS } from '@/lib/dolibarr-hrm';
import type { CreateJobPositionDto } from '@/lib/types/hrm';

export function YeniIsIlani() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateJobPositionDto>({
    label: '',
    description: '',
    status: RECRUITMENT_STATUS.OPEN.value,
    location: '',
    salary_min: undefined,
    salary_max: undefined,
    salary_currency: 'TRY',
    nb_candidates: 1,
    date_start: '',
    date_end: '',
    removenotify: 0,
    notify_email: '',
    keywords: '',
    fk_user_card: undefined,
    contract_type: '',
  });

  const handleChange = (field: keyof CreateJobPositionDto, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.label?.trim()) {
      setError('Pozisyon adı zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPosition = await recruitmentApi.createPosition(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/ise-alim/ilan/${newPosition.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlan oluşturulurken hata oluştu');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fadeIn max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/ise-alim" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">İş İlanlarına Dön</span>
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
            İlan başarıyla oluşturuldu. Yönlendiriliyorsunuz...
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Temel Bilgiler
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pozisyon Adı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Örn: Senior Yazılım Mühendisi"
                    value={formData.label || ''}
                    onChange={(e) => handleChange('label', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                    rows={4}
                    placeholder="Pozisyon hakkında detaylı bilgi..."
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Durum
                  </label>
                  <Select
                    options={[
                      { value: RECRUITMENT_STATUS.OPEN.value.toString(), label: 'Açık' },
                      { value: RECRUITMENT_STATUS.CLOSED.value.toString(), label: 'Kapalı' },
                      { value: RECRUITMENT_STATUS.DRAFT.value.toString(), label: 'Taslak' },
                    ]}
                    value={formData.status?.toString() || RECRUITMENT_STATUS.OPEN.value.toString()}
                    onChange={(v) => handleChange('status', v ? parseInt(v) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Location and Salary */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Konum ve Ücret
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Konum
                  </label>
                  <Input
                    placeholder="Örn: İstanbul, Türkiye"
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sözleşme Türü
                  </label>
                  <Select
                    options={[
                      { value: '', label: 'Seçiniz' },
                      { value: 'CDD', label: 'Belirli Süreli (CDD)' },
                      { value: 'CDI', label: 'Belirsiz Süreli (CDI)' },
                      { value: 'Stage', label: 'Staj' },
                      { value: 'Intérim', label: 'Geçici İş' },
                    ]}
                    value={formData.contract_type || ''}
                    onChange={(v) => handleChange('contract_type', v)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Minimum Ücret (TL)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.salary_min?.toString() || ''}
                    onChange={(e) => handleChange('salary_min', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Maksimum Ücret (TL)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.salary_max?.toString() || ''}
                    onChange={(e) => handleChange('salary_max', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </Card>

            {/* Dates */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">Tarihler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.date_start?.toString() || ''}
                    onChange={(e) => handleChange('date_start', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bitiş Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.date_end?.toString() || ''}
                    onChange={(e) => handleChange('date_end', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Keywords */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">Anahtar Kelimeler</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Anahtar Kelimeler
                </label>
                <Input
                  placeholder="Örn: React, TypeScript, Node.js (virgülle ayırın)"
                  value={formData.keywords || ''}
                  onChange={(e) => handleChange('keywords', e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Aday arama sonuçlarını iyileştirmek için virgülle ayırarak yazın
                </p>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4">
              <Link to="/ise-alim">
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
                {isSubmitting ? 'Kaydediliyor...' : success ? 'Kaydedildi!' : 'İlan Oluştur'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default YeniIsIlani;