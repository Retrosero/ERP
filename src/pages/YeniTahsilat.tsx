import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, User, Receipt, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, Button, Input, Select, Alert } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { paymentApi, thirdPartyApi, invoiceApi } from '@/lib/dolibarr';
import type { ThirdParty, Invoice } from '@/lib/types/dolibarr';

export default function YeniTahsilat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<ThirdParty[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    currency: 'TRY',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    referenceType: 'invoice',
    referenceId: '',
    referenceNumber: '',
    description: '',
    notes: '',
  });

  // Fetch customers and unpaid invoices from Dolibarr
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [customerData, invoiceData] = await Promise.all([
        thirdPartyApi.list({ limit: 100, mode: 'customer' }),
        invoiceApi.list({ limit: 50 }),
      ]);
      setCustomers(customerData);
      // Filter unpaid invoices
      const unpaidInvoices = invoiceData.filter(inv => inv.status !== 2 && inv.remain_to_pay > 0);
      setInvoices(unpaidInvoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert('Lütfen bir müşteri seçin');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Lütfen geçerli bir tutar girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare payment data for Dolibarr API
      const paymentData: Record<string, unknown> = {
        timestamp: Math.floor(new Date(formData.date).getTime() / 1000),
        payment_type: formData.paymentMethod === 'CASH' ? 'LIQ' : 'VIR',
        num_payment: formData.referenceNumber || undefined,
        label: formData.description || 'Tahsilat',
        amount: parseFloat(formData.amount),
        datep: Math.floor(new Date(formData.date).getTime() / 1000),
        note: formData.notes,
      };

      // If invoice is selected, link payment to invoice
      if (formData.referenceId) {
        paymentData.facture = parseInt(formData.referenceId);
      }

      // Create payment via Dolibarr API
      await paymentApi.create(paymentData as Parameters<typeof paymentApi.create>[0]);

      alert('Tahsilat başarıyla kaydedildi');
      navigate('/tahsilatlar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tahsilat kaydedilirken hata oluştu');
      console.error('Payment create error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get customer invoices
  const customerInvoices = formData.customerId
    ? invoices.filter(inv => inv.socid === parseInt(formData.customerId))
    : [];

  const paymentMethodOptions = [
    { value: 'CASH', label: 'Nakit' },
    { value: 'CHQ', label: 'Çek' },
    { value: 'VIR', label: 'Banka Havalesi' },
    { value: 'CB', label: 'Kredi Kartı' },
    { value: 'LIQ', label: 'Kredi Kartı (Liquidity)' },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <p className="text-gray-500">Müşteri ve faturalar yükleniyor...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
          <h1 className="page-title">Yeni Tahsilat</h1>
          <p className="page-subtitle">Müşteriden tahsilat kaydı oluşturun (Dolibarr'a kaydedilecek)</p>
        </div>

        {error && (
          <Alert type="error" title="Hata">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Müşteri Bilgisi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Müşteri Seçimi <span className="text-red-500">*</span>
                </label>
                <Select
                  name="customerId"
                  value={formData.customerId}
                  onChange={(value) => {
                    handleSelectChange('customerId', value);
                    handleSelectChange('referenceId', ''); // Reset invoice
                  }}
                  options={[
                    { value: '', label: 'Müşteri seçin...' },
                    ...customers.map(c => ({
                      value: String(c.id),
                      label: c.name || 'İsimsiz Müşteri',
                    })),
                  ]}
                  placeholder="Müşteri seçin"
                />
              </div>

              {customerInvoices.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açık Faturalar (Tahsilat Bağlantısı)
                  </label>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                    {customerInvoices.map((invoice) => (
                      <label key={invoice.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="referenceId"
                          value={String(invoice.id)}
                          checked={formData.referenceId === String(invoice.id)}
                          onChange={(e) => {
                            handleChange(e);
                            handleSelectChange('amount', String(invoice.remain_to_pay || invoice.total_ttc || 0));
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <div className="flex-1 flex justify-between">
                          <span className="text-sm font-medium">{invoice.ref || `Fatura #${invoice.id}`}</span>
                          <span className="text-sm text-gray-500">
                            Kalan: {formatCurrency(invoice.remain_to_pay || 0)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
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
                  Tutar <span className="text-red-500">*</span>
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
                  Tarih <span className="text-red-500">*</span>
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
                  Ödeme Yöntemi <span className="text-red-500">*</span>
                </label>
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(value) => handleSelectChange('paymentMethod', value)}
                  options={paymentMethodOptions}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tahsilat açıklaması"
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
              placeholder="Tahsilat hakkında notlar..."
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
              Tahsilat Kaydet
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}