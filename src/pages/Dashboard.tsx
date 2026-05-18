import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Coins,
  Plus,
  FileText,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, StatCard, Alert } from '@/components/ui';
import { formatCurrency, formatDate, getRelativeTime, cn } from '@/lib/utils';
import { orderApi, invoiceApi, productApi, stockApi } from '@/lib/dolibarr';
import type { Order, Invoice, Product, StockMovement } from '@/lib/types/dolibarr';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaySales, setTodaySales] = useState(0);
  const [openOrders, setOpenOrders] = useState(0);
  const [criticalStock, setCriticalStock] = useState(0);
  const [pendingCollections, setPendingCollections] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  // Fetch dashboard data from Dolibarr
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch open orders (status 1 = validated)
      const orders = await orderApi.list({ limit: 5, sortfield: 'date_commande', sortorder: 'DESC' });
      setRecentOrders(orders);
      setOpenOrders(orders.length);

      // Calculate today's sales
      const today = new Date().toISOString().split('T')[0];
      const todayOrdersTotal = orders
        .filter(o => o.date_commande?.startsWith(today))
        .reduce((sum, o) => sum + (o.total_ttc || 0), 0);
      setTodaySales(todayOrdersTotal);

      // Fetch invoices for pending collections
      const invoices = await invoiceApi.list({ limit: 50, sortfield: 'date_valid', sortorder: 'DESC' });
      const pendingTotal = invoices
        .filter(inv => inv.status !== 2 && inv.remain_to_pay)
        .reduce((sum, inv) => sum + (inv.remain_to_pay || 0), 0);
      setPendingCollections(pendingTotal);

      // Fetch products for critical stock
      const products = await productApi.list({ limit: 100 });
      const critical = products.filter(p =>
        p.seuil_stock_alerte && p.stock_reel && p.stock_reel <= p.seuil_stock_alerte
      );
      setCriticalStock(critical.length);
      setLowStockProducts(critical.slice(0, 5));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case 'invoice':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'proposal':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'payment':
        return <Coins className="w-4 h-4 text-amber-500" />;
      case 'stock':
        return <Package className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const quickActions = [
    { id: 'new-order', label: 'Yeni Sipariş', icon: Plus, path: '/siparisler/yeni', color: 'bg-blue-500' },
    { id: 'new-proposal', label: 'Yeni Teklif', icon: FileText, path: '/teklifler/yeni', color: 'bg-green-500' },
    { id: 'stock-check', label: 'Stok Durumu', icon: Package, path: '/urunler', color: 'bg-purple-500' },
    { id: 'collections', label: 'Tahsilat', icon: Coins, path: '/tahsilatlar', color: 'bg-amber-500' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Dolibarr verileri ile güncelleniyor
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert type="error" title="Veri Yükleme Hatası">
            {error}
            <p className="text-sm mt-1">Lütfen Dolibarr bağlantınızı Ayarlar sayfasından kontrol edin.</p>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
            <p className="text-gray-500">Veriler yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="Bugünün Satışı"
                value={formatCurrency(todaySales, false)}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-100"
              />
              <StatCard
                icon={<ShoppingCart className="w-6 h-6" />}
                label="Açık Siparişler"
                value={openOrders}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-100"
              />
              <StatCard
                icon={<AlertCircle className="w-6 h-6" />}
                label="Kritik Stok"
                value={criticalStock}
                iconColor="text-red-600"
                iconBgColor="bg-red-100"
              />
              <StatCard
                icon={<Coins className="w-6 h-6" />}
                label="Tahsilat Bekleyen"
                value={formatCurrency(pendingCollections, false)}
                iconColor="text-green-600"
                iconBgColor="bg-green-100"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Son Siparişler</CardTitle>
                    <Link
                      to="/siparisler"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Tümünü Gör
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </CardHeader>
                  {recentOrders.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {recentOrders.slice(0, 5).map((order) => (
                        <Link
                          key={order.id}
                          to={`/siparisler/${order.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{order.ref}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {formatCurrency(order.total_ttc || 0)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-400">
                              {order.date_commande ? formatDate(order.date_commande) : '-'}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>Henüz sipariş bulunamadı</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Quick Actions */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Hızlı İşlemler</CardTitle>
                  </CardHeader>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={action.id}
                          to={action.path}
                          className={cn(
                            'flex flex-col items-center justify-center p-4 rounded-lg text-white transition-transform hover:scale-105',
                            action.color
                          )}
                        >
                          <Icon className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium">{action.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </Card>

                {/* Low Stock Warning */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Kritik Stok Uyarısı
                    </CardTitle>
                  </CardHeader>
                  {lowStockProducts.length > 0 ? (
                    <div className="space-y-3">
                      {lowStockProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 truncate flex-1">{product.label}</span>
                          <span className="text-sm font-medium text-red-600">
                            {product.stock_reel || 0} / {product.seuil_stock_alerte || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Kritik stok yok</p>
                  )}
                  <Link
                    to="/urunler?filter=critical"
                    className="block mt-4 text-sm text-primary hover:underline text-center"
                  >
                    Tüm kritik stokları gör
                  </Link>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default Dashboard;