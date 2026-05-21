import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle,
  Search, Filter, Download, Loader2, BarChart3, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, Button, Input, Select,
  Badge, Table, Alert, Modal
} from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import { productApi, orderApi, invoiceApi } from '@/lib/dolibarr';
import type { Product, Order, Invoice } from '@/lib/types/dolibarr';

// Margin analysis types
interface ProductMargin {
  productId: number;
  productRef: string;
  productName: string;
  costPrice: number;
  salePrice: number;
  margin: number;
  marginPercent: number;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
}

interface CategorySummary {
  name: string;
  totalRevenue: number;
  totalProfit: number;
  marginPercent: number;
  productCount: number;
}

export default function KarMarjiAnalizi() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'marginPercent' | 'totalProfit' | 'productName'>('marginPercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductMargin | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productData, orderData, invoiceData] = await Promise.all([
        productApi.list({ limit: 100 }),
        orderApi.list({ limit: 50, status: 2 }), // Completed orders
        invoiceApi.list({ limit: 50, status: 2 }), // Paid invoices
      ]);
      setProducts(productData);
      setOrders(orderData);
      setInvoices(invoiceData);
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

  // Calculate product margins
  const productMargins: ProductMargin[] = products
    .filter(p => p.price && p.price > 0)
    .map(p => {
      const costPrice = p.cost_price || p.price! * 0.7; // Assume 30% margin if no cost
      const salePrice = p.price || 0;
      const margin = salePrice - costPrice;
      const marginPercent = costPrice > 0 ? (margin / costPrice) * 100 : 0;

      // Calculate totals from orders (simplified)
      const totalSold = Math.floor(Math.random() * 100); // Mock data
      const totalRevenue = totalSold * salePrice;
      const totalProfit = totalSold * margin;

      return {
        productId: p.id,
        productRef: p.ref,
        productName: p.label,
        costPrice,
        salePrice,
        margin,
        marginPercent,
        totalSold,
        totalRevenue,
        totalProfit,
      };
    });

  // Filter and sort
  const filteredProducts = productMargins
    .filter(p =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productRef.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * multiplier;
      }
      return ((aVal as number) - (bVal as number)) * multiplier;
    });

  // Calculate category summaries (mock grouping)
  const categorySummaries: CategorySummary[] = [
    { name: 'Elektronik', totalRevenue: 125000, totalProfit: 37500, marginPercent: 30, productCount: 15 },
    { name: 'Gıda', totalRevenue: 85000, totalProfit: 17000, marginPercent: 20, productCount: 25 },
    { name: 'Giyim', totalRevenue: 45000, totalProfit: 13500, marginPercent: 30, productCount: 40 },
    { name: 'Hırdavat', totalRevenue: 62000, totalProfit: 18600, marginPercent: 30, productCount: 18 },
  ];

  // Summary stats
  const avgMargin = productMargins.length > 0
    ? productMargins.reduce((sum, p) => sum + p.marginPercent, 0) / productMargins.length
    : 0;
  const totalProfitAll = productMargins.reduce((sum, p) => sum + p.totalProfit, 0);
  const totalRevenueAll = productMargins.reduce((sum, p) => sum + p.totalRevenue, 0);

  const getMarginBadge = (percent: number) => {
    if (percent >= 30) return <Badge variant="success">Yüksek ({percent.toFixed(1)}%)</Badge>;
    if (percent >= 15) return <Badge variant="warning">Orta ({percent.toFixed(1)}%)</Badge>;
    return <Badge variant="danger">Düşük ({percent.toFixed(1)}%)</Badge>;
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <p className="text-gray-500">Kar marjı analizi yükleniyor...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kar Marjı Analizi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ürün karlılık analizi ve performans raporları
        </p>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ortalama Marj</p>
              <p className="text-2xl font-bold text-gray-900">{avgMargin.toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Ciro</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenueAll)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Kar</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalProfitAll)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Düşük Marj Ürün</p>
              <p className="text-2xl font-bold text-red-600">
                {productMargins.filter(p => p.marginPercent < 15).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Category Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kategori Bazlı Karlılık</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categorySummaries.map((cat) => (
            <div key={cat.name} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{cat.name}</span>
                {getMarginBadge(cat.marginPercent)}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ciro:</span>
                  <span className="font-medium">{formatCurrency(cat.totalRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kar:</span>
                  <span className="font-medium text-green-600">{formatCurrency(cat.totalProfit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ürün:</span>
                  <span className="font-medium">{cat.productCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Product Margins Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Ürün Bazlı Marj Analizi</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="secondary">
                <Download className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <Table
          data={filteredProducts}
          columns={[
            {
              key: 'productRef',
              header: 'Referans',
              render: (value) => <span className="font-mono text-sm">{value as string}</span>,
            },
            {
              key: 'productName',
              header: (
                <button onClick={() => handleSort('productName')} className="flex items-center gap-1">
                  Ürün Adı
                  {sortField === 'productName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              ),
            },
            {
              key: 'costPrice',
              header: 'Maliyet',
              align: 'right' as const,
              render: (value) => formatCurrency(value as number),
            },
            {
              key: 'salePrice',
              header: 'Satış Fiyatı',
              align: 'right' as const,
              render: (value) => formatCurrency(value as number),
            },
            {
              key: 'marginPercent',
              header: (
                <button onClick={() => handleSort('marginPercent')} className="flex items-center gap-1">
                  Marj %
                  {sortField === 'marginPercent' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              ),
              align: 'right' as const,
              render: (value, record) => {
                const item = record as ProductMargin;
                return getMarginBadge(item.marginPercent);
              },
            },
            {
              key: 'margin',
              header: 'Kar',
              align: 'right' as const,
              render: (value) => (
                <span className="font-medium text-green-600">{formatCurrency(value as number)}</span>
              ),
            },
            {
              key: 'totalSold',
              header: 'Satılan',
              align: 'right' as const,
              render: (value) => value as number,
            },
            {
              key: 'totalProfit',
              header: (
                <button onClick={() => handleSort('totalProfit')} className="flex items-center gap-1">
                  Toplam Kar
                  {sortField === 'totalProfit' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              ),
              align: 'right' as const,
              render: (value, record) => {
                const item = record as ProductMargin;
                return (
                  <span className="font-semibold text-gray-900">{formatCurrency(item.totalProfit)}</span>
                );
              },
            },
          ]}
        />
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedProduct && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`${selectedProduct.productName} - Detaylı Analiz`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Maliyet Fiyatı</p>
                <p className="text-xl font-bold">{formatCurrency(selectedProduct.costPrice)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Satış Fiyatı</p>
                <p className="text-xl font-bold">{formatCurrency(selectedProduct.salePrice)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500">Birim Kar</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(selectedProduct.margin)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Marj Oranı</p>
                <p className="text-xl font-bold text-blue-600">{selectedProduct.marginPercent.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}