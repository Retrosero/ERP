import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Building2, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, Button, Input, Select, Alert } from '@/components/ui';
import { thirdPartyApi } from '@/lib/dolibarr';
import type { CreateThirdPartyDto } from '@/lib/types/dolibarr';

export default function YeniMusteri() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'company', // individual or company
    // Individual fields
    firstName: '',
    lastName: '',
    // Company fields
    companyName: '',
    taxNumber: '',
    // Common fields
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Turkey',
    // Additional
    paymentTerms: '30',
    creditLimit: '',
    notes: '',
    status: '1', // 1 = active customer
  });

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare thirdparty data for Dolibarr API
      const thirdpartyData: CreateThirdPartyDto = {
        name: formData.type === 'company' ? formData.companyName : `${formData.firstName} ${formData.lastName}`.trim(),
        client: parseInt(formData.status), // 1 = customer, 2 = supplier, 3 = both
        supplier: 0,
        address: formData.address,
        zip: formData.postalCode,
        town: formData.city,
        country_id: 215, // Turkey
        phone: formData.phone,
        email: formData.email,
        idprof1: formData.taxNumber, // Tax ID / Vergi Numarası
        note_public: formData.notes,
        // Payment terms
        cond_reglement: parseInt(formData.paymentTerms) || 30,
        // Credit limit
        capital: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      };

      // Create thirdparty via Dolibarr API
      await thirdPartyApi.create(thirdpartyData as Parameters<typeof thirdPartyApi.create>[0]);

      alert('Müşteri başarıyla oluşturuldu');
      navigate('/musteriler');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Müşteri oluşturulurken hata oluştu');
      console.error('Customer create error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/musteriler')}
            className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Müşterilere Dön
          </Button>
          <h1 className="page-title">Yeni Müşteri Ekle</h1>
          <p className="page-subtitle">Sisteme yeni bir müşteri ekleyin (Dolibarr'a kaydedilecek)</p>
        </div>

        {error && (
          <Alert type="error" title="Hata">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Type */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Tipi</h2>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="individual"
                  checked={formData.type === 'individual'}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium">Bireysel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="company"
                  checked={formData.type === 'company'}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium">Kurumsal</span>
              </label>
            </div>
          </Card>

          {/* Personal/Company Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {formData.type === 'individual' ? 'Kişisel Bilgiler' : 'Kurumsal Bilgiler'}
            </h2>

            {formData.type === 'individual' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Ad"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soyad <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Soyad"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firma Adı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Firma adı"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vergi Numarası
                  </label>
                  <Input
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleChange}
                    placeholder="Vergi numarası"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Contact Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              İletişim Bilgileri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ornek@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0212 555 1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobil
                </label>
                <Input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="0532 555 1234"
                />
              </div>
            </div>
          </Card>

          {/* Address */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Adres Bilgileri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Tam adres..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir
                </label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="İstanbul"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İlçe
                </label>
                <Input
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Kadıköy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posta Kodu
                </label>
                <Input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="34000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ülke
                </label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Turkey"
                />
              </div>
            </div>
          </Card>

          {/* Financial Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Ticari Bilgiler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ödeme Vadesi (gün)
                </label>
                <Select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(value) => handleSelectChange('paymentTerms', value)}
                  options={[
                    { value: '0', label: 'Peşin' },
                    { value: '15', label: '15 gün' },
                    { value: '30', label: '30 gün' },
                    { value: '45', label: '45 gün' },
                    { value: '60', label: '60 gün' },
                    { value: '90', label: '90 gün' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kredi Limiti
                </label>
                <Input
                  name="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notlar</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Müşteri hakkında notlar..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/musteriler')}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Kaydet
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}