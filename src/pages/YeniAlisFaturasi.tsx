import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2, FileText, Package, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { thirdPartyApi, productApi, invoiceApi } from '@/lib/dolibarr';
import type { ThirdParty, Product } from '@/lib/types/dolibarr';

interface InvoiceItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export default function YeniAlisFaturasi() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<ThirdParty[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    supplierId: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentMethod: 'bank_transfer',
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', productId: 0, productName: '', quantity: 1, unitPrice: 0, vatRate: 18, total: 0 }
  ]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [supplierData, productData] = await Promise.all([
        thirdPartyApi.list({ limit: 100, mode: 'supplier' }),
        productApi.list({ limit: 100 }),
      ]);
      setSuppliers(supplierData);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: String(Date.now()), productId: 0, productName: '', quantity: 1, unitPrice: 0, vatRate: 18, total: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
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
    const product = products.find((p) => p.id === parseInt(productId));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      alert('Lütfen bir tedarikçi seçin');
      return;
    }

    const validItems = items.filter((item) => item.productId > 0);
    if (validItems.length === 0) {
      alert('Lütfen en az bir ürün seçin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Dolibarr supplier invoice creation
      const invoiceData = {
        soccid: parseInt(formData.supplierId),
        date: Math.floor(new Date(formData.date).getTime() / 1000),
        date_lim_reglement: formData.dueDate
          ? Math.floor(new Date(formData.dueDate).getTime() / 1000)
          : undefined,
        type: 1, // 1 = supplier invoice
        lines: validItems.map((item) => ({
          fk_product: item.productId,
          qty: item.quantity,
          unitprice: item.unitPrice,
          tva_tx: item.vatRate,
        })),
        note_public: formData.notes,
      };

      await invoiceApi.create(invoiceData as Parameters<typeof invoiceApi.create>[0]);

      alert('Alış faturası başarıyla oluşturuldu');
      navigate('/faturalar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fatura oluşturulurken hata oluştu');
      console.error('Invoice create error:', err);
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
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/faturalar')}
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Faturalara Dön
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Yeni Alış Faturası</h1>
        <p className="text-sm text-gray-500 mt-1">Tedarikçiden alınan mal veya hizmet için fatura oluşturun</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Fatura Bilgileri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tedarikçi <span className="text-danger">*</span>
              </label>
              <Select
                name="supplierId"
                value={formData.supplierId}
                onChange={(value) => handleSelectChange('supplierId', value)}
                options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
                placeholder="Tedarikçi seçin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fatura Numarası
              </label>
              <Input
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                placeholder="FAT-2024-0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fatura Tarihi <span className="text-danger">*</span>
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
                Vade Tarihi
              </label>
              <Input
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ödeme Yöntemi
              </label>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={(value) => handleSelectChange('paymentMethod', value)}
                options={[
                  { value: 'LIQ', label: 'Nakit' },
                  { value: 'VIR', label: 'Banka Havalesi' },
                  { value: 'CB', label: 'Kredi Kartı' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Invoice Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Fatura Kalemleri
            </h2>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4" />
              Kalem Ekle
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                  <th className="pb-3 w-1/3">Ürün / Hizmet</th>
                  <th className="pb-3 w-20">Miktar</th>
                  <th className="pb-3 w-32">Birim Fiyat</th>
                  <th className="pb-3 w-24">KDV %</th>
                  <th className="pb-3 w-32 text-right">Toplam</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">
                      <Select
                        value={String(item.productId)}
                        onChange={(value) => handleProductSelect(item.id, value)}
                        options={products.map((p) => ({
                          value: String(p.id),
                          label: `${p.ref} - ${p.label}`,
                        }))}
                        placeholder="Ürün seçin"
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                        min={1}
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-2">
                      <Select
                        value={String(item.vatRate)}
                        onChange={(value) => handleItemChange(item.id, 'vatRate', Number(value))}
                        options={[
                          { value: '0', label: '%0' },
                          { value: '1', label: '%1' },
                          { value: '8', label: '%8' },
                          { value: '18', label: '%18' },
                          { value: '20', label: '%20' },
                        ]}
                      />
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(item.total * (1 + item.vatRate / 100))}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="py-3 text-sm font-medium text-right">Ara Toplam:</td>
                  <td className="py-3 text-sm text-right font-medium">{formatCurrency(subtotal)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-3 text-sm font-medium text-right">KDV:</td>
                  <td className="py-3 text-sm text-right font-medium">{formatCurrency(vatAmount)}</td>
                  <td></td>
                </tr>
                <tr className="border-t-2 border-primary">
                  <td colSpan={4} className="py-3 text-base font-bold text-right">Genel Toplam:</td>
                  <td className="py-3 text-base font-bold text-primary text-right">{formatCurrency(total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notlar</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Fatura notları..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/faturalar')}
          >
            İptal
          </Button>
          <Button type="submit" loading={loading}>
            <Save className="w-4 h-4" />
            Fatura Kaydet
          </Button>
        </div>
      </form>
    </div>
  );
}