import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Card, Button, Input, Select, Alert } from '@/components/ui';
import { userApi, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { CreateUserDto } from '@/lib/types/hrm';

export function YeniPersonel() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateUserDto>({
    lastname: '',
    firstname: '',
    login: '',
    email: '',
    admin: 0,
    job: '',
    civility: '',
    phone: '',
    phone_mobile: '',
    address: '',
    zip: '',
    town: '',
    country_id: undefined,
    birth: '',
    sex: '',
    dateemployment: '',
    dateemploymentend: '',
    salary: undefined,
    salary_extra: undefined,
    weeklyhours: undefined,
    note_public: '',
    note_private: '',
  });

  const civilityOptions = [
    { value: '', label: 'Seçiniz' },
    { value: 'MR', label: 'Bay' },
    { value: 'MME', label: 'Bayan' },
    { value: 'MLE', label: 'Bayan (Mlle)' },
  ];

  const genderOptions = [
    { value: '', label: 'Seçiniz' },
    { value: 'M', label: 'Erkek' },
    { value: 'F', label: 'Kadın' },
  ];

  const handleChange = (field: keyof CreateUserDto, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.lastname?.trim()) {
      setError('Soyad zorunludur');
      return;
    }
    if (!formData.firstname?.trim()) {
      setError('Ad zorunludur');
      return;
    }
    if (!formData.email?.trim()) {
      setError('E-posta zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await userApi.create(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/personel/${newUser.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Personel oluşturulurken hata oluştu');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fadeIn max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/personel" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Personel Listesine Dön</span>
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
            Personel başarıyla oluşturuldu. Yönlendiriliyorsunuz...
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">Temel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ünvan <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={civilityOptions}
                    value={formData.civility || ''}
                    onChange={(v) => handleChange('civility', v)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ad <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Personel adı"
                    value={formData.firstname || ''}
                    onChange={(e) => handleChange('firstname', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Soyad <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Personel soyadı"
                    value={formData.lastname || ''}
                    onChange={(e) => handleChange('lastname', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cinsiyet
                  </label>
                  <Select
                    options={genderOptions}
                    value={formData.sex || ''}
                    onChange={(v) => handleChange('sex', v)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Doğum Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.birth || ''}
                    onChange={(e) => handleChange('birth', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">İletişim Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    E-posta <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="ornek@firma.com"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Telefon (İş)
                  </label>
                  <Input
                    placeholder="0212 XXX XX XX"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cep Telefonu
                  </label>
                  <Input
                    placeholder="0532 XXX XX XX"
                    value={formData.phone_mobile || ''}
                    onChange={(e) => handleChange('phone_mobile', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Şehir
                  </label>
                  <Input
                    placeholder="İstanbul"
                    value={formData.town || ''}
                    onChange={(e) => handleChange('town', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Adres
                  </label>
                  <Input
                    placeholder="Cadde, sokak, bina numarası..."
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Work Information */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">Çalışma Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kullanıcı Adı (Login)
                  </label>
                  <Input
                    placeholder="kullanici.adi"
                    value={formData.login || ''}
                    onChange={(e) => handleChange('login', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pozisyon / Meslek
                  </label>
                  <Input
                    placeholder="Yazılım Geliştirici"
                    value={formData.job || ''}
                    onChange={(e) => handleChange('job', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    İşe Başlama Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.dateemployment || ''}
                    onChange={(e) => handleChange('dateemployment', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Haftalık Çalışma Saati
                  </label>
                  <Input
                    type="number"
                    placeholder="40"
                    value={formData.weeklyhours || ''}
                    onChange={(e) => handleChange('weeklyhours', parseFloat(e.target.value) || undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Maaş (Baz)
                  </label>
                  <Input
                    type="number"
                    placeholder="25000"
                    value={formData.salary || ''}
                    onChange={(e) => handleChange('salary', parseFloat(e.target.value) || undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ek Maaş
                  </label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={formData.salary_extra || ''}
                    onChange={(e) => handleChange('salary_extra', parseFloat(e.target.value) || undefined)}
                  />
                </div>
              </div>
            </Card>

            {/* Notes */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">Notlar</h3>
              <div className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Özel Not
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                    rows={3}
                    placeholder="Özel notlar..."
                    value={formData.note_private || ''}
                    onChange={(e) => handleChange('note_private', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4">
              <Link to="/personel">
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
                {isSubmitting ? 'Kaydediliyor...' : success ? 'Kaydedildi!' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default YeniPersonel;