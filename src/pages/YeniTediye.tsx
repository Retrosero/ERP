import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign, Building2, Receipt, Loader2 } from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { thirdPartyApi, invoiceApi, paymentApi } from '@/lib/dolibarr';
import type { ThirdParty, Invoice, CreatePaymentDto } from '@/lib/types/dolibarr';

export default function YeniTediye() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<ThirdParty[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<Invoice[]>([]);
  const [formData, setFormData] = useState({
    supplierId: '',
    amount: '',
    currency: 'TRY',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'VIR',
    referenceType: 'purchase_invoice',
    referenceId: '',
    description: '',
    notes: '',
  });

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supplierData = await thirdPartyApi.list({ limit: 100, mode: 'supplier' });
      setSuppliers(supplierData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Fetch supplier invoices when supplier is selected
  useEffect(() => {
    if (formData.supplierId) {
      invoiceApi.list({ thirdparty_id: parseInt(formData.supplierId), limit: 50 })
        .then((invoices) => {
          // Filter for supplier invoices (type: 1) that are not fully paid
          const supplierInvoicesList = invoices.filter(
            (inv) => inv.type === 1 && (inv.total_ttc - (inv.total_paye || 0)) > 0
          );
          setSupplierInvoices(supplierInvoicesList);
        })
        .catch(console.error);
    } else {
      setSupplierInvoices([]);
    }
  }, [formData.supplierId]);

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      alert('Lütfen bir tedarikçi seçin');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Lütfen geçerli bir tutar girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Dolibarr supplier payment creation
      const paymentData: CreatePaymentDto = {
        datep: Math.floor(new Date(formData.date).getTime() / 1000),
        payment_type: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        fk_soc: parseInt(formData.supplierId),
        fk_invoice: formData.referenceId ? parseInt(formData.referenceId) : undefined,
        note: formData.description || formData.notes,
      };

      await paymentApi.create(paymentData);

      alert('Tediye (Ödeme) başarıyla kaydedildi');
      navigate('/tahsilatlar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme kaydedilirken hata oluştu');
      console.error('Payment create error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
        <p className="text-gray-500">Veriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/tahsilatlar')}
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tahsilatlara Dön
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Yeni Tediye (Ödeme)</h1>
        <p className="text-sm text-gray-500 mt-1">Tedarikçiye yapılan ödeme kaydı oluşturun</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Tedarikçi Bilgisi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tedarikçi Seçimi <span className="text-danger">*</span>
              </label>
              <Select
                name="supplierId"
                value={formData.supplierId}
                onChange={(value) => handleSelectChange('supplierId', value)}
                options={suppliers.map((s) => ({
                  value: String(s.id),
                  label: s.name,
                }))}
                placeholder="Tedarikçi seçin"
              />
            </div>
            {supplierInvoices.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ödenecek Fatura (Opsiyonel)
                </label>
                <Select
                  name="referenceId"
                  value={formData.referenceId}
                  onChange={(value) => handleSelectChange('referenceId', value)}
                  options={[
                    { value: '', label: 'Fatura seçilmedi (serbest ödeme)' },
                    ...supplierInvoices.map((inv) => ({
                      value: String(inv.id),
                      label: `${inv.ref} - ${formatCurrency(inv.total_ttc - (inv.total_paye || 0))} borçlu`,
                    })),
                  ]}
                  placeholder="Fatura seçin"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Payment Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Ödeme Bilgileri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tutar <span className="text-danger">*</span>
              </label>
              <Input
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ödeme Tarihi <span className="text-danger">*</span>
              </label>
              <Input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ödeme Yöntemi <span className="text-danger">*</span>
              </label>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={(value) => handleSelectChange('paymentMethod', value)}
                options={[
                  { value: 'LIQ', label: 'Nakit' },
                  { value: 'VIR', label: 'Banka Havalesi' },
                  { value: 'CB', label: 'Kredi Kartı' },
                  { value: 'CHQ', label: 'Çek' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Açıklama</h2>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ödeme açıklaması..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
          />
        </Card>

        {/* Notes */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notlar</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Ödeme hakkında notlar..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/tahsilatlar')}
          >
            İptal
          </Button>
          <Button type="submit" loading={loading}>
            <Receipt className="w-4 h-4" />
            Ödeme Kaydet
          </Button>
        </div>
      </form>
    </div>
  );
}