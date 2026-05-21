import { useState, useRef, useEffect, useCallback } from 'react';
import { Printer, Download, Search, Package, Plus, X, Eye, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Input, Select, Modal, Alert } from '@/components/ui';
import { productApi } from '@/lib/dolibarr';
import type { Product } from '@/lib/types/dolibarr';

// Barkod format options
const barcodeFormats = [
  { value: 'ean13', label: 'EAN-13' },
  { value: 'code128', label: 'Code-128' },
  { value: 'qr', label: 'QR Code' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'upc', label: 'UPC' },
];

// Label size options
const labelSizes = [
  { value: '50x25', label: '50x25mm (Küçük)' },
  { value: '70x35', label: '70x35mm (Orta)' },
  { value: '100x50', label: '100x50mm (Büyük)' },
  { value: 'a4', label: 'A4 (Çoklu)' },
];

interface SelectedProduct {
  id: number;
  ref: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
}

const toSafePrice = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function BarkodBaski() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState('ean13');
  const [labelSize, setLabelSize] = useState('70x35');
  const [showPreview, setShowPreview] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<SelectedProduct | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch products from Dolibarr
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productApi.list({ limit: 100 });
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ürünler yüklenirken hata oluştu');
      console.error('Products fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products
  const filteredProducts = products.filter(product =>
    product.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  // Add product to selection
  const addProduct = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, {
        id: product.id,
        ref: product.ref || '',
        name: product.label || '',
        barcode: product.barcode || '',
        price: toSafePrice(product.price),
        quantity: 1,
      }]);
    }
  };

  // Remove product from selection
  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Update quantity
  const updateQuantity = (productId: number, quantity: number) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ));
  };

  // Print labels
  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barkod Etiketleri</title>
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 10mm;
                }
                .label-container {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 5mm;
                }
                .label {
                  border: 1px dashed #ccc;
                  padding: 5mm;
                  page-break-inside: avoid;
                  text-align: center;
                }
                .barcode {
                  font-family: 'Libre Barcode 128', monospace;
                  font-size: 48px;
                  margin: 10px 0;
                }
                .product-name {
                  font-size: 12px;
                  font-weight: bold;
                  margin: 5px 0;
                }
                .product-price {
                  font-size: 14px;
                  color: #2563eb;
                }
                .barcode-text {
                  font-size: 10px;
                  font-family: monospace;
                  letter-spacing: 2px;
                }
              }
              body {
                font-family: Arial, sans-serif;
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Print single label
  const handlePrintSingle = () => {
    if (!previewProduct) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barkod Etiketi</title>
            <style>
              @media print {
                @page {
                  size: 70mm 35mm;
                  margin: 0;
                }
              }
              body {
                margin: 0;
                padding: 0;
              }
              .label {
                width: 70mm;
                height: 35mm;
                padding: 2mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
              }
              .product-name {
                font-size: 10px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 2mm;
              }
              .barcode {
                font-family: 'Libre Barcode 128', monospace;
                font-size: 36px;
              }
              .barcode-text {
                font-size: 8px;
                font-family: monospace;
                letter-spacing: 1px;
                margin-top: 1mm;
              }
              .price {
                font-size: 12px;
                font-weight: bold;
                color: #2563eb;
                margin-top: 2mm;
              }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="product-name">${previewProduct.name}</div>
              <div class="barcode">${previewProduct.barcode}</div>
              <div class="barcode-text">${previewProduct.barcode}</div>
              <div class="price">${previewProduct.price.toFixed(2)} TL</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Barkod Etiket Baskısı</h1>
          <p className="page-subtitle">Ürünleriniz için barkodlu etiketler basın</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (selectedProducts.length > 0) {
                setPreviewProduct(selectedProducts[0]);
                setShowPreview(true);
              }
            }}
            disabled={selectedProducts.length === 0}
          >
            <Eye className="w-4 h-4" />
            Önizleme
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            disabled={selectedProducts.length === 0}
          >
            <Printer className="w-4 h-4" />
            Yazdır ({selectedProducts.length})
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert type="error" title="Hata" className="mb-6">
          {error}
          <p className="text-sm mt-1">Lütfen Dolibarr bağlantınızı kontrol edin.</p>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ürün Seçimi</CardTitle>
            </CardHeader>
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Ürün ara (ad, referans veya barkod)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-gray-500">Ürünler yükleniyor...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Arama sonucu bulunamadı' : 'Ürün bulunamadı'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Dolibarr'da ürünlerinizi kontrol edin.
                  </p>
                </div>
              ) : (
                /* Product List */
                <div className="max-h-80 overflow-y-auto border rounded-lg">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProducts.find(p => p.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-3 border-b last:border-b-0 ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.label || '-'}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{product.ref || '-'}</span>
                                <span>•</span>
                                <span className="font-mono">{product.barcode || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-primary">
                              {toSafePrice(product.price) > 0 ? `${toSafePrice(product.price).toFixed(2)} TL` : '-'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stok: {product.stock_reel ?? '-'}
                            </p>
                          </div>
                          <Button
                            variant={isSelected ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => isSelected ? removeProduct(product.id) : addProduct(product)}
                          >
                            {isSelected ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Settings & Selected Products */}
        <div className="space-y-6">
          {/* Print Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Baskı Ayarları</CardTitle>
            </CardHeader>
            <div className="p-4 space-y-4">
              <Select
                label="Barkod Formatı"
                value={barcodeFormat}
                onChange={(value) => setBarcodeFormat(value)}
                options={barcodeFormats}
              />
              <Select
                label="Etiket Boyutu"
                value={labelSize}
                onChange={(value) => setLabelSize(value)}
                options={labelSizes}
              />
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Tahmini etiket sayısı:</p>
                <p className="text-lg font-bold text-primary">
                  {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Bilgi:</strong> Barkod etiketleri Dolibarr'dan çekilen ürün bilgileriyle basılır.
                  Ürünlerin barkod tanımlaması yapılmış olmalıdır.
                </p>
              </div>
            </div>
          </Card>

          {/* Selected Products */}
          <Card>
            <CardHeader>
              <CardTitle>Seçili Ürünler ({selectedProducts.length})</CardTitle>
            </CardHeader>
            <div className="p-4">
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Henüz ürün seçilmedi</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{product.barcode || '-'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border rounded text-center text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="Etiket Önizleme"
        size="lg"
      >
        {previewProduct && (
          <div className="space-y-4">
            {/* Label Preview */}
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex flex-col items-center">
                <p className="text-sm font-bold text-center mb-2">{previewProduct.name}</p>
                <div className="barcode text-center my-2" style={{ fontFamily: 'monospace' }}>
                  {'|| || ||| | || ||| || | || ||| ||| | || || |'}
                </div>
                <p className="text-xs font-mono tracking-widest">{previewProduct.barcode || '-'}</p>
                <p className="text-lg font-bold text-primary mt-2">
                  {previewProduct.price > 0 ? `${previewProduct.price.toFixed(2)} TL` : '-'}
                </p>
              </div>
            </div>

            {/* Label Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ürün Referansı</p>
                <p className="font-mono">{previewProduct.ref}</p>
              </div>
              <div>
                <p className="text-gray-500">Format</p>
                <p className="font-medium">{barcodeFormats.find(f => f.value === barcodeFormat)?.label}</p>
              </div>
              <div>
                <p className="text-gray-500">Etiket Boyutu</p>
                <p className="font-medium">{labelSizes.find(s => s.value === labelSize)?.label}</p>
              </div>
              <div>
                <p className="text-gray-500">Adet</p>
                <p className="font-medium">{previewProduct.quantity}</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowPreview(false)}>Kapat</Button>
          <Button variant="primary" onClick={handlePrintSingle}>
            <Printer className="w-4 h-4" />
            Bu Etiketi Yazdır
          </Button>
        </div>
      </Modal>

      {/* Hidden Print Content */}
      <div className="hidden print:block">
        <div ref={printRef} className="label-container">
          {selectedProducts.map((product) => (
            Array.from({ length: product.quantity }).map((_, index) => (
              <div key={`${product.id}-${index}`} className="label">
                <p className="product-name">{product.name}</p>
                <div className="barcode">{product.barcode || product.ref}</div>
                <p className="barcode-text">{product.barcode || product.ref}</p>
                <p className="product-price">{product.price > 0 ? `${product.price.toFixed(2)} TL` : '-'}</p>
              </div>
            ))
          ))}
        </div>
      </div>
    </>
  );
}
