import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Package, Hash, Tag, DollarSign,
  AlertTriangle, Archive, History, Image, Copy, Share2, Loader2
} from 'lucide-react';
import { Card, Button, Badge, StatCard, Alert } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { productApi, stockApi } from '@/lib/dolibarr';
import type { Product, StockMovement } from '@/lib/types/dolibarr';

/*
// Mock product data - for testing only
const mockProduct = {
  id: 1,
  ref: 'URN-001',
  barcode: '8691234567890',
  label: 'Oyuncak Araba Model X',
  description: 'Uzaktan kumandalı Oyuncak Araba, 1:18 ölçek, yüksek kalite plastik gövde',
  category: 'Oyuncak',
  categoryId: 'toy',
  unit: 'adet',
  purchasePrice: 150,
  salePrice: 299,
  vatRate: 18,
  stock: 45,
  minStock: 10,
  location: 'A-01-05',
  status: 'active',
  createdAt: '2024-01-15',
  updatedAt: '2024-01-18',
  image: null,
  supplier: 'ABC Toy Corp',
};

const mockStockHistory = [
  { id: 1, type: 'in', quantity: 50, date: '2024-01-15', note: 'İlk alış' },
  { id: 2, type: 'out', quantity: 5, date: '2024-01-16', note: 'Sipariş #102' },
  { id: 3, type: 'out', quantity: 2, date: '2024-01-17', note: 'Sipariş #105' },
  { id: 4, type: 'out', quantity: 3, date: '2024-01-18', note: 'Sipariş #108' },
];

const mockPriceHistory = [
  { id: 1, purchasePrice: 120, salePrice: 249, date: '2024-01-10', note: 'İlk fiyat' },
  { id: 2, purchasePrice: 140, salePrice: 279, date: '2024-01-12', note: 'Fiyat güncelleme' },
  { id: 3, purchasePrice: 150, salePrice: 299, date: '2024-01-15', note: 'Son fiyat güncelleme' },
];
*/

interface ProductDisplay extends Product {
  stockHistory: StockMovement[];
}

export default function UrunDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'stock' | 'price'>('info');
  const [product, setProduct] = useState<Product | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const productId = parseInt(id);
      const [productData, stockData] = await Promise.all([
        productApi.get(productId),
        stockApi.listMovements({ product_id: productId, limit: 20, sortfield: 'datem', sortorder: 'DESC' }).catch(() => []),
      ]);
      setProduct(productData);
      setStockMovements(stockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ürün yüklenirken hata oluştu');
      console.error('Product fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
        <p className="text-gray-500">Ürün bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <Alert type="error" title="Hata">
        {error || 'Ürün bulunamadı'}
        <Button variant="secondary" onClick={() => navigate('/urunler')} className="mt-4">
          Ürünlere Dön
        </Button>
      </Alert>
    );
  }

  const isLowStock = (product.stock_reel || 0) <= (product.seuil_stock_alerte || 0);

  return (
    <div className="animate-fadeIn">
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{product.label}</h1>
                <Badge variant={product.status !== undefined ? 'success' : 'warning'}>
                  {product.status !== undefined ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Ref: {product.ref} • Kategori: {product.fk_category || '-'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/urunler/${id}/duzenle`)}>
              <Edit className="w-4 h-4" />
              Düzenle
            </Button>
            <Button variant="secondary">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Mevcut Stok"
          value={product.stock_reel ?? 0}
          iconColor={isLowStock ? 'text-red-600' : 'text-primary'}
          iconBgColor={isLowStock ? 'bg-red-100' : 'bg-blue-100'}
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Satış Fiyatı"
          value={formatCurrency(product.price || 0)}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Min. Stok"
          value={product.seuil_stock_alerte ?? 0}
        />
        <StatCard
          icon={<Hash className="w-5 h-5" />}
          label="Barkod"
          value={product.barcode || '-'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Bilgiler
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stock'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Stok Hareketleri
        </button>
        <button
          onClick={() => setActiveTab('price')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'price'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Fiyat Geçmişi
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Ürün Bilgileri</h3>
            <dl className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Referans</dt>
                <dd className="text-sm font-medium">{product.ref}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Barkod</dt>
                <dd className="text-sm font-medium">{product.barcode || '-'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Tür</dt>
                <dd className="text-sm font-medium">{product.type === 1 ? 'Hizmet' : 'Ürün'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Birim</dt>
                <dd className="text-sm font-medium">{product.unit_type || '-'}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sm text-gray-500">Min. Stok Uyarısı</dt>
                <dd className="text-sm font-medium">{product.seuil_stock_alerte ?? '-'}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Fiyat Bilgileri</h3>
            <dl className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Alış Fiyatı</dt>
                <dd className="text-sm font-medium text-green-600">
                  {formatCurrency(product.cost_price || 0)}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Satış Fiyatı</dt>
                <dd className="text-sm font-medium text-primary">
                  {formatCurrency(product.price || 0)}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">KDV Oranı</dt>
                <dd className="text-sm font-medium">%{product.tva_tx || 0}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sm text-gray-500">En Düşük Fiyat</dt>
                <dd className="text-sm font-medium">
                  {formatCurrency(product.price_min || 0)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Açıklama</h3>
            <p className="text-sm text-gray-600">{product.description || product.descr || '-'}</p>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Kayıt Bilgileri</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-gray-400">Oluşturulma Tarihi</dt>
                <dd className="text-sm font-medium">{product.date_creation ? formatDate(product.date_creation as string) : '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Son Güncelleme</dt>
                <dd className="text-sm font-medium">{product.tms ? formatDate(product.tms as string) : '-'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {activeTab === 'stock' && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Stok Hareketleri</h3>
          {stockMovements.length === 0 ? (
            <p className="text-gray-500 text-sm">Stok hareketi bulunamadı</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="pb-3">Tarih</th>
                    <th className="pb-3">İşlem</th>
                    <th className="pb-3 text-right">Miktar</th>
                    <th className="pb-3">Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stockMovements.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 text-sm">{item.datem ? formatDate(new Date(item.datem * 1000).toISOString()) : '-'}</td>
                      <td className="py-3">
                        <Badge variant={item.type_movement === 1 ? 'success' : 'danger'}>
                          {item.type_movement === 1 ? 'Giriş' : item.type_movement === 2 ? 'Çıkış' : 'Transfer'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium">
                        <span className={item.type_movement === 1 ? 'text-green-600' : 'text-red-600'}>
                          {item.type_movement === 1 ? '+' : '-'}{item.qty || 0}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">{item.label || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'price' && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Fiyat Bilgileri</h3>
          <div className="text-center py-8 text-gray-500">
            <p>Fiyat geçmişi için Dolibarr fiyat geçmişi modülünü kullanın.</p>
            <p className="text-sm mt-2">Mevcut satış fiyatı: {formatCurrency(product.price || 0)}</p>
            <p className="text-sm">Alış fiyatı: {formatCurrency(product.cost_price || 0)}</p>
          </div>
        </Card>
      )}
    </div>
  );
}