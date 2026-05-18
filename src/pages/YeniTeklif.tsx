import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, FileText, Send,
  Package, Building2, Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, Button, Input, Select, Alert } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { proposalApi, thirdPartyApi, productApi } from '@/lib/dolibarr';
import type { ThirdParty, Product } from '@/lib/types/dolibarr';

interface ProposalItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export default function YeniTeklif() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: '30',
    notes: '',
  });

  const [items, setItems] = useState<ProposalItem[]>([
    { id: '1', productId: 0, productName: '', quantity: 1, unitPrice: 0, vatRate: 18, total: 0 },
  ]);

  const [customers, setCustomers] = useState<ThirdParty[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers and products from Dolibarr
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [customerData, productData] = await Promise.all([
        thirdPartyApi.list({ limit: 100, mode: 'customer' }),
        productApi.list({ limit: 100 }),
      ]);
      setCustomers(customerData);
      setProducts(productData);
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

  const addItem = () => {
    setItems([
      ...items,
      { id: String(Date.now()), productId: 0, productName: '', quantity: 1, unitPrice: 0, vatRate: 18, total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof ProposalItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            const qty = field === 'quantity' ? (value as number) : item.quantity;
            const price = field === 'unitPrice' ? (value as number) : item.unitPrice;
            updated.total = qty * price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleProductSelect = (id: string, productId: string) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      setItems(
        items.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              productId: product.id || 0,
              productName: product.label || '',
              unitPrice: product.price || 0,
              total: item.quantity * (product.price || 0),
            };
          }
          return item;
        })
      );
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = items.reduce((sum, item) => sum + (item.total * item.vatRate) / 100, 0);
  const total = subtotal + vatAmount;

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!formData.customerId) {
      alert('Lütfen bir müşteri seçin');
      return;
    }

    const validItems = items.filter(item => item.productId > 0);
    if (validItems.length === 0) {
      alert('Lütfen en az bir ürün seçin');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare proposal data for Dolibarr API
      const proposalData = {
        soccid: parseInt(formData.customerId),
        date: Math.floor(new Date(formData.date).getTime() / 1000),
        date_lim_quota: Math.floor(new Date(formData.validUntil).getTime() / 1000),
        payment_rule_code: formData.paymentTerms,
        lines: validItems.map(item => ({
          fk_product: item.productId,
          qty: item.quantity,
          price: item.unitPrice,
          tva_tx: item.vatRate,
        })),
        note_public: formData.notes,
        // Draft status based on parameter
        status: asDraft ? 0 : 1,
      };

      // Create proposal via Dolibarr API
      await proposalApi.create(proposalData as Parameters<typeof proposalApi.create>[0]);

      alert(asDraft ? 'Teklif taslak olarak kaydedildi' : 'Teklif başarıyla oluşturuldu');
      navigate('/teklifler');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Teklif oluşturulurken hata oluştu');
      console.error('Proposal create error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const vatRateOptions = [
    { value: '0', label: 'KDV Yok' },
    { value: '1', label: '%1' },
    { value: '8', label: '%8' },
    { value: '18', label: '%18' },
    { value: '20', label: '%20' },
  ];

  const paymentTermOptions = [
    { value: '0', label: 'Peşin' },
    { value: '15', label: '15 gün' },
    { value: '30', label: '30 gün' },
    { value: '45', label: '45 gün' },
    { value: '60', label: '60 gün' },
    { value: '90', label: '90 gün' },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <p className="text-gray-500">Müşteri ve ürünler yükleniyor...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/teklifler')}
            className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tekliflere Dön
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Yeni Teklif</h1>
                <p className="text-sm text-gray-500">
                  Müşterilerinize teklif oluşturun (Dolibarr'a kaydedilecek)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
                <Save className="w-4 h-4" />
                Taslak Kaydet
              </Button>
              <Button variant="primary" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Gönder
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert type="error" title="Hata">
            {error}
          </Alert>
        )}

        {/* Customer & Date Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Müşteri ve Tarih Bilgileri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Müşteri Seçimi <span className="text-red-500">*</span>
              </label>
              <Select
                name="customerId"
                value={formData.customerId}
                onChange={(value) => handleSelectChange('customerId', value)}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teklif Tarihi <span className="text-red-500">*</span>
              </label>
              <Input
                name="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleSelectChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geçerlilik Tarihi <span className="text-red-500">*</span>
              </label>
              <Input
                name="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => handleSelectChange('validUntil', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ödeme Vadesi
              </label>
              <Select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={(value) => handleSelectChange('paymentTerms', value)}
                options={paymentTermOptions}
              />
            </div>
          </div>
        </Card>

        {/* Proposal Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Teklif Kalemleri
            </h2>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4" />
              Kalem Ekle
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-1/3">Ürün / Hizmet</th>
                  <th className="px-4 py-3 w-16 text-right">Miktar</th>
                  <th className="px-4 py-3 w-28 text-right">Birim Fiyat</th>
                  <th className="px-4 py-3 w-24 text-right">KDV</th>
                  <th className="px-4 py-3 w-28 text-right">Toplam</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Select
                        value={item.productId ? String(item.productId) : ''}
                        onChange={(value) => handleProductSelect(item.id, value)}
                        options={[
                          { value: '', label: 'Ürün seçin...' },
                          ...products.map(p => ({
                            value: String(p.id),
                            label: `${p.label || 'İsimsiz Ürün'} - ${p.price ? formatCurrency(p.price) : '-'}`,
                          })),
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="text-right"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={String(item.vatRate)}
                        onChange={(value) => handleItemChange(item.id, 'vatRate', parseFloat(value))}
                        options={vatRateOptions}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ara Toplam</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">KDV</span>
                  <span className="font-medium">{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 text-lg">
                  <span className="font-semibold">Genel Toplam</span>
                  <span className="font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notlar ve Açıklamalar</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={(e) => handleSelectChange('notes', e.target.value)}
            placeholder="Teklife ait notlar, özel şartlar veya açıklamalar..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={4}
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <span className="text-red-500">*</span> ile işaretli alanlar zorunludur
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/teklifler')}>
              İptal
            </Button>
            <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              <Save className="w-4 h-4" />
              Taslak Kaydet
            </Button>
            <Button variant="primary" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Gönder
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}