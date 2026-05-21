/**
 * Barkod Tarama Sayfası
 * Ürün arama, stok sorgulama ve hızlı satış için barkod tarama
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Plus,
  History,
  Settings,
  Camera,
  Barcode,
  QrCode,
  ScanBarcode,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShoppingCart,
  Edit,
  Eye,
  X,
} from 'lucide-react';
import { Card, Button, Input, Badge, Alert, Modal } from '@/components/ui';
import { BarcodeScanner, BarcodeInput } from '@/components/ui/BarcodeScanner';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { productApi, stockApi, warehouseApi } from '@/lib/dolibarr';
import type { Product, StockMovement } from '@/lib/types/dolibarr';

interface ScannedProduct {
  product: Product;
  stockInfo?: {
    warehouse_id: number;
    stock: number;
    stock_reel: number;
  }[];
  lastScanTime: Date;
}

export default function BarkodTarama() {
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<'scan' | 'manual'>('scan');
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [recentScans, setRecentScans] = useState<ScannedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickSaleMode, setQuickSaleMode] = useState(false);
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Barcode scan callback
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setIsLoading(true);
    setError(null);
    setScannerOpen(false);

    try {
      // Find product by barcode
      const products = await productApi.list({ limit: 100 });
      const product = products.find(p => p.barcode === barcode);

      if (!product) {
        setError(`Barkod "${barcode}" ile ürün bulunamadı.`);
        return;
      }

      // Get stock info
      let stockInfo: ScannedProduct['stockInfo'] = undefined;
      try {
        stockInfo = await productApi.getStock(product.id);
      } catch {
        // Stock info not available
      }

      const scanned: ScannedProduct = {
        product,
        stockInfo,
        lastScanTime: new Date(),
      };

      setScannedProduct(scanned);
      setRecentScans(prev => [scanned, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ürün aranırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual search
  const handleManualSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const products = await productApi.list({ limit: 50 });
      const product = products.find(
        p => p.ref.toLowerCase().includes(query.toLowerCase()) ||
             p.label.toLowerCase().includes(query.toLowerCase()) ||
             p.barcode === query
      );

      if (!product) {
        setError(`"${query}" ile ürün bulunamadı.`);
        return;
      }

      let stockInfo: ScannedProduct['stockInfo'] = undefined;
      try {
        stockInfo = await productApi.getStock(product.id);
      } catch {
        // Stock info not available
      }

      const scanned: ScannedProduct = {
        product,
        stockInfo,
        lastScanTime: new Date(),
      };

      setScannedProduct(scanned);
      setRecentScans(prev => [scanned, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ürün aranırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add to cart
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  // Update cart quantity
  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, qty } : item
        )
      );
    }
  };

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price_ttc || 0) * item.qty, 0);

  // Clear scanned product
  const clearScannedProduct = () => {
    setScannedProduct(null);
    setError(null);
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <ScanBarcode className="w-5 h-5 text-white" />
            </div>
            Barkod Tarama
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ürün aramak veya stok sorgulamak için barkod tarayın
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={quickSaleMode ? 'primary' : 'secondary'}
            onClick={() => setQuickSaleMode(!quickSaleMode)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Hızlı Satış
            {cart.length > 0 && (
              <Badge variant="danger" className="ml-2">{cart.length}</Badge>
            )}
          </Button>
          <Button variant="ghost" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Sale Cart */}
      {quickSaleMode && cart.length > 0 && (
        <Card className="mb-6 bg-teal-50 border-teal-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-teal-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Satış Sepeti
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setCart([])}>
              Temizle
            </Button>
          </div>
          <div className="space-y-2 mb-4">
            {cart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{item.product.label}</p>
                  <p className="text-sm text-slate-500">{formatCurrency(item.product.price_ttc || 0)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{item.qty}</span>
                  <button
                    onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-teal-200">
            <div>
              <p className="text-sm text-teal-700">Toplam</p>
              <p className="text-2xl font-bold text-teal-900">{formatCurrency(cartTotal)}</p>
            </div>
            <Button onClick={() => navigate('/siparisler/yeni', { state: { cart } })}>
              Sipariş Oluştur
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert
          type="warning"
          title="Ürün Bulunamadı"
          onClose={() => setError(null)}
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Section */}
        <div className="space-y-4">
          {/* Search Mode Toggle */}
          <Card padding="sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchMode('scan')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all',
                  searchMode === 'scan'
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <Camera className="w-5 h-5" />
                Kamera ile Tara
              </button>
              <button
                onClick={() => setSearchMode('manual')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all',
                  searchMode === 'manual'
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <Barcode className="w-5 h-5" />
                Manuel Ara
              </button>
            </div>
          </Card>

          {/* Manual Search Input */}
          {searchMode === 'manual' && (
            <Card>
              <BarcodeInput
                onSubmit={handleManualSearch}
                onScan={() => setSearchMode('scan')}
                placeholder="Barkod veya ürün adı girin..."
              />
            </Card>
          )}

          {/* Camera Scanner */}
          {searchMode === 'scan' && (
            <Card>
              {!scannerOpen ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
                    <ScanBarcode className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Kamerayı Aç</h3>
                  <p className="text-sm text-slate-500 text-center mb-4">
                    Ürün barkodunu taramak için kamerayı kullanın
                  </p>
                  <Button onClick={() => setScannerOpen(true)}>
                    <Camera className="w-4 h-4 mr-2" />
                    Tarayıcıyı Aç
                  </Button>
                </div>
              ) : (
                <BarcodeScanner
                  onScan={handleBarcodeScan}
                  onClose={() => setScannerOpen(false)}
                  showResult={true}
                />
              )}
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card>
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500 mr-3" />
                <p className="text-slate-500">Ürün aranıyor...</p>
              </div>
            </Card>
          )}
        </div>

        {/* Product Info Section */}
        <div className="space-y-4">
          {scannedProduct ? (
            <>
              {/* Product Card */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{scannedProduct.product.label}</h3>
                      <p className="text-sm text-slate-500">{scannedProduct.product.ref}</p>
                      {scannedProduct.product.barcode && (
                        <Badge variant="info" className="mt-1">
                          <Barcode className="w-3 h-3 mr-1" />
                          {scannedProduct.product.barcode}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={clearScannedProduct}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Price Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Fiyat (KDV Dahil)</p>
                    <p className="text-xl font-bold text-teal-600">
                      {formatCurrency(scannedProduct.product.price_ttc || 0)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">KDV'siz Fiyat</p>
                    <p className="text-xl font-bold text-slate-700">
                      {formatCurrency(scannedProduct.product.price || 0)}
                    </p>
                  </div>
                </div>

                {/* Stock Info */}
                {scannedProduct.stockInfo && scannedProduct.stockInfo.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Stok Durumu</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {scannedProduct.stockInfo.map((stock, index) => (
                        <div key={index} className="bg-slate-50 rounded-lg p-2">
                          <p className="text-xs text-slate-500">Depo {stock.warehouse_id}</p>
                          <p className="font-semibold text-slate-900">{stock.stock_reel || 0}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">
                      Toplam Stok: <span className="font-semibold text-slate-900">{scannedProduct.product.stock_reel || 0}</span>
                    </p>
                    {scannedProduct.product.seuil_stock_alerte && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Kritik stok seviyesi: {scannedProduct.product.seuil_stock_alerte}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/urunler/${scannedProduct.product.id}`)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Detay
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/urunler/${scannedProduct.product.id}/duzenle`)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Düzenle
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleAddToCart(scannedProduct.product)}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Sepete Ekle
                  </Button>
                </div>
              </Card>

              {/* Product Description */}
              {scannedProduct.product.description && (
                <Card>
                  <h4 className="font-medium text-slate-700 mb-2">Açıklama</h4>
                  <p className="text-sm text-slate-500">{scannedProduct.product.description}</p>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Barcode className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Ürün Seçilmedi</h3>
                <p className="text-sm text-slate-500">
                  Barkod tarayarak veya manuel arama yaparak ürün seçin
                </p>
              </div>
            </Card>
          )}

          {/* Recent Scans */}
          {recentScans.length > 0 && !scannedProduct && (
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Son Tarama Geçmişi
              </h3>
              <div className="space-y-2">
                {recentScans.map((scan, index) => (
                  <button
                    key={`${scan.product.id}-${index}`}
                    onClick={() => setScannedProduct(scan)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{scan.product.label}</p>
                      <p className="text-sm text-slate-500">{scan.product.ref}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-teal-600">{formatCurrency(scan.product.price_ttc || 0)}</p>
                      <p className="text-xs text-slate-400">{formatDate(scan.lastScanTime.toISOString())}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Tarayıcı Ayarları"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Tarama Formatları</label>
            <div className="grid grid-cols-2 gap-2">
              {['EAN-13', 'EAN-8', 'UPC-A', 'Code 128', 'Code 39', 'QR Code'].map(format => (
                <div key={format} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  <span className="text-sm">{format}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Sesli Uyarı</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-teal-500 focus:ring-teal-500" />
              <span className="text-sm">Barkod başarıyla tarandığında ses çal</span>
            </label>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Vibrate</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-teal-500 focus:ring-teal-500" />
              <span className="text-sm">Tarama başarılı olduğunda titreşim</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowSettings(false)}>
            Kapat
          </Button>
        </div>
      </Modal>
    </div>
  );
}