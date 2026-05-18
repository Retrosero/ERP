import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Package, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { productApi, warehouseApi } from '@/lib/dolibarr';
import type { CreateProductDto, Warehouse } from '@/lib/types/dolibarr';

export default function YeniUrun() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState({
    ref: '',
    barcode: '',
    label: '',
    description: '',
    category: '',
    unit: 'UNIT',
    purchasePrice: '',
    salePrice: '',
    vatRate: '18',
    minStock: '10',
    stock: '',
    location: '',
    status: '1', // 1 = active
    tosell: '1', // for sale
    tobuy: '1', // for purchase
  });

  // Fetch warehouses on mount
  useEffect(() => {
    warehouseApi.list().then(setWarehouses).catch(console.error);
  }, []);

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
      // Prepare product data for Dolibarr API
      const productData: CreateProductDto = {
        ref: formData.ref || undefined,
        label: formData.label,
        description: formData.description || undefined,
        type: 0, // product (not service)
        price: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        price_ttc: formData.salePrice ? parseFloat(formData.salePrice) * (1 + parseFloat(formData.vatRate) / 100) : undefined,
        barcode: formData.barcode || undefined,
        tva_tx: parseFloat(formData.vatRate),
        cost_price: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        tosell: parseInt(formData.tosell),
        tobuy: parseInt(formData.tobuy),
        seuil_stock_alerte: formData.minStock ? parseInt(formData.minStock) : undefined,
      };

      // Create product via Dolibarr API
      await productApi.create(productData);

      alert('Ürün başarıyla oluşturuldu');
      navigate('/urunler');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ürün oluşturulurken hata oluştu');
      console.error('Product create error:', err);
    } finally {
      setLoading(false);
    }
  };

  const vatRates = [
    { value: '0', label: '%0' },
    { value: '1', label: '%1' },
    { value: '8', label: '%8' },
    { value: '18', label: '%18' },
    { value: '20', label: '%20' },
  ];

  const statusOptions = [
    { value: '1', label: 'Aktif' },
    { value: '0', label: 'Pasif' },
  ];

  const tosellOptions = [
    { value: '1', label: 'Evet' },
    { value: '0', label: 'Hayır' },
  ];

  const tobuyOptions = [
    { value: '1', label: 'Evet' },
    { value: '0', label: 'Hayır' },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/urunler')}
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ürünlere Dön
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Yeni Ürün Ekle</h1>
        <p className="text-sm text-gray-500 mt-1">Sisteme yeni bir ürün ekleyin</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Temel Bilgiler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Referansı
              </label>
              <Input
                name="ref"
                value={formData.ref}
                onChange={handleChange}
                placeholder="URN-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barkod
              </label>
              <Input
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="barkod numarası"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Adı <span className="text-danger">*</span>
              </label>
              <Input
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="Ürün adını girin"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ürün açıklaması..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Satışta
              </label>
              <Select
                name="tosell"
                value={formData.tosell}
                onChange={(value) => handleSelectChange('tosell', value)}
                options={tosellOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alışta
              </label>
              <Select
                name="tobuy"
                value={formData.tobuy}
                onChange={(value) => handleSelectChange('tobuy', value)}
                options={tobuyOptions}
              />
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Fiyat Bilgileri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alış Fiyatı
              </label>
              <Input
                name="purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Satış Fiyatı <span className="text-danger">*</span>
              </label>
              <Input
                name="salePrice"
                type="number"
                value={formData.salePrice}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KDV Oranı
              </label>
              <Select
                name="vatRate"
                value={formData.vatRate}
                onChange={(value) => handleSelectChange('vatRate', value)}
                options={vatRates}
              />
            </div>
          </div>
        </Card>

        {/* Stock */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Stok Bilgileri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stok (Uyarı)
              </label>
              <Input
                name="minStock"
                type="number"
                value={formData.minStock}
                onChange={handleChange}
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durum
              </label>
              <Select
                name="status"
                value={formData.status}
                onChange={(value) => handleSelectChange('status', value)}
                options={statusOptions}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/urunler')}
          >
            İptal
          </Button>
          <Button type="submit" loading={loading}>
            <Save className="w-4 h-4" />
            Kaydet
          </Button>
        </div>
      </form>
    </div>
  );
}