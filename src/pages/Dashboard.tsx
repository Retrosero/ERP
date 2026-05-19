import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Coins,
  Plus,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Receipt,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, StatCard, Badge, Button } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration - replace with actual API calls
  const [stats] = useState({
    todaySales: 15420.50,
    weekSales: 89500.00,
    monthOrders: 47,
    pendingCollections: 34250.00,
    activeCustomers: 156,
    lowStockCount: 8,
  });

  const recentOrders = [
    { id: 1, ref: 'SP-2024-001', customer: 'ABC Teknoloji Ltd.', amount: 12450.00, date: '2024-01-18', status: 'completed' },
    { id: 2, ref: 'SP-2024-002', customer: 'XYZ Muhendislik', amount: 8900.00, date: '2024-01-17', status: 'pending' },
    { id: 3, ref: 'SP-2024-003', customer: 'Def Sanayi A.Ş.', amount: 15600.00, date: '2024-01-17', status: 'processing' },
    { id: 4, ref: 'SP-2024-004', customer: 'GHI Ticaret', amount: 4250.00, date: '2024-01-16', status: 'completed' },
    { id: 5, ref: 'SP-2024-005', customer: 'JKL Mühendislik', amount: 7800.00, date: '2024-01-16', status: 'pending' },
  ];

  const topProducts = [
    { name: 'Ürün A', sold: 125, revenue: 45600 },
    { name: 'Ürün B', sold: 98, revenue: 38400 },
    { name: 'Ürün C', sold: 87, revenue: 32500 },
    { name: 'Ürün D', sold: 76, revenue: 28900 },
  ];

  const recentActivities = [
    { type: 'order', message: 'Yeni sipariş oluşturuldu', detail: 'SP-2024-001 - 12.450 ₺', time: '5 dk önce' },
    { type: 'payment', message: 'Tahsilat yapıldı', detail: '3.500 ₺ - Kasa TL', time: '15 dk önce' },
    { type: 'invoice', message: 'Fatura onaylandı', detail: 'FAT-2024-045', time: '30 dk önce' },
    { type: 'stock', message: 'Stok güncellendi', detail: 'Ürün A: +50 adet', time: '1 saat önce' },
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'success' | 'warning' | 'info' | 'neutral'; label: string }> = {
      completed: { variant: 'success', label: 'Tamamlandı' },
      pending: { variant: 'warning', label: 'Bekliyor' },
      processing: { variant: 'info', label: 'İşleniyor' },
    };
    const { variant, label } = statusMap[status] || { variant: 'neutral', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, { icon: typeof ShoppingCart; bg: string; color: string }> = {
      order: { icon: ShoppingCart, bg: 'bg-blue-100', color: 'text-blue-600' },
      payment: { icon: DollarSign, bg: 'bg-emerald-100', color: 'text-emerald-600' },
      invoice: { icon: Receipt, bg: 'bg-purple-100', color: 'text-purple-600' },
      stock: { icon: Package, bg: 'bg-amber-100', color: 'text-amber-600' },
    };
    const config = icons[type] || { icon: Clock, bg: 'bg-slate-100', color: 'text-slate-600' };
    return (
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bg)}>
        <config.icon className={cn('w-5 h-5', config.color)} />
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">Veriler yükleniyor...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={<FileText className="w-4 h-4" />}>
              Rapor İndir
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Yeni Sipariş
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Bugünün Satışı"
            value={formatCurrency(stats.todaySales, false)}
            change={12.5}
            iconColor="text-teal-600"
            iconBgColor="bg-teal-100"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Haftalık Satış"
            value={formatCurrency(stats.weekSales, false)}
            change={8.3}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
          />
          <StatCard
            icon={<ShoppingCart className="w-5 h-5" />}
            label="Aylık Sipariş"
            value={stats.monthOrders}
            change={-2.1}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            icon={<Coins className="w-5 h-5" />}
            label="Bekleyen Tahsilat"
            value={formatCurrency(stats.pendingCollections, false)}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card padding="none">
              <div className="p-5 border-b border-slate-100/60 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Son Siparişler</h3>
                <Link to="/siparisler" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium">
                  Tümünü Gör <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100/60">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/siparisler/${order.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900">{order.ref}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-slate-500 truncate">{order.customer}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-slate-900">{formatCurrency(order.amount, false)}</p>
                      <p className="text-xs text-slate-400">{formatDate(order.date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">Hızlı İşlemler</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/siparisler/yeni" className="quick-action quick-action-primary">
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Yeni Sipariş</span>
                </Link>
                <Link to="/teklifler/yeni" className="quick-action quick-action-success">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">Yeni Teklif</span>
                </Link>
                <Link to="/tahsilatlar/yeni" className="quick-action quick-action-warning">
                  <Coins className="w-5 h-5" />
                  <span className="text-sm font-medium">Tahsilat</span>
                </Link>
                <Link to="/hizli-satis" className="quick-action quick-action-info">
                  <Receipt className="w-5 h-5" />
                  <span className="text-sm font-medium">Hızlı Satış</span>
                </Link>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">Son Aktiviteler</h3>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                      <p className="text-xs text-slate-500 truncate">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Row - Two Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">En Çok Satan Ürünler</h3>
              <Link to="/rapor-merkezi" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                Detaylı Rapor
              </Link>
            </div>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sold} adet satış</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(product.revenue, false)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Critical Stock Warning */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Kritik Stok Uyarısı
              </h3>
              <Link to="/urunler?filter=critical" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                Stok Yönetimi
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Ürün X', current: 5, min: 10 },
                { name: 'Ürün Y', current: 8, min: 15 },
                { name: 'Ürün Z', current: 3, min: 10 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50">
                  <span className="text-sm font-medium text-slate-900">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-red-600">{item.current}</span>
                    <span className="text-xs text-slate-400">/ {item.min}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-center">
                <Badge variant="danger">{stats.lowStockCount} ürün kritik seviyede</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;